// import express from "express";
// import { getPendingFollowups, getHistoryFollowups, submitFollowUp } from "../controllers/followup.controller.js";

// const router = express.Router();

// router.get("/pending", getPendingFollowups);
// router.get("/history", getHistoryFollowups);
// router.post("/followup", submitFollowUp);

// export default router;


const express = require("express");
const { 
  getPendingFollowups, 
  getHistoryFollowups, 
  submitFollowUp 
} = require("../controllers/followup.controller.js");
const { verifyToken } = require("../controllers/auth.controller.js"); // Import JWT middleware

const router = express.Router();

// Apply JWT middleware to all routes
router.use(verifyToken);

// Routes
router.get("/pending", getPendingFollowups);
router.get("/history", getHistoryFollowups);
router.post("/followup", submitFollowUp);

module.exports = router;
