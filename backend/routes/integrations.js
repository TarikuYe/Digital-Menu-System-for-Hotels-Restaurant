import express from 'express';
import { getApiKeys, createApiKey, deleteApiKey, toggleApiKeyStatus } from '../controllers/integrationController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { USER_ROLES } from '../utils/constants.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize(USER_ROLES.ADMIN, USER_ROLES.OWNER));

router.get('/keys', getApiKeys);
router.post('/keys', createApiKey);
router.delete('/keys/:id', deleteApiKey);
router.patch('/keys/:id/status', toggleApiKeyStatus);

export default router;
