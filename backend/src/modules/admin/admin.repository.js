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
  getUserById: userId => User.findById(userId).select('+refreshToken +tokenVersion'),
  saveUser: user => user.save(),
  deleteUser: user => user.deleteOne(),
  getOrdersByUserId: userId => Order.find({ user: userId }).sort({ createdAt: -1 }),
  getProducts: () => Product.find().populate('seller', 'name email role blocked'),
  getProductById: productId => Product.findById(productId),
  createProduct: payload => Product.create(payload),
  saveProduct: product => product.save(),
  deleteProduct: product => product.deleteOne(),
  getOrders: () => Order.find().populate('user', 'name email phone role blocked').sort({ createdAt: -1 }),
  getOrderById: orderId => Order.findById(orderId),
  createOrder: payload => Order.create(payload),
  saveOrder: order => order.save(),
  deleteOrder: order => order.deleteOne(),
};

module.exports = { adminRepository };
