const cors = require('cors');
const cookieParser = require('cookie-parser');
const express = require('express');
const path = require('path');

require('dotenv').config();

const { registerRoutes } = require('./routes');
const { requestLogger } = require('../shared/middleware/requestLogger');
const { notFound, errorHandler } = require('../shared/middleware/errorHandler');
const { corsOptions } = require('../shared/utils/corsOptions');

const createExpressApp = () => {
  const app = express();

  app.use(cors(corsOptions));

  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(requestLogger);
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

  registerRoutes(app);

  app.use(notFound);
  app.use(errorHandler);

  return app;
};

module.exports = { createExpressApp };
