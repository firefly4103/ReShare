const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  let error = err;

  // Log all non-operational or server errors with stack
  if (!error.isOperational) {
    logger.error('Unhandled Exception: %o', {
      message: error.message,
      stack: error.stack,
      url: req.originalUrl,
      method: req.method
    });
  }

  // Handle Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    error = ApiError.badRequest(`Invalid format for parameter: ${err.path}`, [
      { field: err.path, message: `Invalid ObjectId: ${err.value}` }
    ]);
  }

  // Handle Mongoose Duplicate Key Error (Code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const value = err.keyValue ? err.keyValue[field] : '';
    error = ApiError.conflict(
      `A record with ${field} '${value}' already exists.`,
      'DUPLICATE_KEY_ERROR'
    );
  }

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const validationErrors = Object.values(err.errors).map((item) => ({
      field: item.path,
      message: item.message
    }));
    error = ApiError.unprocessable('Schema validation failed', validationErrors);
  }

  // Handle JWT Malformed / Invalid Error
  if (err.name === 'JsonWebTokenError') {
    error = ApiError.unauthorized('Invalid authentication token');
  }

  // Handle JWT Expired Error
  if (err.name === 'TokenExpiredError') {
    error = ApiError.unauthorized('Authentication token has expired. Please log in again.');
  }

  const statusCode = error.statusCode || 500;
  const errorCode = error.errorCode || 'INTERNAL_SERVER_ERROR';
  const message = error.message || 'An unexpected internal error occurred';

  res.status(statusCode).json({
    success: false,
    statusCode,
    errorCode,
    message,
    errors: error.errors || [],
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
