const mongoose = require('mongoose');
const Request = require('../models/Request');
const Listing = require('../models/Listing');
const Exchange = require('../models/Exchange');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const { LISTING_STATUS, REQUEST_STATUS, EXCHANGE_STATUS } = require('../constants');

/**
 * @desc    Submit a request for an available listing
 * @route   POST /api/v1/requests
 * @access  Private (Requester)
 */
const createRequest = async (req, res, next) => {
  try {
    const { listingId, message, requestedPickupDate } = req.body;

    const listing = await Listing.findById(listingId);
    if (!listing) {
      return next(ApiError.notFound('Listing not found'));
    }

    // Verify listing is currently available
    if (listing.status !== LISTING_STATUS.AVAILABLE) {
      return next(
        ApiError.badRequest(
          `Cannot request this item. Listing status is '${listing.status}' (expected AVAILABLE).`
        )
      );
    }

    // Donor cannot request their own item
    if (listing.donorId.equals(req.user._id)) {
      return next(
        ApiError.badRequest('You cannot request your own donation listing.')
      );
    }

    // Check for existing active request by this user
    const existingActiveRequest = await Request.findOne({
      listingId,
      requesterId: req.user._id,
      status: { $in: [REQUEST_STATUS.PENDING, REQUEST_STATUS.ACCEPTED] }
    });

    if (existingActiveRequest) {
      return next(
        ApiError.conflict(
          'You already have an active request pending or accepted for this listing.',
          'DUPLICATE_ACTIVE_REQUEST'
        )
      );
    }

    const newRequest = await Request.create({
      listingId,
      requesterId: req.user._id,
      donorId: listing.donorId,
      message,
      requestedPickupDate,
      status: REQUEST_STATUS.PENDING
    });

    return ApiResponse.created(res, 'Item request submitted successfully', newRequest);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Accept request with MongoDB ACID Multi-Document Transaction:
 *          1. Conditionally reserves listing (AVAILABLE -> RESERVED)
 *          2. Updates accepted request (PENDING -> ACCEPTED)
 *          3. Bulk-rejects competing pending requests
 *          4. Instantiates Exchange document (status: SCHEDULED)
 * @route   PATCH /api/v1/requests/:id/accept
 * @access  Private (Donor)
 */
const acceptRequest = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    let resultPayload = null;

    await session.withTransaction(async () => {
      // 1. Fetch request within transaction session
      const targetRequest = await Request.findById(req.params.id).session(session);

      if (!targetRequest) {
        throw ApiError.notFound('Request not found');
      }

      // Authorization: only the listing's donor can accept requests
      if (!targetRequest.donorId.equals(req.user._id) && req.user.role !== 'admin') {
        throw ApiError.forbidden('Only the donor of this listing can accept requests');
      }

      // Check request status
      if (targetRequest.status !== REQUEST_STATUS.PENDING) {
        throw ApiError.badRequest(
          `Cannot accept a request with status '${targetRequest.status}'. Only PENDING requests can be accepted.`
        );
      }

      // 2. Conditionally reserve listing (ensures safe reservation and avoids race conditions)
      const reservedListing = await Listing.findOneAndUpdate(
        {
          _id: targetRequest.listingId,
          status: LISTING_STATUS.AVAILABLE
        },
        {
          $set: { status: LISTING_STATUS.RESERVED }
        },
        {
          session,
          new: true
        }
      );

      if (!reservedListing) {
        throw ApiError.conflict(
          'Listing is no longer available or has already been reserved for another recipient.'
        );
      }

      // 3. Mark the accepted request
      targetRequest.status = REQUEST_STATUS.ACCEPTED;
      await targetRequest.save({ session });

      // 4. Reject all competing pending requests for this listing
      await Request.updateMany(
        {
          listingId: targetRequest.listingId,
          _id: { $ne: targetRequest._id },
          status: REQUEST_STATUS.PENDING
        },
        {
          $set: { status: REQUEST_STATUS.REJECTED }
        },
        { session }
      );

      // 5. Create the Exchange document
      const [exchange] = await Exchange.create(
        [
          {
            listingId: targetRequest.listingId,
            requestId: targetRequest._id,
            donorId: targetRequest.donorId,
            recipientId: targetRequest.requesterId,
            status: EXCHANGE_STATUS.SCHEDULED
          }
        ],
        { session }
      );

      resultPayload = {
        request: targetRequest,
        listing: reservedListing,
        exchange
      };
    });

    return ApiResponse.success(
      res,
      200,
      'Request accepted successfully and exchange scheduled',
      resultPayload
    );
  } catch (error) {
    next(error);
  } finally {
    await session.endSession();
  }
};

