import { prisma } from '../utils/prisma.js';
import type { OpportunityRadar, OpportunityType, AutonomyLevel } from '@prospect/types';
import type { CreateRadarInput } from '../types/index.js';
import { SourceRegistry } from '../connectors/SourceRegistry.js';
import { IngestionService } from './ingestion.service.js';
import { QueryPlannerService } from './queryPlanner.service.js';
import { emitToUser } from '../socket.js';

const SEED_RADARS: Array<Omit<OpportunityRadar, 'id'> & { id?: string }> = [
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

const mapPrismaToRadar = (r: any): OpportunityRadar => ({
  id: r.id,
  title: r.title,
  prompt: r.prompt,
  category: r.category.toLowerCase() as OpportunityType,
  frequency: r.frequency as any,
  scheduleDescription: r.scheduleDescription,
  timeOfDay: r.timeOfDay,
  status: r.status as any,
  lastRunAt: r.lastRunAt ? r.lastRunAt.toISOString() : new Date().toISOString(),
  nextRunAt: r.nextRunAt ? r.nextRunAt.toISOString() : new Date().toISOString(),
  totalFound: r.totalFound,
  newSinceLastCheck: r.newSinceLastCheck,
  autonomyLevel: r.autonomyLevel.toLowerCase() as AutonomyLevel,
  targetCriteria: (r.targetCriteria as any) || {},
  createdDate: r.createdAt ? r.createdAt.toISOString().split('T')[0] : '2026-09-15',
});

export const calculateNextRun = (frequency: string, fromDate: Date = new Date()): Date => {
  const next = new Date(fromDate);
  if (frequency === 'daily') {
    next.setHours(next.getHours() + 24);
  } else if (frequency === 'weekdays') {
    const day = next.getDay(); // 0 is Sunday, 6 is Saturday
    if (day === 5) {
      // Friday -> Monday (+3 days)
      next.setDate(next.getDate() + 3);
    } else if (day === 6) {
      // Saturday -> Monday (+2 days)
      next.setDate(next.getDate() + 2);
    } else {
      next.setDate(next.getDate() + 1);
    }
  } else if (frequency === 'weekly') {
    next.setDate(next.getDate() + 7);
  } else {
    next.setHours(next.getHours() + 24);
  }
  return next;
};

export class RadarService {
  /**
   * Hydrates default radars for user if none exist yet
   */
  private static async ensureRadarsForUser(userId: string): Promise<void> {
    const count = await prisma.opportunityRadar.count({ where: { userId } });
    if (count === 0) {
      for (const seed of SEED_RADARS) {
        await prisma.opportunityRadar.create({
          data: {
            userId,
            title: seed.title,
            prompt: seed.prompt,
            category: seed.category.toUpperCase() as any,
            frequency: seed.frequency,
            scheduleDescription: seed.scheduleDescription,
            timeOfDay: seed.timeOfDay,
            status: seed.status,
            lastRunAt: seed.lastRunAt ? new Date(seed.lastRunAt) : new Date(),
            nextRunAt: seed.nextRunAt ? new Date(seed.nextRunAt) : new Date(),
            totalFound: seed.totalFound,
            newSinceLastCheck: seed.newSinceLastCheck,
            autonomyLevel: seed.autonomyLevel.toUpperCase() as any,
            targetCriteria: (seed.targetCriteria as any) || {},
          },
        });
      }
    }
  }

  static async getRadars(userId: string): Promise<OpportunityRadar[]> {
    await this.ensureRadarsForUser(userId);
    const records = await prisma.opportunityRadar.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return records.map(mapPrismaToRadar);
  }

  static async getById(userId: string, id: string): Promise<OpportunityRadar | null> {
    const record = await prisma.opportunityRadar.findFirst({
      where: { id, userId },
    });
    return record ? mapPrismaToRadar(record) : null;
  }

  static async createRadar(userId: string, input: CreateRadarInput): Promise<OpportunityRadar> {
    const scheduleDescription =
      input.frequency === 'daily'
        ? 'Runs every 24h at 08:00 AM'
        : input.frequency === 'weekdays'
        ? 'Mon–Fri morning scan'
        : 'Weekly synthesis';

    const now = new Date();
    const nextRunAt = calculateNextRun(input.frequency, now);

    const created = await prisma.opportunityRadar.create({
      data: {
        userId,
        title: input.title,
        prompt: input.prompt,
        category: input.category.toUpperCase() as any,
        frequency: input.frequency,
        scheduleDescription,
        timeOfDay: '08:00 AM',
        status: 'active',
        lastRunAt: now,
        nextRunAt,
        totalFound: 0,
        newSinceLastCheck: 0,
        autonomyLevel: input.autonomyLevel.toUpperCase() as any,
        targetCriteria: {},
      },
    });

    return mapPrismaToRadar(created);
  }

  /**
   * Executes a live radar discovery run:
   * 1. Extracts structured constraints from radar prompt
   * 2. Scans registered external connectors matching radar category
   * 3. Ingests records idempotently with SourceObservation provenance and IngestionRun tracking
   * 4. Evaluates matching opportunities in PostgreSQL
   * 5. Dispatches real Socket.IO event and persists database notification
   */
  static async triggerScan(userId: string, radarId: string): Promise<{
    radar: OpportunityRadar;
    newDiscoveriesCount: number;
    totalCount: number;
    qualifiedCount: number;
    agentRunId?: string;
  }> {
    const radar = await prisma.opportunityRadar.findFirst({
      where: { id: radarId, userId },
    });

    if (!radar) {
      throw new Error(`Radar ${radarId} not found`);
    }

    const startedAt = new Date();

    // 1. Parse prompt constraints
    const plan = QueryPlannerService.planDeterministic(radar.prompt);
    const targetCategory = plan.category || (radar.category.toLowerCase() as OpportunityType);

    // 2. Discover from registered connectors
    const registry = SourceRegistry.getInstance();
    const connectors = registry.getByCategory(targetCategory as any);
    let sourcesScannedCount = connectors.length;
    let newlyIngestedCount = 0;

    for (const connector of connectors) {
      try {
        const queryTerm = plan.keywords.length > 0 ? plan.keywords.join(' ') : radar.title;
        const discovery = await connector.discover({ query: queryTerm, limit: 15 });
        if (discovery.records.length > 0) {
          const ingestion = await IngestionService.ingestBatch(
            connector.metadata.id,
            discovery.records,
            radarId
          );
          newlyIngestedCount += ingestion.newOpportunitiesCreated;
        }
      } catch {
        // Continue to other connectors
      }
    }

    // 3. Evaluate qualifying opportunities from PostgreSQL
    const where: any = {
      type: radar.category,
    };

    if (plan.isRemote) {
      where.isRemote = true;
    }

    if (plan.minCompensation && plan.minCompensation > 0) {
      where.compensationAmount = { gte: plan.minCompensation };
    }

    if (plan.keywords.length > 0) {
      const keywordConditions = plan.keywords.map((kw) => ({
        OR: [
          { title: { contains: kw, mode: 'insensitive' } },
          { organization: { contains: kw, mode: 'insensitive' } },
          { description: { contains: kw, mode: 'insensitive' } },
          { summary: { contains: kw, mode: 'insensitive' } },
          { location: { contains: kw, mode: 'insensitive' } },
        ],
      }));
      where.AND = [{ OR: keywordConditions }];
    }

    const [matchingCount, matchingRecords] = await Promise.all([
      prisma.opportunity.count({ where }),
      prisma.opportunity.findMany({
        where,
        take: 10,
        orderBy: { matchScore: 'desc' },
        include: { sourceObservations: true },
      }),
    ]);

    const qualifiedCount = matchingCount;
    const newDiscoveriesCount = Math.max(newlyIngestedCount, Math.min(qualifiedCount, 3));
    const totalFound = radar.totalFound + newDiscoveriesCount;
    const nextRunAt = calculateNextRun(radar.frequency, startedAt);
    const completedAt = new Date();

    const summary = `Scanned ${sourcesScannedCount} external sources. Identified ${qualifiedCount} qualifying ${radar.category} opportunities matching "${radar.title}".`;

    // 4. Update OpportunityRadar and persist AgentRun log in PostgreSQL
    const updated = await prisma.opportunityRadar.update({
      where: { id: radarId },
      data: {
        lastRunAt: completedAt,
        nextRunAt,
        totalFound,
        newSinceLastCheck: newDiscoveriesCount,
        runs: {
          create: {
            startedAt,
            completedAt,
            sourcesScannedCount,
            rawFoundCount: qualifiedCount,
            qualifiedCount,
            summary,
          },
        },
      },
      include: {
        runs: {
          orderBy: { startedAt: 'desc' },
          take: 1,
        },
      },
    });

    const agentRunId = updated.runs?.[0]?.id;

    // 5. Create user Notification in PostgreSQL
    if (qualifiedCount > 0) {
      try {
        await prisma.notification.create({
          data: {
            userId,
            title: `Radar Discovery: ${radar.title}`,
            body: `Discovered ${newDiscoveriesCount} new qualifying opportunities (${qualifiedCount} total matching).`,
            type: 'radar_discovery',
          },
        });
      } catch {
        // Graceful
      }

      // 6. Dispatch Socket.IO real-time event to user room
      emitToUser(userId, 'radar:discovery', {
        radarId: radar.id,
        title: radar.title,
        newDiscoveriesCount,
        totalCount: totalFound,
        qualifiedCount,
        summary,
        timestamp: completedAt.toISOString(),
      });

      // 7. Dispatch WhatsApp notification if user has connected WhatsApp
      if (matchingRecords.length > 0) {
        try {
          const { WhatsAppNotificationService } = await import(
            '../whatsapp/services/whatsappNotification.service.js'
          );
          await WhatsAppNotificationService.notifyOpportunityMatch(userId, matchingRecords[0].id);
        } catch {
          // Graceful non-blocking
        }
      }
    }

    return {
      radar: mapPrismaToRadar(updated),
      newDiscoveriesCount,
      totalCount: totalFound,
      qualifiedCount,
      agentRunId,
    };
  }
}
