import type { Opportunity } from '@prospect/types';

export class AIService {
  /**
   * Interprets natural language search queries and extracts structured search constraints
   */
  static interpretSearchPrompt(prompt: string): {
    extractedKeywords: string[];
    suggestedCategory?: string;
    isRemoteInferred: boolean;
    minRateInferred?: number;
    intentBadges: string[];
  } {
    const lower = prompt.toLowerCase();
    const badges: string[] = [];
    const keywords: string[] = [];

    let isRemoteInferred = false;
    if (lower.includes('remote') || lower.includes('anywhere') || lower.includes('wfh')) {
      isRemoteInferred = true;
      badges.push('⚡ Remote Work Verified');
    }

    let minRateInferred: number | undefined;
    const rateMatch = lower.match(/\$?(\d+)\s*(\/hr|\/hour|k|\+)/);
    if (rateMatch) {
      const num = parseInt(rateMatch[1], 10);
      minRateInferred = num;
      badges.push(`💰 Rate Floor ≥ $${num}/hr`);
    }

    let suggestedCategory: string | undefined;
    if (lower.includes('contract')) suggestedCategory = 'contract';
    else if (lower.includes('grant')) suggestedCategory = 'grant';
    else if (lower.includes('lead')) suggestedCategory = 'lead';
    else if (lower.includes('freelance')) suggestedCategory = 'freelance';
    else if (lower.includes('scholarship')) suggestedCategory = 'scholarship';
    else if (lower.includes('job') || lower.includes('full-time') || lower.includes('staff')) suggestedCategory = 'job';

    if (suggestedCategory) {
      badges.push(`🎯 Type: ${suggestedCategory.toUpperCase()}`);
    }

    // Extract core skills
    ['react native', 'expo', 'typescript', 'rust', 'crdt', 'offline', 'ai', 'ledger', 'node'].forEach((skill) => {
      if (lower.includes(skill)) {
        keywords.push(skill);
      }
    });

    if (badges.length === 0) {
      badges.push('🎯 Primary CV Calibrated', '⚡ Global Opportunities');
    }

    return {
      extractedKeywords: keywords,
      suggestedCategory,
      isRemoteInferred,
      minRateInferred,
      intentBadges: badges,
    };
  }

  /**
   * Generates a tailored pitch proposal draft according to specified tone and channel
   */
  static generatePitch(params: {
    opportunity: Opportunity;
    tone: 'Executive' | 'Direct' | 'Technical' | 'Warm';
    channel: 'email' | 'linkedin' | 'followup';
    cvSkills: string[];
    userName: string;
  }): { subject: string; body: string } {
    const { opportunity: opp, tone, channel, cvSkills, userName } = params;
    const contact = opp.contactPerson?.split(' ')[0] || `${opp.organization} Team`;
    const skillsList = cvSkills && cvSkills.length > 0 ? cvSkills.slice(0, 3).join(', ') : 'React Native, Expo, TypeScript';

    const subject =
      channel === 'followup'
        ? `Following up: ${opp.title} — ${opp.organization}`
        : `Re: ${opp.title} — Mobile Architecture Alignment`;

    let body = '';

    switch (tone) {
      case 'Direct':
        body =
          `Hi ${contact},\n\n` +
          `I am reaching out directly regarding the ${opp.title} initiative at ${opp.organization}.\n\n` +
          `My production background focuses directly on your core requirements: ${skillsList}. I deliver rapid, zero-friction execution.\n\n` +
          `Are you open to a brief 10-minute sync this week?\n\n` +
          `Best regards,\n${userName}`;
        break;

      case 'Technical':
        body =
          `Hi ${contact},\n\n` +
          `I reviewed ${opp.organization}'s requirements for ${opp.title} with high interest.\n\n` +
          `Having architected distributed systems with ${skillsList}, I have direct answers to the technical challenges highlighted in the role:\n` +
          `• Zero-regression state synchronization and deterministic offline queues\n` +
          `• Strict TypeScript strict-mode adherence with automated CI performance regression tracking\n\n` +
          `Would love to share a short technical architecture brief.\n\n` +
          `Best,\n${userName}`;
        break;

      case 'Warm':
        body =
          `Hello ${contact},\n\n` +
          `I’ve been admiring ${opp.organization}’s product velocity and was excited to discover the ${opp.title} opportunity.\n\n` +
          `With hands-on expertise across ${skillsList}, I believe my background aligns strongly with your current engineering phase.\n\n` +
          `I'd love to connect!\n\n` +
          `Warm regards,\n${userName}`;
        break;

      case 'Executive':
      default:
        body =
          `Dear ${contact},\n\n` +
          `I am writing to express my interest in the ${opp.title} engagement at ${opp.organization}.\n\n` +
          `With proven technical leadership across ${skillsList}, I specialize in helping engineering organizations deliver mission-critical software on accelerated roadmaps.\n\n` +
          `I would appreciate the chance to discuss how my experience can support your team's objectives.\n\n` +
          `Sincerely,\n${userName}`;
        break;
    }

    return { subject, body };
  }
}
