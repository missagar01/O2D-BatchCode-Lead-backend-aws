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

const corsOptions = corsOrigins.includes("*")
  ? { origin: true, credentials: true }
  : { origin: corsOrigins, credentials: true };

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
app.use(helmet());
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
