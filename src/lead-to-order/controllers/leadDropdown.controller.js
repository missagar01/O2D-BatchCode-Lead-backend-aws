// controllers/leadDropdown.controller.js
const { getLeadFormDropdowns } = require("../services/leadDropdown.service.js");

const fetchLeadDropdowns = async (req, res) => {
  const data = await getLeadFormDropdowns();
  res.json(data);
};

module.exports = {
  fetchLeadDropdowns
};
