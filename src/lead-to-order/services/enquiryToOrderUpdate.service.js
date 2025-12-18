// services/enquiryToOrderUpdate.service.js

const pool = require("../config/db.js");

const updateEnquiryToOrderFromTracker = async (enquiryNo, data) => {
  try {

    const updateQuery = `
      UPDATE enquiry_to_order
      SET 
        enquiry_status = COALESCE($1, enquiry_status),
        what_did_customer_say = COALESCE($2, what_did_customer_say),
        current_stage = COALESCE($3, current_stage),
        followup_status = COALESCE($4, followup_status),
        next_call_date = COALESCE($5, next_call_date),
        next_call_time = COALESCE($6, next_call_time),
        acceptance_via = COALESCE($7, acceptance_via),
        payment_mode = COALESCE($8, payment_mode),
        payment_terms_days = COALESCE($9, payment_terms_days),
        transport_mode = COALESCE($10, transport_mode),
        po_number = COALESCE($11, po_number),
        remark = COALESCE($12, remark),
        if_no_relevant_reason_status = COALESCE($13, if_no_relevant_reason_status),
        if_no_relevant_reason_remark = COALESCE($14, if_no_relevant_reason_remark),
        customer_order_hold_reason_category = COALESCE($15, customer_order_hold_reason_category),
        holding_date = COALESCE($16, holding_date),
        hold_remark = COALESCE($17, hold_remark),
        sales_coordinator_name = COALESCE($18, sales_coordinator_name)
      ${
        data.is_order_received_status === "yes"
          ? ", actual = NOW()"     // ⭐ Only set on first success
          : ""
      }
      WHERE en_enquiry_no = $19
      RETURNING *;
    `;

    const values = [
      data.enquiry_status,
      data.what_did_customer_say,
      data.current_stage,
      data.followup_status,
      data.next_call_date,
      data.next_call_time,
      data.acceptance_via,
      data.payment_mode,
      data.payment_terms_in_days,
      data.transport_mode,
      data.po_number,
      data.remark,
      data.if_no_relevant_reason_status,
      data.if_no_relevant_reason_remark,
      data.customer_order_hold_reason_category,
      data.holding_date,
      data.hold_remark,
      data.sales_cordinator,
      enquiryNo
    ];

    const result = await pool.query(updateQuery, values);
    return result.rows[0];

  } catch (error) {
    console.error("❌ Error updating enquiry_to_order:", error.message);
    throw error;
  }
};

module.exports = {
  updateEnquiryToOrderFromTracker
};
