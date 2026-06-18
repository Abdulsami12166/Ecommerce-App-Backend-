const express = require('express');

const adminController = require('./admin.controller');
const supportController = require('../support/support.controller');
const { requireAdminAuth, requireAdminRole } = require('../../shared/middleware/auth');
const reportsRouter = require('../reports/reports.routes');

// Import all extended controllers
const customerController = require('../../controllers/admin/customerAdminController');
const inventoryController = require('../../controllers/admin/inventoryAdminController');
const shipmentController = require('../../controllers/admin/shipmentAdminController');
const refundReturnController = require('../../controllers/admin/refundReturnAdminController');
const ticketController = require('../../controllers/admin/ticketAdminController');
const invoiceController = require('../../controllers/admin/invoiceAdminController');
const auditLogController = require('../../controllers/admin/auditLogAdminController');
const settingsController = require('../../controllers/admin/settingsAdminController');
const featureToggleController = require('../../controllers/admin/featureToggleAdminController');
const notificationController = require('../../controllers/admin/notificationAdminController');
const sessionController = require('../../controllers/admin/sessionAdminController');
const orderTimelineController = require('../../controllers/admin/orderTimelineAdminController');
const bulkOperationsController = require('../../controllers/admin/bulkOperationsAdminController');
const replacementsController = require('../replacements/replacements.controller');
const userAdminController = require('../../controllers/admin/userAdminController');

const { hasPermission } = require('../../services/rbacService');

const authorizePermission = permission => async (req, res, next) => {
  try {
    if (await hasPermission(req.user?.role, permission)) {
      return next();
    }
    return res.status(403).json({ success: false, message: 'Access denied' });
  } catch (e) {
    return next(e);
  }
};

const router = express.Router();

router.post('/auth/login', adminController.loginAdmin);

router.get('/dashboard/metrics', requireAdminAuth, adminController.getDashboardMetrics);
router.get('/activities', requireAdminAuth, requireAdminRole('admin', 'super-admin', 'support'), adminController.getActivities);

// ============ USERS & CUSTOMERS ============
router.get('/users', requireAdminAuth, requireAdminRole('admin', 'super-admin', 'support'), adminController.getUsers);
router.get('/users/:id/orders', requireAdminAuth, requireAdminRole('admin', 'super-admin', 'support'), adminController.getUserOrders);
router.delete('/users/:id', requireAdminAuth, requireAdminRole('admin', 'super-admin'), adminController.deleteUser);
router.post('/users/:id/block', requireAdminAuth, requireAdminRole('admin', 'super-admin'), adminController.blockUser);
router.post('/users/:id/unblock', requireAdminAuth, requireAdminRole('admin', 'super-admin'), adminController.unblockUser);
router.post('/users/:id/logout', requireAdminAuth, requireAdminRole('admin', 'super-admin'), adminController.forceLogoutUser);

router.get('/admins/:id/profile', requireAdminAuth, requireAdminRole('admin', 'super-admin', 'support'), userAdminController.getAdminProfile);

router.get('/customers', requireAdminAuth, requireAdminRole('admin', 'super-admin', 'support'), adminController.getCustomers);
router.get('/customers/:id', requireAdminAuth, requireAdminRole('admin', 'super-admin', 'support'), adminController.getCustomerDetail);
router.get('/customers/:id/activity-logs', requireAdminAuth, requireAdminRole('admin', 'super-admin', 'support'), adminController.getCustomerActivityLogs);
router.get('/customers/:id/notification-preferences', requireAdminAuth, requireAdminRole('admin', 'super-admin', 'support'), adminController.getCustomerNotificationPreferences);
router.post('/customers/:id/block', requireAdminAuth, requireAdminRole('admin', 'super-admin'), adminController.blockUser);
router.post('/customers/:id/unblock', requireAdminAuth, requireAdminRole('admin', 'super-admin'), adminController.unblockUser);

// Extended user detail/history endpoints mapping for user-history tab
router.get('/users/:id/activity', requireAdminAuth, authorizePermission('users:view'), (req, res, next) => {
  req.params.userId = req.params.id;
  return customerController.getCustomerActivityLogs(req, res, next);
});
router.get('/users/:id/login-history', requireAdminAuth, authorizePermission('users:view'), (req, res, next) => {
  return userAdminController.getUserLoginHistory(req, res, next);
});
router.get('/users/:id/payments', requireAdminAuth, authorizePermission('transactions:view'), (req, res, next) => {
  return userAdminController.getUserPayments(req, res, next);
});
router.put('/customers/:userId/notification-preferences', requireAdminAuth, customerController.updateNotificationPreferences);
router.get('/customers/stats/overview', requireAdminAuth, authorizePermission('analytics:view'), customerController.getCustomerStats);

