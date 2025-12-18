const { createLead } = require("../services/leadServices.js");

const createLeadController = async (req, res) => {
  try {
    const {
      receiverName,
      scName,
      source,
      companyName,
      phoneNumber,
      salespersonName,
      location,
      email,
      state,
      address,
      nob,
      notes,
    } = req.body;

    // Basic validation
    if (!receiverName || !scName || !source || !companyName) {
      return res.status(400).json({
        success: false,
        message: "receiverName, scName, source, companyName are required",
      });
    }

    const leadData = {
      receiverName,
      scName,
      source,
      companyName,
      phoneNumber: phoneNumber || "",
      salespersonName: salespersonName || "",
      location: location || "",
      email: email || "",
      state: state || "",
      address: address || "",
      nob: nob || "",
      notes: notes || "",
    };

    const created = await createLead(leadData);

    return res.status(201).json({
      success: true,
      message: "Lead created successfully",
      data: created,
    });
  } catch (error) {
    console.error("Error in createLeadController:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  createLeadController
};
