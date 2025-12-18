const { Router } = require('express');
const laddleChecklistController = require('../controllers/laddleChecklist.controller');
const validateRequest = require('../middlewares/validateRequest');
const { createLaddleChecklistSchema } = require('../validations/laddleChecklist.validation');
const { requireAuth } = require('../middlewares/auth');

const router = Router();

router
  .route('/laddle-checklist')
  .post(requireAuth, validateRequest(createLaddleChecklistSchema), laddleChecklistController.createEntry)
  .get(requireAuth, laddleChecklistController.listEntries);

router.get('/laddle-checklist/:unique_code', requireAuth, laddleChecklistController.getEntryByUniqueCode);

module.exports = router;
