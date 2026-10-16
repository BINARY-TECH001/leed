import { prisma } from '../../utils/prisma.js';
import { OpportunityService } from '../../services/opportunity.service.js';
import { AIService } from '../../services/ai.service.js';
import { getWhatsAppProvider } from '../providers/index.js';

export interface NotificationDispatchResult {
  dispatched: boolean;
  reason?: string;
  waMessageId?: string;
  recipient?: string;
}

export class WhatsAppNotificationService {
  /**
   * Helper to check if current time falls within user's configured quiet hours
   */
  static isQuietHours(startStr?: string | null, endStr?: string | null, now: Date = new Date()): boolean {
    if (!startStr || !endStr) return false;

    const [startH, startM] = startStr.split(':').map(Number);
    const [endH, endM] = endStr.split(':').map(Number);

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = startH * 60 + (startM || 0);
    const endMinutes = endH * 60 + (endM || 0);

    if (startMinutes <= endMinutes) {
      // Quiet hours in same day (e.g. 13:00 to 14:00)
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    } else {
      // Overnight quiet hours (e.g. 22:00 to 08:00)
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    }
  }

  /**
   * Dispatches a verified opportunity match to a user's WhatsApp account
   * while enforcing explicit consent, quiet hours, and daily rate limits.
   */
  static async notifyOpportunityMatch(
    userId: string,
    opportunityId: string
  ): Promise<NotificationDispatchResult> {
    // 1. Fetch user WhatsApp account
    const account = await prisma.whatsAppAccount.findUnique({
      where: { userId },
      include: {
        user: {
          include: { profile: { include: { skills: true } } },
        },
      },
    });

    if (!account || !account.isVerified || !account.consentGiven || account.status !== 'active') {
      return { dispatched: false, reason: 'account_not_active_or_consent_missing' };
    }

    const now = new Date();

    // 2. Quiet hours evaluation
    if (this.isQuietHours(account.quietHoursStart, account.quietHoursEnd, now)) {
      return { dispatched: false, reason: 'quiet_hours' };
    }

    // 3. Daily frequency cap evaluation
    // Reset counter if last notification was on a previous calendar day
    let sentToday = account.notificationsSentToday;
    if (account.lastNotificationSentAt) {
      const lastDate = account.lastNotificationSentAt.toDateString();
      if (lastDate !== now.toDateString()) {
        sentToday = 0;
      }
    }

    if (sentToday >= account.maxDailyNotifications) {
      return { dispatched: false, reason: 'daily_limit_exceeded' };
    }

    // 4. Duplicate match suppression
    // Check if user has already received this opportunity
    const alreadyNotified = await prisma.whatsAppMessage.findFirst({
      where: {
        conversation: { userId },
        content: { contains: opportunityId },
      },
    });

    if (alreadyNotified) {
      return { dispatched: false, reason: 'duplicate_suppressed' };
    }

    // 5. Fetch canonical opportunity
    const opp = await OpportunityService.getById(opportunityId);
    if (!opp) {
      return { dispatched: false, reason: 'opportunity_not_found' };
    }

    // 6. Calculate personalized match calibration
    const userSkills = account.user.profile?.skills.map((s) => s.name) || [
      'React Native',
      'TypeScript',
      'Expo',
    ];
    const match = AIService.calculateMatch({
      candidateSkills: userSkills,
      targetOpportunity: opp,
    });

    if (match.matchScore < account.minMatchScore) {
      return { dispatched: false, reason: 'below_min_match_score' };
    }

    // 7. Format rich match notification
    const remoteStatus = opp.isRemote ? 'Remote' : 'On-Site';
    const deadlineStr = opp.deadline ? `\n⏳ *Deadline:* ${new Date(opp.deadline).toLocaleDateString()}` : '';

    const bodyText =
      `🚀 *New ${opp.type.toUpperCase()} Match Found!*\n\n` +
      `*${opp.title}*\n` +
      `🏢 *Company:* ${opp.organization}\n` +
      `📍 *Arrangement:* ${remoteStatus} (${opp.location})\n` +
      `💰 *Compensation:* ${opp.compensation}${deadlineStr}\n` +
      `🎯 *Match Score:* ${match.matchScore}% fit\n\n` +
      `💡 *Why it matches:*\n` +
      `• Strong alignment on ${match.matchedSkills.slice(0, 3).join(', ') || 'skills'}\n` +
      `• Meets your remote and role criteria\n` +
      `• Verified from ${opp.source}\n\n` +
      `What would you like me to do?`;

    // 8. Send interactive buttons via active WhatsApp provider
    const provider = getWhatsAppProvider();
    const sendResult = await provider.sendInteractiveButtons(
      account.phoneNumber,
      bodyText,
      [
        { id: `APPLY_${opp.id}`, title: 'Apply' },
        { id: `SAVE_${opp.id}`, title: 'Save' },
        { id: `DETAILS_${opp.id}`, title: 'View details' },
      ],
      { headerText: 'New Opportunity Discovery' }
    );

    if (!sendResult.success) {
      return {
        dispatched: false,
        reason: sendResult.error,
        recipient: account.phoneNumber,
      };
    }

    // 9. Update conversation context and activeOpportunityId
    const cleanWaId = account.phoneNumber.replace(/\D/g, '');
    let conversation = await prisma.whatsAppConversation.findFirst({
      where: { userId, waId: cleanWaId },
    });

    if (!conversation) {
      conversation = await prisma.whatsAppConversation.create({
        data: {
          userId,
          waId: cleanWaId,
          activeOpportunityId: opp.id,
          lastInteractionAt: now,
        },
      });
    } else {
      await prisma.whatsAppConversation.update({
        where: { id: conversation.id },
        data: {
          activeOpportunityId: opp.id,
          lastInteractionAt: now,
        },
      });
    }

    // 10. Record outbound notification in database
    await prisma.whatsAppMessage.create({
      data: {
        conversationId: conversation.id,
        direction: 'outbound',
        waMessageId: sendResult.waMessageId,
        messageType: 'interactive_button',
        content: `Opportunity Match [${opp.id}]: ${opp.title} at ${opp.organization}`,
        deliveryStatus: 'sent',
      },
    });

    // 11. Update account rate-limit counters
    await prisma.whatsAppAccount.update({
      where: { userId },
      data: {
        notificationsSentToday: sentToday + 1,
        lastNotificationSentAt: now,
      },
    });

    return {
      dispatched: true,
      waMessageId: sendResult.waMessageId,
      recipient: account.phoneNumber,
    };
  }
}
