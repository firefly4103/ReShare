const ApiError = require('../utils/apiError');

/**
 * Role-based authorization guard
 * @param  {...string} roles - Allowed roles (e.g. 'admin', 'user')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('User not authenticated'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `User role '${req.user.role}' is not authorized to access this resource`
        )
      );
    }

    next();
  };
};

module.exports = { authorize };
