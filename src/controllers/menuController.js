const { getConnection, sql } = require('../config/database');
const { validationResult } = require('express-validator');

// Get all menu items
const getMenuItems = async (req, res) => {
  try {
    const { category, isVeg } = req.query;
    
    const pool = await getConnection();
    let query = `
      SELECT Id, Name, Description, Price, Category, ImageUrl, 
             IsVeg, SpiceLevel, Rating, PrepTime, IsAvailable, CreatedAt
      FROM MenuItems 
      WHERE IsAvailable = 1
    `;
    
    const request = pool.request();
    
    if (category) {
      query += ` AND Category = @category`;
      request.input('category', sql.NVarChar, category);
    }
    
    if (isVeg !== undefined) {
      query += ` AND IsVeg = @isVeg`;
      request.input('isVeg', sql.Bit, isVeg === 'true');
    }
    
    query += ` ORDER BY CreatedAt DESC`;
    
    const result = await request.query(query);

    res.json({
      success: true,
      data: result.recordset
    });

  } catch (error) {
    console.error('Get menu items error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get single menu item
const getMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    
    const pool = await getConnection();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT Id, Name, Description, Price, Category, ImageUrl, 
               IsVeg, SpiceLevel, Rating, PrepTime, IsAvailable, CreatedAt
        FROM MenuItems 
        WHERE Id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    res.json({
      success: true,
      data: result.recordset[0]
    });

  } catch (error) {
    console.error('Get menu item error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Create menu item (Admin only)
const createMenuItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      name, description, price, category, imageUrl,
      isVeg, spiceLevel, prepTime
    } = req.body;

    const pool = await getConnection();
    const result = await pool.request()
      .input('name', sql.NVarChar, name)
      .input('description', sql.NVarChar, description)
      .input('price', sql.Decimal(10, 2), price)
      .input('category', sql.NVarChar, category)
      .input('imageUrl', sql.NVarChar, imageUrl || null)
      .input('isVeg', sql.Bit, isVeg || false)
      .input('spiceLevel', sql.Int, spiceLevel || 1)
      .input('prepTime', sql.NVarChar, prepTime)
      .query(`
        INSERT INTO MenuItems (Name, Description, Price, Category, ImageUrl, 
                              IsVeg, SpiceLevel, PrepTime, IsAvailable, CreatedAt)
        OUTPUT INSERTED.*
        VALUES (@name, @description, @price, @category, @imageUrl, 
                @isVeg, @spiceLevel, @prepTime, 1, GETDATE())
      `);

    res.status(201).json({
      success: true,
      message: 'Menu item created successfully',
      data: result.recordset[0]
    });

  } catch (error) {
    console.error('Create menu item error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update menu item (Admin only)
const updateMenuItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const {
      name, description, price, category, imageUrl,
      isVeg, spiceLevel, prepTime, isAvailable
    } = req.body;

    const pool = await getConnection();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('name', sql.NVarChar, name)
      .input('description', sql.NVarChar, description)
      .input('price', sql.Decimal(10, 2), price)
      .input('category', sql.NVarChar, category)
      .input('imageUrl', sql.NVarChar, imageUrl)
      .input('isVeg', sql.Bit, isVeg)
      .input('spiceLevel', sql.Int, spiceLevel)
      .input('prepTime', sql.NVarChar, prepTime)
      .input('isAvailable', sql.Bit, isAvailable)
      .query(`
        UPDATE MenuItems 
        SET Name = @name, Description = @description, Price = @price,
            Category = @category, ImageUrl = @imageUrl, IsVeg = @isVeg,
            SpiceLevel = @spiceLevel, PrepTime = @prepTime, 
            IsAvailable = @isAvailable, UpdatedAt = GETDATE()
        OUTPUT INSERTED.*
        WHERE Id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    res.json({
      success: true,
      message: 'Menu item updated successfully',
      data: result.recordset[0]
    });

  } catch (error) {
    console.error('Update menu item error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete menu item (Admin only)
const deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;

    const pool = await getConnection();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        UPDATE MenuItems 
        SET IsAvailable = 0, UpdatedAt = GETDATE()
        WHERE Id = @id AND IsAvailable = 1
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    res.json({
      success: true,
      message: 'Menu item deleted successfully'
    });

  } catch (error) {
    console.error('Delete menu item error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getMenuItems,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem
};