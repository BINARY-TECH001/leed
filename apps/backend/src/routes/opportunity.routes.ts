import { Router } from 'express';
import {
  getOpportunities,
  getOpportunityById,
  searchOpportunities,
  applyOpportunity,
  verifyFreshness,
  calculateOpportunityMatch,
} from '../controllers/opportunity.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', getOpportunities);
router.post('/search', searchOpportunities);
router.get('/:id', getOpportunityById);
router.post('/:id/apply', authenticateToken, applyOpportunity);
router.post('/:id/verify-freshness', verifyFreshness);
router.post('/:id/match', calculateOpportunityMatch);

export default router;
