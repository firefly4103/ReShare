const express = require('express');
const router = express.Router();

const {
  createRequest,
  acceptRequest,
  rejectRequest,
  cancelRequest,
  getIncomingRequests,
  getOutgoingRequests
} = require('../controllers/requestController');

const {
  createRequestValidator,
  requestIdParamValidator
} = require('../validations/requestValidation');

const validate = require('../middlewares/validate');
const { protect } = require('../middlewares/auth');

// All request routes require authentication
router.use(protect);

router.post('/', createRequestValidator, validate, createRequest);
router.get('/incoming', getIncomingRequests);
router.get('/outgoing', getOutgoingRequests);

router.patch('/:id/accept', requestIdParamValidator, validate, acceptRequest);
router.patch('/:id/reject', requestIdParamValidator, validate, rejectRequest);
router.patch('/:id/cancel', requestIdParamValidator, validate, cancelRequest);

module.exports = router;
