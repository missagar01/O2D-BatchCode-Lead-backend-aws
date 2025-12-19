const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");

const sharedAuthRoutes = require("./auth/routes/login.routes.js");
const rootRoutes = require("./routes/root.routes.js");
const batchcodeApp = require("./batchcode/app.cjs");
const leadToOrderRoutes = require("./lead-to-order/routes/index.js");
const o2dRoutes = require("./o2d/routes/index.js");

const corsOriginsEnv = process.env.CORS_ORIGINS;
const corsOrigins = corsOriginsEnv
  ? corsOriginsEnv.split(",").map((origin) => origin.trim()).filter(Boolean)
  : ["*"];

// Log CORS configuration on startup
console.log('🔒 CORS Configuration:', {
  enabled: true,
  allowedOrigins: corsOrigins.includes("*") ? "ALL (*)" : corsOrigins,
  credentials: true
});

// CORS configuration - simplified and explicit
const corsOptions = corsOrigins.includes("*")
  ? { 
      origin: true, // Allow all origins
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
      exposedHeaders: ['Content-Range', 'X-Content-Range'],
      preflightContinue: false,
      optionsSuccessStatus: 204
    }
  : { 
      origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, Postman, curl)
        if (!origin) {
          return callback(null, true);
        }
        // Check if origin is in allowed list
        if (corsOrigins.includes(origin)) {
          callback(null, true);
        } else {
          console.warn(`CORS: Origin ${origin} not allowed. Allowed origins: ${corsOrigins.join(', ')}`);
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
      exposedHeaders: ['Content-Range', 'X-Content-Range'],
      preflightContinue: false,
      optionsSuccessStatus: 204
    };

const apiRouter = express.Router();
apiRouter.use("/o2d", o2dRoutes);
apiRouter.use("/lead-to-order", leadToOrderRoutes);
apiRouter.use("/batchcode", batchcodeApp);
apiRouter.use("/auth", sharedAuthRoutes);

const app = express();
app.set("trust proxy", 1);

// CORS must be applied FIRST, before any other middleware
app.use(cors(corsOptions));

// Configure helmet to work with CORS (must come after CORS)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}));

app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", apiRouter);

// Root routes (non-/api routes)
app.use("/", rootRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

module.exports = app;
