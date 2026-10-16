import type { Request, Response } from 'express';
import { WhatsAppAccountService } from '../services/whatsappAccount.service.js';
import { WhatsAppWebhookService } from '../services/whatsappWebhook.service.js';
import { WhatsAppConversationService } from '../services/whatsappConversation.service.js';
import type { AuthenticatedRequest, ApiResponse } from '../../types/index.js';

export const linkPhoneNumber = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized: Authentication required' } as ApiResponse);
      return;
    }

    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      res.status(400).json({ success: false, error: 'phoneNumber is required' } as ApiResponse);
      return;
    }

    const result = await WhatsAppAccountService.linkPhoneNumber(userId, phoneNumber);
    res.json({
      success: true,
      message: 'Verification code dispatched to your WhatsApp number',
      data: result,
    } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message } as ApiResponse);
  }
};

export const verifyPhoneNumber = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized: Authentication required' } as ApiResponse);
      return;
    }

    const { code } = req.body;
    if (!code) {
      res.status(400).json({ success: false, error: '6-digit verification code is required' } as ApiResponse);
      return;
    }

    const result = await WhatsAppAccountService.verifyCode(userId, code);
    if (!result.success) {
      res.status(400).json({ success: false, error: result.error } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      message: 'WhatsApp number verified successfully. Personal Opportunity Agent activated!',
      data: result,
    } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message } as ApiResponse);
  }
};

export const getWhatsAppStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized: Authentication required' } as ApiResponse);
      return;
    }

    const status = await WhatsAppAccountService.getStatus(userId);
    res.json({
      success: true,
      data: status,
    } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message } as ApiResponse);
  }
};

export const updatePreferences = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized: Authentication required' } as ApiResponse);
      return;
    }

    const updated = await WhatsAppAccountService.updatePreferences(userId, req.body);
    res.json({
      success: true,
      message: 'Notification preferences updated successfully',
      data: updated,
    } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message } as ApiResponse);
  }
};

export const disconnectWhatsApp = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized: Authentication required' } as ApiResponse);
      return;
    }

    await WhatsAppAccountService.disconnect(userId);
    res.json({
      success: true,
      message: 'WhatsApp disconnected and notifications disabled.',
    } as ApiResponse);
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message } as ApiResponse);
  }
};

/**
 * Meta Webhook Challenge verification (GET /webhook)
 */
export const handleWebhookChallenge = (req: Request, res: Response): void => {
  const mode = req.query['hub.mode'] as string;
  const token = req.query['hub.verify_token'] as string;
  const challenge = req.query['hub.challenge'] as string;

  const result = WhatsAppWebhookService.verifyChallenge(mode, token, challenge);
  if (result.isValid && result.challenge) {
    res.status(200).send(result.challenge);
  } else {
    res.status(403).send('Forbidden: Invalid webhook verification token');
  }
};

/**
 * Meta Inbound Webhook handler (POST /webhook)
 * Responds with HTTP 200 immediately, processing asynchronously.
 */
export const handleWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Verify HMAC-SHA256 signature if in production
    const signature = req.headers['x-hub-signature-256'] as string | undefined;
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    const isSignatureValid = WhatsAppWebhookService.verifySignature(rawBody, signature);

    if (!isSignatureValid) {
      res.status(401).send('Unauthorized: Invalid webhook signature');
      return;
    }

    // 2. Immediate HTTP 200 acknowledgment to Meta to prevent timeout/retries
    res.status(200).send('EVENT_RECEIVED');

    // 3. Asynchronously parse and process payload
    const parsed = WhatsAppWebhookService.parsePayload(req.body);

    // Handle delivery status updates
    for (const status of parsed.statuses) {
      WhatsAppWebhookService.updateDeliveryStatus(status).catch(() => {});
    }

    // Handle inbound messages
    for (const msg of parsed.messages) {
      // Deduplicate: avoid processing the exact same message ID twice
      const alreadyProcessed = await WhatsAppWebhookService.isMessageProcessed(msg.waMessageId);
      if (alreadyProcessed) continue;

      WhatsAppConversationService.handleIncomingMessage(msg).catch((err) => {
        console.error(`[WhatsApp] Failed to process message ${msg.waMessageId}:`, err);
      });
    }
  } catch (err: any) {
    console.error('[WhatsApp] Webhook handling error:', err);
    if (!res.headersSent) {
      res.status(500).send('Internal Server Error');
    }
  }
};
