const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const User = require('../../models/User');
const { logger } = require('../utils/logger');
const { socketEvents } = require('./socketEvents');
const { USER_JWT_SECRET, ADMIN_JWT_SECRET, ADMIN_ROLES, normalizeRole } = require('../middleware/auth');

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

let ioInstance = null;

const attachSocketServer = (httpServer, app) => {
  const allowedOrigins = [
    process.env.CLIENT_URL,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://localhost:8081',
  ].filter(Boolean);

  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*') || process.env.CLIENT_URL === '*') {
          callback(null, true);
        } else {
          callback(null, false);
        }
      },
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
      if (!ADMIN_ROLES.has(normalizeRole(socket.data.user?.role))) {
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
  ioInstance = io;
  return io;
};

const getIo = app => app ? app.get('io') : ioInstance;

const emitToAdmins = (app, event, payload) => {
  const io = getIo(app);
  if (io) {
    io.to(socketEvents.ROOMS.ADMINS).emit(event, payload);
  }
  try {
    const { triggerEventNotifications } = require('../services/notificationTriggerService');
    triggerEventNotifications(event, payload).catch(err => console.error(err));
  } catch (err) {
    console.error('Failed to trigger event notifications:', err);
  }
};

const emitToAll = (app, event, payload) => {
  const io = getIo(app);
  if (io) {
    io.emit(event, payload);
  }
  try {
    const { triggerEventNotifications } = require('../services/notificationTriggerService');
    triggerEventNotifications(event, payload).catch(err => console.error(err));
  } catch (err) {
    console.error('Failed to trigger event notifications:', err);
  }
};

const emitToUser = (app, userId, event, payload) => {
  const io = getIo(app);
  if (io && userId) {
    io.to(socketEvents.ROOMS.user(String(userId))).emit(event, payload);
  }

  if (userId) {
    try {
      const { triggerEventNotifications } = require('../services/notificationTriggerService');
      triggerEventNotifications(event, { ...payload, userId }).catch(err => console.error(err));
    } catch (err) {
      console.error('Failed to trigger event notifications:', err);
    }
  }
};

module.exports = {
  attachSocketServer,
  emitToAll,
  emitToAdmins,
  emitToUser,
  socketEvents,
  getIo: () => ioInstance
};