// ============ INVENTORY ============
router.get('/inventory', requireAdminAuth, authorizePermission('inventory:view'), inventoryController.getAllInventory);
router.get('/inventory/product/:productId', requireAdminAuth, authorizePermission('inventory:view'), inventoryController.getProductInventory);
router.patch('/inventory/product/:productId/stock', requireAdminAuth, authorizePermission('inventory:manage'), inventoryController.updateStock);
router.patch('/inventory/product/:productId/reorder', requireAdminAuth, authorizePermission('inventory:manage'), inventoryController.updateReorderSettings);
router.get('/inventory/low-stock', requireAdminAuth, authorizePermission('inventory:view'), inventoryController.getLowStockProducts);
router.get('/inventory/product/:productId/movements', requireAdminAuth, authorizePermission('inventory:view'), inventoryController.getStockMovements);
router.get('/inventory/stats', requireAdminAuth, authorizePermission('inventory:view'), inventoryController.getInventoryStats);

// ============ SHIPMENTS ============
router.get('/shipments', requireAdminAuth, authorizePermission('orders:view'), shipmentController.getAllShipments);
router.get('/shipments/:shipmentId', requireAdminAuth, authorizePermission('orders:view'), shipmentController.getShipmentDetails);
router.post('/shipments/order/:orderId', requireAdminAuth, authorizePermission('orders:update'), shipmentController.createShipment);
router.patch('/shipments/:shipmentId/tracking', requireAdminAuth, authorizePermission('orders:update'), shipmentController.updateTrackingStatus);
router.get('/shipments/:shipmentId/tracking-history', requireAdminAuth, authorizePermission('orders:view'), shipmentController.getTrackingHistory);
router.get('/shipments/status/:status', requireAdminAuth, authorizePermission('orders:view'), shipmentController.getShipmentsByStatus);
router.get('/shipments/stats/overview', requireAdminAuth, authorizePermission('analytics:view'), shipmentController.getShipmentStats);

// ============ TICKETS ============
router.get('/tickets', requireAdminAuth, requireAdminRole('admin', 'super-admin', 'support'), ticketController.getAllTickets);
router.get('/tickets/:ticketId', requireAdminAuth, requireAdminRole('admin', 'super-admin', 'support'), ticketController.getTicketDetails);
router.post('/tickets/:ticketId/message', requireAdminAuth, requireAdminRole('admin', 'super-admin', 'support'), supportController.addAdminMessage);
router.patch('/tickets/:ticketId/status', requireAdminAuth, requireAdminRole('admin', 'super-admin', 'support'), ticketController.updateTicketStatus);
router.post('/tickets/:ticketId/assign', requireAdminAuth, requireAdminRole('admin', 'super-admin', 'support'), ticketController.assignTicket);
router.post('/tickets/:ticketId/escalate', requireAdminAuth, requireAdminRole('admin', 'super-admin', 'support'), ticketController.escalateTicket);
router.get('/tickets/stats/overview', requireAdminAuth, authorizePermission('analytics:view'), ticketController.getTicketStats);

// ============ RETURNS ============
router.get('/returns', requireAdminAuth, requireAdminRole('admin', 'super-admin', 'support'), supportController.getAllReturns);
router.get('/returns/:returnId', requireAdminAuth, requireAdminRole('admin', 'super-admin', 'support'), supportController.getAdminReturnDetail);
router.patch('/returns/:returnId/status', requireAdminAuth, requireAdminRole('admin', 'super-admin', 'support'), supportController.updateAdminReturnStatus);
router.post('/returns/:returnId/approve', requireAdminAuth, requireAdminRole('admin', 'super-admin', 'support'), (req, res, next) => {
  req.body.status = 'approved';
  return supportController.updateAdminReturnStatus(req, res, next);
});
router.post('/returns/:returnId/reject', requireAdminAuth, requireAdminRole('admin', 'super-admin', 'support'), (req, res, next) => {
  req.body.status = 'rejected';
  return supportController.updateAdminReturnStatus(req, res, next);
});

