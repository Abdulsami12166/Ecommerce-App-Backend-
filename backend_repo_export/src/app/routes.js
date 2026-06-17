const authRoutes = require('../modules/auth/auth.routes');
const productsRoutes = require('../modules/products/products.routes');
const usersRoutes = require('../modules/users/users.routes');
const ordersRoutes = require('../modules/orders/orders.routes');
const adminRoutes = require('../modules/admin/admin.routes');
const { logger } = require('../shared/utils/logger');

const registerRoutes = app => {
  app.get('/', (req, res) => {
    res.json({
      success: true,
      message: 'Ecommerce backend is running',
    });
  });

  app.get('/api/v1/health', (req, res) => {
    res.json({
      success: true,
      message: 'Ecommerce backend is healthy',
    });
  });

  // TEMPORARY: catch POSTs to support tickets and log body for diagnosis (unsafe - remove after debug)
  app.post('/api/v1/support/tickets', (req, res) => {
    logger.info('TEMP support POST received (repo_export)', { path: req.originalUrl, body: req.body });
    return res.status(200).json({ success: true, message: 'Temporary support POST received (repo_export)', data: req.body });
  });

  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/products', productsRoutes);
  app.use('/api/v1/users', usersRoutes);
  app.use('/api/v1/orders', ordersRoutes);
  app.use('/api/v1/admin', adminRoutes);
};

module.exports = { registerRoutes };
