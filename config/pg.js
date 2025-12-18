const { Pool } = require("pg");
const dotenv = require("dotenv");
const { getLocalPostgresPort, isTunnelActive } = require("./sshTunnel");

dotenv.config();

let pool;
let loginPool; // Separate pool for login database

function createPool() {
  // AWS RDS requires SSL, so enable it automatically for RDS hosts
  const pgHost = process.env.PG_HOST || process.env.DB_HOST || "";
  const isRDS = pgHost.includes("rds.amazonaws.com");
  const useSSL = isRDS || String(process.env.PG_SSL || "").toLowerCase() === "true";
  
  // Check if we should use SSH tunnel (if SSH_HOST is set and tunnel is actually active)
  // For AWS RDS, don't use SSH tunnel - connect directly
  const useTunnel = process.env.SSH_HOST && isTunnelActive() && !isRDS;
  
  const host = useTunnel ? '127.0.0.1' : pgHost;
  const port = useTunnel ? getLocalPostgresPort() : (Number(process.env.PG_PORT || process.env.DB_PORT) || 5432);

  // If pool exists, check if it's still valid
  if (pool) {
    // Check if pool is already ended or ending
    if (pool._ending || pool._ended) {
      pool = null;
    } else {
      // Check if pool is still connected
      try {
        const currentHost = pool.options?.host || pool._clients?.[0]?.host;
        if (currentHost !== host) {
          console.log(`🔄 Recreating PostgreSQL pool (tunnel status changed)`);
          pool = null;
        } else {
          return pool;
        }
      } catch (e) {
        // Pool is invalid, recreate it
        pool = null;
      }
    }
  }

  if (useTunnel) {
    console.log(`📡 PostgreSQL: Using SSH tunnel (localhost:${port})`);
  } else {
    console.log(`📡 PostgreSQL: Using direct connection (${host}:${port})${useSSL ? ' (SSL enabled)' : ''}`);
  }

  // Main pool uses DB_* variables (for batchcode and lead-to-order)
  // Fallback to PG_* if DB_* not set
  pool = new Pool({
    host,
    port,
    user: process.env.DB_USER || process.env.PG_USER,
    password: process.env.DB_PASSWORD || process.env.PG_PASSWORD,
    database: process.env.DB_NAME || process.env.PG_DATABASE,
    ssl: useSSL ? { rejectUnauthorized: false } : false,
    max: 10,
    connectionTimeoutMillis: isRDS ? 20000 : 15000, // Longer timeout for RDS
    idleTimeoutMillis: 30000,
    statement_timeout: 30000,
  });

  return pool;
}

function getPgPool() {
  return createPool();
}

async function pgQuery(text, params = []) {
  let client;
  let retries = 2;
  
  while (retries >= 0) {
    try {
      const pool = getPgPool();
      client = await pool.connect();
      const result = await client.query(text, params);
      client.release();
      return result;
    } catch (err) {
      if (client) {
        try {
          client.release();
        } catch (e) {
          // Ignore release errors
        }
      }
      
      // If connection error and retries left, reset pool and retry
      if (retries > 0 && (err.message.includes("terminated") || err.message.includes("ECONNREFUSED") || err.message.includes("timeout") || err.message.includes("Connection terminated"))) {
        console.warn(`⚠️ PostgreSQL connection failed, retrying... (${retries} attempts left)`, err.message);
        resetPool();
        await new Promise(resolve => setTimeout(resolve, 1000));
        retries--;
      } else {
        throw err;
      }
    }
  }
}

function createLoginPool() {
  // AWS RDS requires SSL, so enable it by default for RDS hosts
  const pgHost = process.env.PG_HOST || process.env.DB_HOST || "";
  const isRDS = pgHost.includes("rds.amazonaws.com");
  const useSSL = isRDS || String(process.env.PG_SSL || "").toLowerCase() === "true";
  
  // For RDS, don't use SSH tunnel - connect directly
  // SSH tunnel is only for on-premise servers
  const useTunnel = process.env.SSH_HOST && isTunnelActive() && !isRDS;
  
  const host = useTunnel ? '127.0.0.1' : pgHost;
  const port = useTunnel ? getLocalPostgresPort() : (Number(process.env.PG_PORT || process.env.DB_PORT) || 5432);
  
  // Use PG_NAME for login database, fallback to PG_DATABASE or DB_NAME
  const loginDatabase = process.env.PG_NAME || process.env.PG_DATABASE || process.env.DB_NAME;

  // If pool exists but connection config changed, recreate it
  if (loginPool) {
    const currentHost = loginPool.options?.host || loginPool._clients?.[0]?.host;
    if (currentHost !== host) {
      console.log(`🔄 Recreating Login PostgreSQL pool (tunnel status changed)`);
      loginPool.end().catch(() => {});
      loginPool = null;
    } else {
      return loginPool;
    }
  }

  if (useTunnel) {
    console.log(`📡 Login Database: Using SSH tunnel (localhost:${port}) - Database: ${loginDatabase}`);
  } else {
    console.log(`📡 Login Database: Using direct connection (${host}:${port}) - Database: ${loginDatabase}${useSSL ? ' (SSL enabled)' : ''}`);
  }

  // Login pool uses PG_* variables (for auth/login)
  loginPool = new Pool({
    host,
    port,
    user: process.env.PG_USER || process.env.DB_USER,
    password: process.env.PG_PASSWORD || process.env.DB_PASSWORD,
    database: loginDatabase,
    ssl: useSSL ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: isRDS ? 20000 : 15000, // Longer timeout for RDS
    idleTimeoutMillis: 30000,
    statement_timeout: 30000,
    max: 10,
  });

  return loginPool;
}

function getLoginPool() {
  return createLoginPool();
}

async function loginQuery(text, params = []) {
  let client;
  let retries = 2;
  
  while (retries >= 0) {
    try {
      client = await getLoginPool().connect();
      const result = await client.query(text, params);
      client.release();
      return result;
    } catch (err) {
      if (client) {
        try {
          client.release();
        } catch (e) {
          // Ignore release errors
        }
      }
      
      // If connection error and retries left, reset pool and retry
      if (retries > 0 && (err.message.includes("terminated") || err.message.includes("ECONNREFUSED") || err.message.includes("timeout"))) {
        console.warn(`⚠️ Login DB connection failed, retrying... (${retries} attempts left)`);
        resetPool();
        await new Promise(resolve => setTimeout(resolve, 1000));
        retries--;
      } else {
        throw err;
      }
    }
  }
}

async function closePgPool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
  if (loginPool) {
    await loginPool.end();
    loginPool = null;
  }
}

function resetPool() {
  // Don't end the pool - just mark it for recreation on next use
  // This prevents "Cannot use a pool after calling end" errors
  if (pool) {
    try {
      // Only end if pool is actually broken
      if (pool._ending || pool._ended) {
        pool = null;
      } else {
        // Just mark for recreation, don't end it
        pool = null;
      }
    } catch (e) {
      pool = null;
    }
  }
  if (loginPool) {
    try {
      if (loginPool._ending || loginPool._ended) {
        loginPool = null;
      } else {
        loginPool = null;
      }
    } catch (e) {
      loginPool = null;
    }
  }
}

module.exports = {
  getPgPool,
  getLoginPool,
  pgQuery,
  loginQuery,
  closePgPool,
  resetPool,
};
