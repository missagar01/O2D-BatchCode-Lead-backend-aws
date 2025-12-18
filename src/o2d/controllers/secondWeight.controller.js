const {
  getPendingSecondWeight,
  getSecondWeightHistory,
} = require("../services/secondWeight.service.js");

async function fetchPendingSecondWeight(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const customer = req.query.customer || '';
    const search = req.query.search || '';

    const result = await getPendingSecondWeight(offset, limit, customer, search);
    res.status(200).json({ 
      success: true, 
      data: result.data,
      totalCount: result.totalCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch pending second weight data",
      error: error.message,
    });
  }
}

async function fetchSecondWeightHistory(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const customer = req.query.customer || '';
    const search = req.query.search || '';

    const result = await getSecondWeightHistory(offset, limit, customer, search);
    res.status(200).json({ 
      success: true, 
      data: result.data,
      totalCount: result.totalCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch second weight history data",
      error: error.message,
    });
  }
}

module.exports = {
  fetchPendingSecondWeight,
  fetchSecondWeightHistory,
};
