const app = require('./app');
const config = require('./src/config/env');
const { connectDB, disconnectDB } = require('./src/config/db');
const logger = require('./src/utils/logger');

let server = null;

const startServer = async () => {
  try {
    // Connect to MongoDB Atlas / local database
    await connectDB();

    server = app.listen(config.port, () => {
      logger.info(`ReShare Server running in ${config.nodeEnv} mode on port ${config.port}`);
    });
  } catch (error) {
    logger.error('Failed to start server: %o', error.message);
    process.exit(1);
  }
};

// Graceful shutdown handler
const shutdown = async (signal) => {
  logger.info(`Received ${signal}. Initiating graceful shutdown...`);

  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed.');
      await disconnectDB();
      process.exit(0);
    });
  } else {
    await disconnectDB();
    process.exit(0);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Promise Rejection: %o', reason);
  if (config.nodeEnv === 'production') {
    shutdown('UNHANDLED_REJECTION');
  }
});

startServer();
