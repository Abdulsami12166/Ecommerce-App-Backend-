const { adminRepository } = require('./admin.repository');
const { AppError } = require('../../shared/utils/appError');
const { emitToAdmins, emitToAll, emitToUser } = require('../../shared/events/eventBus');
const { socketEvents } = require('../../shared/events/socketEvents');

const slugify = value =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const getDashboardMetrics = async () => {
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [
    totalUsers,
    totalOrders,
    productCount,
    blockedUsers,
    newUsersToday,
    ordersLast24h,
    activeUsersLast24h,
    orderStatusCounts,
    revenueAgg,
    recentOrders,
    recentUsers,
    recentActivities,
  ] = await Promise.all([
    adminRepository.countUsers({}),
    adminRepository.countOrders({}),
    adminRepository.countProducts({}),
    adminRepository.countUsers({ blocked: true }),
    adminRepository.countUsers({ createdAt: { $gte: startOfToday } }),
    adminRepository.countOrders({ createdAt: { $gte: last24h } }),
    adminRepository.countUsers({ lastLoginAt: { $gte: last24h } }),
    adminRepository.aggregateOrderStatusCounts(),
    adminRepository.aggregateRevenue(),
    adminRepository.getRecentOrders(),
    adminRepository.getRecentUsers(),
    adminRepository.getRecentActivities(),
  ]);

  const ordersByStatus = orderStatusCounts.reduce((acc, item) => {
    acc[item._id] = item.count;
    return acc;
  }, {});

  return {
    totalUsers,
    totalOrders,
    productCount,
    revenue: revenueAgg?.[0]?.totalRevenue || 0,
    blockedUsers,
    newUsersToday,
    ordersLast24h,
    activeUsersLast24h,
    ordersByStatus,
    recentOrders,
    recentUsers,
    recentActivities,
    fetchedAt: now.toISOString(),
  };
};

