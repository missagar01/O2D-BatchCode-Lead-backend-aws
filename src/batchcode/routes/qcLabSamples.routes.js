const { Router } = require('express');
const qcLabSamplesController = require('../controllers/qcLabSamples.controller');
const validateRequest = require('../middlewares/validateRequest');
const createFileUploadMiddleware = require('../middlewares/fileUpload');
const { createSampleSchema } = require('../validations/qcLabSamples.validation');
const { requireAuth } = require('../middlewares/auth');

const router = Router();

const handleReportUpload = createFileUploadMiddleware({
  fieldName: 'report_picture',
  subDirectory: 'qc-report-pictures'
});

router
  .route('/qc-lab-samples')
  .post(requireAuth, handleReportUpload, validateRequest(createSampleSchema), qcLabSamplesController.createSample)
  .get(requireAuth, qcLabSamplesController.listSamples);

router.get('/qc-lab-samples/:unique_code', requireAuth, qcLabSamplesController.getSampleByUniqueCode);

module.exports = router;

