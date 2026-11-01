const express = require('express');
const router = express.Router();

const { register, login, getMe, logout } = require('../controllers/authController');
const { registerValidator, loginValidator } = require('../validations/authValidation');
const validate = require('../middlewares/validate');
const { protect } = require('../middlewares/auth');
const { authLimiter } = require('../middlewares/rateLimiter');

router.post('/register', authLimiter, registerValidator, validate, register);
router.post('/login', authLimiter, loginValidator, validate, login);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

module.exports = router;
