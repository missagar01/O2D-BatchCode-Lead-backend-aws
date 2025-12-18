const { Router } = require('express');
const reCoilerController = require('../controllers/reCoiler.controller');
const validateRequest = require('../middlewares/validateRequest');
const { createReCoilerSchema } = require('../validations/reCoiler.validation');
const { requireAuth } = require('../middlewares/auth');

const router = Router();

router
  .route('/re-coiler')
  .post(requireAuth, validateRequest(createReCoilerSchema), reCoilerController.createEntry)
  .get(requireAuth, reCoilerController.listEntries);

router.get('/re-coiler/:unique_code', requireAuth, reCoilerController.getEntryByUniqueCode);

module.exports = router;



