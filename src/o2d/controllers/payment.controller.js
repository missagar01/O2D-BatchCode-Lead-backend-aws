const {
  getPendingPaymentData,
  getPaymentHistoryData,
  getAllPaymentCustomers,
} = require("../services/payment.service.js");

// 🟢 Pending Payments
async function fetchPendingPayments(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const customer = req.query.customer || '';
    const search = req.query.search || '';

    const result = await getPendingPaymentData(offset, limit, customer, search);
    res.status(200).json({ 
      success: true, 
      data: result.data,
      totalCount: result.totalCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch pending payments",
      error: error.message,
    });
  }
}

// 🟣 Payment History
async function fetchPaymentHistory(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const customer = req.query.customer || '';
    const search = req.query.search || '';

    const result = await getPaymentHistoryData(offset, limit, customer, search);
    res.status(200).json({ 
      success: true, 
      data: result.data,
      totalCount: result.totalCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment history",
      error: error.message,
    });
  }
}

// 🟩 Unique Customers
async function fetchAllPaymentCustomers(req, res) {
  try {
    const customers = await getAllPaymentCustomers();
    res.status(200).json({ success: true, data: customers });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch customers",
      error: error.message,
    });
  }
}

module.exports = {
  fetchPendingPayments,
  fetchPaymentHistory,
  fetchAllPaymentCustomers,
};
