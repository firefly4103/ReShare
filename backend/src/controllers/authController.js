const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const config = require('../config/env');

/**
 * Sign JWT token for authenticated session
 * @param {string} userId
 * @param {string} role
 * @returns {string} Signed JWT
 */
const signToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    config.jwtSecret,
    { expiresIn: config.jwtExpire }
  );
};

/**
 * @desc    Register a new user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, location } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(
        ApiError.conflict(
          'An account with this email address already exists.',
          'EMAIL_ALREADY_EXISTS'
        )
      );
    }

    // Create user (password is automatically hashed via pre-save hook)
    const user = await User.create({
      name,
      email,
      password,
      phone,
      location,
      role: 'user' // Default to standard user; prevent privilege escalation
    });

    const token = signToken(user._id, user.role);

    return ApiResponse.created(res, 'User registered successfully', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        location: user.location,
        stats: user.stats,
        createdAt: user.createdAt
      },
      token
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email and explicitly select password field
    const user = await User.findOne({ email }).select('+password +phone');
    if (!user) {
      return next(
        ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS')
      );
    }

    // Verify password using bcrypt instance method
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(
        ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS')
      );
    }

    // Check if account is active
    if (!user.isActive) {
      return next(
        ApiError.forbidden(
          'Your account has been deactivated. Please contact an administrator.',
          'ACCOUNT_DEACTIVATED'
        )
      );
    }

    const token = signToken(user._id, user.role);

    return ApiResponse.success(res, 200, 'Login successful', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        location: user.location,
        stats: user.stats,
        createdAt: user.createdAt
      },
      token
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current authenticated user profile
 * @route   GET /api/v1/auth/me
 * @access  Private (Bearer JWT)
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+phone');

    return ApiResponse.success(res, 200, 'Profile retrieved successfully', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        location: user.location,
        stats: user.stats,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Logout user / clear token acknowledgement
 * @route   POST /api/v1/auth/logout
 * @access  Private (Bearer JWT)
 */
const logout = async (req, res, next) => {
  try {
    return ApiResponse.success(res, 200, 'Logged out successfully', null);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  logout
};
