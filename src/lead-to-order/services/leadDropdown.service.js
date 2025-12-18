// services/leadDropdown.service.js
const pool = require("../config/db.js");

const getLeadFormDropdowns = async () => {
  try {
    // BASIC DROPDOWNS - Get receiver names from both columns
    const receiverNames = await pool.query(`
      SELECT DISTINCT lead_receiver_name AS receiver_name
      FROM dropdown 
      WHERE lead_receiver_name IS NOT NULL AND lead_receiver_name <> ''
      UNION
      SELECT DISTINCT enquiry_receiver_name AS receiver_name
      FROM dropdown 
      WHERE enquiry_receiver_name IS NOT NULL AND enquiry_receiver_name <> ''
    `);

    // Get SC Names from sales_coordinator_name (used in fms_leads and enquiry_to_order)
    const scNames = await pool.query(`
      SELECT DISTINCT sales_coordinator_name AS sc_name
      FROM dropdown
      WHERE sales_coordinator_name IS NOT NULL AND sales_coordinator_name <> ''
      UNION
      SELECT DISTINCT live_sc_name AS sc_name
      FROM dropdown
      WHERE live_sc_name IS NOT NULL AND live_sc_name <> ''
    `);

    const leadSources = await pool.query(`
      SELECT DISTINCT lead_source
      FROM dropdown
      WHERE lead_source IS NOT NULL AND lead_source <> ''
    `);

    const states = await pool.query(`
      SELECT DISTINCT state
      FROM dropdown
      WHERE state IS NOT NULL AND state <> ''
    `);

    const nob = await pool.query(`
      SELECT DISTINCT nob
      FROM dropdown
      WHERE nob IS NOT NULL AND nob <> ''
    `);

    // LIVE CLIENT DETAILS ONLY
    const companyListRaw = await pool.query(`
      SELECT DISTINCT
        live_company_name AS company_name,
        live_person_name AS contact_person,
        live_mobile AS phone_number,
        live_email_address AS email,
        live_address AS location
      FROM dropdown
      WHERE live_company_name IS NOT NULL AND live_company_name <> ''
    `);

    const companyList = companyListRaw.rows.reduce((map, row) => {
      if (!row.company_name) return map;

      map[row.company_name] = {
        salesPerson: row.contact_person || "",
        phoneNumber: row.phone_number || "",
        email: row.email || "",
        location: row.location || "",
      };

      return map;
    }, {});

    return {
      success: true,
      data: {
        receiverNames: receiverNames.rows.map(r => r.receiver_name).filter(Boolean),
        scNames: scNames.rows.map(r => r.sc_name).filter(Boolean),
        leadSources: leadSources.rows.map(r => r.lead_source).filter(Boolean),
        states: states.rows.map(r => r.state).filter(Boolean),
        nob: nob.rows.map(r => r.nob).filter(Boolean),
        companyList
      }
    };
  } catch (error) {
    console.error("Lead Dropdown Fetch Error:", error);
    return { success: false, message: error.message };
  }
};

module.exports = {
  getLeadFormDropdowns
};
