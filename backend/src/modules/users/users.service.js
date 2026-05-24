const path = require('path');

const { usersRepository } = require('./users.repository');
const { buildUserPayload } = require('../auth/auth.service');
const { AppError } = require('../../shared/utils/appError');

const getProfile = async userId => {
  const user = await usersRepository.findUserById(userId);
  if (!user) throw new AppError('User not found', 404);
  return { user: buildUserPayload(user) };
};

const updateProfile = async (userId, payload) => {
  const user = await usersRepository.findUserById(userId);
  if (!user) throw new AppError('User not found', 404);

  if (payload.name) user.name = payload.name.trim();
  if (payload.phone !== undefined) user.phone = payload.phone.trim();
  await usersRepository.saveUser(user);
  return { user: buildUserPayload(user) };
};

const updateProfileAvatar = async (userId, file) => {
  const user = await usersRepository.findUserById(userId);
  if (!user) throw new AppError('User not found', 404);
  if (!file) throw new AppError('Avatar file is required', 400);

  user.avatar = `/uploads/${path.basename(file.filename)}`;
  await usersRepository.saveUser(user);
  return { user: buildUserPayload(user) };
};

const toggleWishlist = async (userId, productId) => {
  if (!productId) throw new AppError('Product ID is required', 400);

  const user = await usersRepository.findUserById(userId);
  if (!user) throw new AppError('User not found', 404);

  const normalizedId = String(productId);
  const exists = user.wishlist.some(item => String(item) === normalizedId);
  user.wishlist = exists
    ? user.wishlist.filter(item => String(item) !== normalizedId)
    : [...user.wishlist, productId];

  await usersRepository.saveUser(user);
  await user.populate('wishlist');
  return { wishlist: user.wishlist };
};

module.exports = {
  getProfile,
  updateProfile,
  updateProfileAvatar,
  toggleWishlist,
};
