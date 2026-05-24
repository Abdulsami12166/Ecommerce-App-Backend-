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

    // Send email OTP via email service
    // Some deployments may end up with different bundle layouts, so attempt both known paths.
    let sendOtpEmail;
    const requireEmailService = () => {
      // eslint-disable-next-line global-require
      const svc = require('../../services/emailService');
      if (typeof svc?.sendOtpEmail !== 'function') {
        throw new Error('emailService.sendOtpEmail is not a function');
      }
      return svc.sendOtpEmail;
    };

    const requireUtilsEmailService = () => {
      // eslint-disable-next-line global-require
      const utilSvc = require('../../utils/emailService');
      if (typeof utilSvc?.sendEmail !== 'function') {
        throw new Error('utils.emailService.sendEmail is not a function');
      }

      // Adapter: utils/emailService exports sendEmail({to, subject, html, text}), not sendOtpEmail.
      return async ({ toEmail, otpCode }) => {
        const subject = 'Your OTP Code';
        const text = `Your OTP code is: ${otpCode}. It will expire in 5 minutes.`;
        const html = `<div style="font-family: Arial, sans-serif;"><h3>Your OTP Code</h3><p>Your OTP code is: <b>${otpCode}</b></p><p>It will expire in 5 minutes.</p></div>`;
        await utilSvc.sendEmail({ to: toEmail, subject, text, html });
      };
    };

    try {
      sendOtpEmail = requireEmailService();
    } catch (e1) {
      try {
        // If the primary email service module cannot even be required (e.g., missing env keys at import time),
        // fall back to the alternate implementation.
        sendOtpEmail = requireUtilsEmailService();
      } catch (e2) {
        e2.message = `Failed to load email service from both paths: services/emailService (${e1.message}) and utils/emailService (${e2.message})`;
        throw e2;
      }
    }

    try {
      await sendOtpEmail({ toEmail: user.email, otpCode });
    } catch (emailErr) {
      // If Resend sender config is missing, try the alternate implementation (nodemailer-backed).
      const msg = String(emailErr?.message || emailErr);
      if (msg.includes('Missing email sender') || msg.toLowerCase().includes('email sender')) {
        logger.warn('Resend OTP failed due to missing sender config; falling back to utils/emailService', {
          userId: user._id,
          email: user.email,
          reason: msg,
        });
        const fallbackSend = require('../../utils/emailService').sendEmail;
        const subject = 'Your OTP Code';
        const text = `Your OTP code is: ${otpCode}. It will expire in 5 minutes.`;
        const html = `<div style="font-family: Arial, sans-serif;"><h3>Your OTP Code</h3><p>Your OTP code is: <b>${otpCode}</b></p><p>It will expire in 5 minutes.</p></div>`;
        await fallbackSend({ to: user.email, subject, text, html });
      } else {
        throw emailErr;
      }
    }

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

