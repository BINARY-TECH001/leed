import { Router } from 'express';
import {
  getRadars,
  getRadarById,
  createRadar,
  triggerRadarScan,
} from '../controllers/radar.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', getRadars);
router.post('/', authenticateToken, createRadar);
router.get('/:id', getRadarById);
router.post('/:id/scan', authenticateToken, triggerRadarScan);

export default router;
