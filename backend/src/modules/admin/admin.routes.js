const express = require('express');

const adminController = require('./admin.controller');
const { requireAdminAuth } = require('../../shared/middleware/auth');

const router = express.Router();

router.post('/auth/login', adminController.loginAdmin);

router.get('/dashboard/metrics', requireAdminAuth, adminController.getDashboardMetrics);
router.get('/activities', requireAdminAuth, adminController.getActivities);

router.get('/users', requireAdminAuth, adminController.getUsers);
router.get('/users/:id/orders', requireAdminAuth, adminController.getUserOrders);
router.delete('/users/:id', requireAdminAuth, adminController.deleteUser);
router.post('/users/:id/block', requireAdminAuth, adminController.blockUser);
router.post('/users/:id/unblock', requireAdminAuth, adminController.unblockUser);
router.post('/users/:id/logout', requireAdminAuth, adminController.forceLogoutUser);

router.get('/products', requireAdminAuth, adminController.getProducts);
router.post('/products', requireAdminAuth, adminController.createProduct);
router.put('/products/:id', requireAdminAuth, adminController.updateProduct);
router.delete('/products/:id', requireAdminAuth, adminController.deleteProduct);

router.get('/orders', requireAdminAuth, adminController.getOrders);
router.post('/orders', requireAdminAuth, adminController.createOrder);
router.patch('/orders/:id/status', requireAdminAuth, adminController.updateOrderStatus);
router.delete('/orders/:id', requireAdminAuth, adminController.deleteOrder);

module.exports = router;
