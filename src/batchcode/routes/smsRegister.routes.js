const { Router } = require('express');
const smsRegisterController = require('../controllers/smsRegister.controller');
const validateRequest = require('../middlewares/validateRequest');
const createFileUploadMiddleware = require('../middlewares/fileUpload');
const { createSmsRegisterSchema } = require('../validations/smsRegister.validation');
const { requireAuth } = require('../middlewares/auth');
const router = Router();

const handleSmsRegisterPicture = createFileUploadMiddleware({
  fieldName: 'picture',
  subDirectory: 'sms-register-pictures'
});

router
  .route('/sms-register')
  .post(requireAuth, handleSmsRegisterPicture, validateRequest(createSmsRegisterSchema), smsRegisterController.createEntry)
  .get(requireAuth, smsRegisterController.listEntries);

module.exports = router;
