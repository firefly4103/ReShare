const Listing = require('../models/Listing');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const { uploadImageBuffer, deleteImage } = require('../config/cloudinary');
const { LISTING_STATUS } = require('../constants');

/**
 * @desc    Create a new item listing
 * @route   POST /api/v1/listings
 * @access  Private (Donor)
 */
const createListing = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      condition,
      pickupLocation,
      preferredPickupWindow,
      images: preloadedImages
    } = req.body;

    let finalImages = [];

    // 1. Process files uploaded via Multer multipart form-data
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) =>
        uploadImageBuffer(file.buffer, 'reshare/listings')
      );
      const uploadedResults = await Promise.all(uploadPromises);
      finalImages = uploadedResults.map((img) => ({
        url: img.url,
        publicId: img.publicId
      }));
    } else if (Array.isArray(preloadedImages) && preloadedImages.length > 0) {
      // 2. Accept preloaded/mock image objects (e.g. from tests or direct client upload)
      finalImages = preloadedImages.slice(0, 5).map((img) => ({
        url: typeof img === 'string' ? img : img.url,
        publicId: typeof img === 'object' ? img.publicId : ''
      }));
    }

    const listing = await Listing.create({
      title,
      description,
      category,
      condition,
      images: finalImages,
      donorId: req.user._id,
      status: LISTING_STATUS.AVAILABLE,
      pickupLocation,
      preferredPickupWindow
    });

    return ApiResponse.created(res, 'Listing created successfully', listing);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Browse & search available listings with filters and pagination
 * @route   GET /api/v1/listings
 * @access  Public
 */
const getListings = async (req, res, next) => {
  try {
    const {
      category,
      condition,
      city,
      area,
      q,
      status = LISTING_STATUS.AVAILABLE,
      page = 1,
      limit = 10,
      sortBy = 'newest'
    } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = Math.min(parseInt(limit, 10) || 10, 50);
    const skip = (pageNum - 1) * limitNum;

    // Build MongoDB filter query
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (category) {
      filter.category = category;
    }

    if (condition) {
      filter.condition = condition;
    }

    if (city) {
      filter['pickupLocation.city'] = { $regex: new RegExp(`^${city}$`, 'i') };
    }

    if (area) {
      filter['pickupLocation.area'] = { $regex: new RegExp(area, 'i') };
    }

    // Text Search using MongoDB $text query operator
    let projection = {};
    let sort = {};

    if (q) {
      filter.$text = { $search: q };
      projection = { score: { $meta: 'textScore' } };
      sort = { score: { $meta: 'textScore' } };
    } else {
      if (sortBy === 'oldest') {
        sort = { createdAt: 1 };
      } else {
        sort = { createdAt: -1 };
      }
    }

    // Execute paginated queries in parallel
    const [total, listings] = await Promise.all([
      Listing.countDocuments(filter),
      Listing.find(filter, projection)
        .populate('donorId', 'name location.city location.area stats.itemsDonated')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean()
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    return ApiResponse.success(
      res,
      200,
      'Listings retrieved successfully',
      listings,
      {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages
      }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single listing details
 * @route   GET /api/v1/listings/:id
 * @access  Public
 */
const getListingById = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate('donorId', 'name location.city location.area stats.itemsDonated createdAt')
      .lean();

    if (!listing) {
      return next(ApiError.notFound('Listing not found'));
    }

    return ApiResponse.success(res, 200, 'Listing details retrieved', listing);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update listing details (only if status is AVAILABLE)
 * @route   PUT /api/v1/listings/:id
 * @access  Private (Owner / Admin)
 */
const updateListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return next(ApiError.notFound('Listing not found'));
    }

    // Authorization: only the donor or an admin can edit
    if (!listing.donorId.equals(req.user._id) && req.user.role !== 'admin') {
      return next(
        ApiError.forbidden('You are not authorized to edit this listing')
      );
    }

    // State check: cannot edit if reserved or completed
    if (listing.status !== LISTING_STATUS.AVAILABLE) {
      return next(
        ApiError.badRequest(
          `Cannot edit listing with status '${listing.status}'. Only AVAILABLE listings may be modified.`
        )
      );
    }

    const {
      title,
      description,
      category,
      condition,
      pickupLocation,
      preferredPickupWindow
    } = req.body;

    if (title) listing.title = title;
    if (description) listing.description = description;
    if (category) listing.category = category;
    if (condition) listing.condition = condition;
    if (pickupLocation) {
      if (pickupLocation.city) listing.pickupLocation.city = pickupLocation.city;
      if (pickupLocation.area) listing.pickupLocation.area = pickupLocation.area;
      if (pickupLocation.addressNote !== undefined) {
        listing.pickupLocation.addressNote = pickupLocation.addressNote;
      }
    }
    if (preferredPickupWindow !== undefined) {
      listing.preferredPickupWindow = preferredPickupWindow;
    }

    // Handle new images if uploaded
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) =>
        uploadImageBuffer(file.buffer, 'reshare/listings')
      );
      const newImages = await Promise.all(uploadPromises);
      listing.images.push(
        ...newImages.map((img) => ({ url: img.url, publicId: img.publicId }))
      );
      // Keep within 5 images max
      listing.images = listing.images.slice(0, 5);
    }

    const updatedListing = await listing.save();

    return ApiResponse.success(res, 200, 'Listing updated successfully', updatedListing);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete or deactivate listing
 * @route   DELETE /api/v1/listings/:id
 * @access  Private (Owner / Admin)
 */
const deleteListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return next(ApiError.notFound('Listing not found'));
    }

    // Authorization
    if (!listing.donorId.equals(req.user._id) && req.user.role !== 'admin') {
      return next(
        ApiError.forbidden('You are not authorized to delete this listing')
      );
    }

    // Status check: Cannot delete a listing that is actively reserved
    if (listing.status === LISTING_STATUS.RESERVED) {
      return next(
        ApiError.badRequest(
          'Cannot delete a listing that is actively reserved for an exchange. Cancel the exchange first.'
        )
      );
    }

    // Mark as INACTIVE (soft-delete to preserve history)
    listing.status = LISTING_STATUS.INACTIVE;
    await listing.save();

    return ApiResponse.success(res, 200, 'Listing successfully archived/deactivated', {
      id: listing._id,
      status: listing.status
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get listings posted by the current authenticated user
 * @route   GET /api/v1/listings/my-listings
 * @access  Private
 */
const getMyListings = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = Math.min(parseInt(limit, 10) || 10, 50);
    const skip = (pageNum - 1) * limitNum;

    const filter = { donorId: req.user._id };
    if (status) {
      filter.status = status;
    }

    const [total, listings] = await Promise.all([
      Listing.countDocuments(filter),
      Listing.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean()
    ]);

    return ApiResponse.success(
      res,
      200,
      'My listings retrieved successfully',
      listings,
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
  createListing,
  getListings,
  getListingById,
  updateListing,
  deleteListing,
  getMyListings
};