// ============ REFUNDS ============
router.get('/refunds', requireAdminAuth, requireAdminRole('admin', 'super-admin', 'support'), supportController.getAllRefunds);
router.get('/refunds/:refundId', requireAdminAuth, requireAdminRole('admin', 'super-admin', 'support'), supportController.getAdminRefundDetail);
router.post('/refunds/:refundId/approve', requireAdminAuth, requireAdminRole('admin', 'super-admin', 'support'), (req, res, next) => {
  req.body.status = 'approved';
  return supportController.updateAdminRefundStatus(req, res, next);
});
router.post('/refunds/:refundId/reject', requireAdminAuth, requireAdminRole('admin', 'super-admin', 'support'), (req, res, next) => {
  req.body.status = 'rejected';
  return supportController.updateAdminRefundStatus(req, res, next);
});
router.post('/refunds/:refundId/process', requireAdminAuth, requireAdminRole('admin', 'super-admin', 'support'), (req, res, next) => {
  req.body.status = 'processing';
  return supportController.updateAdminRefundStatus(req, res, next);
});
router.post('/refunds/:refundId/complete', requireAdminAuth, requireAdminRole('admin', 'super-admin', 'support'), (req, res, next) => {
  req.body.status = 'completed';
  return supportController.updateAdminRefundStatus(req, res, next);
});
router.get('/refunds/stats/overview', requireAdminAuth, authorizePermission('analytics:view'), refundReturnController.getRefundStats);

// ============ REPLACEMENTS ============
router.get('/replacements', requireAdminAuth, authorizePermission('orders:view'), replacementsController.getAllReplacements);
router.patch('/replacements/:replacementId/status', requireAdminAuth, authorizePermission('orders:update'), replacementsController.updateReplacementStatus);

// ============ PRODUCTS ============
router.get('/products', requireAdminAuth, requireAdminRole('admin', 'super-admin', 'product-manager'), adminController.getProducts);
router.post('/products', requireAdminAuth, requireAdminRole('admin', 'super-admin', 'product-manager'), adminController.createProduct);
router.put('/products/:id', requireAdminAuth, requireAdminRole('admin', 'super-admin', 'product-manager'), adminController.updateProduct);
router.delete('/products/:id', requireAdminAuth, requireAdminRole('admin', 'super-admin'), adminController.deleteProduct);

// ============ ORDERS ============
router.get('/orders', requireAdminAuth, requireAdminRole('admin', 'super-admin', 'product-manager', 'support'), adminController.getOrders);
router.get('/transactions', requireAdminAuth, requireAdminRole('admin', 'super-admin', 'product-manager'), adminController.getTransactions);
router.post('/orders', requireAdminAuth, requireAdminRole('admin', 'super-admin', 'product-manager'), adminController.createOrder);
router.patch('/orders/:id/status', requireAdminAuth, requireAdminRole('admin', 'super-admin', 'product-manager'), adminController.updateOrderStatus);
router.delete('/orders/:id', requireAdminAuth, requireAdminRole('admin', 'super-admin'), adminController.deleteOrder);

// Order timeline routes
router.get('/orders/:orderId/timeline', requireAdminAuth, requireAdminRole('admin', 'super-admin', 'product-manager', 'support'), adminController.getOrderTimeline);
router.post('/orders/:orderId/timeline/event', requireAdminAuth, requireAdminRole('admin', 'super-admin', 'product-manager', 'support'), adminController.addOrderTimelineEvent);

// ============ INVOICES ============
router.get('/invoices', requireAdminAuth, authorizePermission('finance:view'), invoiceController.getAllInvoices);
router.get('/invoices/:invoiceId', requireAdminAuth, authorizePermission('finance:view'), invoiceController.getInvoiceDetails);
router.post('/invoices/order/:orderId', requireAdminAuth, authorizePermission('finance:manage'), invoiceController.createInvoice);
router.post('/invoices/:invoiceId/send', requireAdminAuth, authorizePermission('finance:manage'), invoiceController.sendInvoice);
router.post('/invoices/:invoiceId/payment', requireAdminAuth, authorizePermission('finance:manage'), invoiceController.recordPayment);
router.post('/invoices/:invoiceId/credit-note', requireAdminAuth, authorizePermission('finance:manage'), invoiceController.issueCreditNote);
router.patch('/invoices/:invoiceId/status', requireAdminAuth, authorizePermission('finance:manage'), invoiceController.updateInvoiceStatus);
router.get('/invoices/stats/overview', requireAdminAuth, authorizePermission('analytics:view'), invoiceController.getInvoiceStats);

