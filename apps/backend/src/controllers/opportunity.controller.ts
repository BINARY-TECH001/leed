import type { Request, Response } from 'express';
import { OpportunityService } from '../services/opportunity.service.js';
import { QueryPlannerService } from '../services/queryPlanner.service.js';
import { PipelineService } from '../services/pipeline.service.js';
import { opportunitySearchSchema, applyOpportunitySchema } from '../utils/validation.js';
import type { AuthenticatedRequest, ApiResponse } from '../types/index.js';

export const getOpportunities = async (req: Request, res: Response): Promise<void> => {
  try {
    const filters = opportunitySearchSchema.parse(req.query);
    const result = await OpportunityService.searchOpportunities(filters as any);

    res.json({
      success: true,
      data: result.opportunities,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
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
    const { prompt, enableAI, page, limit, sort } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({ success: false, error: 'Search prompt string is required' } as ApiResponse);
      return;
    }

    // 1. Structured Query Planning (Deterministic with optional AI augmentation)
    const plan = await QueryPlannerService.plan(prompt, { enableAI });

    // 2. Query execution with structured constraints
    let result = await OpportunityService.searchOpportunities({
      keywords: plan.keywords.length > 0 ? plan.keywords : undefined,
      category: plan.category,
      remoteOnly: plan.isRemote,
      minCompRate: plan.minCompensation,
      location: plan.location,
      page,
      limit,
      sort,
    });

    // Graceful query relaxation: if keywords match nothing, fallback to category/remote/comp constraints
    if (result.total === 0 && plan.keywords.length > 0) {
      result = await OpportunityService.searchOpportunities({
        category: plan.category,
        remoteOnly: plan.isRemote,
        minCompRate: plan.minCompensation,
        location: plan.location,
        page,
        limit,
        sort,
      });
    }

    res.json({
      success: true,
      data: {
        prompt,
        plan,
        intentBadges: plan.intentBadges,
        extractedKeywords: plan.keywords,
        results: result.opportunities,
      },
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        interpretedBy: plan.interpretedBy,
      },
    } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message } as ApiResponse);
  }
};

export const applyOpportunity = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized: Authentication required' } as ApiResponse);
      return;
    }

    const { id } = req.params;
    const { cvName, customPitch } = applyOpportunitySchema.parse(req.body);

    const opp = await OpportunityService.getById(id);
    if (!opp) {
      res.status(404).json({ success: false, error: 'Opportunity not found' } as ApiResponse);
      return;
    }

    // Advance in user pipeline automatically
    await PipelineService.updateStage(
      userId,
      id,
      'applied',
      customPitch || `Application calibrated with ${cvName || 'primary CV'}`
    );

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

export const verifyFreshness = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { FreshnessService } = await import('../services/freshness.service.js');
    const result = await FreshnessService.verifyOpportunity(id);

    res.json({
      success: true,
      data: result,
    } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message } as ApiResponse);
  }
};

export const calculateOpportunityMatch = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { candidateSkills } = req.body;

    const opp = await OpportunityService.getById(id);
    if (!opp) {
      res.status(404).json({ success: false, error: 'Opportunity not found' } as ApiResponse);
      return;
    }

    const { AIService } = await import('../services/ai.service.js');
    const match = AIService.calculateMatch({
      candidateSkills: Array.isArray(candidateSkills) ? candidateSkills : ['React Native', 'TypeScript', 'Expo'],
      targetOpportunity: opp,
    });

    res.json({
      success: true,
      data: match,
    } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message } as ApiResponse);
  }
};
