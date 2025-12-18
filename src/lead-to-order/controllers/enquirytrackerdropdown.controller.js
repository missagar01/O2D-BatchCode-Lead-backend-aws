const { getDropdownValues } = require("../services/enquirytrackerformdropdown.service.js");

const fetchDropdown = async (req, res) => {
  try {
    const { column } = req.params;

    if (!column) {
      return res.status(400).json({
        success: false,
        message: "Column name is required"
      });
    }

    const values = await getDropdownValues(column);

    res.status(200).json({
      success: true,
      values
    });

  } catch (error) {
    console.error("Error fetching dropdown values:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to fetch dropdown values"
    });
  }
};

module.exports = {
  fetchDropdown
};
