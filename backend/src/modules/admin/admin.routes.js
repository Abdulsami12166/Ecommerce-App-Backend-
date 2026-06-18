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

router.get('/auth/seed', async (req, res, next) => {
  try {
    const User = require('../../models/User');
    const adminAccounts = [
      {
        name: 'Super Admin',
        email: 'superadmin@company.com',
        role: 'super-admin',
        password: process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@123',
      },
      {
        name: 'Product Manager',
        email: 'products@company.com',
        role: 'product-manager',
        password: process.env.PRODUCT_MANAGER_PASSWORD || 'ProductManager@123',
      },
      {
        name: 'Support Admin',
        email: 'support@company.com',
        role: 'support',
        password: process.env.SUPPORT_ADMIN_PASSWORD || 'SupportAdmin@123',
      },
    ];

    const results = [];
    for (const account of adminAccounts) {
      const existingUser = await User.findOne({ email: account.email }).select('+password +tokenVersion');
      if (existingUser) {
        existingUser.name = account.name;
        existingUser.role = account.role;
        existingUser.blocked = false;
        existingUser.isVerified = true;
        existingUser.password = account.password;
        existingUser.tokenVersion = (existingUser.tokenVersion || 0) + 1;
        await existingUser.save();
        results.push({ email: account.email, role: account.role, status: 'updated' });
      } else {
        await User.create({
          name: account.name,
          email: account.email,
          password: account.password,
          role: account.role,
          isVerified: true,
          blocked: false,
        });
        results.push({ email: account.email, role: account.role, status: 'created' });
      }
    }

    return res.json({ success: true, message: 'Database seeded successfully', data: results });
  } catch (e) {
    return next(e);
  }
});

router.get('/dashboard/metrics', requireAdminAuth, adminController.getDashboardMetrics);
router.get('/activities', requireAdminAuth, authorizePermission('activity:view'), adminController.getActivities);

// ============ USERS & CUSTOMERS ============
router.get('/users', requireAdminAuth, authorizePermission('users:view'), adminController.getUsers);
router.get('/users/:id/orders', requireAdminAuth, authorizePermission('users:view'), adminController.getUserOrders);
router.delete('/users/:id', requireAdminAuth, authorizePermission('users:control'), adminController.deleteUser);
router.post('/users/:id/block', requireAdminAuth, authorizePermission('users:control'), adminController.blockUser);
router.post('/users/:id/unblock', requireAdminAuth, authorizePermission('users:control'), adminController.unblockUser);
router.post('/users/:id/logout', requireAdminAuth, authorizePermission('users:control'), adminController.forceLogoutUser);

router.get('/admins/:id/profile', requireAdminAuth, authorizePermission('admins:view'), userAdminController.getAdminProfile);

// ============ ADMIN MANAGEMENT & ACCESS CONTROL ============
router.get('/access-control', requireAdminAuth, authorizePermission('admins:manage'), userAdminController.getAdminAccessControl);
router.put('/roles/:role/permissions', requireAdminAuth, authorizePermission('roles:assign'), userAdminController.updateAdminRolePermissions);
router.get('/admins', requireAdminAuth, authorizePermission('admins:manage'), userAdminController.getAdminUsers);
router.post('/admins', requireAdminAuth, authorizePermission('admins:manage'), userAdminController.createAdminUser);
router.patch('/admins/:id/role', requireAdminAuth, authorizePermission('roles:assign'), userAdminController.updateAdminUserRole);

router.get('/customers', requireAdminAuth, authorizePermission('users:view'), adminController.getCustomers);
router.get('/customers/:id', requireAdminAuth, authorizePermission('users:view'), adminController.getCustomerDetail);
router.get('/customers/:id/activity-logs', requireAdminAuth, authorizePermission('users:view'), adminController.getCustomerActivityLogs);
router.get('/customers/:id/notification-preferences', requireAdminAuth, authorizePermission('users:view'), adminController.getCustomerNotificationPreferences);
router.post('/customers/:id/block', requireAdminAuth, authorizePermission('users:control'), adminController.blockUser);
router.post('/customers/:id/unblock', requireAdminAuth, authorizePermission('users:control'), adminController.unblockUser);

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
router.get('/tickets', requireAdminAuth, authorizePermission('support:view'), ticketController.getAllTickets);
router.get('/tickets/:ticketId', requireAdminAuth, authorizePermission('support:view'), ticketController.getTicketDetails);
router.post('/tickets/:ticketId/message', requireAdminAuth, authorizePermission('support:respond'), supportController.addAdminMessage);
router.patch('/tickets/:ticketId/status', requireAdminAuth, authorizePermission('support:respond'), ticketController.updateTicketStatus);
router.post('/tickets/:ticketId/assign', requireAdminAuth, authorizePermission('support:manage'), ticketController.assignTicket);
router.post('/tickets/:ticketId/escalate', requireAdminAuth, authorizePermission('support:escalate'), ticketController.escalateTicket);
router.get('/tickets/stats/overview', requireAdminAuth, authorizePermission('analytics:view'), ticketController.getTicketStats);

