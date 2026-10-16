import { Router } from 'express';
import authRoutes from './auth.routes.js';
import opportunityRoutes from './opportunity.routes.js';
import radarRoutes from './radar.routes.js';
import pipelineRoutes from './pipeline.routes.js';
import proposalRoutes from './proposal.routes.js';
import sourceRoutes from './source.routes.js';
import whatsappRoutes from '../whatsapp/routes/whatsapp.routes.js';
import profileRoutes from './profile.routes.js';
import connectionsRoutes from './connections.routes.js';
import notificationRoutes from './notification.routes.js';
import onboardingRoutes from './onboarding.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/opportunities', opportunityRoutes);
router.use('/radars', radarRoutes);
router.use('/pipeline', pipelineRoutes);
router.use('/proposals', proposalRoutes);
router.use('/sources', sourceRoutes);
router.use('/whatsapp', whatsappRoutes);
router.use('/profile', profileRoutes);
router.use('/connections', connectionsRoutes);
router.use('/notifications', notificationRoutes);
router.use('/onboarding', onboardingRoutes);

export default router;
