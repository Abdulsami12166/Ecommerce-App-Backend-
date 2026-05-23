const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sendSuccess, sendError } = require('../../utils/responseHandler');
const { logger } = require('../../utils/logger');
const { sendEmail } = require('../../utils/emailService');

const JWT_SECRET = process.env.JWT_SECRET || process.env.ADMIN_JWT_SECRET || 'default_user_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const OTP_TTL_MINUTES = 10;
const RESET_CODE_TTL_MINUTES = 10;

const createUserToken = user =>
  jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

const generateNumericOtp = () => crypto.randomInt(1e5, 1e6).toString(); // 6-digit

async function sendOtpEmail(email, otpCode) {
  const appName = process.env.APP_NAME || 'ShopVerse';
  try {
    return await sendEmail({
      to: email,
      subject: `${appName} — Your OTP Code`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;color:#1a1a2e">
          <h2 style="color:#d4a574">${appName}</h2>
          <p>Your verification code is:</p>
          <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#1a1a2e;padding:16px 0;text-align:center">${otpCode}</div>
          <p style="color:#666">This code expires in ${OTP_TTL_MINUTES} minutes.</p>
          <p style="font-size:12px;color:#999">If you didn't request this, ignore this email.</p>
        </div>
      `,
    });
  } catch (err) {
    logger.error('OTP email failed', { error: err.message, email });
    throw new Error('Unable to send OTP email right now. Please try again later.');
  }
}

async function sendResetCodeEmail(email, resetCode) {
  const appName = process.env.APP_NAME || 'ShopVerse';
  try {
    return await sendEmail({
      to: email,
      subject: `${appName} — Password Reset Code`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;color:#1a1a2e">
          <h2 style="color:#d4a574">${appName}</h2>
          <p>Your password reset code is:</p>
          <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#1a1a2e;padding:16px 0;text-align:center">${resetCode}</div>
          <p style="color:#666">This code expires in ${RESET_CODE_TTL_MINUTES} minutes. Enter it in the app to set a new password.</p>
          <p style="font-size:12px;color:#999">If you didn't request this, ignore this email.</p>
        </div>
      `,
    });
  } catch (err) {
    logger.error('Reset-code email failed', { error: err.message, email });
    throw new Error('Unable to send reset code right now. Please try again later.');
  }
}

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
    const user = await User.create({ name, email, password, phone: phone || '', role: 'user' });
    logger.info('User registered', { userId: user._id, email: user.email });
    return sendSuccess(res, 201, 'Registration successful', {
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    next(error);
  }
};

// ── OL userLogin — returns OTP-verify-wait state ─────────
async function generateEmailOtp(user) {
  user.otpCode = generateNumericOtp();
  user.otpExpiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
  user.isVerified = false;
  await user.save();
  return user.otpCode;
}

const userLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return sendError(res, 400, 'Email and password are required');
    }
    let user = await User.findOne({ email }).select('+password');
    if (!user) {
      // Auto-register first-time users silently
      user = await User.create({ name: email.split('@')[0], email, password, role: 'user' });
    }
    if (user.blocked) {
      return sendError(res, 403, 'Your account has been blocked. Contact support.');
    }
    // Allow OTP-only logins if password field is missing
    let passOk = false;
    if (user.password) {
      passOk = user.comparePassword(password);
    }
    if (!passOk && !user.password) {
      passOk = true;
    }
    if (!passOk) {
      return sendError(res, 401, 'Invalid email or password');
    }
    user.lastLoginAt = new Date();
    await user.save();
    const otpCode = await generateEmailOtp(user);
    await sendOtpEmail(email, otpCode);
    logger.info('User OTP sent', { userId: user._id, email: user.email });
    return sendSuccess(res, 200, 'OTP sent to your email. Please verify to continue.', {
      emailDelivered: true,
      email: user.email,
    });
  } catch (error) {
    next(error);
  }
};

