const pool = require("../config/db.js");

const updateFmsLeadsFromTracker = async (enquiryNo, data) => {
  const query = `
    UPDATE fms_leads
    SET 
      enquiry_status = COALESCE($1, enquiry_status),
      customer_say = COALESCE($2, customer_say),
      current_stage = COALESCE($3, current_stage),

      followup_status = COALESCE($4, followup_status),
      followup_next_call_date = COALESCE($5, followup_next_call_date),
      followup_next_call_time = COALESCE($6, followup_next_call_time),

      is_order_received = COALESCE($7, is_order_received),

      acceptance_via = COALESCE($8, acceptance_via),
      payment_mode = COALESCE($9, payment_mode),
      payment_terms_days = COALESCE($10, payment_terms_days),
      transport_mode = COALESCE($11, transport_mode),

      remark = COALESCE($12, remark),

      not_received_reason_status = COALESCE($13, not_received_reason_status),
      not_received_reason_remark = COALESCE($14, not_received_reason_remark),

      customer_order_hold_category = COALESCE($15, customer_order_hold_category),
      hold_date = COALESCE($16, hold_date),
      hold_remark = COALESCE($17, hold_remark),

      actual1 = CASE 
                  WHEN $7 = 'yes' THEN CURRENT_DATE
                  ELSE actual1
                END

    WHERE lead_no = $18
    RETURNING *;
  `;

  const values = [
    data.enquiry_status,
    data.what_did_customer_say,
    data.current_stage,

    data.followup_status,
    data.next_call_date,
    data.next_call_time,

    data.is_order_received_status,

    data.acceptance_via,
    data.payment_mode,
    data.payment_terms_in_days,
    data.transport_mode,

    data.remark,

    data.if_no_relevant_reason_status,
    data.if_no_relevant_reason_remark,

    data.customer_order_hold_reason_category,
    data.holding_date,
    data.hold_remark,

    enquiryNo
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

module.exports = {
  updateFmsLeadsFromTracker
};

