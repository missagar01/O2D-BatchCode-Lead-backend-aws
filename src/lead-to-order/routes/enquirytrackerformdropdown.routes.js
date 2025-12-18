const express = require("express");
const { fetchDropdown } = require("../controllers/enquirytrackerdropdown.controller.js");

const router = express.Router();

router.get("/:column", fetchDropdown);

module.exports = router;
