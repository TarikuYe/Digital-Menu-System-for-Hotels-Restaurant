import express from 'express';
import {
  getMenus,
  getMenuById,
  createMenu,
  updateMenu,
  deleteMenu,
} from '../controllers/menuController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { USER_ROLES } from '../utils/constants.js';

const router = express.Router();

// Public routes
router.get('/', getMenus);
router.get('/:id', getMenuById);

// Admin only routes
router.post('/', authenticate, authorize(USER_ROLES.ADMIN), createMenu);
router.put('/:id', authenticate, authorize(USER_ROLES.ADMIN), updateMenu);
router.delete('/:id', authenticate, authorize(USER_ROLES.ADMIN), deleteMenu);

export default router;

