const { Router } = require("express");
const {
  fetchPendingInvoiceData,
  fetchInvoiceHistoryData,
} = require("../controllers/invoice.controller.js");
const asyncHandler = require("../utils/asyncHandler.js");

const router = Router();

router.get("/pending", asyncHandler(fetchPendingInvoiceData));
router.get("/history", asyncHandler(fetchInvoiceHistoryData));

module.exports = router;
