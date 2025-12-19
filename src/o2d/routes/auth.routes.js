const { Router } = require("express");
const { handleLogout } = require("../controllers/auth.controller.js");
const asyncHandler = require("../utils/asyncHandler.js");

const router = Router();

// Login removed - use /api/auth/login instead
// All user CRUD operations removed - use shared /api/auth/login for authentication
router.post("/logout", asyncHandler(handleLogout));

module.exports = router;
