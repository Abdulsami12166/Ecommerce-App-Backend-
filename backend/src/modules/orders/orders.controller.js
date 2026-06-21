const { sendSuccess } = require('../../shared/utils/apiResponse');
const ordersService = require('./orders.service');
const { logCustomerActivity } = require('../../utils/auditLogger');

const getOrders = async (req, res, next) => {
  try {
    const data = await ordersService.getOrdersForUser(req.userId);
    return sendSuccess(res, 200, 'Orders fetched successfully', data);
  } catch (error) {
    return next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const data = await ordersService.getOrderForUser(req.userId, req.params.id);
    return sendSuccess(res, 200, 'Order fetched successfully', data);
  } catch (error) {
    return next(error);
  }
};

const createOrder = async (req, res, next) => {
  try {
    const data = await ordersService.createOrderForUser(req.userId, req.body, req.app);
    const order = data.order;
    if (order) {
      await logCustomerActivity(
        req.userId,
        'Order Created',
        'orders',
        `Order ${String(order._id).slice(-6).toUpperCase()} created successfully`,
        order._id,
        req
      );
      if (order.paymentStatus === 'paid') {
        await logCustomerActivity(
          req.userId,
          'Order Placed',
          'orders',
          `Order ${String(order._id).slice(-6).toUpperCase()} placed successfully`,
          order._id,
          req
        );
        await logCustomerActivity(
          req.userId,
          'Payment Success',
          'orders',
          `Payment of ₹${order.totalAmount} successful for order ${String(order._id).slice(-6).toUpperCase()}`,
          order._id,
          req
        );
      }
    }
    return sendSuccess(res, 201, 'Order created successfully', data);
  } catch (error) {
    await logCustomerActivity(
      req.userId,
      'Payment Failure',
      'orders',
      `Order creation/payment failed: ${error.message}`,
      '',
      req
    );
    return next(error);
  }
};

const createPaymentOrder = async (req, res, next) => {
  try {
    const data = await ordersService.createPaymentOrderForUser(req.userId, req.body);
    return sendSuccess(res, 201, 'Payment order created successfully', data);
  } catch (error) {
    return next(error);
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    const data = await ordersService.verifyPaymentForUser(req.userId, req.body);
    if (data.verified) {
      const Order = require('../../models/Order');
      const order = await Order.findOne({ razorpayOrderId: req.body.razorpayOrderId });
      const orderId = order ? order._id : '';
      const orderCode = order ? String(order._id).slice(-6).toUpperCase() : '';
      await logCustomerActivity(
        req.userId,
        'Payment Success',
        'orders',
        `Payment verified successfully for order ${orderCode}`,
        orderId,
        req
      );
      await logCustomerActivity(
        req.userId,
        'Order Placed',
        'orders',
        `Order ${orderCode} placed successfully`,
        orderId,
        req
      );
    }
    return sendSuccess(res, 200, 'Payment verified successfully', data);
  } catch (error) {
    await logCustomerActivity(
      req.userId,
      'Payment Failure',
      'orders',
      `Payment verification failed: ${error.message}`,
      '',
      req
    );
    return next(error);
  }
};

module.exports = { getOrders, getOrderById, createOrder, createPaymentOrder, verifyPayment };
