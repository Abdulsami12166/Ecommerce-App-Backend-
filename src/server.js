require('dotenv').config();

const http = require('http');

const app = require('./app');
const connectDB = require('./config/db');
const { attachSocketServer } = require('./shared/events/eventBus');
const { logger } = require('./shared/utils/logger');

const port = process.env.PORT || 5001;

const startServer = async () => {
  try {
    console.log('[Backend] Starting Ecommerce backend server (backend-only branch)');
    await connectDB();

    const server = http.createServer(app);
    attachSocketServer(server, app);

    server.listen(port, () => {
      logger.info('Ecommerce backend started', {
        port,
        nodeEnv: process.env.NODE_ENV || 'development',
      });
    });
  } catch (error) {
    logger.error('Failed to start ecommerce backend', {
      message: error.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
    });
    process.exit(1);
  }
};

startServer();
