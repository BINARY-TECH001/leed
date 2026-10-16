import type { Response } from 'express';
import { RadarService } from '../services/radar.service.js';
import { createRadarSchema } from '../utils/validation.js';
import { NotificationService } from '../services/notification.service.js';
import type { AuthenticatedRequest, ApiResponse } from '../types/index.js';

export const getRadars = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' } as ApiResponse);
      return;
    }

    const radars = await RadarService.getRadars(userId);
    res.json({
      success: true,
      data: radars,
      meta: {
        total: radars.length,
      },
    } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message } as ApiResponse);
  }
};

export const getRadarById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' } as ApiResponse);
      return;
    }

    const { id } = req.params;
    const radar = await RadarService.getById(userId, id);

    if (!radar) {
      res.status(404).json({ success: false, error: 'Radar not found' } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      data: radar,
    } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message } as ApiResponse);
  }
};

export const createRadar = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' } as ApiResponse);
      return;
    }

    const payload = createRadarSchema.parse(req.body);
    const newRadar = await RadarService.createRadar(userId, payload);

    res.status(201).json({
      success: true,
      message: 'Autonomous radar deployed successfully',
      data: newRadar,
    } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message } as ApiResponse);
  }
};

export const triggerRadarScan = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' } as ApiResponse);
      return;
    }

    const { id } = req.params;
    const scanResult = await RadarService.triggerScan(userId, id);

    // Notify via socket
    await NotificationService.broadcastCrawlerDiscovery(scanResult.radar.title, scanResult.newDiscoveriesCount);

    res.json({
      success: true,
      message: `Radar scan complete: ${scanResult.newDiscoveriesCount} new discoveries found.`,
      data: scanResult,
    } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message } as ApiResponse);
  }
};
