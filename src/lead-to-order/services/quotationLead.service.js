const pool = require("../config/db.js");

const getLeadNumbers = async () => {
  try {
    // Get ALL lead numbers from FMS leads (no filtering)
    const fmsQuery = `
      SELECT 
        lead_no,
        company_name,
        location,
        state,
        salesperson_name,
        phone_number,
        item_qty,
        planned1,
        actual1
      FROM fms_leads 
      WHERE lead_no IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 100
    `;

    // Get ALL lead numbers from enquiry_to_order (no filtering)
    // REMOVED: state column since enquiry_to_order doesn't have it
    const enquiryQuery = `
      SELECT 
        en_enquiry_no as lead_no,
        company_name,
        location,
        sales_person_name,
        phone_number,
        item_qty,
        planned,
        actual
      FROM enquiry_to_order 
      WHERE en_enquiry_no IS NOT NULL
      ORDER BY timestamp DESC
      LIMIT 100
    `;

    const [fmsResult, enquiryResult] = await Promise.all([
      pool.query(fmsQuery),
      pool.query(enquiryQuery)
    ]);

    const leadNumbers = [];
    const leadDataMap = {};

    // Process FMS leads
    fmsResult.rows.forEach(row => {
      if (row.lead_no && !leadDataMap[row.lead_no]) {
        leadNumbers.push(row.lead_no);
        leadDataMap[row.lead_no] = {
          sheet: "FMS",
          company_name: row.company_name || "",
          address: row.location || "",
          state: row.state || "",  // FMS has state
          salesperson_name: row.salesperson_name || "",
          phone_number: row.phone_number || "",
          item_qty: row.item_qty || "",
          planned1: row.planned1,
          actual1: row.actual1,
          rowData: row
        };
      }
    });

    // Process Enquiry leads
    enquiryResult.rows.forEach(row => {
      if (row.lead_no && !leadDataMap[row.lead_no]) {
        leadNumbers.push(row.lead_no);
        leadDataMap[row.lead_no] = {
          sheet: "ENQUIRY",
          company_name: row.company_name || "",
          address: row.location || "",
          state: "",  // ENQUIRY doesn't have state - leave empty
          sales_person_name: row.sales_person_name || "",
          phone_number: row.phone_number || "",
          item_qty: row.item_qty || "",
          planned: row.planned,
          actual: row.actual,
          rowData: row
        };
      }
    });

    return {
      success: true,
      leadNumbers: leadNumbers.sort(),
      leadData: leadDataMap
    };

  } catch (error) {
    console.error("Error fetching lead numbers:", error);
    throw error;
  }
};

const getLeadDetails = async (leadNo) => {
  try {
    // Try FMS leads first (no filtering)
    const fmsQuery = `
      SELECT * FROM fms_leads 
      WHERE lead_no = $1
    `;

    const fmsResult = await pool.query(fmsQuery, [leadNo]);

    if (fmsResult.rows.length > 0) {
      return {
        success: true,
        data: fmsResult.rows[0],
        sheet: "FMS"
      };
    }

    // Try enquiry_to_order if not found in FMS (no filtering)
    const enquiryQuery = `
      SELECT * FROM enquiry_to_order 
      WHERE en_enquiry_no = $1
    `;

    const enquiryResult = await pool.query(enquiryQuery, [leadNo]);

    if (enquiryResult.rows.length > 0) {
      return {
        success: true,
        data: enquiryResult.rows[0],
        sheet: "ENQUIRY"
      };
    }

    return {
      success: false,
      message: "Lead not found"
    };

  } catch (error) {
    console.error("Error fetching lead details:", error);
    throw error;
  }
};


// Add these functions to your existing quotationLead.service.js

const getQuotationNumbers = async () => {
  try {
    const query = `
      SELECT quotation_no 
      FROM make_quotation 
      WHERE quotation_no IS NOT NULL 
      ORDER BY timestamp DESC  -- Use 'timestamp' if that column exists
      LIMIT 100
    `;

    const result = await pool.query(query);
    const quotationNumbers = result.rows.map(row => row.quotation_no).filter(Boolean);

    return {
      success: true,
      quotationNumbers: quotationNumbers
    };

  } catch (error) {
    console.error("Error fetching quotation numbers:", error);
    throw error;
  }
};

