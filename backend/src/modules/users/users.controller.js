const { sendSuccess } = require('../../shared/utils/apiResponse');
const usersService = require('./users.service');
const { logCustomerActivity } = require('../../utils/auditLogger');

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
    await logCustomerActivity(
      req.userId,
      'Profile Updates',
      'authentication',
      'Profile updated successfully',
      '',
      req
    );
    return sendSuccess(res, 200, 'Profile updated successfully', data);
  } catch (error) {
    return next(error);
  }
};

const uploadProfileAvatar = async (req, res, next) => {
  try {
    const data = await usersService.updateProfileAvatar(req.userId, req.file);
    await logCustomerActivity(
      req.userId,
      'Profile Updates',
      'authentication',
      'Profile avatar updated successfully',
      '',
      req
    );
    return sendSuccess(res, 200, 'Profile avatar updated successfully', data);
  } catch (error) {
    return next(error);
  }
};

const toggleWishlist = async (req, res, next) => {
  try {
    const User = require('../../models/User');
    const user = await User.findById(req.userId);
    const isRemoved = user && user.wishlist.some(item => String(item) === String(req.body.productId));

    const data = await usersService.toggleWishlist(req.userId, req.body.productId);
    
    await logCustomerActivity(
      req.userId,
      isRemoved ? 'Product Removed from Wishlist' : 'Product Added to Wishlist',
      'wishlist',
      isRemoved ? 'Product removed from wishlist' : 'Product added to wishlist',
      req.body.productId,
      req
    );
    return sendSuccess(res, 200, 'Wishlist updated successfully', data);
  } catch (error) {
    return next(error);
  }
};

const updateFcmToken = async (req, res, next) => {
  try {
    const data = await usersService.updateFcmToken(req.userId, req.body.fcmToken);
    return sendSuccess(res, 200, 'FCM token updated successfully', data);
  } catch (error) {
    return next(error);
  }
};

const postClientActivityLog = async (req, res, next) => {
  try {
    const { action, module, details, relatedEntityId, platform, deviceInfo, metadata } = req.body;
    if (!action || !module || !details) {
      return res.status(400).json({ success: false, message: 'action, module, and details are required' });
    }
    await logCustomerActivity(req.userId, action, module, details, relatedEntityId, req, {
      platform,
      deviceInfo,
      metadata
    });
    return res.status(201).json({ success: true, message: 'Activity logged successfully' });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadProfileAvatar,
  toggleWishlist,
  updateFcmToken,
  postClientActivityLog,
};
