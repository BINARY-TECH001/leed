import type { OpportunityType } from '@prospect/types';
import type { QueryPlan } from '../types/index.js';

const KNOWN_SKILLS = [
  'react native',
  'expo',
  'typescript',
  'javascript',
  'python',
  'rust',
  'golang',
  'go',
  'node',
  'nodejs',
  'sqlite',
  'postgres',
  'postgresql',
  'crdt',
  'offline',
  'ai',
  'llm',
  'graphql',
  'docker',
  'kubernetes',
  'next.js',
  'nextjs',
  'tailwind',
  'aws',
  'swift',
  'kotlin',
  'ble',
  'bluetooth',
  'ledger',
  'security',
];

const KNOWN_ORGS = [
  'figma',
  'linear',
  'vercel',
  'stripe',
  'github',
  'openai',
  'anthropic',
  'google',
  'meta',
  'apple',
  'fintech velocity',
  'northline studio',
  'apex logistics',
  'ethereum foundation',
];

const KNOWN_LOCATIONS = [
  'san francisco',
  'new york',
  'berlin',
  'london',
  'lagos',
  'ibadan',
  'remote',
  'europe',
  'emea',
  'us',
  'usa',
  'germany',
  'uk',
  'canada',
  'global',
];

const STOP_WORDS = new Set([
  'find',
  'me',
  'search',
  'looking',
  'for',
  'want',
  'need',
  'show',
  'give',
  'get',
  'opportunities',
  'opportunity',
  'lead',
  'leads',
  'job',
  'jobs',
  'contract',
  'contracts',
  'grant',
  'grants',
  'freelance',
  'paying',
  'at',
  'least',
  'minimum',
  'a',
  'an',
  'the',
  'in',
  'with',
  'from',
  'to',
  'of',
  'and',
  'or',
  'per',
  'hour',
  'hr',
  'year',
  'yr',
  'annual',
  'annually',
  'around',
  'above',
  'over',
]);

