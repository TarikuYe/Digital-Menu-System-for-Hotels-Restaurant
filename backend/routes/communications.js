import express from 'express';
import {
    getAnnouncements,
    createAnnouncement,
    deleteAnnouncement,
    getNotifications,
    sendStaffAlert,
    markNotificationRead,
    getCommSettings,
    updateCommSettings,
    getMessages,
    sendMessage,
    getStaffList
} from '../controllers/communicationController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { USER_ROLES } from '../utils/constants.js';

const router = express.Router();

router.use(authenticate);

// Public (authenticated) announcements and personal notifications
router.get('/announcements', getAnnouncements);
router.get('/notifications', getNotifications);
router.patch('/notifications/:id/read', markNotificationRead);

// Chat and Staff Alerts (All authenticated staff & guests for alerts)
router.get('/messages', getMessages);
router.post('/messages', sendMessage);
router.post('/staff-alert', sendStaffAlert);
router.get('/staff', getStaffList);

// Admin / Manager only routes (Configuration and official announcements)
router.post('/announcements', authorize(USER_ROLES.ADMIN, USER_ROLES.MANAGER), createAnnouncement);
router.delete('/announcements/:id', authorize(USER_ROLES.ADMIN, USER_ROLES.MANAGER), deleteAnnouncement);
router.get('/settings', authorize(USER_ROLES.ADMIN, USER_ROLES.MANAGER), getCommSettings);
router.put('/settings', authorize(USER_ROLES.ADMIN, USER_ROLES.MANAGER), updateCommSettings);

export default router;
