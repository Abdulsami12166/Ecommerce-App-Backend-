const jwt = require('jsonwebtoken');

const User = require('../../models/User');
const { AppError } = require('../utils/appError');

const USER_JWT_SECRET = process.env.JWT_SECRET || process.env.ADMIN_JWT_SECRET || 'default_user_secret';
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'default_admin_secret';
const ADMIN_ROLES = new Set(['admin', 'super-admin', 'product-manager', 'support']);

const normalizeRole = role =>
  String(role || '')
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-');

const extractBearerToken = req => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (authHeader) {
    const parts = authHeader.trim().split(/\s+/);
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
      return parts[1];
    }
    if (parts.length === 1) {
      return parts[0];
    }
  }

  return req.query.token || req.query.authToken || null;
};

const attachUserFromToken = async (req, decoded) => {
  const user = await User.findById(decoded.id).select('+tokenVersion blocked');

  if (!user) {
    throw new AppError('Account not found', 401);
  }

  if (user.blocked) {
    throw new AppError('Your account has been blocked by an administrator', 403);
  }

  if ((user.tokenVersion || 0) !== (decoded.tokenVersion || 0)) {
    throw new AppError('Session is no longer valid. Please sign in again.', 401);
  }

  req.user = user;
  req.adminUser = user;
  req.userId = String(user._id);
};

const requireUserAuth = async (req, res, next) => {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      throw new AppError('Authorization token required', 401);
    }

    const decoded = jwt.verify(token, USER_JWT_SECRET);
    await attachUserFromToken(req, decoded);
    return next();
  } catch (error) {
    return next(error.statusCode ? error : new AppError('Invalid or expired token', 401));
  }
};

const requireAdminAuth = async (req, res, next) => {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      throw new AppError('Authorization token required', 401);
    }

    const decoded = jwt.verify(token, ADMIN_JWT_SECRET);
    await attachUserFromToken(req, decoded);

    if (!ADMIN_ROLES.has(normalizeRole(req.user.role))) {
      throw new AppError('Admin access required', 403);
    }

    return next();
  } catch (error) {
    return next(error.statusCode ? error : new AppError('Invalid or expired token', 401));
  }
};

const requireAdminRole = (...roles) => (req, res, next) => {
  const allowedRoles = new Set(roles.map(normalizeRole));

  if (!allowedRoles.has(normalizeRole(req.user?.role))) {
    return next(new AppError('Access denied', 403));
  }

  return next();
};

module.exports = {
  ADMIN_ROLES,
  USER_JWT_SECRET,
  ADMIN_JWT_SECRET,
  extractBearerToken,
  normalizeRole,
  requireUserAuth,
  requireAdminAuth,
  requireAdminRole,
  requireAdminRoles: requireAdminRole,
};
