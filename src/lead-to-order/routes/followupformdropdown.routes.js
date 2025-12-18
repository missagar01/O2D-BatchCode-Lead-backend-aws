// routes/followupform.routes.js
const express = require("express");
const { fetchDropdowns } = require("../controllers/followupformdropdown.controller.js");

const router = express.Router();

// Mount at /follow-up/dropdowns and /followup/dropdowns
router.get("/dropdowns", fetchDropdowns);

module.exports = router;
