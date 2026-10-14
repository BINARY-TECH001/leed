import { api } from './api';
import type { Opportunity } from '@prospect/types';

export interface GenerateProposalParams {
  opportunity: Opportunity;
  tone: 'Executive' | 'Direct' | 'Technical' | 'Warm';
  channel: 'email' | 'linkedin' | 'followup';
  userSkills: string[];
  userName: string;
}

export const proposalService = {
  async generateProposal(params: GenerateProposalParams): Promise<{ subject: string; body: string }> {
    try {
      const response = await api.post<{
        success: boolean;
        data: { subject: string; body: string };
      }>('/proposals/generate', {
        opportunityId: params.opportunity.id,
        tone: params.tone,
        channel: params.channel,
      });

      if (response.data?.success && response.data.data) {
        return response.data.data;
      }
    } catch {
      // Local high-conversion fallback generator
    }

    const { opportunity: opp, tone, channel, userSkills, userName } = params;
    const contact = opp.contactPerson?.split(' ')[0] || `${opp.organization} Team`;
    const skillsList = userSkills.slice(0, 3).join(', ');

    const subject =
      channel === 'followup'
        ? `Following up: ${opp.title} — ${opp.organization}`
        : `Re: ${opp.title} — Mobile Architecture Alignment`;

    let body = '';

    if (tone === 'Direct') {
      body =
        `Hi ${contact},\n\n` +
        `Reaching out regarding the ${opp.title} opening at ${opp.organization}.\n\n` +
        `My core stack directly satisfies your roadmap: ${skillsList}. I deliver production-ready code with minimal onboarding time.\n\n` +
        `Would 10 minutes this week work for a brief intro?\n\n` +
        `Best regards,\n${userName}`;
    } else if (tone === 'Technical') {
      body =
        `Hi ${contact},\n\n` +
        `I noticed ${opp.organization}'s work on ${opp.title} and wanted to reach out regarding the technical scope.\n\n` +
        `Having engineered high-performance architectures utilizing ${skillsList}, I've solved the specific constraints this role requires:\n` +
        `• Offline-first synchronization with deterministic CRDT conflict resolution\n` +
        `• Strict typed contracts and automated CI performance benchmarking\n\n` +
        `Would you be open to reviewing a 5-minute technical brief?\n\n` +
        `Cheers,\n${userName}`;
    } else if (tone === 'Warm') {
      body =
        `Hello ${contact},\n\n` +
        `I’ve been following ${opp.organization}’s engineering growth and was excited to see the ${opp.title} opening.\n\n` +
        `With hands-on experience in ${skillsList}, I’d love to contribute to your team's mission and culture.\n\n` +
        `Looking forward to connecting!\n\n` +
        `Warm regards,\n${userName}`;
    } else {
      // Executive
      body =
        `Dear ${contact},\n\n` +
        `I am writing to express my interest in the ${opp.title} engagement at ${opp.organization}.\n\n` +
        `With extensive leadership across ${skillsList}, I specialize in building resilient systems that accelerate product delivery while maintaining enterprise reliability standards.\n\n` +
        `I welcome the opportunity to discuss how my background can support your strategic initiatives.\n\n` +
        `Sincerely,\n${userName}`;
    }

    return { subject, body };
  },
};
