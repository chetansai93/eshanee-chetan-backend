const express = require('express');
const { body } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const {
  login,
  register,
  getCurrentUser,
  logout
} = require('../controllers/authController');

const router = express.Router();

// Validation rules
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('firstName')
    .trim()
    .isLength({ min: 2 })
    .withMessage('First name must be at least 2 characters long'),
  body('lastName')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Last name must be at least 2 characters long'),
  body('role')
    .optional()
    .isIn(['admin', 'employee', 'customer'])
    .withMessage('Role must be admin, employee, or customer')
];

// Routes
router.post('/login', loginValidation, login);
router.post('/register', registerValidation, register);
router.get('/me', authenticateToken, getCurrentUser);
router.post('/logout', logout);

module.exports = router;