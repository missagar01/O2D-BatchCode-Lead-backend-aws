const { Router } = require('express');
const pipeMillController = require('../controllers/pipeMill.controller');
const validateRequest = require('../middlewares/validateRequest');
const createFileUploadMiddleware = require('../middlewares/fileUpload');
const { createPipeMillSchema } = require('../validations/pipeMill.validation');
const { requireAuth } = require('../middlewares/auth');

const router = Router();

const handlePictureUpload = createFileUploadMiddleware({
  fieldName: 'picture',
  subDirectory: 'pipe-mill-pictures'
});

router
  .route('/pipe-mill')
  .post(requireAuth, handlePictureUpload, validateRequest(createPipeMillSchema), pipeMillController.createEntry)
  .get(requireAuth, pipeMillController.listEntries);

router.get('/pipe-mill/:unique_code', requireAuth, pipeMillController.getEntryByUniqueCode);

module.exports = router;
