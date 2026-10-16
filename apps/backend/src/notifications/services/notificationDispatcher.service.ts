import { prisma } from '../../utils/prisma.js';
import type { NotificationDomainEvent, DispatchResult, ChannelDispatchAttempt } from '../types/index.js';
import { CostControlService } from './costControl.service.js';
import { getTelegramProvider, getEmailProvider, getPushProvider } from '../providers/index.js';
import { getWhatsAppProvider } from '../../whatsapp/providers/index.js';

export class NotificationDispatcherService {
  /**
   * Main entry point for dispatching domain notification events across all eligible channels.
   */
  static async dispatch(event: NotificationDomainEvent): Promise<DispatchResult> {
    const eventId = event.eventId || `evt_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const attempts: ChannelDispatchAttempt[] = [];

    // 1. Fetch user, profile, connections, and preferences
    const user = await prisma.user.findUnique({
      where: { id: event.userId },
      include: {
        notificationPreference: true,
        whatsAppAccount: true,
        telegramAccount: true,
        emailPreference: true,
        pushDeviceTokens: { where: { isActive: true } },
      },
    });

    if (!user) {
      throw new Error(`User not found: ${event.userId}`);
    }

    // 2. Check duplicate suppression for opportunity events
    const suppressionHours = user.notificationPreference?.duplicateSuppressionHours || 72;
    if (event.opportunityId) {
      const existingDelivery = await prisma.channelDeliveryRecord.findFirst({
        where: {
          userId: user.id,
          eventType: event.eventType,
          status: { in: ['sent', 'delivered'] },
          createdAt: { gte: new Date(Date.now() - suppressionHours * 3600 * 1000) },
          providerMessageId: { not: null },
        },
      });

      // If already delivered recently, don't re-dispatch external notifications
      if (existingDelivery) {
        attempts.push({
          channel: 'in_app',
          status: 'skipped_disabled',
          error: `Suppressed duplicate event within ${suppressionHours} hours`,
        });
        return {
          eventId,
          userId: user.id,
          channels: attempts,
          timestamp: new Date(),
        };
      }
    }

    // 3. Always create an in-app Notification record in the Notification Centre
    const validPriorities = ['URGENT', 'ACTION_REQUIRED', 'IMPORTANT', 'RECOMMENDED', 'INFO'];
    const inAppPriority = validPriorities.includes(event.priority as any)
      ? (event.priority as any)
      : 'RECOMMENDED';
    const inAppRecord = await prisma.notification.create({
      data: {
        userId: user.id,
        title: event.title,
        body: event.body,
        type: event.eventType,
        priority: inAppPriority,
        opportunityId: event.opportunityId,
        actionUrl: event.actionUrl,
        metadata: event.metadata || {},
        isRead: false,
      },
    });

    attempts.push({
      channel: 'in_app',
      status: 'delivered',
      recipient: user.id,
      providerMessageId: inAppRecord.id,
    });

    // 4. Quiet hours evaluation
    const isQuietHours = NotificationDispatcherService.isInQuietHours(
      user.notificationPreference?.quietHoursStart || '22:00',
      user.notificationPreference?.quietHoursEnd || '08:00'
    );

    // 5. Telegram Dispatch (100% Free Developer Tier)
    if (
      user.telegramAccount &&
      user.telegramAccount.status === 'active' &&
      user.telegramAccount.isVerified &&
      user.telegramAccount.telegramChatId
    ) {
      if (isQuietHours && event.priority !== 'URGENT') {
        attempts.push({ channel: 'telegram', status: 'skipped_quiet_hours', recipient: user.telegramAccount.telegramChatId });
      } else {
        const tgProvider = getTelegramProvider();
        const buttons = event.suggestedActions?.map((act) => [
          { text: act.label, callbackData: `${act.id}_${event.opportunityId || ''}`, url: act.url },
        ]);

        const formattedText = `🔔 *${event.title}*\n\n${event.body}${
          event.actionUrl ? `\n\n🔗 [Open in Leed](${event.actionUrl})` : ''
        }`;

        const tgResult = await tgProvider.sendMessage(user.telegramAccount.telegramChatId, formattedText, {
          parseMode: 'Markdown',
          buttons,
        });

        const status = tgResult.success ? 'sent' : 'failed';
        attempts.push({
          channel: 'telegram',
          status,
          recipient: user.telegramAccount.telegramChatId,
          providerMessageId: tgResult.messageId,
          error: tgResult.error,
        });

        await prisma.channelDeliveryRecord.create({
          data: {
            userId: user.id,
            channel: 'telegram',
            eventType: event.eventType,
            recipient: user.telegramAccount.telegramChatId,
            status,
            providerMessageId: tgResult.messageId,
            error: tgResult.error,
          },
        });
      }
    }

    // 6. WhatsApp Dispatch (With Strict Zero-Cost Launch & Cost Budget Guardrails)
    if (
      user.whatsAppAccount &&
      user.whatsAppAccount.status === 'active' &&
      user.whatsAppAccount.isVerified &&
      user.whatsAppAccount.consentGiven
    ) {
      const budgetCheck = await CostControlService.canDispatchWhatsApp();
      if (!budgetCheck.allowed) {
        // Operator budget cap reached or disabled: safely skip and log
        attempts.push({
          channel: 'whatsapp',
          status: 'skipped_budget',
          recipient: user.whatsAppAccount.phoneNumber,
          error: budgetCheck.reason,
        });
      } else if (isQuietHours && event.priority !== 'URGENT') {
        attempts.push({ channel: 'whatsapp', status: 'skipped_quiet_hours', recipient: user.whatsAppAccount.phoneNumber });
      } else {
        const waProvider = getWhatsAppProvider();
        const costEst = CostControlService.getEstimatedCost('whatsapp');

        let waRes: any;
        if (event.suggestedActions && event.suggestedActions.length > 0) {
          waRes = await waProvider.sendInteractiveButtons(
            user.whatsAppAccount.phoneNumber,
            `*${event.title}*\n\n${event.body}`,
            event.suggestedActions.map((a) => ({ id: `${a.id}_${event.opportunityId || ''}`, title: a.label.slice(0, 20) })),
            { headerText: 'Leed Opportunity Agent' }
          );
        } else {
          waRes = await waProvider.sendText(user.whatsAppAccount.phoneNumber, `*${event.title}*\n\n${event.body}`);
        }

        const status = waRes.success ? 'sent' : 'failed';
        attempts.push({
          channel: 'whatsapp',
          status,
          recipient: user.whatsAppAccount.phoneNumber,
          providerMessageId: waRes.messageId,
          costEstimateUsd: costEst,
          error: waRes.error,
        });

        await prisma.channelDeliveryRecord.create({
          data: {
            userId: user.id,
            channel: 'whatsapp',
            eventType: event.eventType,
            recipient: user.whatsAppAccount.phoneNumber,
            status,
            providerMessageId: waRes.messageId,
            costEstimateUsd: costEst,
            error: waRes.error,
          },
        });
      }
    }

    // 7. Email Dispatch (Resend Free Tier / Transactional)
    if (
      user.emailPreference &&
      user.emailPreference.status === 'active' &&
      user.emailPreference.frequency === 'immediate'
    ) {
      if (isQuietHours && event.priority !== 'URGENT') {
        attempts.push({ channel: 'email', status: 'skipped_quiet_hours', recipient: user.emailPreference.email });
      } else {
        const emailProvider = getEmailProvider();
        const emailHtml = `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
            <h2 style="color: #0f172a;">${event.title}</h2>
            <p style="color: #334155; line-height: 1.6;">${event.body}</p>
            ${
              event.actionUrl
                ? `<p><a href="${event.actionUrl}" style="background-color: #2563eb; color: #ffffff; padding: 10px 18px; text-decoration: none; border-radius: 6px; display: inline-block;">View Opportunity</a></p>`
                : ''
            }
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="font-size: 12px; color: #94a3b8;">You are receiving this because you enabled email notifications on Leed. Free launch edition.</p>
          </div>
        `;

        const emailRes = await emailProvider.sendEmail({
          to: user.emailPreference.email,
          subject: event.title,
          html: emailHtml,
          text: `${event.title}\n\n${event.body}`,
        });

        const status = emailRes.success ? 'sent' : 'failed';
        attempts.push({
          channel: 'email',
          status,
          recipient: user.emailPreference.email,
          providerMessageId: emailRes.messageId,
          error: emailRes.error,
        });

        await prisma.channelDeliveryRecord.create({
          data: {
            userId: user.id,
            channel: 'email',
            eventType: event.eventType,
            recipient: user.emailPreference.email,
            status,
            providerMessageId: emailRes.messageId,
            error: emailRes.error,
          },
        });
      }
    }

    // 8. Push Dispatch (Expo Mobile & Web Push)
    if (user.pushDeviceTokens && user.pushDeviceTokens.length > 0) {
      if (isQuietHours && event.priority !== 'URGENT') {
        attempts.push({ channel: 'push', status: 'skipped_quiet_hours', recipient: `${user.pushDeviceTokens.length} devices` });
      } else {
        const pushProvider = getPushProvider();
        const payloads = user.pushDeviceTokens.map((device) => ({
          to: device.token,
          title: event.title,
          body: event.body,
          data: {
            opportunityId: event.opportunityId,
            actionUrl: event.actionUrl,
            eventType: event.eventType,
          },
          sound: 'default' as const,
          priority: event.priority === 'URGENT' ? ('high' as const) : ('default' as const),
        }));

        const pushRes = await pushProvider.sendPush(payloads);
        const status = pushRes.success ? 'sent' : 'failed';
        attempts.push({
          channel: 'push',
          status,
          recipient: `${user.pushDeviceTokens.length} devices`,
          providerMessageId: pushRes.receipts?.[0]?.id,
        });

        await prisma.channelDeliveryRecord.create({
          data: {
            userId: user.id,
            channel: 'push',
            eventType: event.eventType,
            recipient: `${user.pushDeviceTokens.length} devices`,
            status,
            providerMessageId: pushRes.receipts?.[0]?.id,
          },
        });
      }
    }

    return {
      eventId,
      userId: user.id,
      inAppNotificationId: inAppRecord.id,
      channels: attempts,
      timestamp: new Date(),
    };
  }

  /**
   * Helper to evaluate whether current time falls within user's configured quiet hours.
   */
  public static isInQuietHours(start: string, end: string): boolean {
    try {
      const now = new Date();
      const [startHour, startMin] = start.split(':').map(Number);
      const [endHour, endMin] = end.split(':').map(Number);

      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const startMinutes = startHour * 60 + (startMin || 0);
      const endMinutes = endHour * 60 + (endMin || 0);

      if (startMinutes > endMinutes) {
        // Overnight quiet hours, e.g. 22:00 to 08:00
        return currentMinutes >= startMinutes || currentMinutes < endMinutes;
      }
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    } catch {
      return false;
    }
  }
}
