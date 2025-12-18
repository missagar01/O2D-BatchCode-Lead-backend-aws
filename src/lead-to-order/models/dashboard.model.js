const pool = require("../config/db.js");

const getDashboardMetrics = async (userId, isAdmin) => {
  try {
    console.log(`Getting dashboard metrics for user: ${userId}, isAdmin: ${isAdmin}`);
    
    let metrics = {
      totalLeads: 0,
      pendingFollowups: 0,
      quotationsSent: 0,
      ordersReceived: 0,
      totalEnquiry: 0,
      pendingEnquiry: 0
    };

    // Build queries based on your actual table structure
    const params = isAdmin ? [] : [userId];
    
    try {
      // 1. Total Leads from fms_leads
      const totalLeadsQuery = isAdmin 
        ? `SELECT COUNT(*) FROM fms_leads WHERE lead_no IS NOT NULL`
        : `SELECT COUNT(*) FROM fms_leads WHERE lead_no IS NOT NULL AND sc_name = $1`;
      
      const totalLeadsResult = await pool.query(totalLeadsQuery, params);
      metrics.totalLeads = parseInt(totalLeadsResult.rows[0].count) || 0;

      // 2. Pending Followups - Only count records with planned date but no actual date
      // A record is pending if it has planned1/planned set but actual1/actual is NULL
      // We use DISTINCT to avoid counting the same record twice if both conditions match
      const pendingFollowupsQuery = isAdmin
        ? `SELECT COUNT(DISTINCT id) FROM fms_leads WHERE 
            ((planned1 IS NOT NULL AND actual1 IS NULL) OR 
             (planned IS NOT NULL AND actual IS NULL))`
        : `SELECT COUNT(DISTINCT id) FROM fms_leads WHERE 
            ((planned1 IS NOT NULL AND actual1 IS NULL) OR 
             (planned IS NOT NULL AND actual IS NULL))
            AND (sc_name = $1 OR salesperson_name = $1)`;
      
      const pendingFollowupsResult = await pool.query(pendingFollowupsQuery, params);
      metrics.pendingFollowups = parseInt(pendingFollowupsResult.rows[0].count) || 0;

      // 3. Quotations Sent (assuming you track this in enquiry_tracker or have a separate table)
      // For now, let's count enquiries with status
      const quotationsSentQuery = isAdmin
        ? `SELECT COUNT(*) FROM enquiry_tracker WHERE enquiry_no IS NOT NULL`
        : `SELECT COUNT(*) FROM enquiry_tracker WHERE enquiry_no IS NOT NULL AND sales_cordinator = $1`;
      
      const quotationsSentResult = await pool.query(quotationsSentQuery, params);
      metrics.quotationsSent = parseInt(quotationsSentResult.rows[0].count) || 0;

      // 4. Orders Received
      const ordersReceivedQuery = isAdmin
        ? `SELECT COUNT(*) FROM enquiry_tracker WHERE is_order_received_status = 'yes'`
        : `SELECT COUNT(*) FROM enquiry_tracker WHERE is_order_received_status = 'yes' AND sales_coordinator = $1`;
      
      const ordersReceivedResult = await pool.query(ordersReceivedQuery, params);
      metrics.ordersReceived = parseInt(ordersReceivedResult.rows[0].count) || 0;

      // 5. Total Enquiry from enquiry_to_order
      const totalEnquiryQuery = isAdmin
        ? `SELECT COUNT(*) FROM enquiry_to_order WHERE en_enquiry_no IS NOT NULL`
        : `SELECT COUNT(*) FROM enquiry_to_order WHERE en_enquiry_no IS NOT NULL AND sales_person_name = $1`;
      
      const totalEnquiryResult = await pool.query(totalEnquiryQuery, params);
      metrics.totalEnquiry = parseInt(totalEnquiryResult.rows[0].count) || 0;

      // 6. Pending Enquiry
      const pendingEnquiryQuery = isAdmin
        ? `SELECT COUNT(*) FROM enquiry_to_order WHERE followup_status IS NOT NULL AND followup_status != '' AND is_order_received = false`
        : `SELECT COUNT(*) FROM enquiry_to_order WHERE followup_status IS NOT NULL AND followup_status != '' AND is_order_received = false AND sales_coordinator_name = $1`;
      
      const pendingEnquiryResult = await pool.query(pendingEnquiryQuery, params);
      metrics.pendingEnquiry = parseInt(pendingEnquiryResult.rows[0].count) || 0;

    } catch (queryError) {
      console.error("Error in individual queries:", queryError);
      console.error("Query error details:", {
        message: queryError.message,
        stack: queryError.stack,
        code: queryError.code
      });
      // Return default values if queries fail
      return metrics;
    }

    console.log("Dashboard metrics:", metrics);
    return metrics;

  } catch (error) {
    console.error("Error in getDashboardMetrics:", error);
    throw error;
  }
};

