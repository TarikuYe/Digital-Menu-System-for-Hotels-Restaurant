import express from 'express';
import { getSalesPerformance, getCustomerBehavior } from '../controllers/analyticsController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { USER_ROLES } from '../utils/constants.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize(USER_ROLES.ADMIN, USER_ROLES.MANAGER));

router.get('/sales', getSalesPerformance);
router.get('/behavior', getCustomerBehavior);

export default router;
