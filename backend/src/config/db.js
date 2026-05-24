const mongoose = require('mongoose');

const { logger } = require('../shared/utils/logger');

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('MONGO_URI is missing in environment variables');
  }

  await mongoose.connect(mongoUri);
  logger.info('MongoDB connected', {
    host: mongoose.connection.host,
    database: mongoose.connection.name,
  });
};

module.exports = connectDB;

