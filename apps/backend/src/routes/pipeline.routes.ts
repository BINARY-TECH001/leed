import { Router } from 'express';
import {
  getPipeline,
  updatePipelineStage,
  scheduleFollowUp,
  updateNotes,
  deleteFromPipeline,
} from '../controllers/pipeline.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getPipeline);
router.post('/stage', updatePipelineStage);
router.post('/schedule', scheduleFollowUp);
router.post('/notes', updateNotes);
router.delete('/:id', deleteFromPipeline);

export default router;
