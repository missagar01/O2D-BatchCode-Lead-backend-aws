const { Router } = require('express');
const laddleReturnController = require('../controllers/laddleReturn.controller');
const validateRequest = require('../middlewares/validateRequest');
const createFileUploadMiddleware = require('../middlewares/fileUpload');
const { createLaddleReturnSchema } = require('../validations/laddleReturn.validation');
const { requireAuth } = require('../middlewares/auth');

const router = Router();

const handleUploads = createFileUploadMiddleware({
  fields: [
    { fieldName: 'poring_temperature_photo', subDirectory: 'laddle-return-poring-temperature' },
    { fieldName: 'ccm_temp_before_pursing_photo', subDirectory: 'laddle-return-ccm-before' },
    { fieldName: 'ccm_temp_after_pursing_photo', subDirectory: 'laddle-return-ccm-after' }
  ]
});

router
  .route('/laddle-return')
  .post(requireAuth, handleUploads, validateRequest(createLaddleReturnSchema), laddleReturnController.createEntry)
  .get(requireAuth, laddleReturnController.listEntries);

router.get('/laddle-return/:unique_code', requireAuth, laddleReturnController.getEntryByUniqueCode);

module.exports = router;
