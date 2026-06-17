const authRoutes = require('../modules/auth/auth.routes');
const productsRoutes = require('../modules/products/products.routes');
const usersRoutes = require('../modules/users/users.routes');
const ordersRoutes = require('../modules/orders/orders.routes');
const adminRoutes = require('../modules/admin/admin.routes');
const supportRoutes = require('../modules/support/support.routes');

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

  // Debug: verify support router is mounted (used for diagnosing 404s)
  app.get('/api/v1/support/__debug', (req, res) => {
    res.json({ ok: true, message: 'support router is reachable' });
  });

  // TEMPORARY: catch POSTs to support tickets and log body for diagnosis (unsafe - remove after debug)
  app.post('/api/v1/support/tickets', (req, res) => {
    console.log('TEMP support POST received', { path: req.originalUrl, body: req.body });
    return res.status(200).json({ success: true, message: 'Temporary support POST received', data: req.body });
  });


  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/products', productsRoutes);
  app.use('/api/v1/users', usersRoutes);
  app.use('/api/v1/orders', ordersRoutes);
  // Debug: verify support router is mounted in Render runtime
  console.log('[routes] mounting support routes at /api/v1/support');
  app.use('/api/v1/support', supportRoutes);

  // Debug: show all /api/v1/support requests that reach this layer
  app.use('/api/v1/support', (req, res, next) => {
    console.log('[routes] support prefix hit', { method: req.method, originalUrl: req.originalUrl });
    next();
  });

  app.use('/api/v1/admin', adminRoutes);
};

module.exports = { registerRoutes };
