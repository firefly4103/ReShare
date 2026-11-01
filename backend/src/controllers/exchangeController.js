const mongoose = require('mongoose');
const Exchange = require('../models/Exchange');
const Listing = require('../models/Listing');
const User = require('../models/User');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const { LISTING_STATUS, EXCHANGE_STATUS } = require('../constants');

/**
 * @desc    Submit participant handover confirmation.
 *          If BOTH donor and recipient have confirmed, executes an ACID transaction to:
 *          1. Mark exchange as COMPLETED
 *          2. Mark listing as COMPLETED
 *          3. Increment donor's itemsDonated and recipient's itemsReceived stats
 * @route   POST /api/v1/exchanges/:id/confirm
 * @access  Private (Donor or Recipient)
 */
const confirmHandover = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    let responseMessage = '';
    let updatedExchange = null;

    await session.withTransaction(async () => {
      const exchange = await Exchange.findById(req.params.id).session(session);

      if (!exchange) {
        throw ApiError.notFound('Exchange record not found');
      }

      // Participant identity and authorization check
      const isDonor = exchange.donorId.equals(req.user._id);
      const isRecipient = exchange.recipientId.equals(req.user._id);

      if (!isDonor && !isRecipient && req.user.role !== 'admin') {
        throw ApiError.forbidden('You are not an authorized participant in this exchange');
      }

      // State check: exchange must be actively scheduled
      if (exchange.status !== EXCHANGE_STATUS.SCHEDULED) {
        throw ApiError.badRequest(
          `Cannot confirm exchange with status '${exchange.status}'. Only SCHEDULED exchanges may be confirmed.`
        );
      }

      // Record caller's confirmation timestamp
      if (isDonor || req.user.role === 'admin') {
        if (!exchange.donorConfirmedAt) {
          exchange.donorConfirmedAt = new Date();
        }
      }

      if (isRecipient || req.user.role === 'admin') {
        if (!exchange.recipientConfirmedAt) {
          exchange.recipientConfirmedAt = new Date();
        }
      }

      // Check if dual confirmation condition is now satisfied
      const isBothConfirmed = exchange.donorConfirmedAt && exchange.recipientConfirmedAt;

      if (isBothConfirmed) {
        // Complete the exchange
        exchange.status = EXCHANGE_STATUS.COMPLETED;
        exchange.completedAt = new Date();
        await exchange.save({ session });

        // Synchronize listing status to COMPLETED
        await Listing.updateOne(
          { _id: exchange.listingId },
          { $set: { status: LISTING_STATUS.COMPLETED } },
          { session }
        );

        // Atomically increment participation statistics
        await User.updateOne(
          { _id: exchange.donorId },
          { $inc: { 'stats.itemsDonated': 1 } },
          { session }
        );

        await User.updateOne(
          { _id: exchange.recipientId },
          { $inc: { 'stats.itemsReceived': 1 } },
          { session }
        );

        responseMessage = 'Dual confirmation complete. Exchange and listing marked as COMPLETED.';
      } else {
        // Only one party has confirmed so far; persist timestamp and remain in SCHEDULED
        await exchange.save({ session });
        responseMessage = isDonor
          ? 'Donor confirmation recorded. Waiting for recipient to confirm handover.'
          : 'Recipient confirmation recorded. Waiting for donor to confirm handover.';
      }

      updatedExchange = exchange;
    });

    return ApiResponse.success(res, 200, responseMessage, updatedExchange);
  } catch (error) {
    next(error);
  } finally {
    await session.endSession();
  }
};

/**
 * @desc    Cancel scheduled exchange and safely restore listing availability
 * @route   POST /api/v1/exchanges/:id/cancel
 * @access  Private (Participant or Admin)
 */
