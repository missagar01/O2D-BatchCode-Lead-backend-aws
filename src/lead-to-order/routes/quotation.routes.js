const express = require("express");
const {
  createQuotation,
  getQuotationByNo,
  getNextQuotationNumber,
  getQuotationDropdowns,
  uploadPdfToS3
} = require("../controllers/quotation.controller.js");
const { upload } = require("../middleware/s3Upload.js");

const router = express.Router();

router.post("/quotation", createQuotation);
router.get("/quotation/:quotationNo", getQuotationByNo);
router.get("/get-next-number", getNextQuotationNumber);
router.get("/dropdowns", getQuotationDropdowns);
router.post("/upload-pdf", upload.single("pdf"), uploadPdfToS3);


module.exports = router;
