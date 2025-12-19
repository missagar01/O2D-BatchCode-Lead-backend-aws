const {
  getPendingInvoiceData,
  getInvoiceHistoryData,
} = require("../services/invoice.service.js");
const { sendJsonResponse } = require("../utils/responseHelper.js");

// 🟢 Fetch Pending Invoice Data
async function fetchPendingInvoiceData(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const customer = req.query.customer || '';
    const search = req.query.search || '';

    const result = await getPendingInvoiceData(offset, limit, customer, search);
    return sendJsonResponse(req, res, 200, { 
      success: true, 
      data: result.data,
      totalCount: result.totalCount
    });
  } catch (error) {
    console.error("❌ Error in fetchPendingInvoiceData:", error.message);
    return sendJsonResponse(req, res, 500, {
      success: false,
      message: "Failed to fetch pending invoice data",
      error: error.message,
    });
  }
}

async function fetchInvoiceHistoryData(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const customer = req.query.customer || '';
    const search = req.query.search || '';

    const result = await getInvoiceHistoryData(offset, limit, customer, search);
    return sendJsonResponse(req, res, 200, { 
      success: true, 
      data: result.data,
      totalCount: result.totalCount
    });
  } catch (error) {
    console.error("❌ Error in fetchInvoiceHistoryData:", error.message);
    return sendJsonResponse(req, res, 500, {
      success: false,
      message: "Failed to fetch invoice history data",
      error: error.message,
    });
  }
}

module.exports = {
  fetchPendingInvoiceData,
  fetchInvoiceHistoryData,
};
