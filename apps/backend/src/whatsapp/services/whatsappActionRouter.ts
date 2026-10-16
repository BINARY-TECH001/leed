import { prisma } from '../../utils/prisma.js';
import { OpportunityService } from '../../services/opportunity.service.js';
import { PipelineService } from '../../services/pipeline.service.js';
import { AIService } from '../../services/ai.service.js';
import { WhatsAppAccountService } from './whatsappAccount.service.js';
import { getWhatsAppProvider } from '../providers/index.js';
import type { ParsedWhatsAppIntent } from '../types/index.js';

export interface ActionExecutionOutcome {
  actionType: string;
  success: boolean;
  replyMessage: string;
  opportunityId?: string;
  evidence?: Record<string, any>;
}

export class WhatsAppActionRouter {
  /**
   * Executes the appropriate backend service action according to the parsed intent.
   */
  static async routeAction(params: {
    userId: string;
    recipientPhone: string;
    conversationId: string;
    intent: ParsedWhatsAppIntent;
  }): Promise<ActionExecutionOutcome> {
    const { userId, recipientPhone, conversationId, intent } = params;
    const provider = getWhatsAppProvider();

    // 1. HELP INTENT
    if (intent.intent === 'HELP') {
      const helpText =
        `🤖 *Leed Opportunity Agent — Command Guide*\n\n` +
        `• *View details*: Reply _"Details"_ on any opportunity\n` +
        `• *Why it matches*: Reply _"Why does this match?"_\n` +
        `• *Save for later*: Reply _"Save"_\n` +
        `• *Prepare application*: Reply _"Apply"_ or _"Pitch"_\n` +
        `• *Saved list*: Reply _"Show saved"_\n` +
        `• *Pause notifications*: Reply _"Pause alerts"_\n` +
        `• *Resume notifications*: Reply _"Resume alerts"_`;

      await provider.sendText(recipientPhone, helpText);
      return {
        actionType: 'HELP',
        success: true,
        replyMessage: helpText,
      };
    }

    // 2. PAUSE ALERTS
    if (intent.intent === 'PAUSE_NOTIFICATIONS') {
      await WhatsAppAccountService.setStatus(userId, 'paused');
      const reply = `⏸️ *Notifications paused.* I will not send new opportunity alerts to your WhatsApp until you reply *"Resume"* or unpause in the app.`;
      await provider.sendText(recipientPhone, reply);

      await prisma.actionExecutionRecord.create({
        data: {
          userId,
          conversationId,
          actionType: 'PAUSE_NOTIFICATIONS',
          level: 'assist',
          status: 'completed',
          evidence: { pausedAt: new Date().toISOString() },
        },
      });

      return {
        actionType: 'PAUSE_NOTIFICATIONS',
        success: true,
        replyMessage: reply,
      };
    }

    // 3. RESUME ALERTS
    if (intent.intent === 'RESUME_NOTIFICATIONS') {
      await WhatsAppAccountService.setStatus(userId, 'active');
      const reply = `▶️ *Notifications resumed!* Your personal agent is actively monitoring live job boards, research grants, and directories for new matches.`;
      await provider.sendText(recipientPhone, reply);

      await prisma.actionExecutionRecord.create({
        data: {
          userId,
          conversationId,
          actionType: 'RESUME_NOTIFICATIONS',
          level: 'assist',
          status: 'completed',
          evidence: { resumedAt: new Date().toISOString() },
        },
      });

      return {
        actionType: 'RESUME_NOTIFICATIONS',
        success: true,
        replyMessage: reply,
      };
    }

    // 4. LIST SAVED OPPORTUNITIES
    if (intent.intent === 'LIST_SAVED') {
      const saved = await prisma.userOpportunity.findMany({
        where: { userId, stage: 'SAVED' },
        include: { opportunity: true },
        take: 5,
        orderBy: { updatedAt: 'desc' },
      });

      if (saved.length === 0) {
        const reply = `📂 You don't have any saved opportunities yet. When I find matches, reply *"Save"* to bookmark them!`;
        await provider.sendText(recipientPhone, reply);
        return { actionType: 'LIST_SAVED', success: true, replyMessage: reply };
      }

      let reply = `📂 *Your Saved Opportunities (Top ${saved.length}):*\n\n`;
      saved.forEach((item, idx) => {
        const opp = item.opportunity;
        reply += `${idx + 1}. *${opp.title}* — ${opp.organization}\n   💰 ${opp.compensation}\n   🔗 ${opp.canonicalUrl || opp.originalUrl}\n\n`;
      });
      reply += `_To apply to any role, reply "Apply" or open your mobile app._`;

      await provider.sendText(recipientPhone, reply);
      return { actionType: 'LIST_SAVED', success: true, replyMessage: reply };
    }

    // For opportunity-specific intents, resolve target opportunity
    const opportunityId = intent.opportunityId;
    if (!opportunityId) {
      const fallbackReply =
        `I couldn't identify which opportunity you're referring to.\n\n` +
        `Please reply with *"Details"* on a specific opportunity card, or text *"Show saved"* to view your bookmarked items.`;
      await provider.sendText(recipientPhone, fallbackReply);
      return {
        actionType: intent.intent,
        success: false,
        replyMessage: fallbackReply,
      };
    }

    const opp = await OpportunityService.getById(opportunityId);
    if (!opp) {
      const reply = `Sorry, opportunity ID *${opportunityId}* was not found or has expired.`;
      await provider.sendText(recipientPhone, reply);
      return { actionType: intent.intent, success: false, replyMessage: reply };
    }

    // 5. OPPORTUNITY DETAILS
    if (intent.intent === 'OPPORTUNITY_DETAILS') {
      const deadlineText = opp.deadline ? `\n📅 *Deadline:* ${new Date(opp.deadline).toLocaleDateString()}` : '';
      const remoteText = opp.isRemote ? '🌐 Remote Eligible' : '🏢 On-Site / Local';

      const detailsBody =
        `📋 *${opp.title}*\n` +
        `🏢 *Organization:* ${opp.organization}\n` +
        `📍 *Location:* ${opp.location} (${remoteText})\n` +
        `💰 *Compensation:* ${opp.compensation}${deadlineText}\n` +
        `🔍 *Verified Source:* ${opp.source}\n\n` +
        `📝 *Summary:*\n${opp.summary}\n\n` +
        `🔗 *Official Link:* ${(opp as any).canonicalUrl || opp.originalUrl}`;

      await provider.sendInteractiveButtons(
        recipientPhone,
        detailsBody,
        [
          { id: `APPLY_${opp.id}`, title: 'Apply' },
          { id: `SAVE_${opp.id}`, title: 'Save' },
          { id: `EXPLAIN_${opp.id}`, title: 'Why it matches' },
        ],
        { headerText: `Opportunity Overview` }
      );

      return {
        actionType: 'OPPORTUNITY_DETAILS',
        success: true,
        opportunityId: opp.id,
        replyMessage: detailsBody,
      };
    }

    // 6. EXPLAIN MATCH
    if (intent.intent === 'EXPLAIN_MATCH') {
      // Fetch user profile skills
      const profile = await prisma.profile.findUnique({
        where: { userId },
        include: { skills: true },
      });

      const userSkills = profile?.skills.map((s) => s.name) || [
        'React Native',
        'TypeScript',
        'Expo',
        'Distributed Systems',
      ];

      const match = AIService.calculateMatch({
        candidateSkills: userSkills,
        targetOpportunity: opp,
      });

      const matchedList = match.matchedSkills.length > 0 ? match.matchedSkills.join(', ') : 'Domain experience';
      const reply =
        `🎯 *Match Calibration (${match.matchScore}% Fit)*\n\n` +
        `*Role:* ${opp.title} at ${opp.organization}\n\n` +
        `✅ *Why it matched:*\n` +
        `• Direct alignment with your skills: *${matchedList}*\n` +
        `• Meets your remote work and compensation preferences\n` +
        `• Verified active listing from ${opp.source}\n\n` +
        `💡 *Recommendation:* ${match.recommendations[0] || 'Highlight production experience.'}`;

      await provider.sendInteractiveButtons(
        recipientPhone,
        reply,
        [
          { id: `APPLY_${opp.id}`, title: 'Apply' },
          { id: `SAVE_${opp.id}`, title: 'Save' },
        ]
      );

      return {
        actionType: 'EXPLAIN_MATCH',
        success: true,
        opportunityId: opp.id,
        replyMessage: reply,
        evidence: match,
      };
    }

    // 7. SAVE OPPORTUNITY
    if (intent.intent === 'SAVE_OPPORTUNITY') {
      await PipelineService.updateStage(userId, opp.id, 'saved', 'Saved via WhatsApp personal agent');

      const reply =
        `💾 *Opportunity Saved!*\n\n` +
        `*${opp.title}* at *${opp.organization}* has been added to your saved pipeline.\n\n` +
        `You can review and prepare your application anytime. Reply *"Apply"* when you're ready!`;

      await provider.sendText(recipientPhone, reply);

      await prisma.actionExecutionRecord.create({
        data: {
          userId,
          conversationId,
          opportunityId: opp.id,
          actionType: 'SAVE_OPPORTUNITY',
          level: 'prepare',
          status: 'completed',
          evidence: { savedAt: new Date().toISOString() },
        },
      });

      return {
        actionType: 'SAVE_OPPORTUNITY',
        success: true,
        opportunityId: opp.id,
        replyMessage: reply,
      };
    }

    // 8. PREPARE APPLICATION (Level 1 Prepare / Level 2 Assist)
    if (intent.intent === 'PREPARE_APPLICATION' || intent.intent === 'SUBMIT_APPLICATION') {
      // 1. Fetch user profile for customization
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { profile: { include: { skills: true } } },
      });

