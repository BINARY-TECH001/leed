import { Router } from 'express';
import {
  signup,
  login,
  socialAuth,
  refreshToken,
  sendVerificationEmail,
  verifyEmail,
  getMe,
} from '../controllers/auth.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/social', socialAuth);
router.post('/refresh-token', refreshToken);
router.post('/send-verification-email', authenticateToken, sendVerificationEmail);
router.post('/verify-email', authenticateToken, verifyEmail);
router.get('/me', authenticateToken, getMe);

export default router;
