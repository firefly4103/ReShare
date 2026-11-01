const { body } = require('express-validator');

const registerValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[A-Za-z]/)
    .withMessage('Password must contain at least one letter')
    .matches(/\d/)
    .withMessage('Password must contain at least one number'),

  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[+]?[0-9\s\-().]{7,20}$/)
    .withMessage('Please provide a valid phone number format'),

  body('location.city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),

  body('location.area')
    .trim()
    .notEmpty()
    .withMessage('Area/neighborhood is required')
];

const loginValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

module.exports = {
  registerValidator,
  loginValidator
};
