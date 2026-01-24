import express from 'express';
import { getAuditLogs, getSecurityInsights, triggerBackup } from '../controllers/auditController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { USER_ROLES } from '../utils/constants.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize(USER_ROLES.ADMIN));

router.get('/logs', getAuditLogs);
router.get('/insights', getSecurityInsights);
router.post('/backup', triggerBackup);

export default router;
