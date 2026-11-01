const { validationResult } = require('express-validator');
const ApiError = require('../utils/apiError');

/**
 * Middleware that inspects validation errors from express-validator
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value
    }));

    return next(
      ApiError.unprocessable('Input validation failed', formattedErrors)
    );
  }

  next();
};

module.exports = validate;
