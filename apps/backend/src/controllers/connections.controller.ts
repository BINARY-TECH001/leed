import type { Request, Response } from 'express';
import type { AuthenticatedRequest, ApiResponse } from '../types/index.js';
import { ConnectionsService } from '../services/connections.service.js';

export const getStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' } as ApiResponse);
      return;
    }

    const data = await ConnectionsService.getConnectionsStatus(userId);
    res.json({ success: true, data } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse);
  }
};

export const createTelegramLinkToken = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' } as ApiResponse);
      return;
    }

    const data = await ConnectionsService.generateTelegramLinkingToken(userId);
    res.json({ success: true, message: 'Telegram linking token generated', data } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse);
  }
};

export const handleTelegramWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const update = req.body;
    // Check if it's a message containing /start <token>
    const message = update?.message;
    const text = message?.text || '';
    const chatId = String(message?.chat?.id || '');
    const username = message?.from?.username;

    if (text.startsWith('/start ') && chatId) {
      const linkingToken = text.replace('/start ', '').trim();
      const result = await ConnectionsService.handleTelegramStartCallback(linkingToken, chatId, username);
      res.json({ ok: true, result });
      return;
    }

    // Acknowledge other webhook updates
    res.json({ ok: true });
  } catch (error: any) {
    res.status(200).json({ ok: false, error: error.message });
  }
};

export const disconnectTelegram = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' } as ApiResponse);
      return;
    }

    await ConnectionsService.disconnectTelegram(userId);
    res.json({ success: true, message: 'Telegram account disconnected' } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse);
  }
};

export const registerPush = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' } as ApiResponse);
      return;
    }

    const { token, platform, deviceName } = req.body;
    if (!token || !platform) {
      res.status(400).json({ success: false, error: 'Token and platform are required' } as ApiResponse);
      return;
    }

    const device = await ConnectionsService.registerPushToken(userId, token, platform, deviceName);
    res.status(201).json({ success: true, message: 'Push device registered', data: device } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message } as ApiResponse);
  }
};

export const unregisterPush = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { token } = req.body;
    if (!token) {
      res.status(400).json({ success: false, error: 'Token is required' } as ApiResponse);
      return;
    }

    await ConnectionsService.unregisterPushToken(token);
    res.json({ success: true, message: 'Push device unregistered' } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message } as ApiResponse);
  }
};

export const testNotification = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' } as ApiResponse);
      return;
    }

    const { channel } = req.body;
    if (!channel) {
      res.status(400).json({ success: false, error: 'Channel name is required' } as ApiResponse);
      return;
    }

    const result = await ConnectionsService.sendTestNotification(userId, channel);
    res.json({ success: true, message: `Test notification dispatched to ${channel}`, data: result } as ApiResponse);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message } as ApiResponse);
  }
};
