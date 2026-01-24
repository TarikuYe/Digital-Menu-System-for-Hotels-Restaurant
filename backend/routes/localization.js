import express from 'express';
import {
    getLanguages,
    createLanguage,
    updateLanguage,
    deleteLanguage,
    getTranslations,
    upsertTranslation
} from '../controllers/localizationController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { USER_ROLES } from '../utils/constants.js';

const router = express.Router();

// Public routes
router.get('/languages', getLanguages);

// Admin only routes
router.use(authenticate);
router.use(authorize(USER_ROLES.ADMIN));

router.post('/languages', createLanguage);
router.put('/languages/:id', updateLanguage);
router.delete('/languages/:id', deleteLanguage);

router.get('/translations', getTranslations);
router.post('/translations', upsertTranslation);

export default router;
