import { Router } from 'express';
import {
  linkPhoneNumber,
  verifyPhoneNumber,
  getWhatsAppStatus,
  updatePreferences,
  disconnectWhatsApp,
  handleWebhookChallenge,
  handleWebhook,
} from '../controllers/whatsapp.controller.js';
import { authenticateToken } from '../../middleware/auth.middleware.js';

const router = Router();

// Account Management (Authenticated)
router.post('/link', authenticateToken, linkPhoneNumber);
router.post('/verify', authenticateToken, verifyPhoneNumber);
router.get('/status', authenticateToken, getWhatsAppStatus);
router.patch('/preferences', authenticateToken, updatePreferences);
router.post('/disconnect', authenticateToken, disconnectWhatsApp);

// Meta Cloud API Webhook Endpoints (Public)
router.get('/webhook', handleWebhookChallenge);
router.post('/webhook', handleWebhook);

export default router;
