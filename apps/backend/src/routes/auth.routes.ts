import { Router } from 'express';
import { signup, login, refreshToken, getMe } from '../controllers/auth.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.get('/me', authenticateToken, getMe);

export default router;
