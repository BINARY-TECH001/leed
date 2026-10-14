import type { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { AuthenticatedRequest, AuthUser } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'prospectai_jwt_super_secret_key_2026_dev';

export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    // Provide fallback demo engineer identity in development if no token provided
    if (process.env.NODE_ENV !== 'production') {
      req.user = {
        id: 'usr-1',
        email: 'alex.rivers@prospectai.dev',
        name: 'Alex Rivers',
        role: 'USER',
      };
      return next();
    }
    res.status(401).json({ success: false, error: 'Unauthorized: Authentication token required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Unauthorized: Token expired or invalid' });
  }
};
