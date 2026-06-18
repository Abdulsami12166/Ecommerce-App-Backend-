const authRoutes = require('../modules/auth/auth.routes');
const productsRoutes = require('../modules/products/products.routes');
const usersRoutes = require('../modules/users/users.routes');
const ordersRoutes = require('../modules/orders/orders.routes');
const adminRoutes = require('../modules/admin/admin.routes');
const supportRoutes = require('../modules/support/support.routes');
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


  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/products', productsRoutes);
  app.use('/api/v1/users', usersRoutes);
  app.use('/api/v1/orders', ordersRoutes);
  app.use('/api/v1/support', supportRoutes);
  app.use('/api/v1/admin', adminRoutes);

  // Backwards-compat: some clients may call without /api/v1 prefix
  app.use('/support', supportRoutes);
  app.use('/admin', adminRoutes);

};

module.exports = { registerRoutes };
