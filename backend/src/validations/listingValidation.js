const { body, query } = require('express-validator');
const { CATEGORIES, CONDITIONS, LISTING_STATUS } = require('../constants');

const createListingValidator = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),

  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isIn(CATEGORIES)
    .withMessage(`Category must be one of: ${CATEGORIES.join(', ')}`),

  body('condition')
    .notEmpty()
    .withMessage('Condition is required')
    .isIn(CONDITIONS)
    .withMessage(`Condition must be one of: ${CONDITIONS.join(', ')}`),

  body('pickupLocation.city')
    .trim()
    .notEmpty()
    .withMessage('Pickup city is required'),

  body('pickupLocation.area')
    .trim()
    .notEmpty()
    .withMessage('Pickup area is required'),

  body('pickupLocation.addressNote')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Address note cannot exceed 200 characters'),

  body('preferredPickupWindow')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Pickup window note cannot exceed 100 characters')
];

const updateListingValidator = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),

  body('category')
    .optional()
    .isIn(CATEGORIES)
    .withMessage(`Category must be one of: ${CATEGORIES.join(', ')}`),

  body('condition')
    .optional()
    .isIn(CONDITIONS)
    .withMessage(`Condition must be one of: ${CONDITIONS.join(', ')}`),

  body('pickupLocation.city')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Pickup city cannot be empty if provided'),

  body('pickupLocation.area')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Pickup area cannot be empty if provided'),

  body('preferredPickupWindow')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Pickup window note cannot exceed 100 characters')
];

const queryListingsValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),

  query('category')
    .optional()
    .isIn(CATEGORIES)
    .withMessage(`Category filter must be one of: ${CATEGORIES.join(', ')}`),

  query('condition')
    .optional()
    .isIn(CONDITIONS)
    .withMessage(`Condition filter must be one of: ${CONDITIONS.join(', ')}`),

  query('city')
    .optional()
    .trim(),

  query('area')
    .optional()
    .trim(),

  query('q')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query cannot exceed 100 characters'),

  query('status')
    .optional()
    .isIn(Object.values(LISTING_STATUS))
    .withMessage('Invalid status filter')
];

module.exports = {
  createListingValidator,
  updateListingValidator,
  queryListingsValidator
};