const cancelExchange = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    let result = null;

    await session.withTransaction(async () => {
      const exchange = await Exchange.findById(req.params.id).session(session);

      if (!exchange) {
        throw ApiError.notFound('Exchange record not found');
      }

      // Verify participant identity
      const isDonor = exchange.donorId.equals(req.user._id);
      const isRecipient = exchange.recipientId.equals(req.user._id);

      if (!isDonor && !isRecipient && req.user.role !== 'admin') {
        throw ApiError.forbidden('You are not authorized to cancel this exchange');
      }

      // State check: cannot cancel already completed exchange
      if (exchange.status !== EXCHANGE_STATUS.SCHEDULED) {
        throw ApiError.badRequest(
          `Cannot cancel an exchange with status '${exchange.status}'. Only SCHEDULED exchanges can be cancelled.`
        );
      }

      // Transition exchange to CANCELLED
      exchange.status = EXCHANGE_STATUS.CANCELLED;
      exchange.cancellationReason = req.body.cancellationReason;
      exchange.cancelledBy = req.user._id;
      await exchange.save({ session });

      // Safe Availability Restoration:
      // Only restore listing to AVAILABLE if it is currently RESERVED (guards against race conditions or altered listings)
      const restoredListing = await Listing.findOneAndUpdate(
        {
          _id: exchange.listingId,
          status: LISTING_STATUS.RESERVED
        },
        {
          $set: { status: LISTING_STATUS.AVAILABLE }
        },
        {
          session,
          new: true
        }
      );

      result = {
        exchange,
        listingRestored: !!restoredListing
      };
    });

    return ApiResponse.success(
      res,
      200,
      'Exchange cancelled successfully and listing restored to available pool',
      result
    );
  } catch (error) {
    next(error);
  } finally {
    await session.endSession();
  }
};

/**
 * @desc    Submit rating and feedback for completed exchange
 * @route   POST /api/v1/exchanges/:id/feedback
 * @access  Private (Participant)
 */
const submitFeedback = async (req, res, next) => {
  try {
    const exchange = await Exchange.findById(req.params.id);

    if (!exchange) {
      return next(ApiError.notFound('Exchange record not found'));
    }

    const isDonor = exchange.donorId.equals(req.user._id);
    const isRecipient = exchange.recipientId.equals(req.user._id);

    if (!isDonor && !isRecipient && req.user.role !== 'admin') {
      return next(ApiError.forbidden('You are not a participant in this exchange'));
    }

    if (exchange.status !== EXCHANGE_STATUS.COMPLETED) {
      return next(
        ApiError.badRequest('Feedback can only be submitted for COMPLETED exchanges.')
      );
    }

    const { rating, comment } = req.body;

    if (isDonor) {
      exchange.donorFeedback = { rating, comment };
    } else {
      exchange.recipientFeedback = { rating, comment };
    }

    await exchange.save();

    return ApiResponse.success(res, 200, 'Feedback submitted successfully', exchange);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single exchange details
 * @route   GET /api/v1/exchanges/:id
 * @access  Private (Participant or Admin)
 */
const getExchangeById = async (req, res, next) => {
  try {
    const exchange = await Exchange.findById(req.params.id)
      .populate('listingId', 'title category condition images status pickupLocation')
      .populate('donorId', 'name location.city location.area stats.itemsDonated')
      .populate('recipientId', 'name location.city location.area stats.itemsReceived')
      .lean();

    if (!exchange) {
      return next(ApiError.notFound('Exchange not found'));
    }

    const isDonor = exchange.donorId._id.equals(req.user._id);
    const isRecipient = exchange.recipientId._id.equals(req.user._id);

    if (!isDonor && !isRecipient && req.user.role !== 'admin') {
      return next(ApiError.forbidden('You are not authorized to view this exchange'));
    }

    return ApiResponse.success(res, 200, 'Exchange details retrieved', exchange);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all exchanges for the logged in user
 * @route   GET /api/v1/exchanges/my-exchanges
 * @access  Private
 */
const getMyExchanges = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = Math.min(parseInt(limit, 10) || 10, 50);
    const skip = (pageNum - 1) * limitNum;

    const filter = {
      $or: [{ donorId: req.user._id }, { recipientId: req.user._id }]
    };

    if (status) {
      filter.status = status;
    }

    const [total, exchanges] = await Promise.all([
      Exchange.countDocuments(filter),
      Exchange.find(filter)
        .populate('listingId', 'title category images status pickupLocation')
        .populate('donorId', 'name location.city')
        .populate('recipientId', 'name location.city')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean()
    ]);

    return ApiResponse.success(
      res,
      200,
      'My exchanges retrieved successfully',
      exchanges,
      {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1
      }
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  confirmHandover,
  cancelExchange,
  submitFeedback,
  getExchangeById,
  getMyExchanges
};