const getQuotationDetails = async (quotationNo) => {
  try {
    const query = `
      SELECT * FROM make_quotation 
      WHERE quotation_no = $1
    `;

    const result = await pool.query(query, [quotationNo]);

    if (result.rows.length === 0) {
      return {
        success: false,
        message: "Quotation not found"
      };
    }

    const dbData = result.rows[0];
    console.log("Raw database data:", dbData); // Debug log
    
    // Map database column names to frontend field names
    const mappedData = {
      // Quotation basic info
      quotationNo: dbData.quotation_no,
      date: formatDateForFrontend(dbData.quotation_date), // Format date properly
      preparedBy: dbData.prepared_by,
      
      // Consignor details - CORRECTED MAPPING
      consignorState: dbData.consigner_state,
      consignorName: dbData.reference_name, // This is the correct field
      consignorAddress: dbData.consigner_address,
      consignorMobile: dbData.consigner_mobile,
      consignorPhone: dbData.consigner_phone,
      consignorGSTIN: dbData.consigner_gstin,
      consignorStateCode: dbData.consigner_state_code,
      
      // Consignee details
      consigneeName: dbData.company_name,
      consigneeAddress: dbData.consignee_address,
      shipTo: dbData.ship_to,
      consigneeState: dbData.consignee_state,
      consigneeContactName: dbData.contact_name,
      consigneeContactNo: dbData.contact_no,
      consigneeGSTIN: dbData.consignee_gstin,
      consigneeStateCode: dbData.consignee_state_code,
      msmeNumber: dbData.msme_no,
      
      // Terms and conditions
      validity: dbData.validity,
      paymentTerms: dbData.payment_terms,
      delivery: dbData.delivery,
      freight: dbData.freight,
      insurance: dbData.insurance,
      taxes: dbData.taxes,
      notes: dbData.notes ? [dbData.notes] : [""],
      
      // Bank details
      accountNo: dbData.account_no,
      bankName: dbData.bank_name,
      bankAddress: dbData.bank_address,
      ifscCode: dbData.ifsc_code,
      email: dbData.email,
      website: dbData.website,
      pan: dbData.pan,
      
      // Items
      items: parseItems(dbData.items),
      
      // Financials
      totalFlatDiscount: dbData.total_flat_discount || 0,
      specialDiscount: dbData.special_discount || 0,
      
      // GST rates (add defaults)
      cgstRate: 9,
      sgstRate: 9,
      igstRate: 18
    };

    console.log("Mapped data:", mappedData); // Debug log

    return {
      success: true,
      data: mappedData
    };

  } catch (error) {
    console.error("Error fetching quotation details:", error);
    throw error;
  }
};

// Helper function to parse items
const parseItems = (itemsData) => {
  if (!itemsData) return [];
  
  try {
    const items = typeof itemsData === 'string' ? JSON.parse(itemsData) : itemsData;
    
    return Array.isArray(items) ? items.map((item, index) => ({
      id: index + 1,
      code: item.code || "",
      name: item.name || "",
      description: item.description || "",
      gst: Number(item.gst) || 0,
      qty: Number(item.qty) || 0,
      units: item.units || "Nos",
      rate: Number(item.rate) || 0,
      discount: Number(item.discount) || 0,
      flatDiscount: Number(item.flatDiscount) || 0,
      amount: Number(item.amount) || 0
    })) : [];
  } catch (error) {
    console.error("Error parsing items:", error);
    return [];
  }
};

module.exports = {
  getLeadNumbers,
  getLeadDetails,
  getQuotationNumbers,
  getQuotationDetails
};

// Helper function to format date for frontend
const formatDateForFrontend = (dateString) => {
  if (!dateString) return new Date().toLocaleDateString('en-GB');
  
  try {
    // If date is in YYYY-MM-DD format, convert to DD/MM/YYYY
    if (dateString.includes('-')) {
      const [year, month, day] = dateString.split('-');
      return `${day}/${month}/${year}`;
    }
    return dateString;
  } catch (error) {
    console.error("Error formatting date:", error);
    return new Date().toLocaleDateString('en-GB');
  }
};
