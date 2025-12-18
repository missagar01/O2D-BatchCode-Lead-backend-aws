const path = require("path");
const dotenv = require("dotenv");

const { initPool, closePool } = require("./src/o2d/config/db.js");
const { getPgPool, closePgPool, resetPool } = require("./config/pg.js");
const { connectDatabase, connectAuthDatabase } = require("./config/database.js");
const { initSSHTunnel, closeSSHTunnel } = require("./config/sshTunnel.js");

dotenv.config({
  path: path.join(__dirname, ".env"),
});

const port = Number(process.env.PORT) || 3006;

async function ensurePostgresConnection() {
  const maxRetries = 3;
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const pool = getPgPool();
      const client = await Promise.race([
        pool.connect(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 10000)
        )
      ]);
      client.release();
      console.log("✅ Postgres connection pool ready");
      return;
    } catch (err) {
      lastError = err;
      console.warn(`⚠️ Postgres connection attempt ${attempt}/${maxRetries} failed:`, err.message);
      
      if (attempt < maxRetries) {
        resetPool(); // Reset pool before retry
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`🔄 Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  console.error("❌ Postgres initialization failed after all retries:", lastError);
  throw lastError;
}

async function closeDatabases() {
  try {
    await Promise.all([closePool(), closePgPool(), closeSSHTunnel()]);
  } catch (err) {
    console.error("⚠️ Error closing database connections:", err);
  }
}

// Import CommonJS app module
const app = require("./src/app.js");

const server = app.listen(port, async () => {
      try {
        // Initialize SSH tunnel first (if SSH_HOST is configured)
        // Make it optional - don't fail server startup if SSH is unavailable
        if (process.env.SSH_HOST) {
          console.log("🔐 Initializing SSH tunnel for all services...");
          try {
            await initSSHTunnel();
            // Wait longer for tunnels to be fully established and ready
            console.log("⏳ Waiting for tunnels to stabilize...");
            await new Promise(resolve => setTimeout(resolve, 8000)); // Increased wait time
            console.log("✅ SSH tunnel established successfully");
            // Reset PostgreSQL pool to use tunnel
            resetPool();
            console.log("🔄 PostgreSQL pool reset to use tunnel");
          } catch (sshErr) {
            console.warn("⚠️ SSH tunnel initialization failed, continuing without tunnel:", sshErr.message);
            console.warn("⚠️ Databases will attempt direct connection if configured");
          }
        }
        
        // Then initialize all database connections
        // Initialize Oracle first, then PostgreSQL connections
        await initPool();
        
        // Additional delay to ensure tunnel is fully ready for PostgreSQL connections
        await new Promise(resolve => setTimeout(resolve, 3000)); // Increased wait time
        
        // Initialize PostgreSQL connections sequentially to avoid overwhelming the tunnel
        // Make them optional - don't fail server startup if PostgreSQL is unavailable
        console.log("📡 Connecting to PostgreSQL databases...");
        
        try {
          await ensurePostgresConnection();
        } catch (pgErr) {
          console.warn("⚠️ PostgreSQL connection failed, continuing without it:", pgErr.message);
        }
        
        try {
          await new Promise(resolve => setTimeout(resolve, 1000));
          await connectDatabase();
          console.log("✅ Main database (batchcode/lead-to-order) connection established");
        } catch (dbErr) {
          console.error("❌ Main database connection failed:", dbErr.message);
          console.error("⚠️ Batchcode and lead-to-order modules may not work without database connection");
          console.error("⚠️ Check your .env file - ensure PG_HOST, PG_USER, PG_PASSWORD, PG_DATABASE are set correctly");
          // Don't exit - let it try to initialize on-demand with getPool()
        }
        
        try {
          await new Promise(resolve => setTimeout(resolve, 1000));
          await connectAuthDatabase();
        } catch (authErr) {
          console.warn("⚠️ Auth database connection failed, continuing without it:", authErr.message);
        }
        console.log(`🚀 Server running at http://localhost:${port}`);
      } catch (err) {
        console.error("❌ Failed to start server:", err);
        await closeDatabases();
        process.exit(1);
      }
    });

const handleSignal = (signal) => async () => {
  console.log(`⚠️ ${signal} received, shutting down...`);
  await closeDatabases();
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
};

process.on("SIGTERM", handleSignal("SIGTERM"));
process.on("SIGINT", handleSignal("SIGINT"));


