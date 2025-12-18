const { Router } = require("express");
const { fetchDashboardSummary } = require("../controllers/dashboard.controller.js");

const router = Router();

router.get("/summary", fetchDashboardSummary);

module.exports = router;


