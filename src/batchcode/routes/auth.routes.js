const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const validateRequest = require('../middlewares/validateRequest');
const {
  registerSchema,
  registerIdParamSchema,
  registerUpdateSchema
} = require('../validations/auth.validation');
const { requireAuth, requireRoles } = require('../middlewares/auth');

const router = Router();

// Login removed - use /api/auth/login instead
router.get(
  '/auth/register',
  requireAuth,
  requireRoles('admin', 'superadmin', 'super_admin'),
  authController.listRegistrations
);
router.get(
  '/auth/register/:id',
  requireAuth,
  requireRoles('admin', 'superadmin', 'super_admin'),
  validateRequest(registerIdParamSchema),
  authController.getRegistration
);
router.post(
  '/auth/register',
  requireAuth,
  requireRoles('admin', 'superadmin', 'super_admin'),
  validateRequest(registerSchema),
  authController.register
);
router.put(
  '/auth/register/:id',
  requireAuth,
  requireRoles('admin', 'superadmin', 'super_admin'),
  validateRequest(registerUpdateSchema),
  authController.updateRegistration
);
router.delete(
  '/auth/register/:id',
  requireAuth,
  requireRoles('admin', 'superadmin', 'super_admin'),
  validateRequest(registerIdParamSchema),
  authController.deleteRegistration
);
router.post('/auth/logout', requireAuth, authController.logout);

module.exports = router;
