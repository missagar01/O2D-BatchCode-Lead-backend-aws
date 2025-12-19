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

    // Initialize Oracle client (must be done before creating pool)
    // This will use Thick mode if Instant Client is found, Thin mode otherwise
    try {
      initOracleClient();
      
      // Check if we're in Thin mode and warn about potential issues
      if (oracledb.thin) {
        console.warn("⚠️ WARNING: Running in Thin mode. Oracle 11g and older may not be supported.");
        console.warn("⚠️ If you get NJS-138 errors, install Oracle Instant Client and set ORACLE_CLIENT in .env");
        console.warn("⚠️ Thin mode only supports Oracle 12.1.0.2 and later");
        console.warn("⚠️ Your Oracle database appears to be 11g (ora11g) which requires Thick mode");
      } else {
        console.log("✅ Running in Thick mode (Oracle Instant Client detected)");
        console.log("✅ Thick mode supports all Oracle versions including 11g");
      }
    } catch (clientErr) {
      console.error("❌ Failed to initialize Oracle Client:", clientErr.message);
      // Continue anyway - might work in Thin mode for newer Oracle versions
      console.warn("⚠️ Continuing in Thin mode - may fail for older Oracle versions");
    }

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

    try {
      pool = await oracledb.createPool(dbConfig);
      console.log("✅ Oracle connection pool started");

      // Test connection with retry logic
      console.log("🧪 Testing database connection...");
      await testConnectionWithRetry();
      console.log("✅ Database connection test successful");
    } catch (poolErr) {
      // Check for NJS-138 error (unsupported Oracle version in Thin mode)
      if (poolErr.code === 'NJS-138' || poolErr.message.includes('NJS-138')) {
        console.error("❌ NJS-138 Error: Your Oracle database version is not supported in Thin mode");
        console.error("❌ This error occurs when connecting to Oracle 11g or older using Thin mode");
        console.error("");
        console.error("💡 SOLUTION: Install Oracle Instant Client for Thick mode");
        console.error("   1. Download Oracle Instant Client from:");
        console.error("      https://www.oracle.com/database/technologies/instant-client/linux-x86-64-downloads.html");
        console.error("   2. Extract to /opt/oracle/instantclient_21_13 (or similar)");
        console.error("   3. Add to .env: ORACLE_CLIENT=/opt/oracle/instantclient_21_13");
        console.error("   4. Restart PM2: pm2 restart o2d-lead-batch --update-env");
        console.error("");
        console.error("📖 See backend/ORACLE_INSTANT_CLIENT_INSTALL.md for detailed instructions");
        throw new Error("Oracle 11g requires Thick mode. Please install Oracle Instant Client. See ORACLE_INSTANT_CLIENT_INSTALL.md");
      }
      throw poolErr; // Re-throw other errors
    }
    
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
        // Check if it's an NJS-138 error and provide detailed instructions
        const errorMsg = poolInitError.message || '';
        const errorCode = poolInitError.code || '';
        
        if (errorCode === 'NJS-138' || errorMsg.includes('NJS-138') || errorMsg.includes('not supported by node-oracledb in Thin mode')) {
          console.error("");
          console.error("❌ =========================================");
          console.error("❌ NJS-138 ERROR: Oracle Version Not Supported");
          console.error("❌ =========================================");
          console.error("");
          console.error("Your Oracle database (11g/ora11g) requires Thick mode.");
          console.error("Thin mode only supports Oracle 12.1.0.2 and later.");
          console.error("");
          console.error("💡 SOLUTION: Install Oracle Instant Client");
          console.error("");
          console.error("Quick Install Steps:");
          console.error("  1. Download Oracle Instant Client Basic + SDK:");
          console.error("     https://www.oracle.com/database/technologies/instant-client/linux-x86-64-downloads.html");
          console.error("");
          console.error("  2. Upload to AWS server and extract:");
          console.error("     sudo mkdir -p /opt/oracle");
          console.error("     cd /opt/oracle");
          console.error("     sudo unzip instantclient-basic-linux.x64-*.zip");
          console.error("     sudo unzip instantclient-sdk-linux.x64-*.zip");
          console.error("");
          console.error("  3. Set up library path (replace 21_13 with your version):");
          console.error("     echo '/opt/oracle/instantclient_21_13' | sudo tee /etc/ld.so.conf.d/oracle-instantclient.conf");
          console.error("     sudo ldconfig");
          console.error("");
          console.error("  4. Add to .env file:");
          console.error("     ORACLE_CLIENT=/opt/oracle/instantclient_21_13");
          console.error("");
          console.error("  5. Restart PM2:");
          console.error("     pm2 restart o2d-lead-batch --update-env");
          console.error("");
          console.error("📖 See backend/ORACLE_INSTANT_CLIENT_INSTALL.md for detailed instructions");
          console.error("");
          throw new Error("NJS-138: Oracle 11g requires Thick mode. Install Oracle Instant Client. See ORACLE_INSTANT_CLIENT_INSTALL.md");
        }
        
        // If we already tried and failed, throw the cached error
        throw new Error(`Oracle connection pool failed to initialize: ${poolInitError.message}. Please check your ORACLE_CONNECTION_STRING and ensure Oracle is accessible.`);
      }
      
      console.log("📡 Oracle pool not initialized, attempting to initialize now...");
      try {
        await initPool();
      } catch (initError) {
        poolInitError = initError;
        
        // Check if it's an NJS-138 error
        const errorMsg = initError.message || '';
        const errorCode = initError.code || '';
        
        if (errorCode === 'NJS-138' || errorMsg.includes('NJS-138') || errorMsg.includes('not supported by node-oracledb in Thin mode')) {
          console.error("");
          console.error("❌ =========================================");
          console.error("❌ NJS-138 ERROR: Oracle Version Not Supported");
          console.error("❌ =========================================");
          console.error("");
          console.error("Your Oracle database (11g/ora11g) requires Thick mode.");
          console.error("Thin mode only supports Oracle 12.1.0.2 and later.");
          console.error("");
          console.error("💡 SOLUTION: Install Oracle Instant Client");
          console.error("📖 See backend/ORACLE_INSTANT_CLIENT_INSTALL.md for detailed instructions");
          console.error("");
          throw new Error("NJS-138: Oracle 11g requires Thick mode. Install Oracle Instant Client. See ORACLE_INSTANT_CLIENT_INSTALL.md");
        }
        
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

