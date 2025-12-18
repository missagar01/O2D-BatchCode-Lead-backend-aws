const express = require("express");
const authRoutes = require("./auth.routes.js");
const dashboardRoutes = require("./dashboard.routes.js");
const directEnquiryFormRoutes = require("./directEnquiryForm.routes.js");
const directEnquiryFormDropdownRoutes = require("./directEnquiryFormDropdown.routes.js");
const enquiryTrackerRoutes = require("./enquiryTracker.routes.js");
const enquiryTrackerFormRoutes = require("./enquiryTrackerForm.routes.js");
const enquiryTrackerDropdownRoutes = require("./enquirytrackerformdropdown.routes.js");
const followupRoutes = require("./followup.routes.js");
const followupDropdownRoutes = require("./followupformdropdown.routes.js");
const leadDropdownRoutes = require("./leadDropdown.routes.js");
const leadsRoutes = require("./leadsRoutes.js");
const productRoutes = require("./product.routes.js");
const quotationRoutes = require("./quotation.routes.js");
const quotationLeadRoutes = require("./quotationLead.routes.js");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/leads", leadsRoutes);
router.use("/lead-dropdown", leadDropdownRoutes);
router.use("/products", productRoutes);
router.use("/quotations", quotationRoutes);
router.use("/quotation-leads", quotationLeadRoutes);
router.use("/enquiry-to-order", directEnquiryFormRoutes);
router.use("/enquiry-to-order/dropdowns", directEnquiryFormDropdownRoutes);
router.use("/enquiry-tracker", enquiryTrackerRoutes);
router.use("/enquiry-tracker/form", enquiryTrackerFormRoutes);
router.use("/enquiry-tracker/dropdowns", enquiryTrackerDropdownRoutes);
router.use("/follow-up", followupRoutes);
router.use("/followup", followupRoutes); // Support both formats
router.use("/follow-up", followupDropdownRoutes);
router.use("/followup", followupDropdownRoutes); // Support both formats

module.exports = router;
