const { getDropdownValues } = require("../services/directEnquiryFormDropdown.service.js");

const fetchDropdownData = async (req, res) => {
  try {
    const data = await getDropdownValues();
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("❌ Dropdown fetch error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  fetchDropdownData
};
