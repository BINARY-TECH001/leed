import type { Request, Response } from 'express';
import { OpportunityService } from '../services/opportunity.service.js';
import { AIService } from '../services/ai.service.js';
import { generateProposalSchema } from '../utils/validation.js';
import type { ApiResponse } from '../types/index.js';

export const generateProposal = async (req: Request, res: Response): Promise<void> => {
  try {
    const { opportunityId, tone, channel, cvSkills, userName } = generateProposalSchema.parse(req.body);

    const opp = await OpportunityService.getById(opportunityId);
    if (!opp) {
      res.status(404).json({ success: false, error: 'Opportunity not found' } as ApiResponse);
      return;
    }

    const proposal = AIService.generatePitch({
      opportunity: opp,
      tone,
      channel,
      cvSkills: cvSkills || ['React Native', 'Expo Router', 'TypeScript', 'Offline Sync'],
      userName: userName || 'Alex Rivers',
    });

    res.json({
      success: true,
      data: proposal,
    } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message } as ApiResponse);
  }
};
