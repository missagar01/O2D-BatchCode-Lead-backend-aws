const {
  getLeadNumbers,
  getLeadDetails,
  getQuotationNumbers,
  getQuotationDetails
} = require("../services/quotationLead.service.js");

const getLeadNumbersController = async (req, res) => {
  try {
    const result = await getLeadNumbers();
    
    res.json({
      success: true,
      leadNumbers: result.leadNumbers,
      leadData: result.leadData
    });

  } catch (error) {
    console.error("Error in getLeadNumbersController:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getLeadDetailsController = async (req, res) => {
  try {
    const { leadNo } = req.params;

    if (!leadNo) {
      return res.status(400).json({
        success: false,
        message: "Lead number is required"
      });
    }

    const result = await getLeadDetails(leadNo);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);

  } catch (error) {
    console.error("Error in getLeadDetailsController:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


const getQuotationNumbersController = async (req, res) => {
  try {
    const result = await getQuotationNumbers();
    
    res.json({
      success: true,
      quotationNumbers: result.quotationNumbers
    });

  } catch (error) {
    console.error("Error in getQuotationNumbersController:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getQuotationDetailsController = async (req, res) => {
  try {
    const { quotationNo } = req.params;

    if (!quotationNo) {
      return res.status(400).json({
        success: false,
        message: "Quotation number is required"
      });
    }

    const result = await getQuotationDetails(quotationNo);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);

  } catch (error) {
    console.error("Error in getQuotationDetailsController:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getLeadNumbersController,
  getLeadDetailsController,
  getQuotationNumbersController,
  getQuotationDetailsController
};
