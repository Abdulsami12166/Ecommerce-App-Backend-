const { sendSuccess } = require('../../shared/utils/apiResponse');
const usersService = require('./users.service');

const getProfile = async (req, res, next) => {
  try {
    const data = await usersService.getProfile(req.userId);
    return sendSuccess(res, 200, 'Profile fetched successfully', data);
  } catch (error) {
    return next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const data = await usersService.updateProfile(req.userId, req.body);
    return sendSuccess(res, 200, 'Profile updated successfully', data);
  } catch (error) {
    return next(error);
  }
};

const uploadProfileAvatar = async (req, res, next) => {
  try {
    const data = await usersService.updateProfileAvatar(req.userId, req.file);
    return sendSuccess(res, 200, 'Profile avatar updated successfully', data);
  } catch (error) {
    return next(error);
  }
};

const toggleWishlist = async (req, res, next) => {
  try {
    const data = await usersService.toggleWishlist(req.userId, req.body.productId);
    return sendSuccess(res, 200, 'Wishlist updated successfully', data);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadProfileAvatar,
  toggleWishlist,
};
