const express = require("express");
const { fetchLeadDropdowns } = require("../controllers/leadDropdown.controller.js");

const router = express.Router();

router.get("/", fetchLeadDropdowns);

module.exports = router;
