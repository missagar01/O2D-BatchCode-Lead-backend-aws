const express = require("express");
const { fetchDropdownData } = require("../controllers/direcrtEnquiryFormDropdown.controller.js");

const router = express.Router();

// router.get("/dropdowns", fetchDropdownData);
router.get("/", fetchDropdownData);

module.exports = router;
