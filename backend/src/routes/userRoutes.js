const express = require('express');

const authRoutes = require('../modules/auth/auth.routes');
const productsRoutes = require('../modules/products/products.routes');
const usersRoutes = require('../modules/users/users.routes');
const ordersRoutes = require('../modules/orders/orders.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/products', productsRoutes);
router.use('/users', usersRoutes);
router.use('/orders', ordersRoutes);

module.exports = router;
