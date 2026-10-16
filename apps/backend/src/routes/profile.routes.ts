import { Router } from 'express';
import {
  getProfile,
  updatePersonal,
  updateProfessional,
  updatePreferences,
  updatePrivacy,
  uploadDocument,
  deleteAccount,
} from '../controllers/profile.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', getProfile);
router.put('/personal', updatePersonal);
router.put('/professional', updateProfessional);
router.put('/preferences', updatePreferences);
router.put('/privacy', updatePrivacy);
router.post('/documents', uploadDocument);
router.delete('/account', deleteAccount);

export default router;
