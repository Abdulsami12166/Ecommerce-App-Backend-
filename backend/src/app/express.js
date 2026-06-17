const cors = require('cors');
const cookieParser = require('cookie-parser');
const express = require('express');
const path = require('path');

require('dotenv').config();

const { registerRoutes } = require('./routes');
const { requestLogger } = require('../shared/middleware/requestLogger');
const { notFound, errorHandler } = require('../shared/middleware/errorHandler');
const { logger } = require('../shared/utils/logger');

const createExpressApp = () => {
  const app = express();

  app.use(
    cors({
      origin: process.env.CLIENT_URL || '*',
      credentials: true,
    }),
  );

  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(requestLogger);
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

  registerRoutes(app);

  // Log registered routes for debugging (helps identify missing endpoints)
  try {
    const routes = [];
    (app._router && app._router.stack || []).forEach(mw => {
      if (mw.route && mw.route.path) {
        const methods = Object.keys(mw.route.methods).join(',').toUpperCase();
        routes.push(`${methods} ${mw.route.path}`);
      } else if (mw.name === 'router' && mw.handle && mw.handle.stack) {
        mw.handle.stack.forEach(r => {
          if (r.route && r.route.path) {
            const methods = Object.keys(r.route.methods).join(',').toUpperCase();
            routes.push(`${methods} ${r.route.path}`);
          }
        });
      }
    });
    logger.info('Registered routes', { routes });
  } catch (err) {
    logger.warn('Failed to list registered routes', { error: err.message });
  }

  // Diagnostic: log detailed info for any incoming /api/v1/support requests
  app.use((req, res, next) => {
    try {
      if (String(req.originalUrl || '').startsWith('/api/v1/support')) {
        // Collect router stack summary
        const stack = (app._router && app._router.stack || []).map(mw => {
          if (mw.route && mw.route.path) return { path: mw.route.path, methods: Object.keys(mw.route.methods) };
          if (mw.name === 'router' && mw.handle && mw.handle.stack) {
            return mw.handle.stack.filter(r => r.route).map(r => ({ path: r.route.path, methods: Object.keys(r.route.methods) }));
          }
          return { name: mw.name };
        });

        logger.info('Support request diagnostic', {
          method: req.method,
          url: req.originalUrl,
          headers: { authorization: !!req.headers.authorization },
          routerStackSummary: stack,
        });
      }
    } catch (e) {
      logger.warn('Support diagnostic failed', { error: e.message });
    }

    return next();
  });

  app.use(notFound);
  app.use(errorHandler);

  return app;
};

module.exports = { createExpressApp };
