const { sendSuccess } = require('../../shared/utils/apiResponse');
const authService = require('./auth.service');

const registerUser = async (req, res, next) => {
  try {
    const data = await authService.registerUser(req.body);
    return sendSuccess(res, 201, 'Registration successful', data);
  } catch (error) {
    return next(error);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const data = await authService.loginUser(req.body);
    return sendSuccess(res, 200, 'OTP sent to your email. Please verify to continue.', data);
  } catch (error) {
    return next(error);
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    const data = await authService.verifyUserOtp(req.body, req.app, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    return sendSuccess(res, 200, 'OTP verified successfully', data);
  } catch (error) {
    return next(error);
  }
};

const resendOtp = async (req, res, next) => {
  try {
    const data = await authService.resendUserOtp(req.body);
    return sendSuccess(res, 200, 'OTP resent successfully', data);
  } catch (error) {
    return next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    await authService.forgotUserPassword(req.body);
    return sendSuccess(
      res,
      200,
      'If an account exists with this email, a reset code has been sent.',
    );
  } catch (error) {
    return next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    await authService.resetUserPassword(req.body);
    return sendSuccess(res, 200, 'Password reset successfully. Please sign in again.');
  } catch (error) {
    return next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await authService.getAuthenticatedUserProfile(req.userId);
    return sendSuccess(res, 200, 'Authenticated user fetched successfully', { user });
  } catch (error) {
    return next(error);
  }
};

const logoutUser = async (req, res, next) => {
  try {
    await authService.logoutUser(req.userId, req.app, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    return sendSuccess(res, 200, 'Logged out successfully');
  } catch (error) {
    return next(error);
  }
};

const loginAdmin = async (req, res, next) => {
  try {
    const data = await authService.loginAdmin(req.body);
    return res.json({
      success: true,
      message: 'Admin logged in successfully',
      ...data,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  verifyOtp,
  resendOtp,
  forgotPassword,
  resetPassword,
  logoutUser,
  getMe,
  loginAdmin,
};
