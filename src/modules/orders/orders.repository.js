const Order = require('../../models/Order');

const ordersRepository = {
  createOrder: payload => Order.create(payload),
  findOrdersByUserId: userId =>
    Order.find({ user: userId }).sort({ createdAt: -1 }).populate('user', 'name email phone role blocked'),
  findOrderById: orderId =>
    Order.findById(orderId).populate('user', 'name email phone role blocked'),
  findOrderByRazorpayOrderId: razorpayOrderId =>
    Order.findOne({ razorpayOrderId }).populate('user', 'name email phone role blocked'),
  saveOrder: order => order.save(),
};

module.exports = { ordersRepository };
