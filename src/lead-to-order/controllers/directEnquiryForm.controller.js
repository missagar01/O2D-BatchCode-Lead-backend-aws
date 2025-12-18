const pool = require("../config/db.js");

// Convert dd/mm/yyyy → yyyy-mm-dd (if needed)
const convertDate = (d) => {
  if (!d) return null;
  const [day, month, year] = d.split("/");
  return `${year}-${month}-${day}`;
};

const createEnquiryToOrder = async (req, res) => {
  try {
    console.log("Incoming Request:", req.body);

    const {
      scName,                // from frontend → will go to sales_coordinator_name
      leadSource,
      companyName,
      phoneNumber,
      salesPersonName,
      location,
      emailAddress,
      enquiryReceiverName,
      enquiryDate,
      enquiryApproach,
      items
    } = req.body;

    // Convert enquiry date if needed
    const enquiryDateSQL = enquiryDate || null;

    // Convert items array to JSON
    const itemsJson = JSON.stringify(items || []);

    // ❗ IMPORTANT:
    // enquiry_no must be null so trigger generates EN-01, EN-02...
    const enquiryNo = null;

    const insertQuery = `
      INSERT INTO enquiry_to_order (
        en_enquiry_no,
        lead_source,
        company_name,
        phone_number,
        sales_person_name,
        location,
        email,
        enquiry_receiver_name,
        enquiry_date,
        enquiry_approach,
        item_qty,
        sales_coordinator_name
      )
      VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11, $12
      )
      RETURNING *;
    `;

    const values = [
      enquiryNo,            // ⭐ NULL → trigger generates EN-01
      leadSource,
      companyName,
      phoneNumber,
      salesPersonName,
      location,
      emailAddress,
      enquiryReceiverName,
      enquiryDateSQL,
      enquiryApproach,
      itemsJson,
      scName                // ⭐ SC Name → goes to sales_coordinator_name
    ];

    const result = await pool.query(insertQuery, values);

    return res.json({
      success: true,
      message: "Enquiry saved successfully",
      data: result.rows[0]
    });

  } catch (error) {
    console.error("❌ Insert error:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  createEnquiryToOrder
};
