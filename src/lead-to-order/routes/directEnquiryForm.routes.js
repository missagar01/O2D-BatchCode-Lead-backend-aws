const express = require("express");
const { createEnquiryToOrder } = require("../controllers/directEnquiryForm.controller.js");

const router = express.Router();

router.post("/", createEnquiryToOrder);

module.exports = router;
