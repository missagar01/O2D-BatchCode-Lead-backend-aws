const express = require("express");
const {
  getLeadNumbersController,
  getLeadDetailsController,
  getQuotationNumbersController,
  getQuotationDetailsController
} = require("../controllers/quotationLead.controller.js");

const router = express.Router();

// Get all lead numbers for dropdown
router.get("/lead-numbers", getLeadNumbersController);

// Get specific lead details
router.get("/lead-details/:leadNo", getLeadDetailsController);

router.get("/quotation-numbers", getQuotationNumbersController);

// Get specific quotation details
router.get("/quotation-details/:quotationNo", getQuotationDetailsController);

module.exports = router;
