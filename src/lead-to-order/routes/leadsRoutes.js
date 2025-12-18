const express = require("express");
const { createLeadController } = require("../controllers/leadsController.js");

const router = express.Router();

// POST /api/leads
router.post("/", createLeadController);

module.exports = router;
