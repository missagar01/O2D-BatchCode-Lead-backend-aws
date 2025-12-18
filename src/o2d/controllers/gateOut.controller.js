const {
  getPendingGateOutData,
  getGateOutHistoryData,
  getAllGateOutCustomers,
} = require("../services/gateOut.service.js");

// 🟢 Pending Gate Out
async function fetchPendingGateOut(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const customer = req.query.customer || '';
    const search = req.query.search || '';

    const result = await getPendingGateOutData(offset, limit, customer, search);
    res.status(200).json({ 
      success: true, 
      data: result.data,
      totalCount: result.totalCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch pending gate out data",
      error: error.message,
    });
  }
}

// 🟣 Gate Out History
async function fetchGateOutHistory(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const customer = req.query.customer || '';
    const search = req.query.search || '';

    const result = await getGateOutHistoryData(offset, limit, customer, search);
    res.status(200).json({ 
      success: true, 
      data: result.data,
      totalCount: result.totalCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch gate out history data",
      error: error.message,
    });
  }
}


async function fetchAllGateOutCustomers(req, res) {
  try {
    const customers = await getAllGateOutCustomers();
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
  fetchPendingGateOut,
  fetchGateOutHistory,
  fetchAllGateOutCustomers,
};
