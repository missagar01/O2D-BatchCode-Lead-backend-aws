const { Router } = require("express");
const {
  fetchPendingGateOut,
  fetchGateOutHistory,
  fetchAllGateOutCustomers,
} = require("../controllers/gateOut.controller.js");

const router = Router();

router.get("/pending", fetchPendingGateOut);
router.get("/history", fetchGateOutHistory);
router.get("/customers", fetchAllGateOutCustomers);

module.exports = router;
