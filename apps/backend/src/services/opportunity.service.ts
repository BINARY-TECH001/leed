import { prisma } from '../utils/prisma.js';
import type { Opportunity } from '@prospect/types';
import type { OpportunityQueryFilters } from '../types/index.js';
import { ArbeitnowConnector } from '../connectors/ArbeitnowConnector.js';
import { IngestionService } from './ingestion.service.js';

const mapPrismaToDomain = (record: any): Opportunity => {
  return {
    id: record.id,
    type: record.type.toLowerCase() as any,
    title: record.title,
    organization: record.organization,
    organizationLogo: record.organizationLogo || undefined,
    location: record.location,
    isRemote: record.isRemote,
    remoteType: (record.remoteType as any) || undefined,
    compensation: record.compensation,
    compensationAmount: record.compensationAmount || undefined,
    deadline: record.deadline ? record.deadline.toISOString() : undefined,
    contactPerson: record.contactPerson || undefined,
    contactEmail: record.contactEmail || undefined,
    contactRole: record.contactRole || undefined,
    source: record.source,
    sourceType: record.sourceType as any,
    originalUrl: record.originalUrl,
    description: record.description,
    summary: record.summary,
    requirements: (record.requirements as any) || [],
    matchScore: record.matchScore,
    matchExplanation: record.matchExplanation,
    matchPros: record.matchPros || [],
    matchCons: record.matchCons || [],
    status: record.status.toLowerCase() as any,
    nextBestAction: record.nextBestAction as any,
    freshness: record.freshness as any,
    tags: record.tags || [],
    discoveredAt: record.discoveredAt ? record.discoveredAt.toISOString() : new Date().toISOString(),
    lastInteractedAt: record.lastInteractedAt ? record.lastInteractedAt.toISOString() : undefined,
    timeline: (record.timeline as any) || [],
    notes: record.notes || undefined,
    metadata: {
      sourceObservations: record.sourceObservations || [],
      isVerified: record.isVerified,
      canonicalUrl: record.canonicalUrl,
      lastVerifiedAt: record.lastVerifiedAt,
      ...(record.metadata || {}),
    },
  };
};

export class OpportunityService {
  private static isHydrated = false;

  /**
   * Hydrates the PostgreSQL database with initial real opportunities from live connectors if empty
   */
  static async ensureSeeded(): Promise<void> {
    if (this.isHydrated) return;

    try {
      const count = await prisma.opportunity.count();
      if (count === 0) {
        console.log('🔄 Initializing database with live verified opportunities from Arbeitnow API...');
        const connector = new ArbeitnowConnector();
        const discovery = await connector.discover({ limit: 25 });
        if (discovery.records && discovery.records.length > 0) {
          const ingestion = await IngestionService.ingestBatch('arbeitnow', discovery.records);
          console.log(`✅ Live ingestion complete: ${ingestion.newOpportunitiesCreated} real opportunities ingested.`);
        }
      }
      this.isHydrated = true;
    } catch (err) {
      console.warn('⚠️ Notice: Could not complete initial connector sync (proceeding with clean database):', err);
      this.isHydrated = true;
    }
  }

  static async searchOpportunities(filters: OpportunityQueryFilters): Promise<{
    opportunities: Opportunity[];
    total: number;
    page: number;
    limit: number;
  }> {
    await this.ensureSeeded();

    const where: any = {};

    // 1. Category / Type filter
    const cat = filters.category || filters.type;
    if (cat && cat !== 'all') {
      where.type = cat.toUpperCase();
    }

    // 2. Remote filter
    if (filters.remoteOnly) {
      where.isRemote = true;
    }

    // 3. Compensation Floor
    if (filters.minCompRate && filters.minCompRate > 0) {
      where.compensationAmount = { gte: filters.minCompRate };
    }

    // 4. High fit filter
    if (filters.highFitOnly) {
      where.matchScore = { gte: 90 };
    }

    // 5. Location filter
    if (filters.location && filters.location.trim()) {
      where.location = { contains: filters.location.trim(), mode: 'insensitive' };
    }

    // 6. Organization filter
    if (filters.organization && filters.organization.trim()) {
      where.organization = { contains: filters.organization.trim(), mode: 'insensitive' };
    }

    // 7. Tags filter
    if (filters.tags && filters.tags.length > 0) {
      where.tags = { hasSome: filters.tags };
    }

    // 8. Query / Keywords search
    if (filters.keywords && filters.keywords.length > 0) {
      where.AND = where.AND || [];
      const keywordConditions = filters.keywords.map((kw) => ({
        OR: [
          { title: { contains: kw, mode: 'insensitive' } },
          { organization: { contains: kw, mode: 'insensitive' } },
          { description: { contains: kw, mode: 'insensitive' } },
          { summary: { contains: kw, mode: 'insensitive' } },
          { location: { contains: kw, mode: 'insensitive' } },
        ],
      }));
      where.AND.push({ OR: keywordConditions });
    } else if (filters.query && filters.query.trim()) {
      const q = filters.query.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { organization: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { summary: { contains: q, mode: 'insensitive' } },
        { location: { contains: q, mode: 'insensitive' } },
      ];
    }

    // 9. Ordering
    let orderBy: any = { matchScore: 'desc' };
    if (filters.sort === 'comp') {
      orderBy = { compensationAmount: 'desc' };
    } else if (filters.sort === 'newest') {
      orderBy = { discoveredAt: 'desc' };
    } else if (filters.sort === 'org') {
      orderBy = { organization: 'asc' };
    }

    // 10. Pagination
    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const limit = filters.limit && filters.limit > 0 ? Math.min(filters.limit, 100) : 50;
    const skip = (page - 1) * limit;

    const [total, records] = await Promise.all([
      prisma.opportunity.count({ where }),
      prisma.opportunity.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          sourceObservations: {
            orderBy: { firstSeenAt: 'desc' },
          },
        },
      }),
    ]);

    const opportunities = records.map(mapPrismaToDomain);

    return {
      opportunities,
      total,
      page,
      limit,
    };
  }

  static async getById(id: string): Promise<Opportunity | null> {
    await this.ensureSeeded();

    const record = await prisma.opportunity.findUnique({
      where: { id },
      include: {
        sourceObservations: {
          orderBy: { firstSeenAt: 'desc' },
        },
      },
    });

    if (!record) return null;
    return mapPrismaToDomain(record);
  }
}
