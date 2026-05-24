const User = require('../../models/User');
const UserActivity = require('../../models/UserActivity');

const { sendSuccess, sendError } = require('../../utils/responseHandler');
const { logger } = require('../../utils/logger');

const createUserToken = (user) => {
  return `user-${user._id}-${Date.now()}`;
};

// LOGIN -> send OTP email (do NOT return OTP)
const userLogin = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return sendError(res, 400, 'Email is required');
    }

    const user = await User.findOne({ email });

    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    // Generate OTP (5 min expiry)
    const otpCode = String(Math.floor(100000 + Math.random() * 900000));
    user.otpCode = otpCode;
    user.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await user.save();

    // Send email OTP via SMTP (Gmail or other provider)
    const { sendOtpEmail } = require('../../services/emailService');
    await sendOtpEmail({ toEmail: user.email, otpCode });

    logger.info('User OTP email sent', {
      userId: user._id,
      email: user.email,
    });

    // Never return OTP in API response
    return sendSuccess(res, 200, 'OTP sent successfully', {
      email: user.email,
      emailDelivered: true,
    });
  } catch (error) {
    next(error);
  }
};

// VERIFY OTP
const verifyOtp = async (req, res, next) => {
  try {
    const { email, otpCode } = req.body;

    if (!email || !otpCode) {
      return sendError(res, 400, 'Email and OTP code are required');
    }

    const user = await User.findOne({ email }).select('+otpCode +otpExpiresAt');

    if (!user) {
      return sendError(
        res,
        404,
        'Account not found. Please register first.',
      );
    }

    if (String(user.otpCode) !== String(otpCode)) {
      return sendError(res, 401, 'Invalid OTP code');
    }

    if (user.otpExpiresAt && user.otpExpiresAt < new Date()) {
      return sendError(res, 401, 'OTP has expired. Please request a new code.');
    }

    // CLEAR OTP
    user.otpCode = undefined;
    user.otpExpiresAt = undefined;

    // UPDATE USER
    user.isVerified = true;
    user.lastLoginAt = new Date();

    await user.save();

    // SAVE LOGIN ACTIVITY
    await UserActivity.create({
      user: user._id,
      action: 'login',
      details: `${user.name} logged in successfully`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // REALTIME ADMIN EVENT
    const emitAdminEvent = req.app.get('emitAdminEvent');

    if (emitAdminEvent) {
      emitAdminEvent('user-login', {
        userId: user._id,
        name: user.name,
        email: user.email,
        loginTime: new Date(),
      });
    }

    // TOKEN
    const token = createUserToken(user);

    logger.info('User OTP verified', {
      userId: user._id,
      email: user.email,
    });

    return sendSuccess(res, 200, 'OTP verified successfully', {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || '',
        isVerified: true,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  userLogin,
  verifyOtp,
};

