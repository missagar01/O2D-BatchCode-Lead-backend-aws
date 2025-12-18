const { getPool, resetMainPool } = require('../config/database');

/**
 * Retry database query on connection errors
 * @param {Function} queryFn - Function that returns a promise with query result
 * @param {number} maxRetries - Maximum number of retries (default: 3)
 * @returns {Promise} Query result
 */
const retryQuery = async (queryFn, maxRetries = 3) => {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await queryFn();
    } catch (err) {
      lastError = err;
      const errorMsg = err.message || '';
      const isConnectionError = 
        errorMsg.includes('terminated') || 
        errorMsg.includes('Connection terminated') || 
        errorMsg.includes('ECONNREFUSED') ||
        errorMsg.includes('timeout') ||
        errorMsg.includes('not been initialized') ||
        errorMsg.includes('Connection closed');
      
      if (attempt < maxRetries && isConnectionError) {
        // Reset pool on connection errors to force reconnection
        resetMainPool();
        const delay = 1000 * attempt; // Exponential backoff: 1s, 2s, 3s
        console.warn(`⚠️ Database query failed (attempt ${attempt}/${maxRetries}), resetting pool and retrying in ${delay}ms...`, errorMsg);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
};

/**
 * Execute a database query with retry logic and proper connection management
 * Uses pool.connect() pattern for better error handling
 * @param {string} queryText - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise} Query result
 */
const query = async (queryText, params = []) => {
  return await retryQuery(async () => {
    const pool = getPool();
    let client;
    try {
      // Use pool.connect() for better connection management
      client = await pool.connect();
      const result = await client.query(queryText, params);
      return result;
    } catch (err) {
      // Re-throw to be handled by retry logic
      throw err;
    } finally {
      // Always release the client back to the pool
      if (client) {
        try {
          client.release();
        } catch (releaseErr) {
          // Ignore release errors, but log them
          console.warn('⚠️ Error releasing database client:', releaseErr.message);
        }
      }
    }
  });
};

module.exports = { retryQuery, query };