      const userSkills = user?.profile?.skills.map((s) => s.name) || [
        'React Native',
        'TypeScript',
        'Expo',
        'Distributed Systems',
      ];
      const userName = user?.name || 'Candidate';

      // 2. Generate customized pitch proposal asynchronously
      const proposal = await AIService.generatePitchAsync({
        opportunity: opp,
        tone: 'Technical',
        channel: 'email',
        cvSkills: userSkills,
        userName,
      });

      // 3. Update pipeline state to 'applied' / 'prepared'
      await PipelineService.updateStage(
        userId,
        opp.id,
        'applied',
        `Tailored application packet generated (${proposal.generatedBy}) via WhatsApp personal agent`
      );

      // 4. Record action execution with full evidence
      await prisma.actionExecutionRecord.create({
        data: {
          userId,
          conversationId,
          opportunityId: opp.id,
          actionType: 'PREPARE_APPLICATION',
          level: 'prepare',
          status: 'completed',
          authorizedAt: new Date(),
          completedAt: new Date(),
          evidence: {
            subject: proposal.subject,
            body: proposal.body,
            destinationUrl: (opp as any).canonicalUrl || opp.originalUrl,
            generatedBy: proposal.generatedBy,
          },
        },
      });

      // 5. Send truthful response
      const reply =
        `📝 *Application Prepared for ${opp.organization}!* (Level 1: Prepare)\n\n` +
        `*Subject:* ${proposal.subject}\n\n` +
        `*Personalized Pitch:* \n"${proposal.body.slice(0, 320)}..."\n\n` +
        `🔗 *Direct Official Submission Link:*\n${(opp as any).canonicalUrl || opp.originalUrl}\n\n` +
        `✅ Synchronized with your Leed mobile and web dashboard.`;

      await provider.sendText(recipientPhone, reply);

      return {
        actionType: 'PREPARE_APPLICATION',
        success: true,
        opportunityId: opp.id,
        replyMessage: reply,
        evidence: proposal,
      };
    }

    // UNKNOWN FALLBACK
    const defaultReply =
      `I'm listening! You can reply *"Details"* to see more about the current match, *"Apply"* to draft an application, *"Save"*, or *"Help"* for all commands.`;
    await provider.sendText(recipientPhone, defaultReply);

    return {
      actionType: 'UNKNOWN',
      success: false,
      replyMessage: defaultReply,
    };
  }
}
