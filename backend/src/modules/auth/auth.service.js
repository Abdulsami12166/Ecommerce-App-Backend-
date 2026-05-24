const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const { authRepository } = require('./auth.repository');
const { logger } = require('../../shared/utils/logger');
const { AppError } = require('../../shared/utils/appError');
const { sendEmail } = require('../../utils/emailService');
const { USER_JWT_SECRET, ADMIN_JWT_SECRET } = require('../../shared/middleware/auth');
const { emitToAdmins } = require('../../shared/events/eventBus');
const { socketEvents } = require('../../shared/events/socketEvents');

const OTP_TTL_MINUTES = 10;
const RESET_CODE_TTL_MINUTES = 10;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const generateCode = () => crypto.randomInt(100000, 1000000).toString();

const buildUserPayload = user => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone || '',
  role: user.role,
  avatar: user.avatar || '',
  isVerified: user.isVerified,
  wishlist: user.wishlist || [],
  blocked: user.blocked,
  lastLoginAt: user.lastLoginAt,
});

const createUserToken = user =>
  jwt.sign(
    { id: user._id, role: user.role, tokenVersion: user.tokenVersion || 0 },
    USER_JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );

const createAdminToken = user =>
  jwt.sign(
    { id: user._id, role: user.role, tokenVersion: user.tokenVersion || 0 },
    ADMIN_JWT_SECRET,
    { expiresIn: '1d' },
  );

const sendOtpMessage = async (email, otpCode) => {
  try {
    const { sendOtpEmail } = require('../../services/emailService');
    await sendOtpEmail({ toEmail: email, otpCode });
    return;
  } catch (primaryError) {
    logger.warn('Primary OTP email provider failed, falling back to generic email service', {
      email,
      message: primaryError.message,
    });
  }

  await sendEmail({
    to: email,
    subject: 'Your OTP Code',
    text: `Your OTP code is ${otpCode}. It expires in ${OTP_TTL_MINUTES} minutes.`,
    html: `<div style="font-family:Arial,sans-serif"><h3>Your OTP Code</h3><p>Your OTP code is <b>${otpCode}</b>.</p><p>It expires in ${OTP_TTL_MINUTES} minutes.</p></div>`,
  });
};

const sendResetCodeEmail = async (email, resetCode) => {
  const appName = process.env.APP_NAME || 'Ecommerce';
  await sendEmail({
    to: email,
    subject: `${appName} Password Reset Code`,
    text: `Your password reset code is ${resetCode}. It expires in ${RESET_CODE_TTL_MINUTES} minutes.`,
    html: `<div style="font-family:Arial,sans-serif"><h3>${appName}</h3><p>Your password reset code is <b>${resetCode}</b>.</p><p>It expires in ${RESET_CODE_TTL_MINUTES} minutes.</p></div>`,
  });
};

const issueOtpForUser = async user => {
  user.otpCode = generateCode();
  user.otpExpiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
  user.isVerified = false;
  await authRepository.saveUser(user);
  return user.otpCode;
};

const registerUser = async payload => {
  const { name, email, password, phone } = payload;
  if (!name || !email || !password) {
    throw new AppError('Name, email and password are required', 400);
  }

  const existingUser = await authRepository.findUserByEmail(email);
  if (existingUser) {
    throw new AppError('An account with this email already exists', 409);
  }

  const user = await authRepository.createUser({
    name,
    email,
    password,
    phone: phone || '',
    role: 'user',
  });

  const otpCode = await issueOtpForUser(user);
  await sendOtpMessage(user.email, otpCode);

  logger.info('User registered', { userId: String(user._id), email: user.email });
  return {
    user: buildUserPayload(user),
    emailDelivered: true,
  };
};

const loginUser = async payload => {
  const { email, password } = payload;
  if (!email) {
    throw new AppError('Email is required', 400);
  }

  let user = await authRepository.findUserByEmailWithPassword(email);

  if (!user) {
    if (!password) {
      throw new AppError('User not found', 404);
    }

    user = await authRepository.createUser({
      name: email.split('@')[0],
      email,
      password,
      role: 'user',
    });
    user = await authRepository.findUserByEmailWithPassword(email);
  }

  if (user.blocked) {
    throw new AppError('Your account has been blocked. Contact support.', 403);
  }

  if (password) {
    const passwordMatches = await user.comparePassword(password);
    if (!passwordMatches) {
      throw new AppError('Invalid email or password', 401);
    }
  }

  user.lastLoginAt = new Date();
  const otpCode = await issueOtpForUser(user);
  await sendOtpMessage(user.email, otpCode);

  logger.info('User OTP sent', { userId: String(user._id), email: user.email });
  return {
    emailDelivered: true,
    email: user.email,
  };
};

