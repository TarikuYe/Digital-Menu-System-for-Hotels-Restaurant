import express from 'express';
import {
  getFoods,
  getFoodById,
  createFood,
  updateFood,
  deleteFood,
} from '../controllers/foodController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { USER_ROLES } from '../utils/constants.js';

const router = express.Router();

// Public routes
router.get('/', getFoods);
router.get('/:id', getFoodById);

// Admin only routes
router.post('/', authenticate, authorize(USER_ROLES.ADMIN), createFood);
router.put('/:id', authenticate, authorize(USER_ROLES.ADMIN), updateFood);
router.delete('/:id', authenticate, authorize(USER_ROLES.ADMIN), deleteFood);

export default router;

