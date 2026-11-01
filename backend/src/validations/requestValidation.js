const { body, param } = require('express-validator');

const createRequestValidator = [
  body('listingId')
    .notEmpty()
    .withMessage('Listing ID is required')
    .isMongoId()
    .withMessage('Invalid listing ID format'),

  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 5, max: 500 })
    .withMessage('Message must be between 5 and 500 characters long'),

  body('requestedPickupDate')
    .optional()
    .isISO8601()
    .withMessage('Requested pickup date must be a valid ISO 8601 date')
];

const requestIdParamValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid request ID format')
];

module.exports = {
  createRequestValidator,
  requestIdParamValidator
};
