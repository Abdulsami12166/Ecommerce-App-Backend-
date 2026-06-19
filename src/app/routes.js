const authRoutes = require('../modules/auth/auth.routes');
const productsRoutes = require('../modules/products/products.routes');
const usersRoutes = require('../modules/users/users.routes');
const ordersRoutes = require('../modules/orders/orders.routes');
const adminRoutes = require('../modules/admin/admin.routes');
const supportRoutes = require('../modules/support/support.routes');
const storeSettingsRoutes = require('../routes/storeSettingsRoutes');
const { logger } = require('../shared/utils/logger');

const registerRoutes = app => {
  app.get('/', (req, res) => {
    res.json({
      success: true,
      message: 'Ecommerce backend is running - v2',
    });
  });

  app.get('/api/v1/health', (req, res) => {
    res.json({
      success: true,
      message: 'Ecommerce backend is healthy',
    });
  });


  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/products', productsRoutes);
  app.use('/api/v1/users', usersRoutes);
  app.use('/api/v1/orders', ordersRoutes);
  app.use('/api/v1/support', supportRoutes);
  app.use('/api/v1/admin', adminRoutes);
  app.use('/api/v1/store-settings', storeSettingsRoutes);

  // Cross-service internal socket bridge route
  app.post('/api/v1/internal/emit-socket', (req, res) => {
    try {
      const { userId, event, payload } = req.body;
      if (userId) {
        const { emitToUser } = require('../shared/events/eventBus');
        emitToUser(app, userId, event, payload);
        logger.info(`[SocketBridge] Forwarded event "${event}" to user ${userId}`);
      } else {
        const { emitToAll } = require('../shared/events/eventBus');
        emitToAll(app, event, payload);
        logger.info(`[SocketBridge] Broadcasted event "${event}" to all users`);
      }
      res.json({ success: true, message: 'Event emitted' });
    } catch (err) {
      logger.error('[SocketBridge] Emission failed', { error: err.message });
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Backwards-compat: some clients may call without /api/v1 prefix
  app.use('/support', supportRoutes);
  app.use('/admin', adminRoutes);
  app.use('/store-settings', storeSettingsRoutes);

};

module.exports = { registerRoutes };