const getActivities = async query => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 50;
  const [activities, total] = await Promise.all([
    adminRepository.getRecentActivities({ page, limit }),
    adminRepository.countActivities(),
  ]);

  return {
    activities,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

const getUsers = async () => ({ users: await adminRepository.getUsers() });
const getUserOrders = async userId => ({ orders: await adminRepository.getOrdersByUserId(userId) });

const blockUser = async userId => {
  const user = await adminRepository.getUserById(userId);
  if (!user) throw new AppError('User not found', 404);
  user.blocked = true;
  await adminRepository.saveUser(user);
  await adminRepository.createActivity({
    user: user._id,
    action: 'profile_update',
    details: `${user.name} was blocked by admin`,
  });
  return { user };
};

const unblockUser = async userId => {
  const user = await adminRepository.getUserById(userId);
  if (!user) throw new AppError('User not found', 404);
  user.blocked = false;
  await adminRepository.saveUser(user);
  await adminRepository.createActivity({
    user: user._id,
    action: 'profile_update',
    details: `${user.name} was unblocked by admin`,
  });
  return { user };
};

const deleteUser = async userId => {
  const user = await adminRepository.getUserById(userId);
  if (!user) throw new AppError('User not found', 404);
  await adminRepository.deleteUser(user);
  return {};
};

const forceLogoutUser = async (userId, app) => {
  const user = await adminRepository.getUserById(userId);
  if (!user) throw new AppError('User not found', 404);

  user.tokenVersion = (user.tokenVersion || 0) + 1;
  user.refreshToken = undefined;
  await adminRepository.saveUser(user);
  await adminRepository.createActivity({
    user: user._id,
    action: 'logout',
    details: `${user.name || user.email} was forcefully logged out by admin`,
  });

  const payload = {
    userId: String(user._id),
    message: `${user.name || user.email} was forcefully logged out`,
  };

  emitToAdmins(app, socketEvents.LEGACY.USER_FORCE_LOGOUT, payload);
  emitToAdmins(app, socketEvents.DOMAIN.ADMIN_FORCE_LOGOUT, payload);
  emitToUser(app, user._id, socketEvents.DOMAIN.ADMIN_FORCE_LOGOUT, payload);

  return {};
};

const getProducts = async () => ({ products: await adminRepository.getProducts() });

const createProduct = async (payload, adminUserId, app) => {
  if (!payload?.title?.trim()) {
    throw new AppError('Product title is required', 400);
  }

  if (!payload?.description?.trim()) {
    throw new AppError('Product description is required', 400);
  }

  if (!payload?.category?.trim()) {
    throw new AppError('Product category is required', 400);
  }

  const baseSlug = slugify(payload.slug || payload.title);
  const nextPayload = {
    ...payload,
    slug: `${baseSlug || 'product'}-${Date.now()}`,
    seller: payload.seller || adminUserId,
    images: Array.isArray(payload.images)
      ? payload.images.filter(Boolean)
      : payload.image
        ? [payload.image]
        : [],
    isPublished: payload.isPublished ?? true,
  };

  const product = await adminRepository.createProduct(nextPayload);
  await adminRepository.createActivity({
    user: adminUserId,
    action: 'product',
    details: `${product.title} was published by admin`,
  });

  const eventPayload = {
    productId: String(product._id),
    title: product.title,
    description: product.description,
    image: product.images?.[0] || '',
    category: product.category,
    price: product.price,
    discountedPrice: product.discountedPrice,
    stock: product.stock,
  };

  emitToAdmins(app, socketEvents.DOMAIN.PRODUCT_CREATED, eventPayload);
  emitToAll(app, socketEvents.DOMAIN.PRODUCT_CREATED, eventPayload);

  return { product };
};

const updateProduct = async (productId, payload) => {
  const product = await adminRepository.getProductById(productId);
  if (!product) throw new AppError('Product not found', 404);
  Object.assign(product, payload);
  await adminRepository.saveProduct(product);
  return { product };
};

const deleteProduct = async productId => {
  const product = await adminRepository.getProductById(productId);
  if (!product) throw new AppError('Product not found', 404);
  await adminRepository.deleteProduct(product);
  return {};
};

const getOrders = async () => ({ orders: await adminRepository.getOrders() });

const createAdminOrder = async (payload, app) => {
  const order = await adminRepository.createOrder(payload);
  const eventPayload = { orderId: String(order._id), ...order.toObject() };
  emitToAdmins(app, socketEvents.LEGACY.NEW_ORDER, eventPayload);
  emitToAdmins(app, socketEvents.DOMAIN.ORDER_CREATED, eventPayload);
  return { order };
};

const updateOrderStatus = async (orderId, payload, app) => {
  const order = await adminRepository.getOrderById(orderId);
  if (!order) throw new AppError('Order not found', 404);
  if (payload.orderStatus) order.orderStatus = payload.orderStatus;
  if (payload.paymentStatus) order.paymentStatus = payload.paymentStatus;
  await adminRepository.saveOrder(order);
  await adminRepository.createActivity({
    user: order.user,
    action: 'order',
    details: `Order ${String(order._id).slice(-6).toUpperCase()} updated to ${order.orderStatus}`,
  });

  const eventPayload = {
    orderId: String(order._id),
    userId: String(order.user),
    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus,
  };

  emitToAdmins(app, socketEvents.LEGACY.ORDER_STATUS_CHANGED, eventPayload);
  emitToAdmins(app, socketEvents.DOMAIN.ORDER_UPDATED, eventPayload);
  emitToUser(app, order.user, socketEvents.DOMAIN.ORDER_UPDATED, eventPayload);

  return { order };
};

const deleteOrder = async orderId => {
  const order = await adminRepository.getOrderById(orderId);
  if (!order) throw new AppError('Order not found', 404);
  await adminRepository.deleteOrder(order);
  return {};
};

module.exports = {
  getDashboardMetrics,
  getActivities,
  getUsers,
  getUserOrders,
  blockUser,
  unblockUser,
  deleteUser,
  forceLogoutUser,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getOrders,
  createAdminOrder,
  updateOrderStatus,
  deleteOrder,
};
