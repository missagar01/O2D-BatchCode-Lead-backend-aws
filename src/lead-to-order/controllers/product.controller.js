const pool = require("../config/db.js");

const getProducts = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT item_code, item_name 
      FROM dropdown 
      ORDER BY item_code ASC;
    `);

    return res.json({
      success: true,
      products: result.rows,
    });

  } catch (error) {
    console.error("❌ Product fetch error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getProducts
};
