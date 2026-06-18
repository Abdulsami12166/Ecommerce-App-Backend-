const express = require('express');

const authRoutes = require('../modules/auth/auth.routes');
const productsRoutes = require('../modules/products/products.routes');
const usersRoutes = require('../modules/users/users.routes');
const ordersRoutes = require('../modules/orders/orders.routes');
const supportRoutes = require('../modules/support/support.routes');
const returnsRoutes = require('../modules/returns/returns.routes');
const replacementsRoutes = require('../modules/replacements/replacements.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/products', productsRoutes);
router.use('/users', usersRoutes);
router.use('/orders', ordersRoutes);
router.use('/support', supportRoutes);
router.use('/support/returns', returnsRoutes);
router.use('/support/replacements', replacementsRoutes);

module.exports = router;
