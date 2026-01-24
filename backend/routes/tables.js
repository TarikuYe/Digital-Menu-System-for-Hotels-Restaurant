
import express from 'express';
import { getTables, updateTableStatus, getTableById } from '../controllers/tableController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { USER_ROLES } from '../utils/constants.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all tables (Accessible by Staff, Manager, Admin, Kitchen)
router.get('/', authorize(USER_ROLES.STAFF, USER_ROLES.MANAGER, USER_ROLES.ADMIN, USER_ROLES.KITCHEN), getTables);

// Get single table
router.get('/:id', authorize(USER_ROLES.STAFF, USER_ROLES.MANAGER, USER_ROLES.ADMIN), getTableById);

// Update table status (Waiters/Staff primarily)
router.put('/:id/status', authorize(USER_ROLES.STAFF, USER_ROLES.MANAGER, USER_ROLES.ADMIN), updateTableStatus);

export default router;
