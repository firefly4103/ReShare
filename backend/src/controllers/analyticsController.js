const mongoose = require('mongoose');
const Listing = require('../models/Listing');
const Exchange = require('../models/Exchange');
const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const { LISTING_STATUS, EXCHANGE_STATUS } = require('../constants');

/**
 * @desc    Get platform-wide summary metrics via MongoDB Aggregation Pipelines
 * @route   GET /api/v1/analytics/platform-summary
 * @access  Public
 */
const getPlatformSummary = async (req, res, next) => {
  try {
    // Multi-stage Aggregation Pipeline demonstrating $facet, $group, $cond, and $sort
    const [listingStats] = await Listing.aggregate([
      {
        $facet: {
          overallMetrics: [
            {
              $group: {
                _id: null,
                totalListings: { $sum: 1 },
                availableListings: {
                  $sum: { $cond: [{ $eq: ['$status', LISTING_STATUS.AVAILABLE] }, 1, 0] }
                },
                reservedListings: {
                  $sum: { $cond: [{ $eq: ['$status', LISTING_STATUS.RESERVED] }, 1, 0] }
                },
                completedListings: {
                  $sum: { $cond: [{ $eq: ['$status', LISTING_STATUS.COMPLETED] }, 1, 0] }
                }
              }
            }
          ],
          categoryBreakdown: [
            {
              $group: {
                _id: '$category',
                totalCount: { $sum: 1 },
                completedCount: {
                  $sum: { $cond: [{ $eq: ['$status', LISTING_STATUS.COMPLETED] }, 1, 0] }
                }
              }
            },
            { $sort: { totalCount: -1 } }
          ],
          cityDistribution: [
            {
              $group: {
                _id: '$pickupLocation.city',
                listingCount: { $sum: 1 }
              }
            },
            { $sort: { listingCount: -1 } },
            { $limit: 5 }
          ]
        }
      }
    ]);

    // Fast indexed counts for users and completed exchanges
    const [totalUsers, completedExchanges] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Exchange.countDocuments({ status: EXCHANGE_STATUS.COMPLETED })
    ]);

    const overall = listingStats?.overallMetrics[0] || {
      totalListings: 0,
      availableListings: 0,
      reservedListings: 0,
      completedListings: 0
    };

    return ApiResponse.success(res, 200, 'Platform analytics retrieved successfully', {
      totalUsers,
      totalListings: overall.totalListings,
      availableListings: overall.availableListings,
      reservedListings: overall.reservedListings,
      completedListings: overall.completedListings,
      completedExchanges,
      categoryBreakdown: listingStats?.categoryBreakdown || [],
      topCities: listingStats?.cityDistribution || []
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get aggregated donor impact statistics
 * @route   GET /api/v1/analytics/user-impact/:id
 * @access  Public
 */
const getUserImpact = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(ApiError.badRequest('Invalid user ID format'));
    }

    const user = await User.findOne({ _id: id, isActive: true })
      .select('name location.city location.area stats createdAt');

    if (!user) {
      return next(ApiError.notFound('User profile not found'));
    }

    // Aggregation pipeline: Group user's completed donations by category
    const categoryDonationStats = await Listing.aggregate([
      {
        $match: {
          donorId: new mongoose.Types.ObjectId(id),
          status: LISTING_STATUS.COMPLETED
        }
      },
      {
        $group: {
          _id: '$category',
          itemsDonated: { $sum: 1 }
        }
      },
      {
        $sort: { itemsDonated: -1 }
      }
    ]);

    return ApiResponse.success(res, 200, 'User impact metrics retrieved', {
      user: {
        id: user._id,
        name: user.name,
        city: user.location?.city,
        area: user.location?.area,
        joinedAt: user.createdAt
      },
      stats: {
        itemsDonated: user.stats?.itemsDonated || 0,
        itemsReceived: user.stats?.itemsReceived || 0,
        categoryBreakdown: categoryDonationStats
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPlatformSummary,
  getUserImpact
};
