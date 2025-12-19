const { Router } = require("express");
const {
  fetchPendingFirstWeight,
  fetchFirstWeightHistory,
} = require("../controllers/firstWeight.controller.js");
const asyncHandler = require("../utils/asyncHandler.js");

const router = Router();

router.get("/pending", asyncHandler(fetchPendingFirstWeight));
router.get("/history", asyncHandler(fetchFirstWeightHistory));

module.exports = router;
