const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { loginQuery } = require("../../../config/pg.js");

const JWT_SECRET = process.env.JWT_SECRET || "change-me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "30d";

const USER_SELECT = `
  SELECT 
    id,
    user_name,
    password,
    email_id,
    number,
    department,
    given_by,
    role,
    status,
    user_access,
    created_at
  FROM users
  WHERE TRIM(user_name) = $1
  LIMIT 1
`;

function signToken(user) {
  const payload = {
    id: user.id,
    username: user.user_name,
    role: user.role || 'user',
  };
  
  // Include user_access if available
  if (user.user_access) {
    payload.user_access = user.user_access;
  }
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function normalizePermissions(raw = null) {
  if (!raw) return { read: true, write: false, update: false, delete: false };
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return { read: true, write: false, update: false, delete: false };
    }
  }
  return raw;
}

async function login(req, res) {
  // Support both 'username' and 'user_name' in request body
  const username = req.body.username || req.body.user_name;
  const password = req.body.password;
  
  // Validate input
  if (!username || !password) {
    return res.status(400).json({ 
      success: false, 
      message: "username and password are required" 
    });
  }

  try {
    // Query user from login database (checklist-delegation)
    const result = await loginQuery(USER_SELECT, [username.trim()]);
    
    if (!result.rows || result.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid credentials" 
      });
    }

    const user = result.rows[0];
    const storedPassword = user.password || "";
    
    // Check if password is hashed (bcrypt) or plain text
    let passwordMatches = false;
    
    if (storedPassword.startsWith("$2a$") || storedPassword.startsWith("$2b$") || storedPassword.startsWith("$2y$")) {
      // Password is hashed with bcrypt
      try {
        passwordMatches = await bcrypt.compare(password, storedPassword);
      } catch (bcryptErr) {
        console.error("Bcrypt comparison error:", bcryptErr);
        passwordMatches = false;
      }
    } else {
      // Password is plain text
      passwordMatches = storedPassword === password;
      
      // Optional: Auto-hash plain text passwords if enabled
      if (passwordMatches && process.env.AUTO_HASH_PASSWORDS === "true") {
        try {
          const hashedPassword = await bcrypt.hash(password, 10);
          await loginQuery(
            "UPDATE users SET password = $1 WHERE id = $2",
            [hashedPassword, user.id]
          );
          console.log(`Password auto-hashed for user: ${user.user_name}`);
        } catch (hashErr) {
          console.error("Error auto-hashing password:", hashErr);
          // Continue with login even if hashing fails
        }
      }
    }

    if (!passwordMatches) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid credentials" 
      });
    }

    // Generate JWT token
    const token = signToken(user);

    // Return success response with user data
    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          user_name: user.user_name,
          username: user.user_name, // Alias for compatibility
          email_id: user.email_id || null,
          number: user.number || null,
          department: user.department || null,
          given_by: user.given_by || null,
          role: user.role || 'user',
          status: user.status || 'active',
          user_access: user.user_access || null,
          created_at: user.created_at || null,
        },
        token,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ 
      success: false, 
      message: "Login failed", 
      error: process.env.NODE_ENV === "development" ? err.message : "Internal server error"
    });
  }
}

module.exports = {
  login
};
