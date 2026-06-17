const Order = require('../../models/Order');
const Product = require('../../models/Product');
const User = require('../../models/User');
const UserActivity = require('../../models/UserActivity');

const adminRepository = {
  countUsers: filter => User.countDocuments(filter || {}),
  countOrders: filter => Order.countDocuments(filter || {}),
  countProducts: filter => Product.countDocuments(filter || {}),
  aggregateOrderStatusCounts: () => Order.aggregate([{ $group: { _id: '$orderStatus', count: { $sum: 1 } } }]),
  aggregateRevenue: () =>
    Order.aggregate([
      { $match: { orderStatus: 'delivered', paymentStatus: 'paid' } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } },
    ]),
  getRecentOrders: () =>
    Order.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user', 'name email')
      .select('totalAmount orderStatus paymentStatus createdAt user'),
  getRecentUsers: () =>
    User.find()
      .sort({ lastLoginAt: -1 })
      .limit(10)
      .select('name email phone role blocked isVerified lastLoginAt createdAt'),
  getRecentActivities: ({ page = 1, limit = 20 } = {}) =>
    UserActivity.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('user', 'name email')
      .select('action details createdAt user'),
  countActivities: () => UserActivity.countDocuments({}),
  createActivity: payload => UserActivity.create(payload),
  getUsers: () =>
    User.find()
      .select('name email phone role avatar isVerified blocked lastLoginAt createdAt')
      .sort({ createdAt: -1 }),
  getAdmins: () =>
    User.find({ role: { $in: ['admin', 'super-admin', 'product-manager', 'support'] } })
      .select('name email phone role avatar isVerified blocked lastLoginAt createdAt updatedAt')
      .sort({ createdAt: -1 }),
  getCustomers: ({ page = 1, limit = 20, search = '', status = '', sortBy = 'createdAt', sortOrder = 'desc' } = {}) => {
    const filter = { role: 'user' };
    const trimmedSearch = String(search || '').trim();
    if (trimmedSearch) {
      filter.$or = [
        { name: { $regex: trimmedSearch, $options: 'i' } },
        { email: { $regex: trimmedSearch, $options: 'i' } },
        { phone: { $regex: trimmedSearch, $options: 'i' } },
      ];
    }
    if (status === 'active') filter.blocked = false;
    if (status === 'blocked') filter.blocked = true;

    const allowedSorts = ['name', 'email', 'createdAt', 'lastLoginAt'];
    const sortField = allowedSorts.includes(sortBy) ? sortBy : 'createdAt';
    const direction = sortOrder === 'asc' ? 1 : -1;

    return User.find(filter)
      .select('name email phone role avatar isVerified blocked lastLoginAt createdAt updatedAt wishlist')
      .sort({ [sortField]: direction })
      .skip((page - 1) * limit)
      .limit(limit);
  },
  countCustomers: ({ search = '', status = '' } = {}) => {
    const filter = { role: 'user' };
    const trimmedSearch = String(search || '').trim();
    if (trimmedSearch) {
      filter.$or = [
        { name: { $regex: trimmedSearch, $options: 'i' } },
        { email: { $regex: trimmedSearch, $options: 'i' } },
        { phone: { $regex: trimmedSearch, $options: 'i' } },
      ];
    }
    if (status === 'active') filter.blocked = false;
    if (status === 'blocked') filter.blocked = true;
    return User.countDocuments(filter);
  },
  getUserById: userId => User.findById(userId).select('+refreshToken +tokenVersion'),
  getCustomerById: userId =>
    User.findOne({ _id: userId, role: 'user' })
      .select('name email phone role avatar isVerified blocked lastLoginAt createdAt updatedAt wishlist')
      .populate('wishlist', 'title price discountedPrice images stock'),
  saveUser: user => user.save(),
  deleteUser: user => user.deleteOne(),
  getOrdersByUserId: userId => Order.find({ user: userId }).sort({ createdAt: -1 }),
  getActivitiesByUserId: (userId, { page = 1, limit = 50, actions } = {}) => {
    const filter = { user: userId };
    if (actions?.length) filter.action = { $in: actions };
    return UserActivity.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('action details ipAddress userAgent createdAt updatedAt user');
  },
  getProducts: () => Product.find().populate('seller', 'name email role blocked'),
  getProductById: productId => Product.findById(productId),
  createProduct: payload => Product.create(payload),
  saveProduct: product => product.save(),
  deleteProduct: product => product.deleteOne(),
  getOrders: () => Order.find().populate('user', 'name email phone role blocked').sort({ createdAt: -1 }),
  getTransactions: () =>
    Order.find()
      .populate('user', 'name email phone role blocked')
      .sort({ createdAt: -1 })
      .select('totalAmount orderStatus paymentStatus paymentMethod paymentReference razorpayOrderId razorpayPaymentId transactionStatus transactionVerifiedAt createdAt user'),
  getOrderById: orderId => Order.findById(orderId),
  createOrder: payload => Order.create(payload),
  saveOrder: order => order.save(),
  deleteOrder: order => order.deleteOne(),
};

module.exports = { adminRepository };
