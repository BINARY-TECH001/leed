import crypto from 'node:crypto';
import { prisma } from '../../utils/prisma.js';
import type { WhatsAppInboundMessage, WhatsAppDeliveryStatus } from '../types/index.js';

export class WhatsAppWebhookService {
  /**
   * Verifies the Meta Webhook setup challenge (GET /webhook)
   */
  static verifyChallenge(
    mode?: string,
    token?: string,
    challenge?: string
  ): { isValid: boolean; challenge?: string } {
    const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN || 'leed_webhook_verify_token_prod_2026';

    if (mode === 'subscribe' && token === expectedToken && challenge) {
      return { isValid: true, challenge };
    }

    return { isValid: false };
  }

  /**
   * Verifies the HMAC-SHA256 signature from Meta (x-hub-signature-256 header)
   */
  static verifySignature(
    rawBody: string,
    signatureHeader?: string,
    secret?: string
  ): boolean {
    const appSecret = secret || process.env.META_APP_SECRET;

    // In test or local dev without configured META_APP_SECRET, allow pass-through
    if (!appSecret) {
      return true;
    }

    if (!signatureHeader) {
      return false;
    }

    const expectedSignature = `sha256=${crypto
      .createHmac('sha256', appSecret)
      .update(rawBody)
      .digest('hex')}`;

    try {
      return crypto.timingSafeEqual(
        Buffer.from(signatureHeader),
        Buffer.from(expectedSignature)
      );
    } catch {
      return false;
    }
  }

  /**
   * Parses standard Meta Cloud API inbound webhook payloads into normalized objects.
   */
  static parsePayload(body: Record<string, any>): {
    messages: WhatsAppInboundMessage[];
    statuses: WhatsAppDeliveryStatus[];
  } {
    const messages: WhatsAppInboundMessage[] = [];
    const statuses: WhatsAppDeliveryStatus[] = [];

    const entries = body.entry || [];
    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        const value = change.value;
        if (!value) continue;

        // 1. Process Inbound Messages
        const rawMessages = value.messages || [];
        for (const msg of rawMessages) {
          const from = msg.from;
          const waId = from;
          const waMessageId = msg.id;
          const timestamp = msg.timestamp;

          let type: 'text' | 'button_reply' | 'list_reply' | 'unsupported' = 'unsupported';
          let text: string | undefined;
          let buttonId: string | undefined;
          let buttonTitle: string | undefined;

          if (msg.type === 'text') {
            type = 'text';
            text = msg.text?.body;
          } else if (msg.type === 'interactive') {
            if (msg.interactive?.type === 'button_reply') {
              type = 'button_reply';
              buttonId = msg.interactive.button_reply?.id;
              buttonTitle = msg.interactive.button_reply?.title;
              text = buttonTitle || buttonId;
            } else if (msg.interactive?.type === 'list_reply') {
              type = 'list_reply';
              buttonId = msg.interactive.list_reply?.id;
              buttonTitle = msg.interactive.list_reply?.title;
              text = buttonTitle || buttonId;
            }
          } else if (msg.type === 'button') {
            type = 'button_reply';
            buttonId = msg.button?.payload;
            buttonTitle = msg.button?.text;
            text = buttonTitle || buttonId;
          }

          messages.push({
            from,
            waId,
            waMessageId,
            timestamp,
            type,
            text,
            buttonId,
            buttonTitle,
            rawPayload: msg,
          });
        }

        // 2. Process Delivery Statuses (sent, delivered, read, failed)
        const rawStatuses = value.statuses || [];
        for (const st of rawStatuses) {
          const status = st.status as 'sent' | 'delivered' | 'read' | 'failed';
          statuses.push({
            waMessageId: st.id,
            status,
            recipient: st.recipient_id,
            timestamp: st.timestamp,
            error: st.errors?.[0]?.message,
          });
        }
      }
    }

    return { messages, statuses };
  }

  /**
   * Checks if an incoming message was already processed (deduplication)
   */
  static async isMessageProcessed(waMessageId: string): Promise<boolean> {
    const count = await prisma.whatsAppMessage.count({
      where: { waMessageId },
    });
    return count > 0;
  }

  /**
   * Updates delivery status in the database
   */
  static async updateDeliveryStatus(status: WhatsAppDeliveryStatus): Promise<void> {
    const existing = await prisma.whatsAppMessage.findUnique({
      where: { waMessageId: status.waMessageId },
    });

    if (existing) {
      await prisma.whatsAppMessage.update({
        where: { id: existing.id },
        data: {
          deliveryStatus: status.status,
          errorMessage: status.error,
        },
      });
    }
  }
}
