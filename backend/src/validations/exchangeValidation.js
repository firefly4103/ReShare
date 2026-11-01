const { body, param } = require('express-validator');

const exchangeIdParamValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid exchange ID format')
];

const cancelExchangeValidator = [
  exchangeIdParamValidator[0],
  body('cancellationReason')
    .trim()
    .notEmpty()
    .withMessage('Cancellation reason is required')
    .isLength({ min: 5, max: 300 })
    .withMessage('Cancellation reason must be between 5 and 300 characters long')
];

const feedbackValidator = [
  exchangeIdParamValidator[0],
  body('rating')
    .notEmpty()
    .withMessage('Rating is required')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5'),

  body('comment')
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage('Feedback comment cannot exceed 300 characters')
];

module.exports = {
  exchangeIdParamValidator,
  cancelExchangeValidator,
  feedbackValidator
};
