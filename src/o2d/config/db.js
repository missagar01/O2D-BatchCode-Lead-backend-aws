const oracledb = require("oracledb");
const dotenv = require("dotenv");
const { initOracleClient } = require("../../../config/oracleClient.js");
const { initSSHTunnel, closeSSHTunnel } = require("../../../config/sshTunnel.js");

// Load environment variables
dotenv.config();

let pool;
let poolInitializing = false;
let poolInitError = null;
let sshTunnelActive = false;
const LOCAL_ORACLE_PORT = parseInt(process.env.LOCAL_ORACLE_PORT || "1521", 10);

// Validate all required environment variables
function validateEnv() {
  const required = [
    'ORACLE_USER',
    'ORACLE_PASSWORD'
  ];

  // Check if using direct connection or SSH tunnel
  const usingSSHTunnel = process.env.SSH_HOST && process.env.SSH_USER;
  const usingDirectConnection = process.env.ORACLE_CONNECTION_STRING;

  if (usingSSHTunnel) {
    // If using SSH tunnel, also need SSH credentials
    if (!process.env.SSH_PASSWORD && !process.env.SSH_KEY_PATH && !process.env.SSH_PRIVATE_KEY) {
      required.push('SSH_PASSWORD or SSH_KEY_PATH or SSH_PRIVATE_KEY');
    }
  } else if (!usingDirectConnection) {
    // If not using SSH tunnel, need direct connection string
    required.push('ORACLE_CONNECTION_STRING');
  }

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}. Either set ORACLE_CONNECTION_STRING for direct connection, or SSH_HOST/SSH_USER/SSH_PASSWORD for SSH tunnel.`);
  }

  console.log('✅ All required environment variables are set');
  console.log('🔧 Config:', {
    oracleUser: process.env.ORACLE_USER,
    connectionType: usingSSHTunnel ? 'SSH Tunnel' : 'Direct Connection',
    sshHost: process.env.SSH_HOST || 'N/A',
    sshUser: process.env.SSH_USER || 'N/A',
    sshPort: process.env.SSH_PORT || 22
  });
}

async function initPool() {
  // Prevent multiple simultaneous initialization attempts
  if (poolInitializing) {
    console.log("⏳ Oracle pool initialization already in progress, waiting...");
    // Wait for initialization to complete
    while (poolInitializing) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (poolInitError) {
      throw poolInitError;
    }
    if (pool) {
      return; // Pool initialized successfully
    }
  }

  poolInitializing = true;
  poolInitError = null;
  
  try {
    // Validate environment variables first
    validateEnv();
    
    // Determine connection method
    const usingSSHTunnel = process.env.SSH_HOST && process.env.SSH_USER;
    const usingDirectConnection = process.env.ORACLE_CONNECTION_STRING;

    // Initialize SSH tunnel first (if using SSH tunnel)
    if (usingSSHTunnel) {
      try {
        console.log("🔐 Initializing SSH tunnel for Oracle...");
        await initSSHTunnel();
        sshTunnelActive = true;
        
        // Wait a moment for tunnel to be fully established
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log("✅ SSH tunnel ready for Oracle");
      } catch (sshErr) {
        console.warn("⚠️ SSH tunnel initialization failed for Oracle:", sshErr.message);
        console.warn("⚠️ Oracle connection may fail if direct access is not available");
        // Continue anyway - Oracle connection will fail later if needed
      }
    }

    // Initialize Oracle client
    initOracleClient();

    console.log("📡 Creating Oracle connection pool...");

    // Connection configuration
    let connectString;
    if (usingSSHTunnel && sshTunnelActive) {
      // Use SSH tunnel connection
      connectString = `127.0.0.1:${LOCAL_ORACLE_PORT}/ora11g`;
      console.log("🔗 Using SSH tunnel connection:", connectString);
    } else if (usingDirectConnection) {
      // Use direct connection
      connectString = process.env.ORACLE_CONNECTION_STRING;
      console.log("🔗 Using direct connection:", connectString.replace(/:[^:@]+@/, ':****@')); // Hide password in logs
    } else {
      throw new Error("No valid Oracle connection method configured. Set either ORACLE_CONNECTION_STRING or SSH tunnel configuration.");
    }

    const dbConfig = {
      user: process.env.ORACLE_USER,
      password: process.env.ORACLE_PASSWORD,
      connectString: connectString,
      poolMin: 1,
      poolMax: 4,
      poolIncrement: 1,
      poolTimeout: 60,
      queueTimeout: 30000,
      connectTimeout: 30000,
    };

    console.log('Database config:', { 
      user: dbConfig.user,
      connectString: dbConfig.connectString
    });

    pool = await oracledb.createPool(dbConfig);
    console.log("✅ Oracle connection pool started");

    // Test connection with retry logic
    console.log("🧪 Testing database connection...");
    await testConnectionWithRetry();
    console.log("✅ Database connection test successful");
    
    poolInitializing = false;
  } catch (err) {
    poolInitializing = false;
    poolInitError = err;
    console.error("❌ Pool init failed:", err.message);
    await cleanup();
    throw err;
  }
}

async function testConnectionWithRetry(maxRetries = 3, retryDelay = 2000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    let connection;
    try {
      connection = await pool.getConnection();
      const result = await connection.execute(`SELECT 1 FROM DUAL`);
      await connection.close();
      console.log(`✅ Connection test successful (attempt ${attempt})`);
      return;
    } catch (err) {
      console.log(`⚠️ Connection test attempt ${attempt} failed:`, err.message);
      if (connection) {
        try {
          await connection.close();
        } catch (closeErr) {
          console.error('Error closing connection:', closeErr);
        }
      }
      if (attempt < maxRetries) {
        console.log(`🔄 Retrying in ${retryDelay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      } else {
        throw err;
      }
    }
  }
}

