import express from 'express';
import {
    getPayments,
    updatePaymentStatus,
    getRevenueStats,
    createPayment
} from '../controllers/paymentController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { USER_ROLES } from '../utils/constants.js';

const router = express.Router();

router.use(authenticate);

// Admin & Sales/Cashier routes
// Admin, Manager & Sales/Cashier routes
router.get('/', authorize(USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.CASHIER), getPayments);
router.get('/stats', authorize(USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.CASHIER), getRevenueStats);
router.patch('/:id/status', authorize(USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.CASHIER), updatePaymentStatus);

// Internal/App use
router.post('/', createPayment);

export default router;
