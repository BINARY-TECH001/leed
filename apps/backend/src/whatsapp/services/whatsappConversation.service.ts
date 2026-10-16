import { prisma } from '../../utils/prisma.js';
import type { WhatsAppInboundMessage } from '../types/index.js';
import { WhatsAppIntentService } from './whatsappIntent.service.js';
import { WhatsAppActionRouter, type ActionExecutionOutcome } from './whatsappActionRouter.js';

export class WhatsAppConversationService {
  /**
   * Processes an incoming message from a WhatsApp user end-to-end:
   * Resolves user -> records inbound message -> parses intent -> routes action -> records outbound message.
   */
  static async handleIncomingMessage(
    inbound: WhatsAppInboundMessage
  ): Promise<ActionExecutionOutcome | null> {
    const rawPhone = inbound.from;
    const cleanDigits = rawPhone.replace(/\D/g, '');

    // 1. Resolve verified user by phone number
    const account = await prisma.whatsAppAccount.findFirst({
      where: {
        OR: [
          { phoneNumber: `+${cleanDigits}` },
          { phoneNumber: cleanDigits },
        ],
      },
      include: { user: true },
    });

    if (!account) {
      // Unlinked phone number texting the bot
      return null;
    }

    const userId = account.userId;
    const now = new Date();

    // 2. Resolve or create active conversation record
    let conversation = await prisma.whatsAppConversation.findFirst({
      where: { userId, waId: cleanDigits },
    });

    if (!conversation) {
      conversation = await prisma.whatsAppConversation.create({
        data: {
          userId,
          waId: cleanDigits,
          lastInteractionAt: now,
        },
      });
    }

    // 3. Record inbound message in database for audit trail
    await prisma.whatsAppMessage.create({
      data: {
        conversationId: conversation.id,
        direction: 'inbound',
        waMessageId: inbound.waMessageId,
        messageType: inbound.type,
        content: inbound.text || inbound.buttonId || 'Unsupported message',
        rawPayload: inbound.rawPayload,
        deliveryStatus: 'read',
      },
    });

    // 4. Parse intent contextually using activeOpportunityId from conversation
    const parsedIntent = WhatsAppIntentService.parseIntent(
      inbound,
      conversation.activeOpportunityId || undefined
    );

    // If intent references a specific opportunity, update conversation context
    if (parsedIntent.opportunityId && parsedIntent.opportunityId !== conversation.activeOpportunityId) {
      await prisma.whatsAppConversation.update({
        where: { id: conversation.id },
        data: {
          activeOpportunityId: parsedIntent.opportunityId,
          lastInteractionAt: now,
        },
      });
      conversation.activeOpportunityId = parsedIntent.opportunityId;
    }

    // 5. Route and execute action
    const outcome = await WhatsAppActionRouter.routeAction({
      userId,
      recipientPhone: account.phoneNumber,
      conversationId: conversation.id,
      intent: parsedIntent,
    });

    // 6. Record outbound reply message in database
    await prisma.whatsAppMessage.create({
      data: {
        conversationId: conversation.id,
        direction: 'outbound',
        messageType: 'text',
        content: outcome.replyMessage,
        deliveryStatus: 'sent',
      },
    });

    // Update conversation timestamp
    await prisma.whatsAppConversation.update({
      where: { id: conversation.id },
      data: { lastInteractionAt: now },
    });

    return outcome;
  }
}
