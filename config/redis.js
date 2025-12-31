const redis = require('redis');

// Connection state
let client = null;
let isConnecting = false;
let isConnected = false;
let connectionPromise = null;
let reconnectTimeout = null;
let reconnectAttempts = 0;

// Configuration
const MAX_RECONNECT_ATTEMPTS = 5;
const INITIAL_RECONNECT_DELAY = 1000; // 1 second
const MAX_RECONNECT_DELAY = 30000; // 30 seconds
const CONNECTION_TIMEOUT = 5000; // 5 seconds

// Create Redis client with proper configuration
function createClient() {
  if (client && client.isOpen) {
    return client;
  }

  const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
  
  client = redis.createClient({
    url: redisUrl,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > MAX_RECONNECT_ATTEMPTS) {
          console.warn('⚠️ Redis: Max reconnection attempts reached. Redis will be disabled.');
          return false; // Stop reconnecting
        }
        const delay = Math.min(
          INITIAL_RECONNECT_DELAY * Math.pow(2, retries),
          MAX_RECONNECT_DELAY
        );
        console.log(`🔄 Redis: Reconnecting in ${delay}ms (attempt ${retries + 1}/${MAX_RECONNECT_ATTEMPTS})`);
        return delay;
      },
      connectTimeout: CONNECTION_TIMEOUT,
    },
  });

  // Event handlers
  client.on('connect', () => {
    isConnected = true;
    reconnectAttempts = 0;
    console.log('✅ Redis connected');
  });

  client.on('ready', () => {
    isConnected = true;
    reconnectAttempts = 0;
    console.log('✅ Redis ready');
  });

  client.on('error', (err) => {
    // Only log errors if we're not in a reconnection state
    if (!err.message.includes('ECONNREFUSED') || reconnectAttempts === 0) {
      console.warn(`⚠️ Redis error: ${err.message}`);
    }
    isConnected = false;
  });

  client.on('end', () => {
    isConnected = false;
    console.log('🔌 Redis connection closed');
  });

  client.on('reconnecting', () => {
    reconnectAttempts++;
    console.log(`🔄 Redis reconnecting... (attempt ${reconnectAttempts})`);
  });

  return client;
}

// Connect to Redis with retry logic
async function connect() {
  // If already connected, return
  if (isConnected && client && client.isOpen) {
    return client;
  }

  // If already connecting, return the existing promise
  if (isConnecting && connectionPromise) {
    return connectionPromise;
  }

  // Start connection process
  isConnecting = true;
  connectionPromise = (async () => {
    try {
      if (!client) {
        createClient();
      }

      // Check if already open
      if (client.isOpen) {
        isConnected = true;
        isConnecting = false;
        return client;
      }

      // Connect with timeout
      await Promise.race([
        client.connect(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Connection timeout')), CONNECTION_TIMEOUT)
        )
      ]);

      isConnected = true;
      isConnecting = false;
      reconnectAttempts = 0;
      return client;
    } catch (err) {
      isConnected = false;
      isConnecting = false;
      connectionPromise = null;
      
      // Don't throw - allow graceful degradation
      console.warn(`⚠️ Redis connection failed: ${err.message}`);
      console.warn('⚠️ Application will continue without Redis caching');
      return null;
    }
  })();

  return connectionPromise;
}

// Safe Redis operations wrapper
async function safeOperation(operation, fallback = null) {
  try {
    // Ensure connection
    const redisClient = await connect();
    if (!redisClient || !redisClient.isOpen) {
      return fallback;
    }

    return await operation(redisClient);
  } catch (err) {
    // Log only if it's not a connection error (to avoid spam)
    if (!err.message.includes('ECONNREFUSED') && !err.message.includes('Connection closed')) {
      console.warn(`⚠️ Redis operation failed: ${err.message}`);
    }
    return fallback;
  }
}

// Public API
const redisClient = {
  // Get value
  async get(key) {
    return await safeOperation(async (client) => {
      return await client.get(key);
    }, null);
  },

  // Set value with expiration
  async setEx(key, seconds, value) {
    return await safeOperation(async (client) => {
      return await client.setEx(key, seconds, value);
    }, null);
  },

  // Set value
  async set(key, value) {
    return await safeOperation(async (client) => {
      return await client.set(key, value);
    }, null);
  },

  // Delete key
  async del(key) {
    return await safeOperation(async (client) => {
      return await client.del(key);
    }, null);
  },

  // Check if connected
  isConnected() {
    return isConnected && client && client.isOpen;
  },

  // Get connection status
  getStatus() {
    return {
      connected: isConnected && client && client.isOpen,
      connecting: isConnecting,
      reconnectAttempts,
    };
  },

  // Manually connect (for initialization)
  connect,

  // Disconnect
  async disconnect() {
    if (client && client.isOpen) {
      try {
        await client.quit();
        isConnected = false;
        console.log('✅ Redis disconnected');
      } catch (err) {
        console.warn(`⚠️ Error disconnecting Redis: ${err.message}`);
      }
    }
  },
};

// Initialize connection if REDIS_URL is set (optional - lazy connection is preferred)
if (process.env.REDIS_URL) {
  // Don't block startup - connect in background
  connect().catch(() => {
    // Already handled in connect()
  });
}

module.exports = redisClient;
