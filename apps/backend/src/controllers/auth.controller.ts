import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { signupSchema, loginSchema } from '../utils/validation.js';
import type { AuthenticatedRequest, ApiResponse } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'prospectai_jwt_super_secret_key_2026_dev';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'prospectai_refresh_secret_key_2026_dev';

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name } = signupSchema.parse(req.body);
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = {
      id: `usr-${Date.now()}`,
      email,
      name,
      role: 'USER',
    };

    const accessToken = jwt.sign(user, JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, { expiresIn: '30d' });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        user,
        accessToken,
        refreshToken,
      },
    } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message } as ApiResponse);
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Provide standard demo user in development
    const user = {
      id: 'usr-1',
      email,
      name: email.split('@')[0] || 'Alex Rivers',
      role: 'USER',
    };

    const accessToken = jwt.sign(user, JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, { expiresIn: '30d' });

    res.json({
      success: true,
      message: 'Authentication successful',
      data: {
        user,
        accessToken,
        refreshToken,
      },
    } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message } as ApiResponse);
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) {
      res.status(401).json({ success: false, error: 'Refresh token required' } as ApiResponse);
      return;
    }

    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as { id: string };
    const user = {
      id: decoded.id,
      email: 'alex.rivers@prospectai.dev',
      name: 'Alex Rivers',
      role: 'USER',
    };

    const newAccessToken = jwt.sign(user, JWT_SECRET, { expiresIn: '1h' });

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
      },
    } as ApiResponse);
  } catch {
    res.status(401).json({ success: false, error: 'Invalid refresh token' } as ApiResponse);
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  res.json({
    success: true,
    data: req.user,
  } as ApiResponse);
};
