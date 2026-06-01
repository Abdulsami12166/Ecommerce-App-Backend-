const { sendSuccess } = require('../../shared/utils/apiResponse');
const ordersService = require('./orders.service');

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
    return sendSuccess(res, 201, 'Order created successfully', data);
  } catch (error) {
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
    return sendSuccess(res, 200, 'Payment verified successfully', data);
  } catch (error) {
    return next(error);
  }
};

module.exports = { getOrders, getOrderById, createOrder, createPaymentOrder, verifyPayment };
