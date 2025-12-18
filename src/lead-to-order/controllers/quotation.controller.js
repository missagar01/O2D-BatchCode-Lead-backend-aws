const pool = require("../config/db.js");
const { uploadToS3 } = require("../middleware/s3Upload.js");

const createQuotation = async (req, res) => {
  try {
    const {
      quotationNo,
      quotationDate,
      preparedBy,

      consignerState,
      referenceName,
      consignerAddress,
      consignerMobile,
      consignerPhone,
      consignerGstin,
      consignerStateCode,

      companyName,
      consigneeAddress,
      shipTo,
      consigneeState,
      contactName,
      contactNo,
      consigneeGstin,
      consigneeStateCode,
      msmeNo,

      validity,
      paymentTerms,
      delivery,
      freight,
      insurance,
      taxes,
      notes,

      accountNo,
      bankName,
      bankAddress,
      ifscCode,
      email,
      website,
      pan,

      items,        // JSON ARRAY
      pdfUrl,
      grandTotal
    } = req.body;

    const query = `
      INSERT INTO make_quotation (
        quotation_no, quotation_date, prepared_by,
        consigner_state, reference_name, consigner_address,
        consigner_mobile, consigner_phone, consigner_gstin, consigner_state_code,

        company_name, consignee_address, ship_to,
        consignee_state, contact_name, contact_no,
        consignee_gstin, consignee_state_code, msme_no,

        validity, payment_terms, delivery, freight,
        insurance, taxes, notes,

        account_no, bank_name, bank_address,
        ifsc_code, email, website, pan,

        items, pdf_url, grand_total
      )
      VALUES (
        $1,$2,$3,
        $4,$5,$6,$7,$8,$9,$10,
        $11,$12,$13,$14,$15,$16,$17,$18,$19,
        $20,$21,$22,$23,$24,$25,$26,
        $27,$28,$29,$30,$31,$32,$33,
        $34,$35,$36
      )
      RETURNING *;
    `;

    const values = [
      quotationNo,
      quotationDate,
      preparedBy,

      consignerState,
      referenceName,
      consignerAddress,
      consignerMobile,
      consignerPhone,
      consignerGstin,
      consignerStateCode,

      companyName,
      consigneeAddress,
      shipTo,
      consigneeState,
      contactName,
      contactNo,
      consigneeGstin,
      consigneeStateCode,
      msmeNo,

      validity,
      paymentTerms,
      delivery,
      freight,
      insurance,
      taxes,
      notes,

      accountNo,
      bankName,
      bankAddress,
      ifscCode,
      email,
      website,
      pan,

      JSON.stringify(items),  // 🔥 JSONB ARRAY
      pdfUrl,
      grandTotal
    ];

    const result = await pool.query(query, values);

    res.status(201).json({
      success: true,
      message: "Quotation saved successfully",
      data: result.rows[0]
    });

  } catch (error) {
    console.error("❌ Error creating quotation:", error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};



const getQuotationByNo = async (req, res) => {
  try {
    const { quotationNo } = req.params;

    const result = await pool.query(
      `SELECT * FROM make_quotation WHERE quotation_no=$1`,
      [quotationNo]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Not found" });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


const getNextQuotationNumber = async (req, res) => {
  try {
    const query = `
      SELECT quotation_no
      FROM make_quotation
      ORDER BY id DESC
      LIMIT 1;
    `;

    const result = await pool.query(query);

    let nextNumber = "QN-001";

    if (result.rows.length > 0) {
      const lastNo = result.rows[0].quotation_no; // QN-023
      const num = parseInt(lastNo.split("-")[1]) + 1;
      nextNumber = `QN-${String(num).padStart(3, "0")}`;
    }

    res.json({ success: true, nextNumber });
  } catch (err) {
    console.error("❌ Error next quotation:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};




const clean = (arr) =>
  [...new Set(arr.filter(v => v !== null && v !== undefined && v !== ""))];

const getQuotationDropdowns = async (req, res) => {
  try {
    const query = `
      SELECT 
        lead_receiver_name,
        lead_source,
        sp_state,
        quotation_shared_by,
        enquiry_status,
        acceptance_via,
        payment_mode,
        not_received_reason_status,
        hold_reason_category,
        consignee_company_name,
        consignee_client_name,
        consignee_client_contact_no,
        consignee_billing_address,
        consignee_state,
        consignee_gstin_uin,
        consignee_state_code,
        sp_name,
        reference_contact_no1,
        sp_state,
        sp_state_code,
        sp_pan,
        consignor_bank_details,
        consignor_state_code,
        consignor_gstin,
        consignor_msme_no,
        lead_assign_to,
        requirement_product_category,
        sales_coordinator_name,
        nob,
        enquiry_approach,
        requirement_product_category_codes,
        live_company_name,
        live_person_name,
        live_mobile,
        live_email_address,
        live_address,
        live_sc_name,
        live_source,
        direct_company_name,
        direct_client_name,
        direct_client_contact_no,
        direct_state,
        direct_billing_address,
        item_code,
        item_category,
        item_name,
        payment_terms_days,
        transport_mode,
        freight_type,
        payment_terms,
        enquiry_receiver_name,
        enquiry_assign_to,
        rate,
        description,
        prepared_by,
        followup_status,
        reference_phone_no_2,
        what_did_customer_say
      FROM dropdown;
    `;

    const result = await pool.query(query);
    const rows = result.rows;

    const dropdowns = {
      lead_receiver_name: clean(rows.map(r => r.lead_receiver_name)),
      lead_source: clean(rows.map(r => r.lead_source)),
      state: clean(rows.map(r => r.sp_state)),
      quotation_shared_by: clean(rows.map(r => r.quotation_shared_by)),
      enquiry_status: clean(rows.map(r => r.enquiry_status)),
      acceptance_via: clean(rows.map(r => r.acceptance_via)),
      payment_mode: clean(rows.map(r => r.payment_mode)),
      not_received_reason_status: clean(rows.map(r => r.not_received_reason_status)),
      hold_reason_category: clean(rows.map(r => r.hold_reason_category)),
      consignee_company_name: clean(rows.map(r => r.consignee_company_name)),
      consignee_client_name: clean(rows.map(r => r.consignee_client_name)),
      consignee_client_contact_no: clean(rows.map(r => r.consignee_client_contact_no)),
      consignee_billing_address: clean(rows.map(r => r.consignee_billing_address)),
      consignee_state: clean(rows.map(r => r.consignee_state)),
      consignee_gstin_uin: clean(rows.map(r => r.consignee_gstin_uin)),
      consignee_state_code: clean(rows.map(r => r.consignee_state_code)),
      sp_name: clean(rows.map(r => r.sp_name)),
      reference_contact_no1: clean(rows.map(r => r.reference_contact_no1)),
      sp_state: clean(rows.map(r => r.sp_state)),
      sp_state_code: clean(rows.map(r => r.sp_state_code)),
      sp_pan: clean(rows.map(r => r.sp_pan)),
      consignor_bank_details: clean(rows.map(r => r.consignor_bank_details)),
      consignor_state_code: clean(rows.map(r => r.consignor_state_code)),
      consignor_gstin: clean(rows.map(r => r.consignor_gstin)),
      consignor_msme_no: clean(rows.map(r => r.consignor_msme_no)),
      lead_assign_to: clean(rows.map(r => r.lead_assign_to)),
      requirement_product_category: clean(rows.map(r => r.requirement_product_category)),
      sales_coordinator_name: clean(rows.map(r => r.sales_coordinator_name)),
      nob: clean(rows.map(r => r.nob)),
      enquiry_approach: clean(rows.map(r => r.enquiry_approach)),
      requirement_product_category_codes: clean(rows.map(r => r.requirement_product_category_codes)),
      live_company_name: clean(rows.map(r => r.live_company_name)),
      live_person_name: clean(rows.map(r => r.live_person_name)),
      live_mobile: clean(rows.map(r => r.live_mobile)),
      live_email_address: clean(rows.map(r => r.live_email_address)),
      live_address: clean(rows.map(r => r.live_address)),
      live_sc_name: clean(rows.map(r => r.live_sc_name)),
      live_source: clean(rows.map(r => r.live_source)),
      direct_company_name: clean(rows.map(r => r.direct_company_name)),
      direct_client_name: clean(rows.map(r => r.direct_client_name)),
      direct_client_contact_no: clean(rows.map(r => r.direct_client_contact_no)),
      direct_state: clean(rows.map(r => r.direct_state)),
      direct_billing_address: clean(rows.map(r => r.direct_billing_address)),
      item_code: clean(rows.map(r => r.item_code)),
      item_category: clean(rows.map(r => r.item_category)),
      item_name: clean(rows.map(r => r.item_name)),
      payment_terms_days: clean(rows.map(r => r.payment_terms_days)),
      transport_mode: clean(rows.map(r => r.transport_mode)),
      freight_type: clean(rows.map(r => r.freight_type)),
      payment_terms: clean(rows.map(r => r.payment_terms)),
      enquiry_receiver_name: clean(rows.map(r => r.enquiry_receiver_name)),
      enquiry_assign_to: clean(rows.map(r => r.enquiry_assign_to)),
      rate: clean(rows.map(r => r.rate)),
      description: clean(rows.map(r => r.description)),
      prepared_by: clean(rows.map(r => r.prepared_by)),
      followup_status: clean(rows.map(r => r.followup_status)),
      reference_phone_no_2: clean(rows.map(r => r.reference_phone_no_2)),
      what_did_customer_say: clean(rows.map(r => r.what_did_customer_say))
    };

    return res.json({ success: true, dropdowns });

  } catch (err) {
    console.error("❌ Dropdown error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};


const uploadPdfToS3 = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No PDF file uploaded",
      });
    }

    const fileUrl = await uploadToS3(req.file);

    res.json({
      success: true,
      url: fileUrl,  // send S3 URL to frontend
    });
  } catch (error) {
    console.error("❌ Error uploading PDF:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createQuotation,
  getQuotationByNo,
  getNextQuotationNumber,
  getQuotationDropdowns,
  uploadPdfToS3
};
