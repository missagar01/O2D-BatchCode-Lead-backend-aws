// controllers/callTrackerController.js
const pool = require("../config/db.js");

// ===============================
// 1) FETCH PENDING (FMS LEADS) - WITH USER FILTERING
// ===============================
const getPendingFMS = async (req, res) => {
  try {
    const user = req.user; // Get user from JWT middleware
    const isAdmin = user.userType === "admin";
    const username = user.username;

    let query;
    let params = [];

    if (isAdmin) {
      // Admin sees all pending FMS leads
      query = `
        SELECT *
        FROM fms_leads
        WHERE planned1 IS NOT NULL 
        AND actual1 IS NULL
        ORDER BY id DESC
      `;
    } else {
      // Regular user sees only their assigned leads
      query = `
        SELECT *
        FROM fms_leads
        WHERE planned1 IS NOT NULL 
        AND actual1 IS NULL
        AND (sc_name = $1 OR salesperson_name = $1)
        ORDER BY id DESC
      `;
      params = [username];
    }

    const result = await pool.query(query, params);
    return res.status(200).json({ 
      success: true, 
      data: result.rows,
      userType: user.userType,
      username: username
    });

  } catch (error) {
    console.error("🔥 getPendingFMS:", error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || "Failed to fetch pending FMS leads",
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// ===============================
// 2) FETCH HISTORY (ENQUIRY TRACKER) - WITH USER FILTERING
// ===============================
const getHistory = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: "Authentication required" 
      });
    }
    
    const user = req.user;
    const isAdmin = user.userType === "admin" || user.role === "admin";
    const username = user.username || user.user_name;

    let query;
    let params = [];

    if (isAdmin) {
      // Admin sees all history
      query = `
        SELECT *
        FROM enquiry_tracker
        ORDER BY id DESC
      `;
    } else {
      // Regular user sees only their related history
      query = `
        SELECT et.*
        FROM enquiry_tracker et
        INNER JOIN fms_leads fl 
          ON et.enquiry_no = fl.lead_no
        WHERE fl.sc_name = $1
        ORDER BY et.id DESC
      `;
      params = [username];
    }

    const result = await pool.query(query, params);
    
    return res.status(200).json({
      success: true,
      data: result.rows,
      userType: user.userType,
      username
    });

  } catch (error) {
    console.error("🔥 getHistory:", error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || "Failed to fetch enquiry history",
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};


// ===============================
// 3) FETCH DIRECT ENQUIRY PENDING - WITH USER FILTERING
// ===============================
const getDirectEnquiryPending = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: "Authentication required" 
      });
    }
    
    const user = req.user;
    const isAdmin = user.userType === "admin" || user.role === "admin";
    const username = user.username || user.user_name;

    let query;
    let params = [];

    if (isAdmin) {
      // Admin sees all direct enquiry pending
      query = `
        SELECT *
        FROM enquiry_to_order
        WHERE planned IS NOT NULL
        AND actual IS NULL
        ORDER BY id DESC
      `;
    } else {
      // Regular user sees only their direct enquiries
      // Assuming enquiry_to_order has a salesperson_name or similar field
      query = `
        SELECT *
        FROM enquiry_to_order
        WHERE planned IS NOT NULL
        AND actual IS NULL
        AND (sales_coordinator_name = $1 OR sales_coordinator_name = $1)
        ORDER BY id DESC
      `;
      params = [username];
    }

    const result = await pool.query(query, params);
    return res.status(200).json({ 
      success: true, 
      data: result.rows,
      userType: user.userType,
      username: username
    });

  } catch (error) {
    console.error("🔥 getDirectEnquiryPending:", error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || "Failed to fetch direct enquiry pending",
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// ===============================
// 4) OPTIONAL: FETCH SINGLE ENQUIRY (DETAIL VIEW) - WITH USER AUTHORIZATION
// ===============================
const getEnquiryById = async (req, res) => {
  try {
    const user = req.user;
    const { id, type } = req.params;

    let table = "fms_leads";
    if (type === "history") table = "enquiry_tracker";
    if (type === "direct") table = "enquiry_to_order";

    // First check if user has access to this enquiry
    let authQuery;
    let authParams = [id];
    
    if (user.userType !== "admin") {
      if (table === "fms_leads") {
        authQuery = `SELECT * FROM ${table} WHERE id=$1 AND (sc_name=$2 OR salesperson_name=$2)`;
        authParams.push(user.username);
      } else if (table === "enquiry_tracker") {
        authQuery = `
          SELECT et.* 
          FROM enquiry_tracker et
          INNER JOIN fms_leads fl ON et.enquiry_no = fl.lead_no
          WHERE et.id=$1 AND (fl.sc_name=$2 OR fl.salesperson_name=$2)
        `;
        authParams.push(user.username);
      } else if (table === "enquiry_to_order") {
        authQuery = `SELECT * FROM ${table} WHERE id=$1 AND (enquiry_receiver_name=$2 OR salesperson_name=$2)`;
        authParams.push(user.username);
      }
    } else {
      authQuery = `SELECT * FROM ${table} WHERE id=$1`;
    }

    const authResult = await pool.query(authQuery, authParams);

    if (authResult.rows.length === 0) {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied or enquiry not found" 
      });
    }

  return res.status(200).json({ 
    success: true, 
    data: authResult.rows[0],
    userType: user.userType
  });

} catch (error) {
  console.error("🔥 getEnquiryById:", error);
  return res.status(500).json({ success: false, message: error.message });
}
};

module.exports = {
  getPendingFMS,
  getHistory,
  getDirectEnquiryPending,
  getEnquiryById
};
