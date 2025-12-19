const { Router } = require("express");
const { fetchDashboardSummary } = require("../controllers/dashboard.controller.js");
const asyncHandler = require("../utils/asyncHandler.js");

const router = Router();

router.get("/summary", asyncHandler(fetchDashboardSummary));

module.exports = router;


