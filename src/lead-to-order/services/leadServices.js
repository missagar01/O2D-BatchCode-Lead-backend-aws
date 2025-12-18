const pool = require("../config/db.js");

function generateLeadNoFromId(id) {
  return `LD-${String(id).padStart(3, "0")}`; // LD-001, LD-002 etc.
}

const createLead = async (leadData) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Insert basic data, get id
    const insertQuery = `
      INSERT INTO fms_leads (
        lead_receiver_name,
        lead_source,
        company_name,
        phone_number,
        salesperson_name,
        location,
        email_address,
        state,
        address,
        nob,
        additional_notes,
        sc_name
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING id, created_at;
    `;

    const values = [
      leadData.receiverName,
      leadData.source,
      leadData.companyName,
      leadData.phoneNumber,
      leadData.salespersonName,
      leadData.location,
      leadData.email,
      leadData.state,
      leadData.address,
      leadData.nob,
      leadData.notes,
      leadData.scName,
    ];

    const result = await client.query(insertQuery, values);
    const newId = result.rows[0].id;

    // 2. Generate lead_no from id
    const leadNo = generateLeadNoFromId(newId);

    await client.query(
      `UPDATE fms_leads SET lead_no = $1, updated_at = NOW() WHERE id = $2`,
      [leadNo, newId]
    );

    await client.query("COMMIT");

    return {
      id: newId,
      leadNo,
      createdAt: result.rows[0].created_at,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

module.exports = {
  createLead
};
