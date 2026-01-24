import express from 'express';
import {
    getKitchenOrders,
    updateKitchenStatus,
    toggleFoodAvailability,
    logKitchenCheck,
    getKitchenStats
} from '../controllers/kitchenController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { USER_ROLES } from '../utils/constants.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize(USER_ROLES.KITCHEN, USER_ROLES.ADMIN, USER_ROLES.MANAGER));

router.get('/orders', getKitchenOrders);
router.patch('/orders/:id/status', updateKitchenStatus);
router.patch('/inventory/:foodId', toggleFoodAvailability);
router.post('/logs', logKitchenCheck);
router.get('/stats', getKitchenStats);

export default router;
