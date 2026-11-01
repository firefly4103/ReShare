const mongoose = require('mongoose');
const logger = require('../utils/logger');
const config = require('./env');

const connectDB = async (customUri = null) => {
  const uri = customUri || config.mongoUri;

  try {
    const conn = await mongoose.connect(uri, {
      autoIndex: true // Ensure indexes are created in development/test
    });

    logger.info(`MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection runtime error: %o', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB connection lost. Reconnecting...');
    });

    return conn;
  } catch (error) {
    logger.error('MongoDB connection error: %o', error.message);
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
    throw error;
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed gracefully.');
  } catch (error) {
    logger.error('Error during MongoDB disconnect: %o', error.message);
  }
};

module.exports = { connectDB, disconnectDB };
