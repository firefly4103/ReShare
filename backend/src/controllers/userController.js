const User = require('../models/User');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');

/**
 * @desc    Get public user profile (sanitized: only public name, city, area, and donation stats)
 * @route   GET /api/v1/users/profile/:id
 * @access  Public
 */
const getPublicProfile = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findOne({ _id: id, isActive: true })
      .select('name location.city location.area stats createdAt');

    if (!user) {
      return next(ApiError.notFound('User profile not found or account is inactive.'));
    }

    return ApiResponse.success(res, 200, 'Public profile retrieved successfully', {
      user: {
        id: user._id,
        name: user.name,
        location: {
          city: user.location?.city,
          area: user.location?.area
        },
        stats: {
          itemsDonated: user.stats?.itemsDonated || 0,
          itemsReceived: user.stats?.itemsReceived || 0
        },
        joinedAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPublicProfile
};
