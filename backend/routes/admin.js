import express from 'express';
import {
    getAllUsers,
    createUser,
    updateUser,
    setUserStatus,
    resetUserPassword,
    deleteUser
} from '../controllers/adminController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { USER_ROLES } from '../utils/constants.js';

const router = express.Router();

router.get('/test', (req, res) => res.json({ message: 'Admin route working' }));

// All admin routes require authentication and admin role
router.use(authenticate);

router.use(authorize(USER_ROLES.ADMIN));

router.get('/users', getAllUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.patch('/users/:id/status', setUserStatus);
router.patch('/users/:id/reset-password', resetUserPassword);
router.delete('/users/:id', deleteUser);

export default router;
