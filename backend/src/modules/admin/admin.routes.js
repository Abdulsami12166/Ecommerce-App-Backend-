const express = require('express');

const adminController = require('./admin.controller');
const { requireAdminAuth, requireAdminRole } = require('../../shared/middleware/auth');
const reportsRouter = require('../reports/reports.routes');

const router = express.Router();

router.post('/auth/login', adminController.loginAdmin);

router.get('/dashboard/metrics', requireAdminAuth, adminController.getDashboardMetrics);
router.get('/activities', requireAdminAuth, requireAdminRole('admin', 'super-admin', 'support'), adminController.getActivities);

router.get('/users', requireAdminAuth, requireAdminRole('admin', 'super-admin', 'support'), adminController.getUsers);
router.get('/users/:id/orders', requireAdminAuth, requireAdminRole('admin', 'super-admin', 'support'), adminController.getUserOrders);
router.delete('/users/:id', requireAdminAuth, requireAdminRole('admin', 'super-admin'), adminController.deleteUser);
router.post('/users/:id/block', requireAdminAuth, requireAdminRole('admin', 'super-admin'), adminController.blockUser);
router.post('/users/:id/unblock', requireAdminAuth, requireAdminRole('admin', 'super-admin'), adminController.unblockUser);
router.post('/users/:id/logout', requireAdminAuth, requireAdminRole('admin', 'super-admin'), adminController.forceLogoutUser);

router.get('/customers', requireAdminAuth, requireAdminRole('admin', 'super-admin', 'support'), adminController.getCustomers);
router.get('/customers/:id', requireAdminAuth, requireAdminRole('admin', 'super-admin', 'support'), adminController.getCustomerDetail);
router.get('/customers/:id/activity-logs', requireAdminAuth, requireAdminRole('admin', 'super-admin', 'support'), adminController.getCustomerActivityLogs);
router.get('/customers/:id/notification-preferences', requireAdminAuth, requireAdminRole('admin', 'super-admin', 'support'), adminController.getCustomerNotificationPreferences);
router.post('/customers/:id/block', requireAdminAuth, requireAdminRole('admin', 'super-admin'), adminController.blockUser);
router.post('/customers/:id/unblock', requireAdminAuth, requireAdminRole('admin', 'super-admin'), adminController.unblockUser);

router.get('/products', requireAdminAuth, requireAdminRole('admin', 'super-admin', 'product-manager'), adminController.getProducts);
router.post('/products', requireAdminAuth, requireAdminRole('admin', 'super-admin', 'product-manager'), adminController.createProduct);
router.put('/products/:id', requireAdminAuth, requireAdminRole('admin', 'super-admin', 'product-manager'), adminController.updateProduct);
router.delete('/products/:id', requireAdminAuth, requireAdminRole('admin', 'super-admin'), adminController.deleteProduct);

router.get('/orders', requireAdminAuth, requireAdminRole('admin', 'super-admin', 'product-manager', 'support'), adminController.getOrders);
router.get('/transactions', requireAdminAuth, requireAdminRole('admin', 'super-admin', 'product-manager'), adminController.getTransactions);
router.post('/orders', requireAdminAuth, requireAdminRole('admin', 'super-admin', 'product-manager'), adminController.createOrder);
router.patch('/orders/:id/status', requireAdminAuth, requireAdminRole('admin', 'super-admin', 'product-manager'), adminController.updateOrderStatus);
router.delete('/orders/:id', requireAdminAuth, requireAdminRole('admin', 'super-admin'), adminController.deleteOrder);

// Order timeline routes (Admin)
router.get('/orders/:orderId/timeline', requireAdminAuth, requireAdminRole('admin', 'super-admin', 'product-manager', 'support'), adminController.getOrderTimeline);
router.post('/orders/:orderId/timeline/event', requireAdminAuth, requireAdminRole('admin', 'super-admin', 'product-manager', 'support'), adminController.addOrderTimelineEvent);

// Reports routes
router.use('/reports', requireAdminAuth, reportsRouter);


module.exports = router;
