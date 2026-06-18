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

const normalizeUser = user => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  avatar: user.avatar,
  isVerified: user.isVerified,
  blocked: user.blocked,
  status: user.blocked ? 'blocked' : 'active',
  lastLogin: user.lastLoginAt,
  lastLoginAt: user.lastLoginAt,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const getUsers = async () => ({ users: await adminRepository.getUsers() });
const getUserOrders = async userId => ({ orders: await adminRepository.getOrdersByUserId(userId) });

const buildCustomerSummary = async user => {
  const orders = await adminRepository.getOrdersByUserId(user._id);
  return {
    ...normalizeUser(user),
    totalOrders: orders.length,
    totalSpent: orders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0),
    wishlistCount: user.wishlist?.length || 0,
    lastActivityAt: user.lastLoginAt || user.updatedAt || user.createdAt,
  };
};

const getCustomers = async query => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 100);
  const params = {
    page,
    limit,
    search: query.search,
    status: query.status,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
  };
  const [users, total] = await Promise.all([
    adminRepository.getCustomers(params),
    adminRepository.countCustomers(params),
  ]);
  const customers = await Promise.all(users.map(buildCustomerSummary));
  return {
    customers,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

const getCustomerDetail = async userId => {
  const user = await adminRepository.getCustomerById(userId);
  if (!user) throw new AppError('Customer not found', 404);
  const [summary, orders, activityLogs, refundCount, ticketCount] = await Promise.all([
    buildCustomerSummary(user),
    adminRepository.getOrdersByUserId(userId),
    adminRepository.getActivitiesByUserId(userId, { limit: 20 }),
    adminRepository.countRefunds({ userId }),
    adminRepository.countTickets({ userId }),
  ]);

  const orderList = orders.map(order => ({
    _id: order._id,
    totalAmount: order.totalAmount,
    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    items: order.items,
    address: order.address,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  }));

  const addresses = orders
    .map(order => order.address)
    .filter(Boolean)
    .map(address => ({
      _id: address._id,
      type: address.type || address.label || 'Shipping',
      address: [
        address.addressLine1,
        address.addressLine2,
        address.city,
        address.state,
        address.postalCode || address.pincode,
        address.country,
      ].filter(Boolean).join(', ') || String(address),
    }));

  return {
    customer: {
      ...summary,
      addresses,
      orders: orderList,
      ordersPlaced: orderList.length,
      ordersCancelled: orderList.filter(order => order.orderStatus === 'cancelled').length,
      ordersReturned: orderList.filter(order => order.orderStatus === 'returned').length,
      refundRequests: Array.from({ length: refundCount }),
      ticketsRaised: Array.from({ length: ticketCount }),
      chatHistory: [],
      cartActivity: [],
      notificationHistory: [],
      wishlist: user.wishlist || [],
      activityLogs,
    },
  };
};

const getCustomerActivityLogs = async (userId, query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 50, 1), 100);
  const logs = await adminRepository.getActivitiesByUserId(userId, { page, limit });
  return { logs };
};

const getCustomerNotificationPreferences = async userId => ({
  preferences: {
    _id: userId,
    userId,
    channels: { email: true, sms: false, push: true, inApp: true },
    categories: {
      orders: true,
      refunds: true,
      tickets: true,
      marketing: false,
    },
    frequency: 'instant',
  },
});

const blockUser = async (userId, app) => {
  const user = await adminRepository.getUserById(userId);
  if (!user) throw new AppError('User not found', 404);
  user.blocked = true;
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  user.refreshToken = undefined;
  await adminRepository.saveUser(user);
  await adminRepository.createActivity({
    user: user._id,
    action: 'profile_update',
    details: `${user.name} was blocked by admin`,
  });
  const payload = { userId: String(user._id), status: 'blocked', message: 'Account blocked by administrator' };
  emitToAdmins(app, socketEvents.DOMAIN.ADMIN_ACTIVITY_CREATED, payload);
  emitToUser(app, user._id, socketEvents.DOMAIN.ADMIN_FORCE_LOGOUT, payload);
  return { user };
};

