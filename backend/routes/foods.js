import express from 'express';
import {
  getFoods,
  getFoodById,
  createFood,
  updateFood,
  deleteFood,
  getIngredients,
  createIngredient,
  deleteIngredient,
} from '../controllers/foodController.js';

import { authenticate, authorize } from '../middleware/auth.js';
import { USER_ROLES } from '../utils/constants.js';

const router = express.Router();

// Public routes
router.get('/', getFoods);
router.get('/ingredients', getIngredients);
router.get('/:id', getFoodById);



// Admin only routes
router.post('/', authenticate, authorize(USER_ROLES.ADMIN), createFood);
router.put('/:id', authenticate, authorize(USER_ROLES.ADMIN), updateFood);
router.delete('/:id', authenticate, authorize(USER_ROLES.ADMIN), deleteFood);

router.post('/ingredients', authenticate, authorize(USER_ROLES.ADMIN), createIngredient);
router.delete('/ingredients/:id', authenticate, authorize(USER_ROLES.ADMIN), deleteIngredient);

export default router;
