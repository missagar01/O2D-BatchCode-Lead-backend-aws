// services/followupform.service.js
const pool = require("../config/db.js");

/**
 * Fetch dropdown values from fms_leads + dropdown table
 */
const getFollowupDropdowns = async () => {
  try {
    const customerSay = await pool.query(`
      SELECT DISTINCT what_did_customer_say AS value
      FROM dropdown
      WHERE what_did_customer_say IS NOT NULL AND what_did_customer_say <> ''
    `);

    const enquiryApproach = await pool.query(`
      SELECT DISTINCT enquiry_approach AS value
      FROM dropdown
      WHERE enquiry_approach IS NOT NULL AND enquiry_approach <> ''
    `);

    const productCategories = await pool.query(`
      SELECT DISTINCT item_name AS value
      FROM dropdown
      WHERE item_name IS NOT NULL AND item_name <> ''
    `);

    return {
      success: true,
      data: {
        customerSay: customerSay.rows.map(r => r.value),
        enquiryApproach: enquiryApproach.rows.map(r => r.value),
        productCategories: productCategories.rows.map(r => r.value)
      }
    };
  } catch (err) {
    console.log("Dropdown Fetch Error:", err);
    return { success: false, message: err.message };
  }
};

module.exports = {
  getFollowupDropdowns
};
