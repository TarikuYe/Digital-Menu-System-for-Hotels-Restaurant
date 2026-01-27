import express from 'express';
import { exportOrders, exportFeedback, exportSalesAnalytics } from '../controllers/exportController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { USER_ROLES } from '../utils/constants.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize(USER_ROLES.ADMIN, USER_ROLES.OWNER, USER_ROLES.MANAGER));

router.get('/orders', exportOrders);
router.get('/feedback', exportFeedback);
router.get('/sales', exportSalesAnalytics);

export default router;
