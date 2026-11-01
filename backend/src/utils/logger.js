const winston = require('winston');

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ level, message, timestamp, stack }) => {
    return stack
      ? `[${timestamp}] ${level}: ${message}\nStack: ${stack}`
      : `[${timestamp}] ${level}: ${message}`;
  })
);

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production' ? logFormat : consoleFormat
    })
  ],
  silent: process.env.NODE_ENV === 'test'
});

logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

module.exports = logger;
