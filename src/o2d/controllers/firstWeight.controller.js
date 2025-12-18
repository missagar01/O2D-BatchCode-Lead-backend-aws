const {
  getPendingFirstWeight,
  getFirstWeightHistory,
} = require("../services/firstWeight.service.js");

async function fetchPendingFirstWeight(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const customer = req.query.customer || '';
    const search = req.query.search || '';

    const result = await getPendingFirstWeight(offset, limit, customer, search);
    res.status(200).json({ 
      success: true, 
      data: result.data,
      totalCount: result.totalCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch pending first weight data",
      error: error.message,
    });
  }
}

async function fetchFirstWeightHistory(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const customer = req.query.customer || '';
    const search = req.query.search || '';

    const result = await getFirstWeightHistory(offset, limit, customer, search);
    res.status(200).json({ 
      success: true, 
      data: result.data,
      totalCount: result.totalCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch first weight history data",
      error: error.message,
    });
  }
}

module.exports = {
  fetchPendingFirstWeight,
  fetchFirstWeightHistory,
};
