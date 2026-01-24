import express from 'express';
import {
    getOrdersForPayment,
    processPayment,
    getCashierStats
} from '../controllers/cashierController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { USER_ROLES } from '../utils/constants.js';

const router = express.Router();

// Middleware: Authenticate and check for allowed roles (Cashier, Manager, Admin)
router.use(authenticate);
router.use(authorize(USER_ROLES.CASHIER, USER_ROLES.MANAGER, USER_ROLES.ADMIN));

/**
 * @route   GET /api/cashier/orders
 * @desc    Get orders ready for payment
 */
router.get('/orders', getOrdersForPayment);

/**
 * @route   POST /api/cashier/pay
 * @desc    Process a new payment
 */
router.post('/pay', processPayment);

/**
 * @route   GET /api/cashier/stats
 * @desc    Get daily transaction stats
 */
router.get('/stats', getCashierStats);

export default router;