const verifyUserOtp = async (payload, app, requestMeta = {}) => {
  const { email, otpCode } = payload;
  if (!email || !otpCode) {
    throw new AppError('Email and OTP code are required', 400);
  }

  const user = await authRepository.findUserByEmailWithPassword(email);
  if (!user) {
    throw new AppError('Account not found. Please register first.', 404);
  }

  if (String(user.otpCode) !== String(otpCode)) {
    throw new AppError('Invalid OTP code', 401);
  }

  if (user.otpExpiresAt && user.otpExpiresAt < new Date()) {
    throw new AppError('OTP has expired. Please request a new code.', 401);
  }

  user.otpCode = undefined;
  user.otpExpiresAt = undefined;
  user.isVerified = true;
  user.lastLoginAt = new Date();
  await authRepository.saveUser(user);

  await authRepository.createActivity({
    user: user._id,
    action: 'login',
    details: `${user.name} logged in successfully`,
    ipAddress: requestMeta.ipAddress,
    userAgent: requestMeta.userAgent,
  });

  const eventPayload = {
    userId: String(user._id),
    name: user.name,
    email: user.email,
    loginTime: new Date().toISOString(),
  };

  emitToAdmins(app, socketEvents.LEGACY.USER_LOGIN, eventPayload);
  emitToAdmins(app, socketEvents.DOMAIN.USER_LOGGED_IN, eventPayload);

  logger.info('User OTP verified', { userId: String(user._id), email: user.email });
  return {
    token: createUserToken(user),
    user: buildUserPayload(user),
  };
};

const resendUserOtp = async payload => {
  const { email } = payload;
  if (!email) {
    throw new AppError('Email is required', 400);
  }

  const user = await authRepository.findUserByEmailWithPassword(email);
  if (!user) {
    throw new AppError('Account not found.', 404);
  }

  const otpCode = await issueOtpForUser(user);
  await sendOtpMessage(user.email, otpCode);

  logger.info('User OTP resent', { userId: String(user._id), email: user.email });
  return { emailDelivered: true };
};

const forgotUserPassword = async payload => {
  const { email } = payload;
  if (!email) {
    throw new AppError('Email is required', 400);
  }

  const user = await authRepository.findUserByEmailWithPassword(email);
  if (!user) {
    return {};
  }

  const resetCode = generateCode();
  user.passwordResetCode = resetCode;
  user.passwordResetExpiresAt = new Date(Date.now() + RESET_CODE_TTL_MINUTES * 60 * 1000);
  await authRepository.saveUser(user);
  await sendResetCodeEmail(email, resetCode);

  logger.info('Password reset code sent', { userId: String(user._id), email: user.email });
  return {};
};

const resetUserPassword = async payload => {
  const { email, resetCode, newPassword, confirmPassword } = payload;
  if (!email || !resetCode || !newPassword || !confirmPassword) {
    throw new AppError('All fields are required', 400);
  }
  if (newPassword !== confirmPassword) {
    throw new AppError('Passwords do not match', 400);
  }
  if (newPassword.length < 6) {
    throw new AppError('New password must be at least 6 characters', 400);
  }

  const user = await authRepository.findUserByEmailWithPassword(email);
  if (!user || String(user.passwordResetCode) !== String(resetCode)) {
    throw new AppError('Invalid reset code', 400);
  }
  if (user.passwordResetExpiresAt && user.passwordResetExpiresAt < new Date()) {
    throw new AppError('Reset code has expired', 400);
  }

  user.password = newPassword;
  user.passwordResetCode = undefined;
  user.passwordResetExpiresAt = undefined;
  await authRepository.saveUser(user);

  await authRepository.createActivity({
    user: user._id,
    action: 'password_change',
    details: `${user.name} reset their password`,
  });

  logger.info('Password reset completed', { userId: String(user._id), email: user.email });
  return {};
};

const loginAdmin = async payload => {
  const { email, password } = payload;
  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }

  const user = await authRepository.findUserByEmailWithPassword(email);
  if (!user || user.role !== 'admin') {
    throw new AppError('Invalid admin credentials', 401);
  }

  const passwordMatches = await user.comparePassword(password);
  if (!passwordMatches) {
    throw new AppError('Invalid admin credentials', 401);
  }

  user.lastLoginAt = new Date();
  await authRepository.saveUser(user);

  logger.info('Admin logged in', { userId: String(user._id), email: user.email });
  return {
    token: createAdminToken(user),
    user: buildUserPayload(user),
  };
};

const getAuthenticatedUserProfile = async userId => {
  const user = await authRepository.findUserById(userId);
  if (!user) {
    throw new AppError('Account not found', 404);
  }

  return buildUserPayload(user);
};

const logoutUser = async (userId, app, requestMeta = {}) => {
  const user = await authRepository.findUserById(userId);
  if (!user) {
    throw new AppError('Account not found', 404);
  }

  await authRepository.createActivity({
    user: user._id,
    action: 'logout',
    details: `${user.name} logged out`,
    ipAddress: requestMeta.ipAddress,
    userAgent: requestMeta.userAgent,
  });

  const eventPayload = {
    userId: String(user._id),
    name: user.name,
    email: user.email,
    logoutTime: new Date().toISOString(),
  };

  emitToAdmins(app, socketEvents.DOMAIN.USER_LOGGED_OUT, eventPayload);

  logger.info('User logged out', { userId: String(user._id), email: user.email });
  return {};
};

module.exports = {
  buildUserPayload,
  createUserToken,
  loginAdmin,
  registerUser,
  loginUser,
  verifyUserOtp,
  resendUserOtp,
  forgotUserPassword,
  resetUserPassword,
  getAuthenticatedUserProfile,
  logoutUser,
};
