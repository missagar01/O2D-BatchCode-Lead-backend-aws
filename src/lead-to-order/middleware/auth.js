const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token)
    return res.status(401).json({ error: "Not authorized. No token." });

  try {
    // Use same JWT_SECRET as shared login
    const jwtSecret = process.env.JWT_SECRET || "change-me";
    if (!jwtSecret || jwtSecret === "change-me") {
      console.warn("⚠️ JWT_SECRET not set or using default value");
    }
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded; // username, role
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid token" });
  }
}

module.exports = {
  authMiddleware
};
