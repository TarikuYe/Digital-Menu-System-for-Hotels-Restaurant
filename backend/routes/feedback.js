import express from 'express';
import {
  createFeedback,
  getFeedback,
  getFeedbackById,
  respondToFeedback,
  runSentimentAnalysis,
  bulkAnalyzeSentiment,
  getInsights
} from '../controllers/feedbackController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { USER_ROLES } from '../utils/constants.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Customer can create feedback
router.post('/', createFeedback);
router.get('/', getFeedback);
router.get('/:id', getFeedbackById);

// Admin / Manager only routes
router.use(authorize(USER_ROLES.ADMIN, USER_ROLES.MANAGER));

router.get('/analytics/insights', getInsights);
router.post('/analytics/bulk-analyze', bulkAnalyzeSentiment);
router.post('/:id/analyze', runSentimentAnalysis);
router.post('/:id/respond', respondToFeedback);

export default router;
