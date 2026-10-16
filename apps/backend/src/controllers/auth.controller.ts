import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma.js';
import { signupSchema, loginSchema } from '../utils/validation.js';
import type { AuthenticatedRequest, ApiResponse } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'prospectai_jwt_super_secret_key_2026_dev';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'prospectai_refresh_secret_key_2026_dev';

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('FATAL: JWT_SECRET environment variable must be configured in production');
}

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name } = signupSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      res.status(400).json({ success: false, error: 'Email is already registered' } as ApiResponse);
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        name,
        passwordHash: hashedPassword,
        role: 'USER',
        profile: {
          create: {
            targetOutcome: 'Discovering verified opportunities',
            targetCategories: ['JOB', 'CONTRACT'],
            targetRoles: ['Software Engineer', 'Mobile Architect'],
            targetIndustries: ['Fintech', 'Software', 'AI'],
            targetLocations: ['Remote'],
            onboardingCompleted: true,
          },
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    const accessToken = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
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

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user || !user.passwordHash) {
      res.status(401).json({ success: false, error: 'Invalid email or password' } as ApiResponse);
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ success: false, error: 'Invalid email or password' } as ApiResponse);
      return;
    }

    const authPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const accessToken = jwt.sign(authPayload, JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, { expiresIn: '30d' });

    res.json({
      success: true,
      message: 'Authentication successful',
      data: {
        user: authPayload,
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
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!user) {
      res.status(401).json({ success: false, error: 'User does not exist or was removed' } as ApiResponse);
      return;
    }

    const newAccessToken = jwt.sign(user, JWT_SECRET, { expiresIn: '1h' });

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
      },
    } as ApiResponse);
  } catch {
    res.status(401).json({ success: false, error: 'Invalid or expired refresh token' } as ApiResponse);
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ success: false, error: 'Unauthorized' } as ApiResponse);
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        profile: true,
        userOpportunities: {
          include: { opportunity: true },
          take: 50,
        },
      },
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'User profile not found' } as ApiResponse);
      return;
    }

    const { passwordHash, ...safeUser } = user;

    res.json({
      success: true,
      data: safeUser,
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse);
  }
};