// ============ RETURNS ============
router.get('/returns', requireAdminAuth, authorizePermission('returns:view'), supportController.getAllReturns);
router.get('/returns/:returnId', requireAdminAuth, authorizePermission('returns:view'), supportController.getAdminReturnDetail);
router.patch('/returns/:returnId/status', requireAdminAuth, authorizePermission('returns:manage'), supportController.updateAdminReturnStatus);
router.post('/returns/:returnId/approve', requireAdminAuth, authorizePermission('returns:manage'), (req, res, next) => {
  req.body.status = 'approved';
  return supportController.updateAdminReturnStatus(req, res, next);
});
router.post('/returns/:returnId/reject', requireAdminAuth, authorizePermission('returns:manage'), (req, res, next) => {
  req.body.status = 'rejected';
  return supportController.updateAdminReturnStatus(req, res, next);
});

// ============ REFUNDS ============
router.get('/refunds', requireAdminAuth, authorizePermission('refunds:view'), supportController.getAllRefunds);
router.get('/refunds/:refundId', requireAdminAuth, authorizePermission('refunds:view'), supportController.getAdminRefundDetail);
router.post('/refunds/:refundId/approve', requireAdminAuth, authorizePermission('refunds:manage'), (req, res, next) => {
  req.body.status = 'approved';
  return supportController.updateAdminRefundStatus(req, res, next);
});
router.post('/refunds/:refundId/reject', requireAdminAuth, authorizePermission('refunds:manage'), (req, res, next) => {
  req.body.status = 'rejected';
  return supportController.updateAdminRefundStatus(req, res, next);
});
router.post('/refunds/:refundId/process', requireAdminAuth, authorizePermission('refunds:manage'), (req, res, next) => {
  req.body.status = 'processing';
  return supportController.updateAdminRefundStatus(req, res, next);
});
router.post('/refunds/:refundId/complete', requireAdminAuth, authorizePermission('refunds:manage'), (req, res, next) => {
  req.body.status = 'completed';
  return supportController.updateAdminRefundStatus(req, res, next);
});
router.get('/refunds/stats/overview', requireAdminAuth, authorizePermission('analytics:view'), refundReturnController.getRefundStats);

// ============ REPLACEMENTS ============
router.get('/replacements', requireAdminAuth, authorizePermission('orders:view'), replacementsController.getAllReplacements);
router.patch('/replacements/:replacementId/status', requireAdminAuth, authorizePermission('orders:update'), replacementsController.updateReplacementStatus);

// ============ PRODUCTS ============
router.get('/products', requireAdminAuth, authorizePermission('products:view'), adminController.getProducts);
router.post('/products', requireAdminAuth, authorizePermission('products:create'), adminController.createProduct);
router.put('/products/:id', requireAdminAuth, authorizePermission('products:create'), adminController.updateProduct);
router.delete('/products/:id', requireAdminAuth, authorizePermission('products:delete'), adminController.deleteProduct);

// ============ ORDERS ============
router.get('/orders', requireAdminAuth, authorizePermission('orders:view'), adminController.getOrders);
router.get('/transactions', requireAdminAuth, authorizePermission('transactions:view'), adminController.getTransactions);
router.post('/orders', requireAdminAuth, authorizePermission('orders:update'), adminController.createOrder);
router.patch('/orders/:id/status', requireAdminAuth, authorizePermission('orders:update'), adminController.updateOrderStatus);
router.delete('/orders/:id', requireAdminAuth, authorizePermission('orders:update'), adminController.deleteOrder);

// Order timeline routes
router.get('/orders/:orderId/timeline', requireAdminAuth, authorizePermission('orders:view'), adminController.getOrderTimeline);
router.post('/orders/:orderId/timeline/event', requireAdminAuth, authorizePermission('orders:update'), adminController.addOrderTimelineEvent);

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