/**
 * @desc    Reject a pending request
 * @route   PATCH /api/v1/requests/:id/reject
 * @access  Private (Donor)
 */
const rejectRequest = async (req, res, next) => {
  try {
    const targetRequest = await Request.findById(req.params.id);

    if (!targetRequest) {
      return next(ApiError.notFound('Request not found'));
    }

    if (!targetRequest.donorId.equals(req.user._id) && req.user.role !== 'admin') {
      return next(ApiError.forbidden('Only the donor can reject this request'));
    }

    if (targetRequest.status !== REQUEST_STATUS.PENDING) {
      return next(
        ApiError.badRequest(
          `Cannot reject request with status '${targetRequest.status}'. Only PENDING requests may be rejected.`
        )
      );
    }

    targetRequest.status = REQUEST_STATUS.REJECTED;
    await targetRequest.save();

    return ApiResponse.success(res, 200, 'Request rejected', targetRequest);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel a submitted request
 * @route   PATCH /api/v1/requests/:id/cancel
 * @access  Private (Requester)
 */
const cancelRequest = async (req, res, next) => {
  try {
    const targetRequest = await Request.findById(req.params.id);

    if (!targetRequest) {
      return next(ApiError.notFound('Request not found'));
    }

    // Only the requester can cancel their request
    if (!targetRequest.requesterId.equals(req.user._id) && req.user.role !== 'admin') {
      return next(ApiError.forbidden('You are not authorized to cancel this request'));
    }

    if (targetRequest.status !== REQUEST_STATUS.PENDING) {
      return next(
        ApiError.badRequest(
          `Cannot cancel request with status '${targetRequest.status}'. Only PENDING requests may be cancelled.`
        )
      );
    }

    targetRequest.status = REQUEST_STATUS.CANCELLED;
    await targetRequest.save();

    return ApiResponse.success(res, 200, 'Request cancelled successfully', targetRequest);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get incoming requests for donor's listings
 * @route   GET /api/v1/requests/incoming
 * @access  Private (Donor)
 */
const getIncomingRequests = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = Math.min(parseInt(limit, 10) || 10, 50);
    const skip = (pageNum - 1) * limitNum;

    const filter = { donorId: req.user._id };
    if (status) {
      filter.status = status;
    }

    const [total, requests] = await Promise.all([
      Request.countDocuments(filter),
      Request.find(filter)
        .populate('listingId', 'title category images status pickupLocation')
        .populate('requesterId', 'name location.city location.area stats.itemsReceived')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean()
    ]);

    return ApiResponse.success(
      res,
      200,
      'Incoming requests retrieved successfully',
      requests,
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

/**
 * @desc    Get outgoing requests made by requester
 * @route   GET /api/v1/requests/outgoing
 * @access  Private (Requester)
 */
const getOutgoingRequests = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = Math.min(parseInt(limit, 10) || 10, 50);
    const skip = (pageNum - 1) * limitNum;

    const filter = { requesterId: req.user._id };
    if (status) {
      filter.status = status;
    }

    const [total, requests] = await Promise.all([
      Request.countDocuments(filter),
      Request.find(filter)
        .populate('listingId', 'title category images status pickupLocation')
        .populate('donorId', 'name location.city location.area stats.itemsDonated')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean()
    ]);

    return ApiResponse.success(
      res,
      200,
      'Outgoing requests retrieved successfully',
      requests,
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
  createRequest,
  acceptRequest,
  rejectRequest,
  cancelRequest,
  getIncomingRequests,
  getOutgoingRequests
};
