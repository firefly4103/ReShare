const express = require('express');
const router = express.Router();

const {
  getPlatformSummary,
  getUserImpact
} = require('../controllers/analyticsController');

// Public analytics endpoints
router.get('/platform-summary', getPlatformSummary);
router.get('/user-impact/:id', getUserImpact);

module.exports = router;
