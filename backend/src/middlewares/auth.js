const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/apiError');
const config = require('../config/env');

/**
 * Protect routes: verify JWT Bearer token and populate req.user
 */
const protect = async (req, res, next) => {
  try {
    let token = null;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(ApiError.unauthorized('Access denied. No authorization token provided.'));
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwtSecret);

    // Fetch user from DB (excluding password)
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(ApiError.unauthorized('User associated with this token no longer exists.'));
    }

    if (!user.isActive) {
      return next(ApiError.forbidden('Your account has been deactivated. Please contact support.'));
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { protect };
