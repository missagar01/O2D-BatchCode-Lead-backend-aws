const {
  getPendingInvoiceData,
  getInvoiceHistoryData,
} = require("../services/invoice.service.js");

// 🟢 Fetch Pending Invoice Data
async function fetchPendingInvoiceData(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const customer = req.query.customer || '';
    const search = req.query.search || '';

    const result = await getPendingInvoiceData(offset, limit, customer, search);
    res.status(200).json({ 
      success: true, 
      data: result.data,
      totalCount: result.totalCount
    });
  } catch (error) {
    res.status(500).json({
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
    res.status(200).json({ 
      success: true, 
      data: result.data,
      totalCount: result.totalCount
    });
  } catch (error) {
    res.status(500).json({
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
