const { Router } = require("express");
const asyncHandler = require("../utils/asyncHandler.js");
const { fetchGateProcessTimeline } = require("../controllers/gateProcess.controller.js");

const router = Router();

router.get("/timeline", asyncHandler(fetchGateProcessTimeline));

module.exports = router;
