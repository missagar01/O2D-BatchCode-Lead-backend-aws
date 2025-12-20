const { Router } = require('express');
const adminController = require('../controllers/admin.controller');
const { requireAuth } = require('../middlewares/auth');

const router = Router();

router.get('/admin/overview', requireAuth, adminController.getAdminOverview);

router.get('/admin/overview/:unique_code', requireAuth, adminController.getAdminOverview);

module.exports = router;