export class QueryPlannerService {
  /**
   * Translates a natural language search prompt into structured query constraints
   * deterministically without requiring external AI services.
   */
  static planDeterministic(prompt: string): QueryPlan {
    const raw = prompt.trim();
    const lower = raw.toLowerCase();
    const badges: string[] = [];
    const skills: string[] = [];
    const organizations: string[] = [];

    // 1. Detect Category / OpportunityType
    let category: OpportunityType | undefined;
    if (/\b(?:contract|contracts|contractor)\b/.test(lower)) {
      category = 'contract';
    } else if (/\b(?:grant|grants|fellowship|endowment)\b/.test(lower)) {
      category = 'grant';
    } else if (/\b(?:freelance|gig|bounties|bounty)\b/.test(lower)) {
      category = 'freelance';
    } else if (/\b(?:lead|leads|prospect|prospects|tender|rfp)\b/.test(lower)) {
      category = 'lead';
    } else if (/\b(?:scholarship|scholarships|tuition)\b/.test(lower)) {
      category = 'scholarship';
    } else if (/\b(?:consulting|consultant|advisory)\b/.test(lower)) {
      category = 'consulting';
    } else if (/\b(?:partner|partnership|affiliate)\b/.test(lower)) {
      category = 'partner';
    } else if (/\b(?:job|jobs|full-time|fulltime|permanent|staff|senior|lead engineer)\b/.test(lower)) {
      category = 'job';
    }

    if (category) {
      badges.push(`🎯 Type: ${category.toUpperCase()}`);
    }

    // 2. Detect Remote Intent
    let isRemote: boolean | undefined;
    if (/\b(?:remote|wfh|work from home|anywhere|telecommute|distributed|worldwide|global)\b/.test(lower)) {
      isRemote = true;
      badges.push('⚡ Remote Work Verified');
    } else if (/\b(?:on-site|onsite|in-person|in person|in office)\b/.test(lower)) {
      isRemote = false;
      badges.push('🏢 On-Site');
    }

    // 3. Detect Compensation
    let minCompensation: number | undefined;
    let compensationType: 'hourly' | 'annual' | 'fixed' | undefined;

    // Hourly patterns: "$100/hr", "120 / hour", "150/hr", "$100-150/hr"
    const hourlyMatch = lower.match(/\$?(\d+)(?:\s*-\s*\$?\d+)?\s*(?:\/hr|\/hour|per hour|hr\b)/);
    // Annual patterns: "$150k", "$150,000", "200k/yr", "$180k"
    const annualKMatch = lower.match(/\$?(\d+)\s*k\b/);
    const annualExactMatch = lower.match(/\$?(\d{2,3}),(\d{3})\b/);
    // Fixed grant, project or funding: "$50,000 grant", "25000 fixed", "$50,000 funding"
    const fixedMatch = lower.match(/\$?(\d+)(?:,(\d{3}))?\s*(?:grant|fixed|project|retainer|funding|bounty|prize)/);
    const isGrantOrFixedScope =
      category === 'grant' ||
      category === 'scholarship' ||
      /\b(?:grant|grants|funding|bounty|prize|fixed|endowment|scholarship)\b/.test(lower);

    if (hourlyMatch) {
      minCompensation = parseInt(hourlyMatch[1], 10);
      compensationType = 'hourly';
      badges.push(`💰 Rate Floor ≥ $${minCompensation}/hr`);
    } else if (isGrantOrFixedScope) {
      if (annualExactMatch) {
        minCompensation = parseInt(`${annualExactMatch[1]}${annualExactMatch[2]}`, 10);
      } else if (annualKMatch) {
        minCompensation = parseInt(annualKMatch[1], 10) * 1000;
      } else if (fixedMatch) {
        const thousands = fixedMatch[2] ? `${fixedMatch[1]}${fixedMatch[2]}` : fixedMatch[1];
        const val = parseInt(thousands, 10);
        minCompensation = val < 1000 ? val * 1000 : val;
      }
      if (minCompensation) {
        compensationType = 'fixed';
        badges.push(`💰 Minimum Funding ≥ $${minCompensation.toLocaleString()}`);
      }
    } else if (annualKMatch) {
      minCompensation = parseInt(annualKMatch[1], 10) * 1000;
      compensationType = 'annual';
      badges.push(`💰 Minimum Comp ≥ $${(minCompensation / 1000).toFixed(0)}k/yr`);
    } else if (annualExactMatch) {
      minCompensation = parseInt(`${annualExactMatch[1]}${annualExactMatch[2]}`, 10);
      compensationType = 'annual';
      badges.push(`💰 Minimum Comp ≥ $${minCompensation.toLocaleString()}/yr`);
    } else if (fixedMatch) {
      const thousands = fixedMatch[2] ? `${fixedMatch[1]}${fixedMatch[2]}` : fixedMatch[1];
      const val = parseInt(thousands, 10);
      minCompensation = val < 1000 ? val * 1000 : val;
      compensationType = 'fixed';
      badges.push(`💰 Minimum Scope ≥ $${minCompensation.toLocaleString()}`);
    }

    // 4. Detect Organizations
    for (const org of KNOWN_ORGS) {
      if (lower.includes(org)) {
        organizations.push(org);
        badges.push(`🏢 Org: ${org.charAt(0).toUpperCase() + org.slice(1)}`);
      }
    }
    // Also pattern match "at <Company>"
    const atMatch = raw.match(/\bat\s+([A-Z][a-zA-Z0-9&]+)(?:\s|$|,|\.)/);
    if (atMatch && atMatch[1]) {
      const extractedOrg = atMatch[1].trim();
      if (!organizations.some((o) => o.toLowerCase() === extractedOrg.toLowerCase())) {
        organizations.push(extractedOrg);
        badges.push(`🏢 Org: ${extractedOrg}`);
      }
    }

    // 5. Detect Locations
    let location: string | undefined;
    for (const loc of KNOWN_LOCATIONS) {
      if (loc !== 'remote' && lower.includes(loc)) {
        location = loc.replace(/\b\w/g, (c) => c.toUpperCase());
        badges.push(`📍 Location: ${location}`);
        break;
      }
    }
    // Pattern match "in <City/Country>"
    if (!location) {
      const inMatch = raw.match(/\bin\s+([A-Z][a-zA-Z\s]+?)(?:\s+(?:paying|with|for|at|\$)|$|,|\.)/);
      if (inMatch && inMatch[1]) {
        location = inMatch[1].trim();
        badges.push(`📍 Location: ${location}`);
      }
    }

    // 6. Detect Skills
    for (const skill of KNOWN_SKILLS) {
      // Word boundary check
      const regex = new RegExp(`\\b${skill.replace('.', '\\.')}\\b`, 'i');
      if (regex.test(lower)) {
        skills.push(skill);
      }
    }

    if (skills.length > 0) {
      badges.push(`🛠️ Skills: ${skills.slice(0, 3).join(', ')}`);
    }

    // 7. Clean keywords for full-text search
    // Extract tokens, remove punctuation, stop words, numbers, and currency symbols
    const tokens = lower
      .replace(/[^a-z0-9\s.-]/g, ' ')
      .split(/\s+/)
      .filter((token) => token.length > 1 && !STOP_WORDS.has(token) && !/^\d+k?$/.test(token));

    // Deduplicate tokens while maintaining order
    const keywordSet = new Set<string>();
    // Prioritize skills
    for (const s of skills) {
      keywordSet.add(s);
    }
    // Add organizations
    for (const o of organizations) {
      keywordSet.add(o.toLowerCase());
    }
    // Add remaining tokens
    for (const t of tokens) {
      keywordSet.add(t);
    }

    const keywords = Array.from(keywordSet);

    if (badges.length === 0) {
      badges.push('🎯 Primary CV Calibrated', '⚡ Global Opportunities');
    }

    return {
      originalPrompt: prompt,
      category,
      keywords,
      skills,
      isRemote,
      minCompensation,
      compensationType,
      location,
      organizations: organizations.length > 0 ? organizations : undefined,
      intentBadges: badges,
      confidence: 0.95,
      interpretedBy: 'deterministic_heuristic',
    };
  }

