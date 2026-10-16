import { Router } from 'express';
import { getSources, toggleSource } from '../controllers/source.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// Public endpoint to query truthful available connectors & health
router.get('/', getSources);

// Admin / Authenticated endpoint to toggle sources
router.patch('/:id/toggle', authenticateToken, toggleSource);

export default router;
