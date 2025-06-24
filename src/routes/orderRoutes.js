const express = require('express');
const { body } = require('express-validator');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const {
  getOrders,
  getOrder,
  createOrder,
  getOrderById,
  updateOrderStatus,
  getOrderStats,
  createGuestOrder  
} = require('../controllers/orderController');

const router = express.Router();

// Add debug logging
console.log('🔧 DEBUG: Setting up order routes...');
console.log('🔧 DEBUG: createGuestOrder function available:', typeof createGuestOrder);

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

// Guest validation for guest orders
const guestOrderValidation = [
  body('customerName')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Customer name is required'),
  body('customerPhone')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Valid phone number is required'),
  body('customerEmail')
    .isEmail()
    .withMessage('Valid email address is required'),
  body('items')
    .isArray({ min: 1 })
    .withMessage('Order must contain at least one item'),
  body('items.*.menuItemId')
    .isInt({ min: 1 })
    .withMessage('Valid menu item ID is required'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  body('totalAmount')
    .isFloat({ min: 0 })
    .withMessage('Valid total amount is required')
];

// Debug middleware to log all requests
router.use((req, res, next) => {
  console.log(`🔧 DEBUG: ${req.method} ${req.originalUrl} - ${new Date().toISOString()}`);
  console.log('🔧 DEBUG: Headers:', JSON.stringify(req.headers, null, 2));
  console.log('🔧 DEBUG: Body:', JSON.stringify(req.body, null, 2));
  next();
});

// PUBLIC ROUTES (No authentication required)
// Guest order route - MUST be before authenticateToken middleware
console.log('🔧 DEBUG: Registering guest route at /guest');
router.post('/guest', (req, res, next) => {
  console.log('🔧 DEBUG: Guest route hit! Method:', req.method, 'URL:', req.url);
  next();
}, guestOrderValidation, createGuestOrder);

console.log('🔧 DEBUG: Guest route registered successfully');

// Test route to verify routes are working
router.get('/test', (req, res) => {
  console.log('🔧 DEBUG: Test route hit!');
  res.json({ message: 'Order routes are working', timestamp: new Date() });
});

// PROTECTED ROUTES (Authentication required)
// Apply authentication middleware to all routes below this point
console.log('🔧 DEBUG: Setting up protected routes...');
router.use(authenticateToken);

// Routes that require authentication
router.get('/', getOrders);
router.get('/stats', authorizeRole('admin', 'employee'), getOrderStats);
router.get('/:id', getOrder);
router.post('/', createOrderValidation, createOrder);
router.patch('/:id/status', authorizeRole('admin', 'employee'), updateOrderStatus);

console.log('🔧 DEBUG: All order routes registered');

module.exports = router;