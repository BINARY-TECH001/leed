import { Router } from 'express';
import {
  getProfile,
  updatePersonal,
  updateProfessional,
  updatePreferences,
  updatePrivacy,
  uploadDocument,
  deleteDocument,
  addExperience,
  deleteExperience,
  addSkill,
  deleteSkill,
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
router.delete('/documents/:id', deleteDocument);
router.post('/experiences', addExperience);
router.delete('/experiences/:id', deleteExperience);
router.post('/skills', addSkill);
router.delete('/skills/:id', deleteSkill);
router.delete('/account', deleteAccount);

export default router;
