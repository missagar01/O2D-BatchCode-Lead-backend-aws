// routes/dashboard.routes.js
const express = require("express");
const {
  getDashboardMetricsController,
  getDashboardChartsController
} = require("../controllers/dashboard.controller.js");

const router = express.Router();

// Get dashboard metrics
router.get("/metrics", getDashboardMetricsController);

// Get dashboard charts data
router.get("/charts", getDashboardChartsController);

module.exports = router;
