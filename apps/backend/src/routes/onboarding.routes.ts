import { Router } from 'express';
import {
  getState,
  updateStep,
  executeInitialScan,
  completeOnboarding,
} from '../controllers/onboarding.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/state', getState);
router.post('/step', updateStep);
router.post('/initial-scan', executeInitialScan);
router.post('/complete', completeOnboarding);

export default router;
