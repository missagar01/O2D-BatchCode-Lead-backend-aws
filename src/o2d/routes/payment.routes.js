const { Router } = require("express");
const {
  fetchPendingPayments,
  fetchPaymentHistory,
  fetchAllPaymentCustomers,
} = require("../controllers/payment.controller.js");

const router = Router();

router.get("/pending", fetchPendingPayments);
router.get("/history", fetchPaymentHistory);
router.get("/customers", fetchAllPaymentCustomers);

module.exports = router;
