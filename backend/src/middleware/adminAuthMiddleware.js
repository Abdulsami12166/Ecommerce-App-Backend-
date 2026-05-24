const { sendSuccess } = require('../shared/utils/apiResponse');
const { AppError } = require('../shared/utils/appError');
const { requireAdminAuth } = require('../shared/middleware/auth');
const authService = require('../modules/auth/auth.service');
const { authRepository } = require('../modules/auth/auth.repository');

const adminLogin = async (req, res, next) => {
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

const adminMe = async (req, res, next) => {
  try {
    const userId = req.query.userId || req.userId;
    const user = await authRepository.findUserById(userId);

    if (!user || user.role !== 'admin') {
      throw new AppError('Admin not found', 404);
    }

    return sendSuccess(res, 200, 'Admin fetched successfully', { user });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  adminLogin,
  adminMe,
  authorizeAdmin: requireAdminAuth,
};
