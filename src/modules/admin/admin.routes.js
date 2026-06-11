const express = require('express');

const adminController = require('./admin.controller');
const { requireAdminAuth, requireAdminRoles } = require('../../shared/middleware/auth');

const router = express.Router();
const allow = (...roles) => [requireAdminAuth, requireAdminRoles(...roles)];

router.post('/auth/login', adminController.loginAdmin);

router.get('/dashboard/metrics', requireAdminAuth, adminController.getDashboardMetrics);
router.get('/activities', ...allow('admin', 'super-admin', 'support'), adminController.getActivities);

router.get('/users', ...allow('admin', 'super-admin', 'support'), adminController.getUsers);
router.get('/users/:id/orders', ...allow('admin', 'super-admin', 'support'), adminController.getUserOrders);
router.delete('/users/:id', ...allow('admin', 'super-admin'), adminController.deleteUser);
router.post('/users/:id/block', ...allow('admin', 'super-admin'), adminController.blockUser);
router.post('/users/:id/unblock', ...allow('admin', 'super-admin'), adminController.unblockUser);
router.post('/users/:id/logout', ...allow('admin', 'super-admin'), adminController.forceLogoutUser);

router.get('/products', ...allow('admin', 'super-admin', 'product-manager'), adminController.getProducts);
router.post('/products', ...allow('admin', 'super-admin', 'product-manager'), adminController.createProduct);
router.put('/products/:id', ...allow('admin', 'super-admin', 'product-manager'), adminController.updateProduct);
router.delete('/products/:id', ...allow('admin', 'super-admin'), adminController.deleteProduct);

router.get('/orders', ...allow('admin', 'super-admin', 'product-manager', 'support'), adminController.getOrders);
router.post('/orders', ...allow('admin', 'super-admin', 'product-manager'), adminController.createOrder);
router.patch('/orders/:id/status', ...allow('admin', 'super-admin', 'product-manager'), adminController.updateOrderStatus);
router.delete('/orders/:id', ...allow('admin', 'super-admin'), adminController.deleteOrder);

module.exports = router;
