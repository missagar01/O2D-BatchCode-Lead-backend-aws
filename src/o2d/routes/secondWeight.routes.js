const { Router } = require("express");
const {
  fetchPendingSecondWeight,
  fetchSecondWeightHistory,
} = require("../controllers/secondWeight.controller.js");
const asyncHandler = require("../utils/asyncHandler.js");

const router = Router();

router.get("/pending", asyncHandler(fetchPendingSecondWeight));
router.get("/history", asyncHandler(fetchSecondWeightHistory));

module.exports = router;

