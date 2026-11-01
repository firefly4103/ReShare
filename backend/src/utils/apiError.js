class ApiError extends Error {
  /**
   * Custom Operational Error
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Human-readable error message
   * @param {string} [errorCode='OPERATIONAL_ERROR'] - Machine-readable error code
   * @param {Array} [errors=[]] - Array of validation or field-specific errors
   */
  constructor(statusCode, message, errorCode = 'OPERATIONAL_ERROR', errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.errors = errors;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, errors = [], errorCode = 'BAD_REQUEST') {
    return new ApiError(400, message, errorCode, errors);
  }

  static unauthorized(message = 'Authentication required', errorCode = 'UNAUTHORIZED') {
    return new ApiError(401, message, errorCode);
  }

  static forbidden(message = 'Access forbidden: Insufficient permissions', errorCode = 'FORBIDDEN') {
    return new ApiError(403, message, errorCode);
  }

  static notFound(message = 'Requested resource not found', errorCode = 'NOT_FOUND') {
    return new ApiError(404, message, errorCode);
  }

  static conflict(message = 'Resource conflict or state mismatch', errorCode = 'CONFLICT') {
    return new ApiError(409, message, errorCode);
  }

  static unprocessable(message = 'Validation failed', errors = [], errorCode = 'VALIDATION_ERROR') {
    return new ApiError(422, message, errorCode, errors);
  }

  static internal(message = 'Internal server error', errorCode = 'INTERNAL_ERROR') {
    return new ApiError(500, message, errorCode);
  }
}

module.exports = ApiError;
