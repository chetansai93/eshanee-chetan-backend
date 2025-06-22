const jwt = require('jsonwebtoken');
const { getConnection, sql } = require('../config/database');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access token is required' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database to ensure they still exist
    const pool = await getConnection();
    const result = await pool.request()
      .input('userId', sql.Int, decoded.userId)
      .query(`
        SELECT Id, Email, FirstName, LastName, Role, CreatedAt
        FROM Users 
        WHERE Id = @userId AND IsActive = 1
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found or inactive' 
      });
    }

    req.user = result.recordset[0];
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(403).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    });
  }
};

// Role-based authorization middleware
const authorizeRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    if (!roles.includes(req.user.Role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions' 
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRole
};