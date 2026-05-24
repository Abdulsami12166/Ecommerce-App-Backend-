const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const User = require('../../models/User');
const { logger } = require('../utils/logger');
const { socketEvents } = require('./socketEvents');
const { USER_JWT_SECRET, ADMIN_JWT_SECRET } = require('../middleware/auth');

const extractSocketToken = socket =>
  socket.handshake.auth?.token
  || socket.handshake.query?.token
  || socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '')
  || null;

const resolveSocketUser = async socket => {
  const token = extractSocketToken(socket);
  if (!token) return null;

  const secrets = [ADMIN_JWT_SECRET, USER_JWT_SECRET];

  for (const secret of secrets) {
    try {
      const decoded = jwt.verify(token, secret);
      const user = await User.findById(decoded.id).select('+tokenVersion');

      if (!user) {
        return null;
      }

      if ((user.tokenVersion || 0) !== (decoded.tokenVersion || 0)) {
        return null;
      }

      return user;
    } catch (error) {
      continue;
    }
  }

  return null;
};

const attachSocketServer = (httpServer, app) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || '*',
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = extractSocketToken(socket);
      if (!token) {
        return next();
      }

      const user = await resolveSocketUser(socket);
      if (!user) {
        logger.warn('Rejected socket connection with invalid token', {
          socketId: socket.id,
        });
        return next(new Error('Invalid socket token'));
      }

      socket.data.user = {
        id: String(user._id),
        role: user.role,
      };
      return next();
    } catch (error) {
      return next(new Error('Socket authentication failed'));
    }
  });

  io.on('connection', async socket => {
    if (socket.data.user?.id) {
      socket.join(socketEvents.ROOMS.user(String(socket.data.user.id)));
    }

    logger.info('Socket connected', { socketId: socket.id });

    socket.on(socketEvents.ADMIN_SUBSCRIBE, () => {
      if (socket.data.user?.role !== 'admin') {
        logger.warn('Rejected admin socket subscription', { socketId: socket.id });
        socket.emit('socket.error', { message: 'Admin access required' });
        socket.disconnect(true);
        return;
      }

      socket.join(socketEvents.ROOMS.ADMINS);
      logger.info('Admin socket subscribed', { socketId: socket.id });
    });

    socket.on('disconnect', () => {
      logger.info('Socket disconnected', { socketId: socket.id });
    });
  });

  app.set('io', io);
  return io;
};

const getIo = app => app.get('io');

const emitToAdmins = (app, event, payload) => {
  const io = getIo(app);
  if (!io) return;
  io.to(socketEvents.ROOMS.ADMINS).emit(event, payload);
};

const emitToUser = (app, userId, event, payload) => {
  const io = getIo(app);
  if (!io || !userId) return;
  io.to(socketEvents.ROOMS.user(String(userId))).emit(event, payload);
};

module.exports = {
  attachSocketServer,
  emitToAdmins,
  emitToUser,
};