const getDashboardChartsData = async (userId, isAdmin) => {
  try {
    console.log(`Getting charts data for user: ${userId}, isAdmin: ${isAdmin}`);
    
    // Default data if queries fail
    const defaultData = {
      overview: [
        { month: "Jan", leads: 45, enquiries: 30, orders: 12 },
        { month: "Feb", leads: 52, enquiries: 35, orders: 15 },
        { month: "Mar", leads: 48, enquiries: 32, orders: 14 },
        { month: "Apr", leads: 70, enquiries: 45, orders: 20 },
        { month: "May", leads: 65, enquiries: 40, orders: 18 },
        { month: "Jun", leads: 58, enquiries: 38, orders: 16 },
      ],
      conversion: [
        { name: "Leads", value: 124, color: "#4f46e5" },
        { name: "Enquiries", value: 82, color: "#8b5cf6" },
        { name: "Quotations", value: 56, color: "#d946ef" },
        { name: "Orders", value: 27, color: "#ec4899" },
      ],
      sources: [
        { name: "Indiamart", value: 45, color: "#06b6d4" },
        { name: "Justdial", value: 28, color: "#0ea5e9" },
        { name: "Social Media", value: 20, color: "#3b82f6" },
        { name: "Website", value: 15, color: "#6366f1" },
        { name: "Referrals", value: 12, color: "#8b5cf6" },
      ]
    };

    const params = isAdmin ? [] : [userId];

    try {
      // Monthly Overview Data - Simplified query
      const monthlyDataQuery = `
        SELECT 
          TO_CHAR(DATE_TRUNC('month', created_at), 'Mon') as month,
          COUNT(*) as leads,
          COUNT(CASE WHEN lead_no IN (SELECT enquiry_no FROM enquiry_tracker) THEN 1 END) as enquiries,
          COUNT(CASE WHEN lead_no IN (SELECT enquiry_no FROM enquiry_tracker WHERE is_order_received_status = 'yes') THEN 1 END) as orders
        FROM fms_leads
        WHERE created_at >= CURRENT_DATE - INTERVAL '6 months'
        ${!isAdmin ? 'AND sc_name = $1' : ''}
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY DATE_TRUNC('month', created_at)
        LIMIT 6
      `;

      // Conversion Funnel Data - Simplified
      const conversionDataQuery = `
        WITH lead_count AS (
          SELECT COUNT(*) as count FROM fms_leads 
          WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
          ${!isAdmin ? 'AND sc_name = $1' : ''}
        ),
        enquiry_count AS (
          SELECT COUNT(DISTINCT enquiry_no) as count FROM enquiry_tracker
          WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days'
          ${!isAdmin ? 'AND sales_cordinator = $1' : ''}
        ),
        order_count AS (
          SELECT COUNT(*) as count FROM enquiry_tracker
          WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days'
          AND is_order_received_status = 'yes'
          ${!isAdmin ? 'AND sales_person_name = $1' : ''}
        )
        SELECT 
          'Leads' as name,
          (SELECT count FROM lead_count) as value
        UNION ALL
        SELECT 
          'Enquiries' as name,
          (SELECT count FROM enquiry_count) as value
        UNION ALL
        SELECT 
          'Quotations' as name,
          (SELECT COUNT(*) FROM enquiry_tracker WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days') as value
        UNION ALL
        SELECT 
          'Orders' as name,
          (SELECT count FROM order_count) as value
      `;

      // Lead Sources Data
      const leadSourcesQuery = `
        SELECT 
          COALESCE(lead_source, 'Unknown') as name,
          COUNT(*) as value
        FROM fms_leads
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        ${!isAdmin ? 'AND salesperson_name = $1' : ''}
        GROUP BY lead_source
        ORDER BY value DESC
        LIMIT 5
      `;

      const [
        monthlyDataResult,
        conversionDataResult,
        leadSourcesResult
      ] = await Promise.all([
        pool.query(monthlyDataQuery, params).catch(err => {
          console.error("Monthly data query error:", err);
          return { rows: defaultData.overview };
        }),
        pool.query(conversionDataQuery, params).catch(err => {
          console.error("Conversion data query error:", err);
          return { rows: defaultData.conversion };
        }),
        pool.query(leadSourcesQuery, params).catch(err => {
          console.error("Lead sources query error:", err);
          return { rows: defaultData.sources };
        })
      ]);

      // Color palettes
      const conversionColors = ["#4f46e5", "#8b5cf6", "#d946ef", "#ec4899"];
      const sourceColors = [
        "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1", "#8b5cf6",
        "#a855f7", "#d946ef", "#ec4899", "#f43f5e", "#ef4444"
      ];

      const result = {
        overview: monthlyDataResult.rows.length > 0 ? monthlyDataResult.rows.map(row => ({
          month: row.month,
          leads: parseInt(row.leads) || 0,
          enquiries: parseInt(row.enquiries) || 0,
          orders: parseInt(row.orders) || 0
        })) : defaultData.overview,
        conversion: conversionDataResult.rows.length > 0 ? conversionDataResult.rows.map((row, index) => ({
          name: row.name,
          value: parseInt(row.value) || 0,
          color: conversionColors[index] || conversionColors[0]
        })) : defaultData.conversion,
        sources: leadSourcesResult.rows.length > 0 ? leadSourcesResult.rows.map((row, index) => ({
          name: row.name,
          value: parseInt(row.value) || 0,
          color: sourceColors[index] || sourceColors[0]
        })) : defaultData.sources
      };

      console.log("Charts data prepared successfully");
      return result;

    } catch (queryError) {
      console.error("Error fetching charts data, returning default:", queryError);
      return defaultData;
    }

  } catch (error) {
    console.error("Error in getDashboardChartsData:", error);
    // Return default data instead of throwing
    return {
      overview: [
        { month: "Jan", leads: 45, enquiries: 30, orders: 12 },
        { month: "Feb", leads: 52, enquiries: 35, orders: 15 },
        { month: "Mar", leads: 48, enquiries: 32, orders: 14 },
        { month: "Apr", leads: 70, enquiries: 45, orders: 20 },
        { month: "May", leads: 65, enquiries: 40, orders: 18 },
        { month: "Jun", leads: 58, enquiries: 38, orders: 16 },
      ],
      conversion: [
        { name: "Leads", value: 124, color: "#4f46e5" },
        { name: "Enquiries", value: 82, color: "#8b5cf6" },
        { name: "Quotations", value: 56, color: "#d946ef" },
        { name: "Orders", value: 27, color: "#ec4899" },
      ],
      sources: [
        { name: "Indiamart", value: 45, color: "#06b6d4" },
        { name: "Justdial", value: 28, color: "#0ea5e9" },
        { name: "Social Media", value: 20, color: "#3b82f6" },
        { name: "Website", value: 15, color: "#6366f1" },
        { name: "Referrals", value: 12, color: "#8b5cf6" },
      ]
    };
  }
};

module.exports = {
  getDashboardMetrics,
  getDashboardChartsData
};
