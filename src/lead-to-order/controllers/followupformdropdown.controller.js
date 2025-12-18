// controllers/followupform.controller.js
const {
  getFollowupDropdowns
} = require("../services/followupformdropdown.service.js");

const fetchDropdowns = async (req, res) => {
  const data = await getFollowupDropdowns();
  return res.json(data);
};

module.exports = {
  fetchDropdowns
};
