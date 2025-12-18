const { Router } = require('express');
const tundishChecklistController = require('../controllers/tundishChecklist.controller');
const validateRequest = require('../middlewares/validateRequest');
const { createTundishChecklistSchema } = require('../validations/tundishChecklist.validation');
const { requireAuth } = require('../middlewares/auth');

const router = Router();

router
  .route('/tundish-checklist')
  .post(requireAuth, validateRequest(createTundishChecklistSchema), tundishChecklistController.createEntry)
  .get(requireAuth, tundishChecklistController.listEntries);

router.get('/tundish-checklist/:unique_code', requireAuth, tundishChecklistController.getEntryByUniqueCode);

module.exports = router;
