import express from 'express';
import {
    getAnnouncements,
    createAnnouncement,
    deleteAnnouncement,
    getNotifications,
    sendStaffAlert,
    markNotificationRead,
    getCommSettings,
    updateCommSettings
} from '../controllers/communicationController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { USER_ROLES } from '../utils/constants.js';

const router = express.Router();

router.use(authenticate);

// Public (authenticated) announcements and personal notifications
router.get('/announcements', getAnnouncements);
router.get('/notifications', getNotifications);
router.patch('/notifications/:id/read', markNotificationRead);

// Admin / Manager only routes
router.use(authorize(USER_ROLES.ADMIN, USER_ROLES.MANAGER));

router.post('/announcements', createAnnouncement);
router.delete('/announcements/:id', deleteAnnouncement);
router.post('/staff-alert', sendStaffAlert);
router.get('/settings', getCommSettings);
router.put('/settings', updateCommSettings);

export default router;
