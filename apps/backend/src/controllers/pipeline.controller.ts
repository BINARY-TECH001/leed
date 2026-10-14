import type { Request, Response } from 'express';
import { PipelineService } from '../services/pipeline.service.js';
import {
  updatePipelineStageSchema,
  scheduleFollowUpSchema,
  updateNotesSchema,
} from '../utils/validation.js';
import type { ApiResponse } from '../types/index.js';

export const getPipeline = async (req: Request, res: Response): Promise<void> => {
  try {
    const { records, stats } = await PipelineService.getPipeline();
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

export const updatePipelineStage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { opportunityId, stage, notes } = updatePipelineStageSchema.parse(req.body);
    const updated = await PipelineService.updateStage(opportunityId, stage, notes);

    res.json({
      success: true,
      message: `Stage updated to ${stage}`,
      data: updated,
    } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message } as ApiResponse);
  }
};

export const scheduleFollowUp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { opportunityId, date, objective } = scheduleFollowUpSchema.parse(req.body);
    const updated = await PipelineService.scheduleFollowUp(opportunityId, date, objective);

    res.json({
      success: true,
      message: `Follow-up queued for ${date}`,
      data: updated,
    } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message } as ApiResponse);
  }
};

export const updateNotes = async (req: Request, res: Response): Promise<void> => {
  try {
    const { opportunityId, notes } = updateNotesSchema.parse(req.body);
    const updated = await PipelineService.updateNotes(opportunityId, notes);

    res.json({
      success: true,
      message: 'Private note saved successfully',
      data: updated,
    } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message } as ApiResponse);
  }
};

export const deleteFromPipeline = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const removed = await PipelineService.remove(id);

    res.json({
      success: true,
      message: removed ? 'Removed from pipeline' : 'Opportunity was not in pipeline',
    } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message } as ApiResponse);
  }
};
