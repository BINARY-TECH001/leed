import { prisma } from '../../utils/prisma.js';
import type { CostGuardrailConfig } from '../types/index.js';

/**
 * CostControlService
 *
 * Implements the Zero-Cost Launch & Provider Cost Guardrails:
 * 1. Guarantees Leed remains 100% free for users ($0 cost, 0 credits required).
 * 2. Enforces operator-configured monthly budget caps on potentially paid channels (WhatsApp).
 * 3. Safely skips paid dispatch when the budget is reached or disabled, gracefully falling back
 *    to 100% free channels (Telegram, free-tier Email, Expo Push, and In-App notification centre).
 */
export class CostControlService {
  private static config: CostGuardrailConfig = {
    whatsAppMonthlyBudgetUsd: parseFloat(process.env.WHATSAPP_MONTHLY_BUDGET_USD || '0.00'),
    whatsAppEstimatedCostPerMessageUsd: parseFloat(process.env.WHATSAPP_ESTIMATED_COST_PER_MSG_USD || '0.035'),
    whatsAppEnabled: process.env.WHATSAPP_ENABLED === 'true',
    telegramEnabled: process.env.TELEGRAM_ENABLED !== 'false', // Free Telegram Bot API enabled by default
    emailEnabled: process.env.EMAIL_ENABLED !== 'false',       // Free-tier Resend / SMTP enabled
    pushEnabled: process.env.PUSH_ENABLED !== 'false',         // Free Expo / Web Push enabled
  };

  /**
   * Sets custom cost guardrail configuration (useful for testing or runtime tuning).
   */
  static setConfig(newConfig: Partial<CostGuardrailConfig>) {
    CostControlService.config = { ...CostControlService.config, ...newConfig };
  }

  /**
   * Returns current cost control status and spending estimates.
   */
  static getConfig(): CostGuardrailConfig {
    return { ...CostControlService.config };
  }

  /**
   * Checks whether WhatsApp messaging is permitted under the configured monthly budget.
   */
  static async canDispatchWhatsApp(): Promise<{ allowed: boolean; reason?: string; currentSpendUsd: number }> {
    if (!CostControlService.config.whatsAppEnabled) {
      return { allowed: false, reason: 'WhatsApp channel is disabled in configuration', currentSpendUsd: 0 };
    }

    // Calculate current month's start timestamp
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Sum spend from ChannelDeliveryRecord for whatsapp
    const records = await prisma.channelDeliveryRecord.findMany({
      where: {
        channel: 'whatsapp',
        status: { in: ['sent', 'delivered'] },
        createdAt: { gte: startOfMonth },
      },
      select: { costEstimateUsd: true },
    });

    const currentSpendUsd = records.reduce((sum, r) => sum + r.costEstimateUsd, 0);

    if (currentSpendUsd + CostControlService.config.whatsAppEstimatedCostPerMessageUsd > CostControlService.config.whatsAppMonthlyBudgetUsd) {
      return {
        allowed: false,
        reason: `Monthly WhatsApp budget exhausted ($${currentSpendUsd.toFixed(2)} / $${CostControlService.config.whatsAppMonthlyBudgetUsd.toFixed(2)})`,
        currentSpendUsd,
      };
    }

    return { allowed: true, currentSpendUsd };
  }

  /**
   * Estimates cost for an outbound message.
   */
  static getEstimatedCost(channel: string): number {
    if (channel === 'whatsapp') {
      return CostControlService.config.whatsAppEstimatedCostPerMessageUsd;
    }
    // Telegram, Push, and Email free tier have $0 per-message cost for our zero-cost launch strategy
    return 0.0;
  }
}
