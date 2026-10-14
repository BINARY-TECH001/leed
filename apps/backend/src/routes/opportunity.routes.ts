import { Router } from 'express';
import {
  getOpportunities,
  getOpportunityById,
  searchOpportunities,
  applyOpportunity,
} from '../controllers/opportunity.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', getOpportunities);
router.post('/search', searchOpportunities);
router.get('/:id', getOpportunityById);
router.post('/:id/apply', authenticateToken, applyOpportunity);

export default router;
