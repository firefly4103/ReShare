const express = require('express');
const router = express.Router();

const {
  createListing,
  getListings,
  getListingById,
  updateListing,
  deleteListing,
  getMyListings
} = require('../controllers/listingController');

const {
  createListingValidator,
  updateListingValidator,
  queryListingsValidator
} = require('../validations/listingValidation');

const validate = require('../middlewares/validate');
const { protect } = require('../middlewares/auth');
const { uploadListingImages } = require('../middlewares/upload');

// Helper to parse stringified JSON in multipart/form-data submissions
const parseMultipartFields = (req, res, next) => {
  if (typeof req.body.pickupLocation === 'string') {
    try {
      req.body.pickupLocation = JSON.parse(req.body.pickupLocation);
    } catch (e) {
      // Allow validator to catch formatting issues
    }
  }
  next();
};

// Public routes
router.get('/', queryListingsValidator, validate, getListings);
router.get('/my-listings', protect, getMyListings);
router.get('/:id', getListingById);

// Protected routes (Owner / Donor)
router.post(
  '/',
  protect,
  uploadListingImages,
  parseMultipartFields,
  createListingValidator,
  validate,
  createListing
);

router.put(
  '/:id',
  protect,
  uploadListingImages,
  parseMultipartFields,
  updateListingValidator,
  validate,
  updateListing
);

router.delete('/:id', protect, deleteListing);

module.exports = router;
