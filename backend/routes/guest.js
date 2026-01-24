
import express from 'express';
import { verifyTableToken, startSession, getSessionStatus } from '../controllers/guestController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/verify/:token', verifyTableToken);
router.post('/session', startSession);

// Protected routes (requires Guest header)
router.get('/status', authenticate, getSessionStatus);

export default router;
