const { Router } = require("express");
const {
  fetchPendingGateOut,
  fetchGateOutHistory,
  fetchAllGateOutCustomers,
} = require("../controllers/gateOut.controller.js");
const asyncHandler = require("../utils/asyncHandler.js");

const router = Router();

router.get("/pending", asyncHandler(fetchPendingGateOut));
router.get("/history", asyncHandler(fetchGateOutHistory));
router.get("/customers", asyncHandler(fetchAllGateOutCustomers));

module.exports = router;
