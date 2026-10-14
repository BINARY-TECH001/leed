import type { OpportunityRadar } from '@prospect/types';
import type { CreateRadarInput } from '../types/index.js';

const SEED_RADARS: OpportunityRadar[] = [
  {
    id: 'radar-1',
    title: 'High-Comp Mobile Contracts ($110+/hr)',
    prompt: 'Remote React Native, Expo 57, and mobile systems contracts paying at least $110/hr in US/Europe.',
    category: 'contract',
    frequency: 'daily',
    scheduleDescription: 'Runs every 24h at 08:00 AM',
    timeOfDay: '08:00 AM',
    status: 'active',
    lastRunAt: '2026-10-12T08:00:00Z',
    nextRunAt: '2026-10-13T08:00:00Z',
    totalFound: 14,
    newSinceLastCheck: 3,
    autonomyLevel: 'approve',
    targetCriteria: {
      compensationMin: '$110/hr',
      remote: true,
    },
    createdDate: '2026-09-15',
  },
  {
    id: 'radar-2',
    title: 'Fintech AI Venture Client Leads',
    prompt: 'Seed to Series B fintech startups hiring fractional leads or consulting partners for offline ledger architecture.',
    category: 'lead',
    frequency: 'weekdays',
    scheduleDescription: 'Mon–Fri morning scan',
    timeOfDay: '07:30 AM',
    status: 'active',
    lastRunAt: '2026-10-11T07:30:00Z',
    nextRunAt: '2026-10-14T07:30:00Z',
    totalFound: 8,
    newSinceLastCheck: 1,
    autonomyLevel: 'assist',
    targetCriteria: {
      remote: true,
    },
    createdDate: '2026-09-20',
  },
  {
    id: 'radar-3',
    title: 'Staff/Principal Mobile Roles',
    prompt: 'Staff and Principal mobile architect roles with significant equity packages and async remote culture.',
    category: 'job',
    frequency: 'weekly',
    scheduleDescription: 'Weekly synthesis on Monday',
    timeOfDay: '09:00 AM',
    status: 'active',
    lastRunAt: '2026-10-08T09:00:00Z',
    nextRunAt: '2026-10-15T09:00:00Z',
    totalFound: 22,
    newSinceLastCheck: 0,
    autonomyLevel: 'approve',
    targetCriteria: {
      remote: true,
    },
    createdDate: '2026-09-10',
  },
];

let radarsCache = [...SEED_RADARS];

export class RadarService {
  static async getRadars(): Promise<OpportunityRadar[]> {
    return radarsCache;
  }

  static async getById(id: string): Promise<OpportunityRadar | null> {
    return radarsCache.find((r) => r.id === id) || null;
  }

  static async createRadar(input: CreateRadarInput): Promise<OpportunityRadar> {
    const newRadar: OpportunityRadar = {
      id: `radar-${Date.now()}`,
      title: input.title,
      prompt: input.prompt,
      category: input.category,
      frequency: input.frequency,
      scheduleDescription:
        input.frequency === 'daily'
          ? 'Runs every 24h at 08:00 AM'
          : input.frequency === 'weekdays'
          ? 'Mon–Fri morning scan'
          : 'Weekly synthesis',
      timeOfDay: '08:00 AM',
      status: 'active',
      lastRunAt: new Date().toISOString(),
      nextRunAt: new Date(Date.now() + 86400000).toISOString(),
      totalFound: 4,
      newSinceLastCheck: 4,
      autonomyLevel: input.autonomyLevel,
      targetCriteria: {},
      createdDate: new Date().toISOString().split('T')[0],
    };

    radarsCache.unshift(newRadar);
    return newRadar;
  }

  static async triggerScan(radarId: string): Promise<{
    radar: OpportunityRadar;
    newDiscoveriesCount: number;
    totalCount: number;
  }> {
    const radar = radarsCache.find((r) => r.id === radarId);
    if (!radar) {
      throw new Error(`Radar ${radarId} not found`);
    }

    radar.lastRunAt = new Date().toISOString();
    radar.totalFound += 2;
    radar.newSinceLastCheck = 2;

    return {
      radar,
      newDiscoveriesCount: 2,
      totalCount: radar.totalFound,
    };
  }
}
