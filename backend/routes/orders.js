import express from 'express';
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  getPrepTimeAnalytics,
} from '../controllers/orderController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { USER_ROLES } from '../utils/constants.js';

const router = express.Router();

// Publicly accessible analytics
router.get('/analytics/prep-time', getPrepTimeAnalytics);

// All other routes require authentication
router.use(authenticate);

// Customer can create orders, Staff/Admin can view and update
router.post('/', createOrder);
router.get('/', getOrders);
router.get('/:id', getOrderById);

// Staff/Admin can update order status
router.put('/:id/status', authorize(USER_ROLES.STAFF, USER_ROLES.ADMIN), updateOrderStatus);

export default router;

