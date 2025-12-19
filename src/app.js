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

// Default CORS origins for development and production
const defaultOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:5174",
  "https://o2d-batch-lead.sagartmt.com"
];

const corsOptions = corsOrigins.includes("*")
  ? { 
      origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        // Allow all origins if CORS_ORIGINS is "*"
        callback(null, true);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      exposedHeaders: ['Content-Range', 'X-Content-Range']
    }
  : { 
      origin: function (origin, callback) {
        // Allow requests with no origin
        if (!origin) return callback(null, true);
        // Check if origin is in allowed list
        if (corsOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      exposedHeaders: ['Content-Range', 'X-Content-Range']
    };

const apiRouter = express.Router();
apiRouter.use("/o2d", o2dRoutes);
apiRouter.use("/lead-to-order", leadToOrderRoutes);
apiRouter.use("/batchcode", batchcodeApp);
apiRouter.use("/auth", sharedAuthRoutes);

const app = express();
app.set("trust proxy", 1);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));
// Configure helmet to work with CORS
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}));
app.use(compression());

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