// ============ AUDIT LOGS ============
router.get('/audit-logs', requireAdminAuth, authorizePermission('audit:view'), auditLogController.getAllAuditLogs);
router.get('/audit-logs/:logId', requireAdminAuth, authorizePermission('audit:view'), auditLogController.getAuditLogDetails);
router.get('/audit-logs/user/:userId', requireAdminAuth, authorizePermission('audit:view'), auditLogController.getUserActivity);
router.get('/audit-logs/entity/:entityType/:entityId', requireAdminAuth, authorizePermission('audit:view'), auditLogController.getEntityActivity);
router.get('/audit-logs/stats/overview', requireAdminAuth, authorizePermission('analytics:view'), auditLogController.getAuditStats);
router.get('/audit-logs/export', requireAdminAuth, authorizePermission('audit:view'), auditLogController.exportAuditLogs);
router.get('/audit-logs/health/summary', requireAdminAuth, auditLogController.getSystemHealthSummary);

// ============ SETTINGS ============
router.get('/settings', requireAdminAuth, authorizePermission('settings:view'), settingsController.getAllSettings);
router.get('/settings/:key', requireAdminAuth, authorizePermission('settings:view'), settingsController.getSetting);
router.put('/settings/:key', requireAdminAuth, authorizePermission('settings:manage'), settingsController.updateSetting);
router.post('/settings/batch-update', requireAdminAuth, authorizePermission('settings:manage'), settingsController.updateMultipleSettings);
router.post('/settings', requireAdminAuth, authorizePermission('settings:manage'), settingsController.createSetting);
router.get('/settings/category/:category', requireAdminAuth, authorizePermission('settings:view'), settingsController.getSettingsByCategory);
router.post('/settings/:key/reset', requireAdminAuth, authorizePermission('settings:manage'), settingsController.resetSetting);
router.get('/settings/export', requireAdminAuth, authorizePermission('settings:view'), settingsController.exportSettings);
router.post('/settings/import', requireAdminAuth, authorizePermission('settings:manage'), settingsController.importSettings);

// ============ FEATURE TOGGLES ============
router.get('/feature-toggles', requireAdminAuth, authorizePermission('features:view'), featureToggleController.getAllFeatureToggles);
router.get('/feature-toggles/:name', requireAdminAuth, authorizePermission('features:view'), featureToggleController.getFeatureToggleDetails);
router.post('/feature-toggles/:name/enable', requireAdminAuth, authorizePermission('features:manage'), featureToggleController.enableFeature);
router.post('/feature-toggles/:name/disable', requireAdminAuth, authorizePermission('features:manage'), featureToggleController.disableFeature);
router.patch('/feature-toggles/:name/rollout', requireAdminAuth, authorizePermission('features:manage'), featureToggleController.updateRollout);
router.patch('/feature-toggles/:name/config', requireAdminAuth, authorizePermission('features:manage'), featureToggleController.updateConfiguration);
router.get('/feature-toggles/:name/check', featureToggleController.isFeatureEnabled); // Public endpoint
router.post('/feature-toggles', requireAdminAuth, authorizePermission('features:manage'), featureToggleController.createFeatureToggle);
router.get('/feature-toggles/stats/overview', requireAdminAuth, authorizePermission('analytics:view'), featureToggleController.getFeatureStats);
router.get('/feature-toggles/:name/dependencies', requireAdminAuth, authorizePermission('features:view'), featureToggleController.getFeatureDependencies);

// ============ NOTIFICATIONS ============
router.get('/notifications/templates', requireAdminAuth, authorizePermission('notifications:view'), notificationController.getAllTemplates);
router.get('/notifications/templates/:templateId', requireAdminAuth, authorizePermission('notifications:view'), notificationController.getTemplateDetails);
router.post('/notifications/templates', requireAdminAuth, authorizePermission('notifications:manage'), notificationController.createTemplate);
router.patch('/notifications/templates/:templateId', requireAdminAuth, authorizePermission('notifications:manage'), notificationController.updateTemplate);
router.delete('/notifications/templates/:templateId', requireAdminAuth, authorizePermission('notifications:manage'), notificationController.deleteTemplate);

router.get('/notifications/event-mappings', requireAdminAuth, authorizePermission('notifications:view'), notificationController.getAllEventMappings);
router.post('/notifications/event-mappings', requireAdminAuth, authorizePermission('notifications:manage'), notificationController.createEventMapping);
router.patch('/notifications/event-mappings/:mappingId', requireAdminAuth, authorizePermission('notifications:manage'), notificationController.updateEventMapping);
router.delete('/notifications/event-mappings/:mappingId', requireAdminAuth, authorizePermission('notifications:manage'), notificationController.deleteEventMapping);

