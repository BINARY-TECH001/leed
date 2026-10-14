import type { Request, Response } from 'express';
import { OpportunityService } from '../services/opportunity.service.js';
import { AIService } from '../services/ai.service.js';
import { PipelineService } from '../services/pipeline.service.js';
import { opportunitySearchSchema, applyOpportunitySchema } from '../utils/validation.js';
import type { ApiResponse } from '../types/index.js';

export const getOpportunities = async (req: Request, res: Response): Promise<void> => {
  try {
    const filters = opportunitySearchSchema.parse(req.query);
    const result = await OpportunityService.searchOpportunities(filters as any);

    res.json({
      success: true,
      data: result.opportunities,
      meta: {
        total: result.total,
      },
    } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message } as ApiResponse);
  }
};

export const getOpportunityById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const opp = await OpportunityService.getById(id);

    if (!opp) {
      res.status(404).json({ success: false, error: 'Opportunity not found' } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      data: opp,
    } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message } as ApiResponse);
  }
};

export const searchOpportunities = async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({ success: false, error: 'Search prompt string is required' } as ApiResponse);
      return;
    }

    // 1. AI Prompt Interpretation
    const interpretation = AIService.interpretSearchPrompt(prompt);

    // 2. Query execution with inferred constraints
    const result = await OpportunityService.searchOpportunities({
      query: prompt,
      category: interpretation.suggestedCategory as any,
      remoteOnly: interpretation.isRemoteInferred,
      minCompRate: interpretation.minRateInferred,
    });

    res.json({
      success: true,
      data: {
        prompt,
        intentBadges: interpretation.intentBadges,
        extractedKeywords: interpretation.extractedKeywords,
        results: result.opportunities,
      },
      meta: {
        total: result.total,
      },
    } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message } as ApiResponse);
  }
};

export const applyOpportunity = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { cvName, customPitch } = applyOpportunitySchema.parse(req.body);

    const opp = await OpportunityService.getById(id);
    if (!opp) {
      res.status(404).json({ success: false, error: 'Opportunity not found' } as ApiResponse);
      return;
    }

    // Advance in pipeline automatically
    await PipelineService.updateStage(id, 'applied', customPitch || `Application calibrated with ${cvName || 'primary CV'}`);

    res.json({
      success: true,
      message: `Autonomous application dispatched for ${opp.organization}`,
      data: {
        opportunityId: id,
        organization: opp.organization,
        status: 'applied',
        timestamp: new Date().toISOString(),
      },
    } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message } as ApiResponse);
  }
};
