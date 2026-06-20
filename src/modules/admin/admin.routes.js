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
    const RolePermission = require('../../models/RolePermission');
    
    // Clear customized role permissions so it falls back to DEFAULT_ROLE_PERMISSIONS
    await RolePermission.deleteMany({});

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

    // Seed regular customer user (Zix)
    let zixUser = await User.findOne({ email: 'zix@company.com' });
    if (!zixUser) {
      zixUser = await User.create({
        name: 'Zix',
        email: 'zix@company.com',
        password: 'Password@123',
        role: 'user',
        isVerified: true,
        fcmToken: 'fcm_zix_mock_token'
      });
      results.push({ email: zixUser.email, role: zixUser.role, status: 'created' });
    } else {
      zixUser.fcmToken = 'fcm_zix_mock_token';
      await zixUser.save();
    }

    // Seed mock UserActivity logs for Zix
    const UserActivity = require('../../models/UserActivity');
    // ponytail: delete existing activities for Zix to keep seed action idempotent
    await UserActivity.deleteMany({ user: zixUser._id });
    await UserActivity.create([
      {
        user: zixUser._id,
        action: 'login',
        details: 'Zix signed in successfully.',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        createdAt: new Date(Date.now() - 3 * 3600 * 1000)
      },
      {
        user: zixUser._id,
        action: 'logout',
        details: 'Zix signed out.',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        createdAt: new Date(Date.now() - 2 * 3600 * 1000)
      },
      {
        user: zixUser._id,
        action: 'login',
        details: 'Zix signed in successfully.',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        createdAt: new Date(Date.now() - 1 * 3600 * 1000)
      }
    ]);

    // Seed mock product
    const Product = require('../../models/Product');
    let testProduct = await Product.findOne({});
    if (!testProduct) {
      testProduct = await Product.create({
        title: 'Cool Sneakers',
        name: 'Cool Sneakers',
        description: 'Vibrant sneakers for running and lifestyle',
        price: 2999,
        images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff'],
        category: 'shoes',
        stock: 50,
        sku: 'SNK-COOL-01'
      });
    }

    // Seed Zix wishlist
    zixUser.wishlist = [testProduct._id];
    await zixUser.save();

    // Seed mock order
    const Order = require('../../models/Order');
    let testOrder = await Order.findOne({ user: zixUser._id });
    if (!testOrder) {
      testOrder = await Order.create({
        user: zixUser._id,
        items: [
          {
            product: testProduct._id,
            title: testProduct.title,
            quantity: 1,
            selectedSize: '10',
            price: testProduct.price,
            image: testProduct.images[0]
          }
        ],
        subtotal: testProduct.price,
        shippingFee: 49,
        taxAmount: 539,
        totalAmount: testProduct.price + 49 + 539,
        orderStatus: 'shipped',
        statusHistory: [
          { status: 'pending', label: 'Pending', timestamp: new Date() },
          { status: 'shipped', label: 'Shipped', timestamp: new Date() }
        ],
        paymentStatus: 'paid',
        paymentMethod: 'card',
        razorpayOrderId: 'order_zix_mock_123',
        razorpayPaymentId: 'pay_zix_mock_123',
        transactionStatus: 'paid',
        transactionVerifiedAt: new Date()
      });
    }

    // Seed mock shipment
    const Shipment = require('../../models/Shipment');
    let testShipment = await Shipment.findOne({ order: testOrder._id });
    if (!testShipment) {
      testShipment = await Shipment.create({
        order: testOrder._id,
        trackingNumber: 'TRK-ZIX-12345',
        carrier: 'BlueDart',
        estimatedDeliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        weight: 1.5,
        shippingAddress: {
          name: zixUser.name,
          phone: '+919999999999',
          address: '123 Tech Park',
          city: 'Bangalore',
          state: 'Karnataka',
          postalCode: '560001',
          country: 'India'
        },
        status: 'in_transit',
        trackingEvents: [
          { status: 'created', location: 'Origin Facility', description: 'Shipment created' },
          { status: 'in_transit', location: 'Bangalore Hub', description: 'Package in transit' }
        ],
        cost: 150
      });
    }

    // Seed mock invoice
    const Invoice = require('../../models/Invoice');
    let testInvoice = await Invoice.findOne({ order: testOrder._id });
    if (!testInvoice) {
      testInvoice = await Invoice.create({
        invoiceNumber: 'INV-' + new Date().toISOString().split('T')[0].replace(/-/g, '') + '-00099',
        order: testOrder._id,
        user: zixUser._id,
        invoiceDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'paid',
        billingAddress: {
          name: zixUser.name,
          email: zixUser.email,
          phone: '+919999999999',
          address: '123 Tech Park',
          city: 'Bangalore',
          state: 'Karnataka',
          postalCode: '560001',
          country: 'India'
        },
        shippingAddress: {
          name: zixUser.name,
          phone: '+919999999999',
          address: '123 Tech Park',
          city: 'Bangalore',
          state: 'Karnataka',
          postalCode: '560001',
          country: 'India'
        },
        items: [
          {
            product: testProduct._id,
            description: testProduct.title,
            quantity: 1,
            unitPrice: testProduct.price,
            total: testProduct.price
          }
        ],
        subtotal: testProduct.price,
        tax: { amount: 539, rate: 18 },
        shippingCost: 49,
        total: testProduct.price + 49 + 539,
        amountPaid: testProduct.price + 49 + 539,
        amountDue: 0,
        terms: 'Due on receipt'
      });
    }
    // Seed mock SupportTicket
    const SupportTicket = require('../../models/SupportTicket');
    await SupportTicket.deleteMany({ user: zixUser._id });
    await SupportTicket.create({
      user: zixUser._id,
      order: testOrder._id,
      subject: 'Mock Ticket for Zix',
      description: 'Zix needs support for standard delivery issues.',
      category: 'delivery',
      priority: 'high',
      status: 'open',
      messages: [
        {
          senderType: 'user',
          sender: zixUser._id,
          message: 'Standard delivery taking too long, please help.'
        }
      ]
    });

    // Seed mock RefundRequest
    const RefundRequest = require('../../models/RefundRequest');
    await RefundRequest.deleteMany({ user: zixUser._id });
    await RefundRequest.create({
      user: zixUser._id,
      order: testOrder._id,
      items: [testProduct._id],
      reason: 'return',
      refundType: 'full',
      refundAmount: testOrder.totalAmount,
      status: 'initiated',
      notes: 'Zix is requesting refund for delay in delivery.'
    });
    const FeatureToggle = require('../../models/FeatureToggle');
    const defaultToggles = [
      {
        name: 'new-product-details',
        displayName: 'New Product Details Page',
        category: 'product',
        description: 'Enables the revamped detailed view for products',
        isEnabled: true,
        visibility: 'public'
      },
      {
        name: 'express-checkout',
        displayName: 'Express Checkout Flow',
        category: 'order',
        description: 'Enables 1-click checkout option for users',
        isEnabled: false,
        visibility: 'public'
      },
      {
        name: 'cod-payment',
        displayName: 'COD Payment Method',
        category: 'payment',
        description: 'Toggle cash-on-delivery option at checkout',
        isEnabled: true,
        visibility: 'public'
      },
      {
        name: 'push-notifications',
        displayName: 'Push Notification Alerts',
        category: 'system',
        description: 'Toggles real-time mobile push notifications via Firebase',
        isEnabled: true,
        visibility: 'public'
      },
      {
        name: 'two-factor-auth',
        displayName: 'Two-Factor Authentication',
        category: 'system',
        description: 'Adds an extra layer of security for user logins',
        isEnabled: false,
        visibility: 'internal'
      },
      {
        name: 'seo-optimization',
        displayName: 'SEO Metadata Injection',
        category: 'system',
        description: 'Optimizes search engine indexing and tags dynamically',
        isEnabled: true,
        visibility: 'public'
      }
    ];

    for (const toggle of defaultToggles) {
      const existing = await FeatureToggle.findOne({ name: toggle.name });
      if (!existing) {
        await FeatureToggle.create(toggle);
      }
    }

    const StoreSetting = require('../../models/StoreSetting');
    const defaultSettings = [
      { key: 'store.name', label: 'Store Name', value: 'My Ecommerce Store', type: 'string', category: 'general', section: 'brand', description: 'The public name of your store' },
      { key: 'store.tagline', label: 'Store Tagline', value: 'Shop the best products online', type: 'string', category: 'general', section: 'brand', description: 'Short description shown on the homepage' },
      { key: 'store.email', label: 'Support Email', value: 'support@store.com', type: 'string', category: 'general', section: 'contact', description: 'Customer support email address' },
      { key: 'store.phone', label: 'Support Phone', value: '+91-9999999999', type: 'string', category: 'general', section: 'contact', description: 'Customer support phone number' },
      { key: 'store.currency', label: 'Currency', value: 'INR', type: 'string', category: 'general', section: 'locale', description: 'Store currency code' },
      { key: 'store.language', label: 'Language', value: 'en', type: 'string', category: 'general', section: 'locale', description: 'Default store language' },
      { key: 'store.logo', label: 'Store Logo', value: 'https://example.com/logo.png', type: 'string', category: 'general', section: 'brand', description: 'URL of the store logo' },
      { key: 'store.timezone', label: 'Timezone', value: 'UTC', type: 'string', category: 'general', section: 'locale', description: 'Store timezone' },
      { key: 'shipping.free_threshold', label: 'Free Shipping Threshold (₹)', value: 500, type: 'number', category: 'shipping', section: 'fees', description: 'Orders above this amount get free shipping' },
      { key: 'shipping.default_fee', label: 'Default Shipping Fee (₹)', value: 49, type: 'number', category: 'shipping', section: 'fees', description: 'Flat rate shipping fee' },
      { key: 'shipping.express_fee', label: 'Express Shipping Fee (₹)', value: 99, type: 'number', category: 'shipping', section: 'fees', description: 'Express delivery surcharge' },
      { key: 'shipping.estimated_days', label: 'Estimated Delivery (days)', value: 5, type: 'number', category: 'shipping', section: 'delivery', description: 'Standard delivery time in business days' },
      { key: 'payment.cod_enabled', label: 'Cash On Delivery', value: true, type: 'boolean', category: 'payment', section: 'methods', description: 'Enable COD payment option' },
      { key: 'payment.razorpay_enabled', label: 'Razorpay Payments', value: true, type: 'boolean', category: 'payment', section: 'methods', description: 'Enable Razorpay payment gateway' },
      { key: 'payment.min_order_amount', label: 'Minimum Order Amount (₹)', value: 100, type: 'number', category: 'payment', section: 'limits', description: 'Minimum cart value to place an order' },
      { key: 'payment.refund_policy', label: 'Refund Policy', value: '30-day return policy', type: 'string', category: 'payment', section: 'policies', description: 'Store refund policy terms' },
      { key: 'tax.gst_enabled', label: 'GST Enabled', value: true, type: 'boolean', category: 'tax', section: 'gst', description: 'Apply GST to orders' },
      { key: 'tax.gst_rate', label: 'Default GST Rate (%)', value: 18, type: 'number', category: 'tax', section: 'gst', description: 'GST percentage applied to taxable products' },
      { key: 'tax.tax_inclusive', label: 'Prices Include Tax', value: false, type: 'boolean', category: 'tax', section: 'gst', description: 'Whether product prices already include GST' },
      { key: 'notifications.order_placed', label: 'Order Placed Email', value: true, type: 'boolean', category: 'notifications', section: 'email', description: 'Send confirmation email when order is placed' },
      { key: 'notifications.order_shipped', label: 'Order Shipped Email', value: true, type: 'boolean', category: 'notifications', section: 'email', description: 'Notify customer when order ships' },
      { key: 'notifications.low_stock_alert', label: 'Low Stock Alert', value: true, type: 'boolean', category: 'notifications', section: 'admin', description: 'Alert admin when stock falls below reorder level' },
      { key: 'security.max_login_attempts', label: 'Max Login Attempts', value: 5, type: 'number', category: 'security', section: 'auth', description: 'Account locked after this many failed logins' },
      { key: 'security.session_timeout', label: 'Session Timeout (hours)', value: 24, type: 'number', category: 'security', section: 'auth', description: 'Admin session expires after this many hours' },
      { key: 'security.otp_expiry', label: 'OTP Expiry (minutes)', value: 10, type: 'number', category: 'security', section: 'auth', description: 'Time window for OTP validity' },
      { key: 'performance.cache_ttl', label: 'Cache TTL (seconds)', value: 300, type: 'number', category: 'performance', section: 'cache', description: 'Time-to-live for cached API responses' },
      { key: 'performance.products_per_page', label: 'Products Per Page', value: 20, type: 'number', category: 'performance', section: 'pagination', description: 'Number of products shown per page' }
    ];

    for (const s of defaultSettings) {
      const existing = await StoreSetting.findOne({ key: s.key });
      if (!existing) {
        await StoreSetting.create({ ...s, isEditable: true });
      }
    }

    // Sync shipment statuses with orders
    try {
      const { syncShipmentStatusesWithOrders } = require('../../controllers/admin/shipmentAdminController');
      await syncShipmentStatusesWithOrders();
    } catch (syncErr) {
      console.error('[Seed] Shipment status sync failed:', syncErr.message);
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
router.get('/users/:id/tickets', requireAdminAuth, authorizePermission('users:view'), (req, res, next) => {
  return userAdminController.getUserTickets(req, res, next);
});
router.get('/users/:id/refunds', requireAdminAuth, authorizePermission('users:view'), (req, res, next) => {
  return userAdminController.getUserRefunds(req, res, next);
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
router.get('/shipments/stats/overview', requireAdminAuth, authorizePermission('analytics:view'), shipmentController.getShipmentStats);
router.get('/shipments/status/:status', requireAdminAuth, authorizePermission('orders:view'), shipmentController.getShipmentsByStatus);
router.get('/shipments/:shipmentId', requireAdminAuth, authorizePermission('orders:view'), shipmentController.getShipmentDetails);
router.post('/shipments/order/:orderId', requireAdminAuth, authorizePermission('orders:update'), shipmentController.createShipment);
router.patch('/shipments/:shipmentId/tracking', requireAdminAuth, authorizePermission('orders:update'), shipmentController.updateTrackingStatus);
router.get('/shipments/:shipmentId/tracking-history', requireAdminAuth, authorizePermission('orders:view'), shipmentController.getTrackingHistory);

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
router.post('/notifications/send', requireAdminAuth, authorizePermission('notifications:manage'), notificationController.sendDirectNotification);
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
