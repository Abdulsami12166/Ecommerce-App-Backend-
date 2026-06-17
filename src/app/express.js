const cors = require('cors');
const cookieParser = require('cookie-parser');
const express = require('express');
const path = require('path');

require('dotenv').config();

const { registerRoutes } = require('./routes');
const { requestLogger } = require('../shared/middleware/requestLogger');
const { notFound, errorHandler } = require('../shared/middleware/errorHandler');
const { corsOptions } = require('../shared/utils/corsOptions');
const { logger } = require('../shared/utils/logger');

const createExpressApp = () => {
  const app = express();

  app.use(cors(corsOptions));

  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(requestLogger);
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

  registerRoutes(app);

  // Debug: list registered routes to help diagnose 404s for support endpoints
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

  app.use(notFound);
  app.use(errorHandler);

  return app;
};

module.exports = { createExpressApp };
