import type { Request, Response } from 'express';
import { sourceRegistry } from '../connectors/SourceRegistry.js';
import type { ApiResponse } from '../types/index.js';

export const getSources = async (req: Request, res: Response): Promise<void> => {
  try {
    const summary = sourceRegistry.getHealthSummary();
    const activeCount = sourceRegistry.getActiveCount();

    res.json({
      success: true,
      data: {
        activeCount,
        sources: summary,
      },
      meta: {
        total: summary.length,
        active: activeCount,
        truthfulReport: 'Report reflects actual registered and operational connectors in the system.',
      },
    } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse);
  }
};

export const toggleSource = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { enabled } = req.body;

    let success = false;
    if (enabled) {
      success = sourceRegistry.enable(id);
    } else {
      success = sourceRegistry.disable(id);
    }

    if (!success) {
      res.status(404).json({ success: false, error: `Source ${id} not found` } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      message: `Source ${id} is now ${enabled ? 'enabled' : 'disabled'}`,
    } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message } as ApiResponse);
  }
};
