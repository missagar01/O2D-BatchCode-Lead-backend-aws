const { Router } = require("express");
const {
  fetchPendingFirstWeight,
  fetchFirstWeightHistory,
} = require("../controllers/firstWeight.controller.js");

const router = Router();

router.get("/pending", fetchPendingFirstWeight);
router.get("/history", fetchFirstWeightHistory);

module.exports = router;
