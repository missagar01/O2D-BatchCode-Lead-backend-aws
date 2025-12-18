const express = require("express");
const {
  getUserData,
  createUser,
  verifyToken,
} = require("../controllers/auth.controller.js");

const router = express.Router();

// Login removed - use /api/auth/login instead

// Get user data route (protected)
router.get("/data", verifyToken, getUserData);

// Create user route (admin only)
router.post("/create-user", verifyToken, createUser);

// Verify token route (for frontend to check if token is valid)
router.post("/verify-token", verifyToken, (req, res) => {
  res.json({ 
    success: true, 
    user: req.user 
  });
});

module.exports = router;
