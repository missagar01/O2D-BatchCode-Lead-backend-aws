// // routes/callTrackerRoutes.js
// import express from "express";
// import {
//   getPendingFMS,
//   getHistory,
//   getDirectEnquiryPending,
//   getEnquiryById
// } from "../controllers/enquiryTracker.controller.js";

// const router = express.Router();

// router.get("/pending", getPendingFMS);
// router.get("/history", getHistory);
// router.get("/direct-pending", getDirectEnquiryPending);
// router.get("/view/:type/:id", getEnquiryById);

// export default router;



// routes/callTrackerRoutes.js
const express = require("express");
const {
  getPendingFMS,
  getHistory,
  getDirectEnquiryPending,
  getEnquiryById
} = require("../controllers/enquiryTracker.controller.js");
const { verifyToken } = require("../controllers/auth.controller.js"); // Import JWT middleware

const router = express.Router();

// Apply JWT middleware to all enquiry tracker routes
router.use(verifyToken);

// Routes
router.get("/pending", getPendingFMS);
router.get("/history", getHistory);
router.get("/direct-pending", getDirectEnquiryPending);
router.get("/view/:type/:id", getEnquiryById);

module.exports = router;
