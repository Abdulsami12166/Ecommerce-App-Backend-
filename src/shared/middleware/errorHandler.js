const { logger } = require('../utils/logger');

const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
};

const errorHandler = (error, req, res, next) => {
  logger.error('Unhandled backend error', {
    message: error?.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : error?.stack,
  });

  res.status(error?.statusCode || 500).json({
    success: false,
    message: error?.message || 'Internal server error',
    errors: error?.errors || null,
  });
};

module.exports = { notFound, errorHandler };