  /**
   * Plans query constraints using external AI if requested and available,
   * otherwise falling back immediately to deterministic heuristic.
   */
  static async plan(
    prompt: string,
    options?: { enableAI?: boolean }
  ): Promise<QueryPlan> {
    const deterministicPlan = this.planDeterministic(prompt);

    if (!options?.enableAI || !process.env.GEMINI_API_KEY) {
      return deterministicPlan;
    }

    try {
      // Optional AI model enrichment (e.g. Gemini 2.0 Flash)
      // When GEMINI_API_KEY is present and enabled, call the Google Generative AI API
      const apiKey = process.env.GEMINI_API_KEY;
      const model = process.env.AI_MODEL || 'gemini-2.0-flash';
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const systemPrompt = `You are a search query planner for a professional opportunity discovery platform.
Analyze the user's natural language request and output a strict JSON object with:
{
  "category": "job" | "freelance" | "lead" | "contract" | "scholarship" | "grant" | "partner" | "consulting" | null,
  "keywords": string[],
  "skills": string[],
  "isRemote": boolean | null,
  "minCompensation": number | null,
  "compensationType": "hourly" | "annual" | "fixed" | null,
  "location": string | null,
  "organizations": string[],
  "intentBadges": string[]
}
User Prompt: "${prompt}"`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
        }),
      });

      if (!response.ok) {
        return deterministicPlan;
      }

      const json = (await response.json()) as any;
      const content = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!content) return deterministicPlan;

      const parsed = JSON.parse(content);

      return {
        originalPrompt: prompt,
        category: parsed.category || deterministicPlan.category,
        keywords: parsed.keywords?.length > 0 ? parsed.keywords : deterministicPlan.keywords,
        skills: parsed.skills?.length > 0 ? parsed.skills : deterministicPlan.skills,
        isRemote: parsed.isRemote !== undefined && parsed.isRemote !== null ? parsed.isRemote : deterministicPlan.isRemote,
        minCompensation: parsed.minCompensation || deterministicPlan.minCompensation,
        compensationType: parsed.compensationType || deterministicPlan.compensationType,
        location: parsed.location || deterministicPlan.location,
        organizations: parsed.organizations?.length > 0 ? parsed.organizations : deterministicPlan.organizations,
        intentBadges: parsed.intentBadges?.length > 0 ? parsed.intentBadges : deterministicPlan.intentBadges,
        confidence: 0.98,
        interpretedBy: 'ai_model',
      };
    } catch {
      // Deterministic fallback guarantee
      return deterministicPlan;
    }
  }
}
