const { Router } = require("express");
const {
  getComplaints,
  createComplaint,
  updateComplaint,
  deleteComplaint,
} = require("../controllers/complaint.controller.js");

const router = Router();

router.get("/", getComplaints);
router.post("/", createComplaint);
router.put("/:id", updateComplaint);
router.delete("/:id", deleteComplaint);

module.exports = router;


