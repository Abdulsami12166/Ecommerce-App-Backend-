const express = require('express');

const ordersController = require('./orders.controller');
const { requireUserAuth } = require('../../shared/middleware/auth');

const router = express.Router();

router.get('/', requireUserAuth, ordersController.getOrders);
router.get('/:id', requireUserAuth, ordersController.getOrderById);
router.post('/', requireUserAuth, ordersController.createOrder);

module.exports = router;
