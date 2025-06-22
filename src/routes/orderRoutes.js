const express = require('express');
const { body } = require('express-validator');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const {
  getOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
  getOrderStats
} = require('../controllers/orderController');

const router = express.Router();

// Validation for creating orders
const createOrderValidation = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Order must contain at least one item'),
  body('items.*.menuItemId')
    .isInt({ min: 1 })
    .withMessage('Valid menu item ID is required'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  body('deliveryAddress')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Delivery address must be less than 500 characters'),
  body('specialInstructions')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Special instructions must be less than 1000 characters')
];

// All routes require authentication
router.use(authenticateToken);

// Routes
router.get('/', getOrders);
router.get('/stats', authorizeRole('admin', 'employee'), getOrderStats);
router.get('/:id', getOrder);
router.post('/', createOrderValidation, createOrder);
router.patch('/:id/status', authorizeRole('admin', 'employee'), updateOrderStatus);

module.exports = router;