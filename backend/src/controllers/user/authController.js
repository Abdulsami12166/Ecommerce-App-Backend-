const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const { sendSuccess, sendError } = require('../../utils/responseHandler');
const { logger } = require('../../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || process.env.ADMIN_JWT_SECRET || 'default_user_secret';

const createUserToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' },
  );

const userLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return sendError(res, 400, 'Email and password are required');
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      logger.warn('User login failed: not found', { email });
      return sendError(res, 401, 'Invalid email or password');
    }

    if (user.blocked) {
      return sendError(res, 403, 'Your account has been blocked. Contact support.');
    }

    const passOk = user.comparePassword(password);
    if (!passOk) {
      logger.warn('User login failed: wrong password', {
        email,
        userId: user._id,
      });
      return sendError(res, 401, 'Invalid email or password');
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = createUserToken(user);

    logger.info('User logged in', { userId: user._id, email: user.email });
    return sendSuccess(res, 200, 'Login successful', {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

const userRegister = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      return sendError(res, 400, 'Name, email and password are required');
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return sendError(res, 409, 'An account with this email already exists');
    }

    const user = await User.create({
      name,
      email,
      password,
      phone: phone || '',
      role: 'user',
    });

    logger.info('User registered', { userId: user._id, email: user.email });
    return sendSuccess(res, 201, 'Registration successful', {
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  userLogin,
  userRegister,
  createUserToken,
};
