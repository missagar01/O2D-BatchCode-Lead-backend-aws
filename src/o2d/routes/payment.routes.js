const { Router } = require("express");
const {
  fetchPendingPayments,
  fetchPaymentHistory,
  fetchAllPaymentCustomers,
} = require("../controllers/payment.controller.js");
const asyncHandler = require("../utils/asyncHandler.js");

const router = Router();

router.get("/pending", asyncHandler(fetchPendingPayments));
router.get("/history", asyncHandler(fetchPaymentHistory));
router.get("/customers", asyncHandler(fetchAllPaymentCustomers));

module.exports = router;
