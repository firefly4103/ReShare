const express = require('express');
const router = express.Router();

const {
  confirmHandover,
  cancelExchange,
  submitFeedback,
  getExchangeById,
  getMyExchanges
} = require('../controllers/exchangeController');

const {
  exchangeIdParamValidator,
  cancelExchangeValidator,
  feedbackValidator
} = require('../validations/exchangeValidation');

const validate = require('../middlewares/validate');
const { protect } = require('../middlewares/auth');

// All exchange routes require authentication
router.use(protect);

router.get('/my-exchanges', getMyExchanges);
router.get('/:id', exchangeIdParamValidator, validate, getExchangeById);

router.post('/:id/confirm', exchangeIdParamValidator, validate, confirmHandover);
router.post('/:id/cancel', cancelExchangeValidator, validate, cancelExchange);
router.post('/:id/feedback', feedbackValidator, validate, submitFeedback);

module.exports = router;
