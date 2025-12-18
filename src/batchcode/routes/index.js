const { Router } = require('express');
const qcLabSamplesRoutes = require('./qcLabSamples.routes');
const smsRegisterRoutes = require('./smsRegister.routes');
const hotCoilRoutes = require('./hotCoil.routes');
const reCoilerRoutes = require('./reCoiler.routes');
const pipeMillRoutes = require('./pipeMill.routes');
const laddleChecklistRoutes = require('./laddleChecklist.routes');
const tundishChecklistRoutes = require('./tundishChecklist.routes');
const laddleReturnRoutes = require('./laddleReturn.routes');
const adminRoutes = require('./admin.routes');
const authRoutes = require('./auth.routes');
const dashboardRoutes = require('./dashboard.routes');

const router = Router();

router.use('/', authRoutes);
router.use('/', adminRoutes);
router.use('/', dashboardRoutes);
router.use('/', qcLabSamplesRoutes);
router.use('/', smsRegisterRoutes);
router.use('/', hotCoilRoutes);
router.use('/', reCoilerRoutes);
router.use('/', pipeMillRoutes);
router.use('/', laddleChecklistRoutes);
router.use('/', tundishChecklistRoutes);
router.use('/', laddleReturnRoutes);

module.exports = router;
