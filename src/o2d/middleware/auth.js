const jwt = require("jsonwebtoken");

function getTokenFromHeader(req) {
  const header = req.headers.authorization || req.headers.Authorization;
  if (!header || typeof header !== "string") return null;
  const parts = header.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") return null;
  return parts[1];
}

function authenticate(req, res, next) {
  const token = getTokenFromHeader(req);
  if (!token) {
    return res.status(401).json({ success: false, message: "Authorization token missing" });
  }

  try {
    // Use same JWT_SECRET as shared login
    const jwtSecret = process.env.JWT_SECRET || "change-me";
    if (!jwtSecret || jwtSecret === "change-me") {
      console.warn("⚠️ JWT_SECRET not set or using default value");
    }
    const payload = jwt.verify(token, jwtSecret);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const role = (req.user.role || "").toString().toLowerCase();
  const allowed =
    role === "admin" ||
    role === "all access" ||
    role.includes("all access"); // for stored page-name lists containing "All Access"

  if (!allowed) {
    return res.status(403).json({ success: false, message: "Permission denied" });
  }

  return next();
}

module.exports = { authenticate, requireAdmin };
