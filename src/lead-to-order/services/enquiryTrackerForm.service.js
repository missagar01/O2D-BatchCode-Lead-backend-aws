const pool = require("../config/db.js");

const insertEnquiryTracker = async (data) => {
  const query = `
    INSERT INTO enquiry_tracker (
      enquiry_no,                         -- 1
      enquiry_status,                     -- 2
      what_did_customer_say,              -- 3
      current_stage,                      -- 4

      followup_status,                    -- 5
      next_call_date,                     -- 6
      next_call_time,                     -- 7

      is_order_received_status,           -- 8
      acceptance_via,                     -- 9
      payment_mode,                       --10
      payment_terms_in_days,              --11
      transport_mode,                     --12
      remark,                             --13

      if_no_relevant_reason_status,       --14
      if_no_relevant_reason_remark,       --15

      customer_order_hold_reason_category,--16
      holding_date,                       --17
      hold_remark,                        --18

      sales_cordinator,                   --19
      calling_days,                       --20
      party_name,                         --21
      sales_person_name                   --22
    )
    VALUES (
      $1,$2,$3,$4,$5,$6,$7,
      $8,$9,$10,$11,$12,$13,
      $14,$15,$16,$17,$18,
      $19,$20,$21,$22
    )
    RETURNING *;
  `;

  const values = [
    data.enquiry_no,                        // 1
    data.enquiry_status,                    // 2
    data.what_did_customer_say,             // 3
    data.current_stage,                     // 4

    data.followup_status,                   // 5
    data.next_call_date,                    // 6
    data.next_call_time,                    // 7

    data.is_order_received_status,          // 8
    data.acceptance_via,                    // 9
    data.payment_mode,                      //10
    data.payment_terms_in_days,             //11
    data.transport_mode,                    //12
    data.remark,                            //13

    data.if_no_relevant_reason_status,      //14
    data.if_no_relevant_reason_remark,      //15

    data.customer_order_hold_reason_category,//16
    data.holding_date,                      //17
    data.hold_remark,                       //18

    data.sales_cordinator,                  //19
    data.calling_days,                      //20
    data.party_name,                        //21
    data.sales_person_name                  //22
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

module.exports = {
  insertEnquiryTracker
};

