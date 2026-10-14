import { Router } from 'express';
import authRoutes from './auth.routes.js';
import opportunityRoutes from './opportunity.routes.js';
import radarRoutes from './radar.routes.js';
import pipelineRoutes from './pipeline.routes.js';
import proposalRoutes from './proposal.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/opportunities', opportunityRoutes);
router.use('/radars', radarRoutes);
router.use('/pipeline', pipelineRoutes);
router.use('/proposals', proposalRoutes);

export default router;
