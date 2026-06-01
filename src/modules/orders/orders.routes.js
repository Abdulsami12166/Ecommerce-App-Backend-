const express = require('express');

const ordersController = require('./orders.controller');
const { requireUserAuth } = require('../../shared/middleware/auth');

const router = express.Router();

router.get('/', requireUserAuth, ordersController.getOrders);
router.post('/payments/razorpay/order', requireUserAuth, ordersController.createPaymentOrder);
router.post('/payments/razorpay/verify', requireUserAuth, ordersController.verifyPayment);
router.post('/', requireUserAuth, ordersController.createOrder);
router.get('/:id', requireUserAuth, ordersController.getOrderById);

module.exports = router;
