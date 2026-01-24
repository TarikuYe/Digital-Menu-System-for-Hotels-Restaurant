
import express from 'express';
import { getKitchenOrders, updateOrderStatus } from '../controllers/kitchenController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { USER_ROLES } from '../utils/constants.js';

const router = express.Router();

router.use(authenticate);

// Kitchen Staff, Manager, and Admin can access kitchen orders
router.get('/orders', authorize(USER_ROLES.KITCHEN, USER_ROLES.MANAGER, USER_ROLES.ADMIN), getKitchenOrders);

// Kitchen Staff, Manager, and Admin can update order status
router.patch('/orders/:id/status', authorize(USER_ROLES.KITCHEN, USER_ROLES.MANAGER, USER_ROLES.ADMIN), updateOrderStatus);

export default router;
