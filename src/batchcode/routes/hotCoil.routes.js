const { Router } = require('express');
const hotCoilController = require('../controllers/hotCoil.controller');
const validateRequest = require('../middlewares/validateRequest');
const createFileUploadMiddleware = require('../middlewares/fileUpload');
const { createHotCoilSchema } = require('../validations/hotCoil.validation');
const { requireAuth } = require('../middlewares/auth');

const router = Router();

const handlePictureUpload = createFileUploadMiddleware({
  fieldName: 'picture',
  subDirectory: 'hot-coil-pictures'
});

router
  .route('/hot-coil')
  .post(requireAuth, handlePictureUpload, validateRequest(createHotCoilSchema), hotCoilController.createEntry)
  .get(requireAuth, hotCoilController.listEntries);

router.get('/hot-coil/:unique_code', requireAuth, hotCoilController.getEntryByUniqueCode);

module.exports = router;
