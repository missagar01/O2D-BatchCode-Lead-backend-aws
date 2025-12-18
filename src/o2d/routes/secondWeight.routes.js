const { Router } = require("express");
const {
  fetchPendingSecondWeight,
  fetchSecondWeightHistory,
} = require("../controllers/secondWeight.controller.js");

const router = Router();

router.get("/pending", fetchPendingSecondWeight);
router.get("/history", fetchSecondWeightHistory);

module.exports = router;

