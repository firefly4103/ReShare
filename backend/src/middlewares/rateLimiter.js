const rateLimit = require('express-rate-limit');
const ApiError = require('../utils/apiError');

// General API rate limiter: 300 requests per 15 minutes per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(
      ApiError.badRequest(
        'Too many requests from this IP, please try again after 15 minutes',
        [],
        'RATE_LIMIT_EXCEEDED'
      )
    );
  },
  skip: () => process.env.NODE_ENV === 'test'
});

// Auth endpoint rate limiter: 20 requests per 15 minutes per IP to guard against brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(
      ApiError.badRequest(
        'Too many authentication attempts. Please wait 15 minutes before trying again.',
        [],
        'AUTH_RATE_LIMIT_EXCEEDED'
      )
    );
  },
  skip: () => process.env.NODE_ENV === 'test'
});

module.exports = {
  apiLimiter,
  authLimiter
};
