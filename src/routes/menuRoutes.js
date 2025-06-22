const express = require('express');
const { body } = require('express-validator');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const {
  getMenuItems,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem
} = require('../controllers/menuController');

const router = express.Router();

// Validation rules for menu items
const menuItemValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  body('price')
    .isFloat({ min: 0.01 })
    .withMessage('Price must be a positive number'),
  body('category')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category must be between 2 and 50 characters'),
  body('spiceLevel')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Spice level must be between 1 and 5'),
  body('isVeg')
    .optional()
    .isBoolean()
    .withMessage('isVeg must be a boolean value')
];

// Public routes
router.get('/', getMenuItems);
router.get('/:id', getMenuItem);

// Protected routes (Admin only)
router.post('/', 
  authenticateToken, 
  authorizeRole('admin'), 
  menuItemValidation, 
  createMenuItem
);

router.put('/:id', 
  authenticateToken, 
  authorizeRole('admin'), 
  menuItemValidation, 
  updateMenuItem
);

router.delete('/:id', 
  authenticateToken, 
  authorizeRole('admin'), 
  deleteMenuItem
);

module.exports = router;