router.get('/notifications/logs', requireAdminAuth, authorizePermission('notifications:view'), notificationController.getAllNotificationLogs);
router.get('/notifications/logs/:logId', requireAdminAuth, authorizePermission('notifications:view'), notificationController.getNotificationLogDetails);
router.post('/notifications/logs', requireAdminAuth, authorizePermission('notifications:manage'), notificationController.createNotificationLog);
router.get('/notifications/stats', requireAdminAuth, authorizePermission('analytics:view'), notificationController.getNotificationStats);

router.get('/notifications/marketing-rules', requireAdminAuth, authorizePermission('marketing:view'), notificationController.getAllMarketingRules);
router.post('/notifications/marketing-rules', requireAdminAuth, authorizePermission('marketing:manage'), notificationController.createMarketingRule);
router.patch('/notifications/marketing-rules/:ruleId', requireAdminAuth, authorizePermission('marketing:manage'), notificationController.updateMarketingRule);
router.delete('/notifications/marketing-rules/:ruleId', requireAdminAuth, authorizePermission('marketing:manage'), notificationController.deleteMarketingRule);

// ============ SESSIONS ============
router.get('/sessions', requireAdminAuth, requireAdminRole('super-admin'), sessionController.getAllActiveSessions);
router.get('/sessions/admin/:adminId', requireAdminAuth, requireAdminRole('super-admin'), sessionController.getAdminSessions);
router.get('/sessions/:sessionId', requireAdminAuth, requireAdminRole('super-admin'), sessionController.getSessionDetails);
router.post('/sessions', requireAdminAuth, requireAdminRole('super-admin'), sessionController.createSession);
router.post('/sessions/:sessionId/logout', requireAdminAuth, requireAdminRole('super-admin'), sessionController.forceLogout);
router.post('/sessions/admin/:adminId/logout-all', requireAdminAuth, requireAdminRole('super-admin'), sessionController.forceLogoutAllForAdmin);
router.patch('/sessions/:sessionId/activity', requireAdminAuth, requireAdminRole('super-admin'), sessionController.updateSessionActivity);
router.get('/sessions/stats/overview', requireAdminAuth, requireAdminRole('super-admin'), sessionController.getSessionStats);

// ============ ORDER TIMELINE EXTRA ============
router.patch('/orders/:orderId/timeline/:eventId', requireAdminAuth, authorizePermission('orders:update'), orderTimelineController.updateTimelineEvent);
router.get('/orders/:orderId/timeline/lifecycle', requireAdminAuth, authorizePermission('orders:view'), orderTimelineController.getOrderLifecycleHistory);
router.get('/timeline/stats', requireAdminAuth, authorizePermission('analytics:view'), orderTimelineController.getTimelineStats);

// ============ BULK OPERATIONS ============
router.get('/bulk-operations', requireAdminAuth, authorizePermission('products:manage'), bulkOperationsController.getBulkOperations);
router.get('/bulk-operations/:jobId', requireAdminAuth, authorizePermission('products:manage'), bulkOperationsController.getBulkOperationDetails);
router.post('/bulk-operations/visibility', requireAdminAuth, authorizePermission('products:manage'), bulkOperationsController.bulkToggleProductVisibility);
router.post('/bulk-operations/inventory', requireAdminAuth, authorizePermission('inventory:manage'), bulkOperationsController.bulkUpdateInventory);
router.post('/bulk-operations/category', requireAdminAuth, authorizePermission('products:manage'), bulkOperationsController.bulkAssignCategory);
router.post('/bulk-operations/pricing', requireAdminAuth, authorizePermission('products:manage'), bulkOperationsController.bulkUpdatePricing);
router.post('/bulk-operations/:jobId/cancel', requireAdminAuth, authorizePermission('products:manage'), bulkOperationsController.cancelBulkOperation);
router.get('/bulk-operations/:jobId/logs', requireAdminAuth, authorizePermission('products:manage'), bulkOperationsController.getBulkOperationLogs);
router.get('/bulk-operations/stats/overview', requireAdminAuth, authorizePermission('analytics:view'), bulkOperationsController.getBulkOperationStats);

// ============ REPORTS ============
router.use('/reports', requireAdminAuth, reportsRouter);

module.exports = router;
