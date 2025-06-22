const { getConnection, sql } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async findByEmail(email) {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('email', sql.NVarChar, email)
        .query(`
          SELECT Id, Email, Password, FirstName, LastName, Role, IsActive, CreatedAt
          FROM Users 
          WHERE Email = @email AND IsActive = 1
        `);

      return result.recordset[0] || null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('id', sql.Int, id)
        .query(`
          SELECT Id, Email, FirstName, LastName, Role, IsActive, CreatedAt
          FROM Users 
          WHERE Id = @id AND IsActive = 1
        `);

      return result.recordset[0] || null;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  }

  static async create(userData) {
    try {
      const { email, password, firstName, lastName, role = 'customer' } = userData;
      
      // Hash password
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(password, salt);

      const pool = await getConnection();
      const result = await pool.request()
        .input('email', sql.NVarChar, email)
        .input('password', sql.NVarChar, hashedPassword)
        .input('firstName', sql.NVarChar, firstName)
        .input('lastName', sql.NVarChar, lastName)
        .input('role', sql.NVarChar, role)
        .query(`
          INSERT INTO Users (Email, Password, FirstName, LastName, Role, IsActive, CreatedAt)
          OUTPUT INSERTED.Id, INSERTED.Email, INSERTED.FirstName, INSERTED.LastName, INSERTED.Role
          VALUES (@email, @password, @firstName, @lastName, @role, 1, GETDATE())
        `);

      return result.recordset[0];
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  static async validatePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async updatePassword(userId, newPassword) {
    try {
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      const pool = await getConnection();
      await pool.request()
        .input('userId', sql.Int, userId)
        .input('password', sql.NVarChar, hashedPassword)
        .query(`
          UPDATE Users 
          SET Password = @password, UpdatedAt = GETDATE()
          WHERE Id = @userId
        `);

      return true;
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  }

  static async getAllUsers(role = null) {
    try {
      const pool = await getConnection();
      let query = `
        SELECT Id, Email, FirstName, LastName, Role, IsActive, CreatedAt
        FROM Users 
        WHERE IsActive = 1
      `;
      
      const request = pool.request();
      
      if (role) {
        query += ` AND Role = @role`;
        request.input('role', sql.NVarChar, role);
      }
      
      query += ` ORDER BY CreatedAt DESC`;
      
      const result = await request.query(query);
      return result.recordset;
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }
}

module.exports = User;