import express from 'express';
import {
    getKitchenOrders,
    updateKitchenOrderStatus,
    updateFoodAvailability,
    getKitchenStats
} from '../controllers/kitchenController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { USER_ROLES } from '../utils/constants.js';

const router = express.Router();

// All kitchen routes require authentication and kitchen/manager/admin role
router.use(authenticate);
router.use(authorize(USER_ROLES.KITCHEN, USER_ROLES.MANAGER, USER_ROLES.ADMIN));

/**
 * @route   GET /api/kitchen/orders
 * @desc    Get all orders for kitchen display
 * @access  Kitchen, Manager, Admin
 * @query   status - Filter by status (comma-separated: pending,confirmed,preparing)
 */
router.get('/orders', getKitchenOrders);

/**
 * @route   PUT /api/kitchen/orders/:id/status
 * @desc    Update order status from kitchen
 * @access  Kitchen, Manager, Admin
 * @body    { status: 'confirmed' | 'preparing' | 'ready' }
 */
router.put('/orders/:id/status', updateKitchenOrderStatus);

/**
 * @route   PATCH /api/kitchen/foods/:id/availability
 * @desc    Update food availability (mark as out of stock)
 * @access  Kitchen, Manager, Admin
 * @body    { is_available: boolean }
 */
router.patch('/foods/:id/availability', updateFoodAvailability);

/**
 * @route   GET /api/kitchen/stats
 * @desc    Get kitchen statistics (order counts, avg prep time)
 * @access  Kitchen, Manager, Admin
 */
router.get('/stats', getKitchenStats);

export default router;
