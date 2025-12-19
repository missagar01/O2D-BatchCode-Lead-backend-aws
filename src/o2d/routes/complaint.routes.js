const { Router } = require("express");
const {
  getComplaints,
  createComplaint,
  updateComplaint,
  deleteComplaint,
} = require("../controllers/complaint.controller.js");
const asyncHandler = require("../utils/asyncHandler.js");

const router = Router();

router.get("/", asyncHandler(getComplaints));
router.post("/", asyncHandler(createComplaint));
router.put("/:id", asyncHandler(updateComplaint));
router.delete("/:id", asyncHandler(deleteComplaint));

module.exports = router;





