const sql = require('mssql');

const config = {
  server: "eshanee-chetan-sql-server.database.windows.net",
  database: "eshanee-chetan-db",
  user: "eshanee-chetan-restaurant",
  password: "sqlDatabase#25",
  port: parseInt(process.env.DB_PORT) || 1433,
  options: {
    encrypt: true, // Use encryption for Azure SQL
    trustServerCertificate: false,
    enableArithAbort: true,
    requestTimeout: 30000,
    connectionTimeout: 30000,
  },
  pool: {
    min: 0,
    max: 10,
    idleTimeoutMillis: 30000,
  },
};

let poolPromise;

const getConnection = async () => {
  try {
    if (!poolPromise) {
      poolPromise = new sql.ConnectionPool(config);
      await poolPromise.connect();
      console.log('✅ Connected to Azure SQL Database');
    }
    return poolPromise;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
};

// Test connection function
const testConnection = async () => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query('SELECT 1 as test');
    console.log('✅ Database connection test successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    return false;
  }
};

module.exports = {
  getConnection,
  testConnection,
  sql
};