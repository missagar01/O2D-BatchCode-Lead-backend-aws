const { insertEnquiryTracker } = require("../services/enquiryTrackerForm.service.js");
const { updateFmsLeadsFromTracker } = require("../services/fmsenquiryupdate.service.js");
const { updateEnquiryToOrderFromTracker } = require("../services/enquiryToOrderUpdate.service.js");  // ⭐ only this added

const createEnquiryTracker = async (req, res) => {
  try {
    const body = req.body;

    // Normalize empty strings → null
    Object.keys(body).forEach(key => {
      if (body[key] === "" || body[key] === undefined) {
        body[key] = null;
      }
    });

    // 1️⃣ Insert into enquiry_tracker
    const saved = await insertEnquiryTracker(body);

    // 2️⃣ Update fms_leads table
    await updateFmsLeadsFromTracker(body.enquiry_no, body);

    // 3️⃣ ⭐ Update enquiry_to_order table also (ONLY this is added)
    await updateEnquiryToOrderFromTracker(body.enquiry_no, body);

    res.status(201).json({
      success: true,
      message: "Enquiry Tracker saved & fms_leads + enquiry_to_order updated",
      data: saved
    });

  } catch (error) {
    console.error("❌ Error inserting enquiry tracker:", error);
    res.status(500).json({
      success: false,
      message: "Failed to insert enquiry tracker",
      error: error.message
    });
  }
};

module.exports = {
  createEnquiryTracker
};
