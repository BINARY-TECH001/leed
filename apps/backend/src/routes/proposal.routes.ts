import { Router } from 'express';
import { generateProposal } from '../controllers/proposal.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/generate', authenticateToken, generateProposal);

export default router;
