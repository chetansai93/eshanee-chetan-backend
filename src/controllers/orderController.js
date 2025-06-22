const { getConnection, sql } = require('../config/database');
const { validationResult } = require('express-validator');

// Get all orders (with role-based filtering)
const getOrders = async (req, res) => {
  try {
    const { status, date } = req.query;
    const userRole = req.user.Role;
    const userId = req.user.Id;

    const pool = await getConnection();
    let query = `
      SELECT o.Id, o.OrderNumber, o.TotalAmount, o.Status, o.OrderDate,
             o.DeliveryAddress, o.SpecialInstructions,
             u.FirstName + ' ' + u.LastName as CustomerName,
             u.Email as CustomerEmail
      FROM Orders o
      INNER JOIN Users u ON o.CustomerId = u.Id
      WHERE 1=1
    `;

    const request = pool.request();

    // Role-based filtering
    if (userRole === 'customer') {
      query += ` AND o.CustomerId = @userId`;
      request.input('userId', sql.Int, userId);
    }

    if (status) {
      query += ` AND o.Status = @status`;
      request.input('status', sql.NVarChar, status);
    }

    if (date) {
      query += ` AND CAST(o.OrderDate AS DATE) = @date`;
      request.input('date', sql.Date, date);
    }

    query += ` ORDER BY o.OrderDate DESC`;

    const result = await request.query(query);

    // Get order items for each order
    for (let order of result.recordset) {
      const itemsResult = await pool.request()
        .input('orderId', sql.Int, order.Id)
        .query(`
          SELECT oi.Id, oi.Quantity, oi.Price,
                 mi.Name, mi.Description, mi.Category
          FROM OrderItems oi
          INNER JOIN MenuItems mi ON oi.MenuItemId = mi.Id
          WHERE oi.OrderId = @orderId
        `);
      
      order.Items = itemsResult.recordset;
    }

    res.json({
      success: true,
      data: result.recordset
    });

  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get single order
const getOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user.Role;
    const userId = req.user.Id;

    const pool = await getConnection();
    let query = `
      SELECT o.Id, o.OrderNumber, o.TotalAmount, o.Status, o.OrderDate,
             o.DeliveryAddress, o.SpecialInstructions,
             u.FirstName + ' ' + u.LastName as CustomerName,
             u.Email as CustomerEmail, u.Id as CustomerId
      FROM Orders o
      INNER JOIN Users u ON o.CustomerId = u.Id
      WHERE o.Id = @id
    `;

    const request = pool.request().input('id', sql.Int, id);

    // Role-based access control
    if (userRole === 'customer') {
      query += ` AND o.CustomerId = @userId`;
      request.input('userId', sql.Int, userId);
    }

    const orderResult = await request.query(query);

    if (orderResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const order = orderResult.recordset[0];

    // Get order items
    const itemsResult = await pool.request()
      .input('orderId', sql.Int, id)
      .query(`
        SELECT oi.Id, oi.Quantity, oi.Price,
               mi.Name, mi.Description, mi.Category, mi.ImageUrl
        FROM OrderItems oi
        INNER JOIN MenuItems mi ON oi.MenuItemId = mi.Id
        WHERE oi.OrderId = @orderId
      `);

    order.Items = itemsResult.recordset;

    res.json({
      success: true,
      data: order
    });

  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Create new order
const createOrder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { items, deliveryAddress, specialInstructions } = req.body;
    const customerId = req.user.Id;

    // Generate order number
    const orderNumber = `EC${Date.now()}`;
    
    // Calculate total amount
    const pool = await getConnection();
    let totalAmount = 0;
    
    // Validate items and calculate total
    for (const item of items) {
      const menuItemResult = await pool.request()
        .input('menuItemId', sql.Int, item.menuItemId)
        .query(`
          SELECT Price, IsAvailable 
          FROM MenuItems 
          WHERE Id = @menuItemId AND IsAvailable = 1
        `);

      if (menuItemResult.recordset.length === 0) {
        return res.status(400).json({
          success: false,
          message: `Menu item with ID ${item.menuItemId} not found or unavailable`
        });
      }

      const menuItem = menuItemResult.recordset[0];
      totalAmount += menuItem.Price * item.quantity;
    }

    // Create order
    const orderResult = await pool.request()
      .input('customerId', sql.Int, customerId)
      .input('orderNumber', sql.NVarChar, orderNumber)
      .input('totalAmount', sql.Decimal(10, 2), totalAmount)
      .input('deliveryAddress', sql.NVarChar, deliveryAddress || null)
      .input('specialInstructions', sql.NVarChar, specialInstructions || null)
      .query(`
        INSERT INTO Orders (CustomerId, OrderNumber, TotalAmount, Status, 
                           DeliveryAddress, SpecialInstructions, OrderDate)
        OUTPUT INSERTED.Id, INSERTED.OrderNumber, INSERTED.TotalAmount, 
               INSERTED.Status, INSERTED.OrderDate
        VALUES (@customerId, @orderNumber, @totalAmount, 'pending', 
                @deliveryAddress, @specialInstructions, GETDATE())
      `);

    const order = orderResult.recordset[0];

    // Create order items
    for (const item of items) {
      const menuItemResult = await pool.request()
        .input('menuItemId', sql.Int, item.menuItemId)
        .query(`SELECT Price FROM MenuItems WHERE Id = @menuItemId`);

      const price = menuItemResult.recordset[0].Price;

      await pool.request()
        .input('orderId', sql.Int, order.Id)
        .input('menuItemId', sql.Int, item.menuItemId)
        .input('quantity', sql.Int, item.quantity)
        .input('price', sql.Decimal(10, 2), price)
        .query(`
          INSERT INTO OrderItems (OrderId, MenuItemId, Quantity, Price)
          VALUES (@orderId, @menuItemId, @quantity, @price)
        `);
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update order status
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const pool = await getConnection();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('status', sql.NVarChar, status)
      .query(`
        UPDATE Orders 
        SET Status = @status, UpdatedAt = GETDATE()
        OUTPUT INSERTED.Id, INSERTED.OrderNumber, INSERTED.Status
        WHERE Id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: result.recordset[0]
    });

  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get order statistics (Admin/Employee only)
const getOrderStats = async (req, res) => {
  try {
    const { date, period = 'today' } = req.query;
    
    const pool = await getConnection();
    let whereClause = '';
    const request = pool.request();

    // Date filtering
    switch (period) {
      case 'today':
        whereClause = 'WHERE CAST(OrderDate AS DATE) = CAST(GETDATE() AS DATE)';
        break;
      case 'week':
        whereClause = 'WHERE OrderDate >= DATEADD(WEEK, -1, GETDATE())';
        break;
      case 'month':
        whereClause = 'WHERE OrderDate >= DATEADD(MONTH, -1, GETDATE())';
        break;
      case 'custom':
        if (date) {
          whereClause = 'WHERE CAST(OrderDate AS DATE) = @date';
          request.input('date', sql.Date, date);
        }
        break;
    }

    const statsResult = await request.query(`
      SELECT 
        COUNT(*) as TotalOrders,
        SUM(TotalAmount) as TotalRevenue,
        AVG(TotalAmount) as AverageOrderValue,
        COUNT(DISTINCT CustomerId) as UniqueCustomers,
        SUM(CASE WHEN Status = 'delivered' THEN 1 ELSE 0 END) as CompletedOrders,
        SUM(CASE WHEN Status = 'pending' THEN 1 ELSE 0 END) as PendingOrders,
        SUM(CASE WHEN Status = 'preparing' THEN 1 ELSE 0 END) as PreparingOrders
      FROM Orders 
      ${whereClause}
    `);

    res.json({
      success: true,
      data: statsResult.recordset[0]
    });

  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
  getOrderStats
};