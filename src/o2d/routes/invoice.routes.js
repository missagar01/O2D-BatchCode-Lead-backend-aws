const { Router } = require("express");
const {
  fetchPendingInvoiceData,
  fetchInvoiceHistoryData,
} = require("../controllers/invoice.controller.js");

const router = Router();

router.get("/pending", fetchPendingInvoiceData);
router.get("/history", fetchInvoiceHistoryData);

module.exports = router;
