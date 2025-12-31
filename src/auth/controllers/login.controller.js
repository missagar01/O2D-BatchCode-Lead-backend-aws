const jwt = require("jsonwebtoken");
const { loginQuery } = require("../../../config/pg.js");

const JWT_SECRET = process.env.JWT_SECRET || "change-me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "30d";

// Build USER_SELECT query dynamically to handle missing columns
async function buildUserSelectQuery() {
  try {
    // Check if given_by column exists
    const columnCheck = await loginQuery(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'users' 
      AND column_name IN ('given_by', 'status', 'user_status', 'number', 'department', 'user_access', 'page_access', 'system_access', 'remark', 'employee_id')
    `);
    
    const existingColumns = columnCheck.rows.map(r => r.column_name);
    const hasGivenBy = existingColumns.includes('given_by');
    const hasStatus = existingColumns.includes('status');
    const hasUserStatus = existingColumns.includes('user_status');
    
    let givenBySelect = hasGivenBy ? 'given_by,' : 'NULL as given_by,';
    let statusSelect = hasStatus && hasUserStatus 
      ? 'COALESCE(status, user_status, \'active\') as status, user_status,'
      : hasStatus 
        ? 'status, NULL as user_status,'
        : hasUserStatus
          ? 'COALESCE(user_status, \'active\') as status, user_status,'
          : '\'active\' as status, NULL as user_status,';
    
    return `
      SELECT 
        id,
        user_name,
        password,
        email_id,
        ${existingColumns.includes('number') ? 'number,' : 'NULL as number,'}
        ${existingColumns.includes('department') ? 'department,' : 'NULL as department,'}
        ${givenBySelect}
        role,
        ${statusSelect}
        ${existingColumns.includes('user_access') ? 'user_access,' : 'NULL as user_access,'}
        ${existingColumns.includes('page_access') ? 'page_access,' : 'NULL as page_access,'}
        ${existingColumns.includes('system_access') ? 'system_access,' : 'NULL as system_access,'}
        ${existingColumns.includes('remark') ? 'remark,' : 'NULL as remark,'}
        ${existingColumns.includes('employee_id') ? 'employee_id,' : 'NULL as employee_id,'}
        created_at
      FROM users
      WHERE TRIM(user_name) = $1
      LIMIT 1
    `;
  } catch (err) {
    console.error('Error building user select query, using fallback:', err);
    // Fallback query with minimal columns
    return `
      SELECT 
        id,
        user_name,
        password,
        email_id,
        NULL as number,
        NULL as department,
        NULL as given_by,
        role,
        COALESCE(status, user_status, 'active') as status,
        user_status,
        NULL as user_access,
        NULL as page_access,
        NULL as system_access,
        NULL as remark,
        NULL as employee_id,
        created_at
      FROM users
      WHERE TRIM(user_name) = $1
      LIMIT 1
    `;
  }
}

// Cache the query string
let cachedUserSelectQuery = null;

function signToken(user) {
  const payload = {
    id: user.id,
    username: user.user_name,
    user_name: user.user_name,
    role: user.role || 'user',
  };

  // Include user_access if available (not null and not empty)
  if (user.user_access && user.user_access !== 'NULL' && user.user_access.trim() !== '') {
    payload.user_access = user.user_access;
  }

  // Include page_access if available (not null and not empty)
  if (user.page_access && user.page_access !== 'NULL' && user.page_access.trim() !== '') {
    payload.page_access = user.page_access;
  }

  if (user.system_access && user.system_access !== 'NULL' && user.system_access.trim() !== '') {
    payload.system_access = user.system_access;
  }

  // Include employee_id if available (not null and not "NULL" string)
  if (user.employee_id && user.employee_id !== 'NULL' && user.employee_id.trim() !== '') {
    payload.employee_id = user.employee_id;
  }

  // Include email_id if available (not null and not "NULL" string)
  if (user.email_id && user.email_id !== 'NULL' && user.email_id.trim() !== '') {
    payload.email_id = user.email_id;
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
    // Build or use cached query
    if (!cachedUserSelectQuery) {
      cachedUserSelectQuery = await buildUserSelectQuery();
    }
    
    // Query user from login database
    const result = await loginQuery(cachedUserSelectQuery, [username.trim()]);
    
    if (!result.rows || result.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid credentials" 
      });
    }

    const user = result.rows[0];
    const storedPassword = user.password || "";
    
    // Normalize status field (support both status and user_status)
    if (!user.status && user.user_status) {
      user.status = user.user_status;
    }
    
    // Password comparison - plain text only (no hashing)
    const passwordMatches = storedPassword === password;

    if (!passwordMatches) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid credentials" 
      });
    }

    // Normalize values - convert "NULL" strings to actual null
    const normalizeValue = (value) => {
      if (value === null || value === undefined) return null;
      if (typeof value === 'string' && (value.toUpperCase() === 'NULL' || value.trim() === '')) return null;
      return value;
    };

    // Normalize user data
    const normalizedUser = {
      id: user.id,
      role: user.role || 'user',
      user_name: user.user_name,
      user_access: normalizeValue(user.user_access),
      page_access: normalizeValue(user.page_access),
      system_access: normalizeValue(user.system_access),
      employee_id: normalizeValue(user.employee_id),
      email_id: normalizeValue(user.email_id),
      // Additional fields for compatibility (optional)
      username: user.user_name, // Alias for compatibility
      status: user.status || user.user_status || 'active',
    };

    // Generate JWT token with normalized data
    const token = signToken(normalizedUser);

    // Return success response with user data
    // Include the requested fields: id, role, user_name, user_access, page_access, system_access, employee_id, email_id
    return res.status(200).json({
      success: true,
      data: {
        user: normalizedUser,
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

function logout(req, res) {
  // Stateless logout - simply acknowledge and allow frontend to clear tokens
  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
}

module.exports = {
  login,
  logout,
};
