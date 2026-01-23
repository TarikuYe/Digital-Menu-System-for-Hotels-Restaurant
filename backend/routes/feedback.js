import express from 'express';
import {
  createFeedback,
  getFeedback,
  getFeedbackById,
  updateFeedbackVisibility,
} from '../controllers/feedbackController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { USER_ROLES } from '../utils/constants.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Customer can create feedback, all authenticated users can view
router.post('/', createFeedback);
router.get('/', getFeedback);
router.get('/:id', getFeedbackById);

// Admin can update feedback visibility
router.put('/:id/visibility', authorize(USER_ROLES.ADMIN), updateFeedbackVisibility);

export default router;

