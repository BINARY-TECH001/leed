import type { Response } from 'express';
import type { AuthenticatedRequest, ApiResponse } from '../types/index.js';
import { ProfileService } from '../services/profile.service.js';

export const getProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' } as ApiResponse);
      return;
    }

    const data = await ProfileService.getFullProfile(userId);
    res.json({ success: true, data } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse);
  }
};

export const updatePersonal = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' } as ApiResponse);
      return;
    }

    const user = await ProfileService.updatePersonal(userId, req.body);
    res.json({ success: true, message: 'Personal information updated', data: user } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message } as ApiResponse);
  }
};

export const updateProfessional = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' } as ApiResponse);
      return;
    }

    const profile = await ProfileService.updateProfessional(userId, req.body);
    res.json({ success: true, message: 'Professional profile updated', data: profile } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message } as ApiResponse);
  }
};

export const updatePreferences = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' } as ApiResponse);
      return;
    }

    const updated = await ProfileService.updateOpportunityPreferences(userId, req.body);
    res.json({ success: true, message: 'Opportunity preferences updated', data: updated } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message } as ApiResponse);
  }
};

export const updatePrivacy = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' } as ApiResponse);
      return;
    }

    const updated = await ProfileService.updatePrivacy(userId, req.body);
    res.json({ success: true, message: 'Privacy preferences updated', data: updated } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message } as ApiResponse);
  }
};

export const uploadDocument = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' } as ApiResponse);
      return;
    }

    const { name, type, fileUrl, fileSize, extractedText } = req.body;
    if (!name || !type) {
      res.status(400).json({ success: false, error: 'Document name and type are required' } as ApiResponse);
      return;
    }

    const doc = await ProfileService.addDocument(userId, { name, type, fileUrl, fileSize, extractedText });
    res.status(201).json({ success: true, message: 'Document registered', data: doc } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message } as ApiResponse);
  }
};

export const deleteDocument = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' } as ApiResponse);
      return;
    }

    const { id } = req.params;
    await ProfileService.deleteDocument(userId, id);
    res.json({ success: true, message: 'Document deleted' } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message } as ApiResponse);
  }
};

export const addExperience = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' } as ApiResponse);
      return;
    }

    const { role, company, period, description, highlights } = req.body;
    if (!role || !company || !period) {
      res.status(400).json({ success: false, error: 'Role, company, and period are required' } as ApiResponse);
      return;
    }

    const exp = await ProfileService.addExperience(userId, { role, company, period, description, highlights });
    res.status(201).json({ success: true, message: 'Experience added', data: exp } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message } as ApiResponse);
  }
};

export const deleteExperience = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' } as ApiResponse);
      return;
    }

    const { id } = req.params;
    await ProfileService.deleteExperience(userId, id);
    res.json({ success: true, message: 'Experience removed' } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message } as ApiResponse);
  }
};

export const addSkill = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' } as ApiResponse);
      return;
    }

    const { name, category, yearsExperience, isTopSkill } = req.body;
    if (!name) {
      res.status(400).json({ success: false, error: 'Skill name is required' } as ApiResponse);
      return;
    }

    const skill = await ProfileService.addSkill(userId, { name, category, yearsExperience, isTopSkill });
    res.status(201).json({ success: true, message: 'Skill added', data: skill } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message } as ApiResponse);
  }
};

export const deleteSkill = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' } as ApiResponse);
      return;
    }

    const { id } = req.params;
    await ProfileService.deleteSkill(userId, id);
    res.json({ success: true, message: 'Skill removed' } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message } as ApiResponse);
  }
};

export const deleteAccount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' } as ApiResponse);
      return;
    }

    await ProfileService.deleteAccount(userId);
    res.json({ success: true, message: 'Account and associated data deleted' } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse);
  }
};
