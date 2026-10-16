import type { Response } from 'express';
import { PipelineService } from '../services/pipeline.service.js';
import {
  updatePipelineStageSchema,
  scheduleFollowUpSchema,
  updateNotesSchema,
} from '../utils/validation.js';
import type { AuthenticatedRequest, ApiResponse } from '../types/index.js';

export const getPipeline = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' } as ApiResponse);
      return;
    }

    const { records, stats } = await PipelineService.getPipeline(userId);
    res.json({
      success: true,
      data: records,
      meta: {
        stats,
      },
    } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message } as ApiResponse);
  }
};

export const updatePipelineStage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' } as ApiResponse);
      return;
    }

    const { opportunityId, stage, notes } = updatePipelineStageSchema.parse(req.body);
    const updated = await PipelineService.updateStage(userId, opportunityId, stage, notes);

    res.json({
      success: true,
      message: `Stage updated to ${stage}`,
      data: updated,
    } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message } as ApiResponse);
  }
};

export const scheduleFollowUp = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' } as ApiResponse);
      return;
    }

    const { opportunityId, date, objective } = scheduleFollowUpSchema.parse(req.body);
    const updated = await PipelineService.scheduleFollowUp(userId, opportunityId, date, objective);

    res.json({
      success: true,
      message: `Follow-up queued for ${date}`,
      data: updated,
    } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message } as ApiResponse);
  }
};

export const updateNotes = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' } as ApiResponse);
      return;
    }

    const { opportunityId, notes } = updateNotesSchema.parse(req.body);
    const updated = await PipelineService.updateNotes(userId, opportunityId, notes);

    res.json({
      success: true,
      message: 'Private note saved successfully',
      data: updated,
    } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message } as ApiResponse);
  }
};

export const deleteFromPipeline = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' } as ApiResponse);
      return;
    }

    const { id } = req.params;
    const removed = await PipelineService.remove(userId, id);

    res.json({
      success: true,
      message: removed ? 'Removed from pipeline' : 'Opportunity was not in pipeline',
    } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message } as ApiResponse);
  }
};
