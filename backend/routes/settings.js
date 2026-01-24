import express from 'express';
import {
    getSystemSettings,
    updateSystemSettings,
    getRestaurantProfile,
    updateRestaurantProfile
} from '../controllers/settingsController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { USER_ROLES } from '../utils/constants.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize(USER_ROLES.ADMIN, USER_ROLES.MANAGER));

router.get('/', getSystemSettings);
router.put('/', updateSystemSettings);

router.get('/profile', getRestaurantProfile);
router.put('/profile', updateRestaurantProfile);

export default router;
