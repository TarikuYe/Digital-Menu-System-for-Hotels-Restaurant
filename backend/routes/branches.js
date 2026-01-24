import express from 'express';
import {
    getBranches,
    createBranch,
    updateBranch,
    deleteBranch,
    getBranchPerformance
} from '../controllers/branchController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { USER_ROLES } from '../utils/constants.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize(USER_ROLES.ADMIN, USER_ROLES.OWNER));

router.get('/', getBranches);
router.post('/', createBranch);
router.get('/performance', getBranchPerformance);
router.put('/:id', updateBranch);
router.delete('/:id', deleteBranch);

export default router;
