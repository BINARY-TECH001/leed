import type { Opportunity } from '@prospect/types';
import { QueryPlannerService } from './queryPlanner.service.js';

export interface ProfileMatchResult {
  matchScore: number; // 0 to 100
  matchedSkills: string[];
  missingSkills: string[];
  alignmentSummary: string;
  recommendations: string[];
}

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
    const plan = QueryPlannerService.planDeterministic(prompt);

    return {
      extractedKeywords: plan.keywords,
      suggestedCategory: plan.category,
      isRemoteInferred: plan.isRemote ?? false,
      minRateInferred: plan.minCompensation,
      intentBadges: plan.intentBadges,
    };
  }

  /**
   * Deeply analyzes candidate profile skills against an opportunity's description,
   * requirements, and tags, returning a deterministic match score and skill breakdown.
   */
  static calculateMatch(params: {
    candidateSkills: string[];
    targetOpportunity: Opportunity;
  }): ProfileMatchResult {
    const { candidateSkills, targetOpportunity: opp } = params;
    const oppText = `${opp.title} ${opp.description} ${opp.summary} ${(opp.tags || []).join(' ')} ${(opp.requirements || []).map((r) => r.text).join(' ')}`.toLowerCase();

    const matchedSkills: string[] = [];
    const missingSkills: string[] = [];

    // Check candidate skills against opportunity text
    for (const skill of candidateSkills) {
      const cleanSkill = skill.trim().toLowerCase();
      if (!cleanSkill) continue;
      if (oppText.includes(cleanSkill)) {
        matchedSkills.push(skill);
      }
    }

    // Identify requirements mentioned in opportunity that candidate doesn't list
    const candidateSkillsLower = candidateSkills.map((s) => s.toLowerCase());
    for (const req of opp.requirements || []) {
      const reqTextLower = req.text.toLowerCase();
      const hasSkill = candidateSkillsLower.some((cs) => reqTextLower.includes(cs));
      if (!hasSkill && !req.isMatched) {
        missingSkills.push(req.text);
      }
    }

    // Deterministic match score calculation
    let matchScore = 50;
    if (candidateSkills.length > 0) {
      const matchRatio = matchedSkills.length / Math.max(candidateSkills.length, 1);
      matchScore = Math.min(100, Math.round(40 + matchRatio * 50));
    }

    if (opp.isRemote) {
      matchScore = Math.min(100, matchScore + 5);
    }

    const alignmentSummary =
      matchedSkills.length >= 2
        ? `Strong technical alignment on ${matchedSkills.slice(0, 3).join(', ')}. Candidate profile fulfills primary domain requirements for ${opp.title}.`
        : `Moderate alignment. Opportunity emphasizes specialized criteria that may require tailored portfolio highlights.`;

    const recommendations = [
      `Emphasize verified production outcomes in ${matchedSkills[0] || 'core stack'} in your opening statement.`,
      `Reference ${opp.organization}'s specific operational focus in your application.`,
    ];

    return {
      matchScore,
      matchedSkills,
      missingSkills: missingSkills.slice(0, 3),
      alignmentSummary,
      recommendations,
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

  /**
   * Generates a tailored pitch proposal asynchronously, attempting Gemini AI generation
   * if GEMINI_API_KEY is configured, otherwise falling back smoothly to deterministic templates.
   */
  static async generatePitchAsync(params: {
    opportunity: Opportunity;
    tone: 'Executive' | 'Direct' | 'Technical' | 'Warm';
    channel: 'email' | 'linkedin' | 'followup';
    cvSkills: string[];
    userName: string;
  }): Promise<{ subject: string; body: string; generatedBy: 'gemini' | 'template' }> {
    const templateResult = this.generatePitch(params);

    if (!process.env.GEMINI_API_KEY) {
      return { ...templateResult, generatedBy: 'template' };
    }

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      const model = process.env.AI_MODEL || 'gemini-2.0-flash';
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const prompt = `You are an elite talent representative and executive career strategist.
Generate a tailored ${params.channel} outreach message in a ${params.tone} tone.
Candidate Name: ${params.userName}
Candidate Key Skills: ${params.cvSkills.join(', ')}
Target Opportunity Title: ${params.opportunity.title}
Target Organization: ${params.opportunity.organization}
Location: ${params.opportunity.location}
Compensation: ${params.opportunity.compensation}
Details: ${params.opportunity.description}

Output strict JSON with:
{
  "subject": "Email/Message Subject Line",
  "body": "Complete message text ready to send"
}`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.3 },
        }),
        signal: AbortSignal.timeout(6000),
      });

      if (!res.ok) {
        return { ...templateResult, generatedBy: 'template' };
      }

      const json = (await res.json()) as any;
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        return { ...templateResult, generatedBy: 'template' };
      }

      const parsed = JSON.parse(text);
      if (parsed.subject && parsed.body) {
        return {
          subject: parsed.subject,
          body: parsed.body,
          generatedBy: 'gemini',
        };
      }

      return { ...templateResult, generatedBy: 'template' };
    } catch {
      return { ...templateResult, generatedBy: 'template' };
    }
  }
}
