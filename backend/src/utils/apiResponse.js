class ApiResponse {
  /**
   * Standard JSON success response envelope
   * @param {Object} res - Express response object
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Human-readable success message
   * @param {*} data - Payload data
   * @param {Object} [meta=null] - Optional metadata (e.g., pagination)
   */
  static success(res, statusCode = 200, message = 'Success', data = null, meta = null) {
    const responsePayload = {
      success: true,
      statusCode,
      message,
      data
    };

    if (meta) {
      responsePayload.meta = meta;
    }

    return res.status(statusCode).json(responsePayload);
  }

  static created(res, message = 'Resource created successfully', data = null) {
    return ApiResponse.success(res, 201, message, data);
  }
}

module.exports = ApiResponse;