/** POST /auth/verify-otp */
const verifyOtp = async (req, res, next) => {
  try {
    const { email, otpCode } = req.body;
    if (!email || !otpCode) {
      return sendError(res, 400, 'Email and OTP code are required');
    }
    const user = await User.findOne({ email }).select('+otpCode +otpExpiresAt');
    if (!user) {
      return sendError(res, 404, 'Account not found. Please register first.');
    }
    if (user.otpCode !== otpCode) {
      return sendError(res, 401, 'Invalid OTP code');
    }
    if (user.otpExpiresAt && user.otpExpiresAt < new Date()) {
      return sendError(res, 401, 'OTP has expired. Please request a new code.');
    }
    user.otpCode = undefined;
    user.otpExpiresAt = undefined;
    user.isVerified = true;
    await user.save();
    const token = createUserToken(user);
    logger.info('User OTP verified', { userId: user._id, email: user.email });
    return sendSuccess(res, 200, 'OTP verified successfully', {
      token,
      user: {
        id: user._id, name: user.name, email: user.email,
        role: user.role, avatar: user.avatar || '', isVerified: true,
      },
    });
  } catch (error) {
    next(error);
  }
};

/** POST /auth/resend-otp */
const resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return sendError(res, 400, 'Email is required');
    }
    const user = await User.findOne({ email }).select('+otpCode +otpExpiresAt');
    if (!user) {
      return sendError(res, 404, 'Account not found.');
    }
    const otpCode = generateNumericOtp();
    user.otpCode = otpCode;
    user.otpExpiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
    user.isVerified = false;
    await user.save();
    await sendOtpEmail(email, otpCode);
    logger.info('OTP resent', { userId: user._id, email: user.email });
    return sendSuccess(res, 200, 'OTP resent successfully', { emailDelivered: true });
  } catch (error) {
    if (error.statusCode) return next(error);
    logger.error('Resend OTP failed', { error: error.message });
    return sendError(res, 500, 'Unable to resend OTP right now.');
  }
};

/** POST /auth/forgot-password */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return sendError(res, 400, 'Email is required');
    const user = await User.findOne({ email });
    if (!user) {
      return sendSuccess(res, 200, 'If an account exists with this email, a reset code has been sent.');
    }
    const resetCode = generateNumericOtp();
    user.passwordResetCode = resetCode;
    user.passwordResetExpiresAt = new Date(Date.now() + RESET_CODE_TTL_MINUTES * 60 * 1000);
    await user.save();
    await sendResetCodeEmail(email, resetCode);
    logger.info('Password reset code sent', { userId: user._id, email: user.email });
    return sendSuccess(res, 200, 'Reset code sent successfully');
  } catch (error) {
    if (error.statusCode) return next(error);
    logger.error('Forgot password failed', { error: error.message });
    return sendError(res, 500, 'Unable to send reset code right now.');
  }
};

/** POST /auth/reset-password */
const resetPassword = async (req, res, next) => {
  try {
    const { email, resetCode, newPassword, confirmPassword } = req.body;
    if (!email || !resetCode || !newPassword || !confirmPassword) {
      return sendError(res, 400, 'All fields are required');
    }
    if (newPassword !== confirmPassword) {
      return sendError(res, 400, 'Passwords do not match');
    }
    if (newPassword.length < 6) {
      return sendError(res, 400, 'New password must be at least 6 characters');
    }
    const user = await User.findOne({ email });
    if (!user || user.passwordResetCode !== resetCode) {
      return sendError(res, 400, 'Invalid reset code');
    }
    if (user.passwordResetExpiresAt < new Date()) {
      return sendError(res, 400, 'Reset code has expired');
    }
    user.password = newPassword;
    user.passwordResetCode = undefined;
    user.passwordResetExpiresAt = undefined;
    await user.save();
    logger.info('Password reset', { userId: user._id, email: user.email });
    return sendSuccess(res, 200, 'Password reset successfully. Please sign in again.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  userLogin, userRegister, createUserToken,
  verifyOtp, resendOtp, forgotPassword, resetPassword,
};