async function cleanup() {
  if (pool) {
    try {
      await pool.close(0);
      pool = null;
      console.log("✅ Pool closed during cleanup");
    } catch (closeErr) {
      console.error("Error closing pool:", closeErr);
    }
  }
  
  if (sshTunnelActive) {
    try {
      await closeSSHTunnel();
      sshTunnelActive = false;
      console.log("✅ SSH tunnel closed during cleanup");
    } catch (tunnelErr) {
      console.error("Error closing SSH tunnel:", tunnelErr);
    }
  }
}

async function getConnection() {
  try {
    // If pool doesn't exist, try to initialize it
    if (!pool) {
      if (poolInitError) {
        // If we already tried and failed, throw the cached error
        throw new Error(`Oracle connection pool failed to initialize: ${poolInitError.message}. Please check your ORACLE_CONNECTION_STRING and ensure Oracle is accessible.`);
      }
      
      console.log("📡 Oracle pool not initialized, attempting to initialize now...");
      try {
        await initPool();
      } catch (initError) {
        poolInitError = initError;
        throw new Error(`Failed to initialize Oracle connection pool: ${initError.message}. Please check your .env file and ensure ORACLE_USER, ORACLE_PASSWORD, and ORACLE_CONNECTION_STRING are set correctly.`);
      }
    }
    
    if (!pool) {
      throw new Error("Oracle connection pool is not available. Please check your Oracle configuration and ensure the server has access to the Oracle database.");
    }
    
    // Try to get a connection from the pool
    try {
      return await pool.getConnection();
    } catch (poolError) {
      console.error("❌ Failed to get connection from pool:", poolError.message);
      // If pool is invalid, reset it and try again
      if (poolError.message.includes('pool') || poolError.message.includes('closed')) {
        console.log("🔄 Pool appears invalid, resetting...");
        pool = null;
        poolInitError = null;
        throw new Error("Oracle connection pool is invalid. Please check your Oracle connection settings.");
      }
      throw poolError;
    }
  } catch (error) {
    console.error("❌ Failed to get Oracle connection:", error.message);
    throw error; // Re-throw to be caught by route error handler
  }
}

async function closePool() {
  await cleanup();
}

module.exports = {
  initPool,
  getConnection,
  closePool,
};

