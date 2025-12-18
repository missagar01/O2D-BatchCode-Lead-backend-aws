const {
  getDashboardMetrics,
  getDashboardChartsData
} = require("../models/dashboard.model.js");

const getDashboardMetricsController = async (req, res) => {
  try {
    const { userId, isAdmin } = req.query;
    
    console.log("Dashboard metrics request:", { userId, isAdmin });
    
    // Allow empty userId for admin users
    const adminStatus = isAdmin === 'true' || isAdmin === true;
    const userIdParam = userId || 'admin';
    
    const metrics = await getDashboardMetrics(userIdParam, adminStatus);
    
    console.log("Dashboard metrics response:", metrics);
    
    res.json({
      success: true,
      data: metrics
    });

  } catch (error) {
    console.error("Error in getDashboardMetricsController:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard metrics",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

const getDashboardChartsController = async (req, res) => {
  try {
    const { userId, isAdmin } = req.query;
    
    console.log("Dashboard charts request:", { userId, isAdmin });
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required"
      });
    }

    const chartsData = await getDashboardChartsData(userId, isAdmin === 'true');
    
    res.json({
      success: true,
      data: chartsData
    });

  } catch (error) {
    console.error("Error in getDashboardChartsController:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard charts data",
      error: error.message
    });
  }
};

module.exports = {
  getDashboardMetricsController,
  getDashboardChartsController
};
