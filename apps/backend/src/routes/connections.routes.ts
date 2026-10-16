import { Router } from 'express';
import {
  getStatus,
  createTelegramLinkToken,
  handleTelegramWebhook,
  disconnectTelegram,
  registerPush,
  unregisterPush,
  testNotification,
} from '../controllers/connections.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// Public webhook endpoint for Telegram Bot updates
router.post('/telegram/webhook', handleTelegramWebhook);

// Protected endpoints
router.use(authenticate);

router.get('/status', getStatus);
router.post('/telegram/link-token', createTelegramLinkToken);
router.post('/telegram/disconnect', disconnectTelegram);
router.post('/push/register', registerPush);
router.post('/push/unregister', unregisterPush);
router.post('/test', testNotification);

export default router;