const unblockUser = async (userId, app) => {
  const user = await adminRepository.getUserById(userId);
  if (!user) throw new AppError('User not found', 404);
  user.blocked = false;
  await adminRepository.saveUser(user);
  await adminRepository.createActivity({
    user: user._id,
    action: 'profile_update',
    details: `${user.name} was unblocked by admin`,
  });
  emitToAdmins(app, socketEvents.DOMAIN.ADMIN_ACTIVITY_CREATED, {
    userId: String(user._id),
    status: 'active',
    message: 'Account unblocked by administrator',
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
const getTransactions = async () => ({ transactions: await adminRepository.getTransactions() });

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
    isPublished: true, // Always publish products created by admin
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
    sizes: product.sizes || [],
  };

  emitToAdmins(app, socketEvents.DOMAIN.PRODUCT_CREATED, eventPayload);
  emitToAll(app, socketEvents.DOMAIN.PRODUCT_CREATED, eventPayload);

  return { product };
};

const updateProduct = async (productId, payload, app) => {
  const product = await adminRepository.getProductById(productId);
  if (!product) throw new AppError('Product not found', 404);

  Object.assign(product, payload);
  await adminRepository.saveProduct(product);

  // Notify users in real-time
  const eventPayload = {
    productId: String(product._id),
    title: product.title,
    description: product.description,
    image: product.images?.[0] || '',
    category: product.category,
    price: product.price,
    discountedPrice: product.discountedPrice,
    stock: product.stock,
    sizes: product.sizes || [],
  };

  // Notify users
  // - existing client listens to `product.updated`
  emitToAll(app, 'product.updated', eventPayload);


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
  const nextStatus = payload.orderStatus || order.orderStatus;
  const nextPaymentStatus = payload.paymentStatus || order.paymentStatus;

  if (payload.orderStatus) {
    order.orderStatus = payload.orderStatus;
    order.statusHistory = order.statusHistory || [];
    order.statusHistory.push({
      status: payload.orderStatus,
      label: String(payload.orderStatus)
        .split('-')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' '),
      timestamp: new Date(),
    });
  }

  if (payload.paymentStatus) {
    order.paymentStatus = payload.paymentStatus;
  }

  await adminRepository.saveOrder(order);
  await adminRepository.createActivity({
    user: order.user,
    action: 'order',
    details: `Order ${String(order._id).slice(-6).toUpperCase()} updated to ${order.orderStatus}`,
  });

  const eventPayload = {
    orderId: String(order._id),
    userId: String(order.user),
    orderStatus: nextStatus,
    paymentStatus: nextPaymentStatus,
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

const getOrderTimeline = async orderId => {
  const order = await adminRepository.getOrderById(orderId);
  if (!order) throw new AppError('Order not found', 404);

  const events = (order.statusHistory || [])
    .slice()
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    .map((sh, idx) => ({
      id: `timeline_${idx}_${orderId}`,
      timestamp: sh.timestamp,
      event: sh.status,
      description: sh.label || sh.status,
      actor: 'admin',
    }));

  return { orderId: String(orderId), events };
};

const addOrderTimelineEvent = async (orderId, payload, adminUserId, app) => {
  const order = await adminRepository.getOrderById(orderId);
  if (!order) throw new AppError('Order not found', 404);

  const { event, description, actor } = payload || {};
  const nextStatus = event || payload?.status || payload?.orderStatus;
  if (!nextStatus) throw new AppError('Event/status is required', 400);

  order.orderStatus = nextStatus;
  order.statusHistory = order.statusHistory || [];
  order.statusHistory.push({
    status: nextStatus,
    label: description || String(nextStatus)
      .split('-')
      .map(part => (part ? part.charAt(0).toUpperCase() + part.slice(1) : part))
      .join(' '),
    timestamp: new Date(),
  });

  await adminRepository.saveOrder(order);

  const eventPayload = {
    orderId: String(order._id),
    userId: String(order.user),
    orderStatus: nextStatus,
    paymentStatus: order.paymentStatus,
  };

  emitToAdmins(app, socketEvents.DOMAIN.ORDER_UPDATED, eventPayload);
  emitToUser(app, order.user, socketEvents.DOMAIN.ORDER_UPDATED, eventPayload);

  return { orderId: String(order._id) };
};

module.exports = {
  getDashboardMetrics,
  getActivities,
  getUsers,
  getUserOrders,
  getCustomers,
  getCustomerDetail,
  getCustomerActivityLogs,
  getCustomerNotificationPreferences,
  blockUser,
  unblockUser,
  deleteUser,
  forceLogoutUser,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getOrders,
  getTransactions,
  createAdminOrder,
  updateOrderStatus,
  deleteOrder,
  getOrderTimeline,
  addOrderTimelineEvent,
};
