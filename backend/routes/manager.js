
import express from 'express';
import { getDashboardStats, getRecentActivity } from '../controllers/managerController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { USER_ROLES } from '../utils/constants.js';

const router = express.Router();

router.use(authenticate);

// Manager and Admin can access dashboard stats
router.get('/stats', authorize(USER_ROLES.MANAGER, USER_ROLES.ADMIN), getDashboardStats);

// Manager and Admin can access recent activity
router.get('/activity', authorize(USER_ROLES.MANAGER, USER_ROLES.ADMIN), getRecentActivity);

export default router;
