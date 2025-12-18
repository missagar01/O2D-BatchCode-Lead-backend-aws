const express = require("express");
const { createEnquiryTracker } = require("../controllers/enquiryTrackerForm.controller.js");

const router = express.Router();

// POST → Save any stage (order-expected, order-status, etc.)
router.post("/", createEnquiryTracker);

module.exports = router;
