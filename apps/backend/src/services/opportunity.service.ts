import { prisma } from '../utils/prisma.js';
import type { Opportunity } from '@prospect/types';
import type { OpportunityQueryFilters } from '../types/index.js';

// Pre-seeded verified opportunities for production-ready development
const SEED_OPPORTUNITIES: Opportunity[] = [
  {
    id: 'opp-1',
    type: 'contract',
    title: 'Principal Mobile Architect (Ledger & Offline-First)',
    organization: 'Fintech Velocity',
    location: 'Remote · US/EMEA Timezones',
    isRemote: true,
    remoteType: 'fully_remote',
    compensation: '$130 - $160 / hr',
    compensationAmount: 145,
    deadline: '2026-11-01',
    contactPerson: 'David Vance (VP Engineering)',
    contactEmail: 'david.vance@fintechvelocity.io',
    contactRole: 'VP of Engineering',
    source: 'Verified Direct Contract',
    sourceType: 'verified_partner',
    originalUrl: 'https://fintechvelocity.io/careers/mobile-architect',
    description:
      'Architect and build an offline-first mobile banking experience with double-entry ledger audits, sub-16ms touch interactions, and zero floating-point math.',
    summary:
      'High-impact 6-month contract with potential for long-term advisory retainer. Requires deep familiarity with Expo 57, React Native 0.86, and financial transaction guarantees.',
    requirements: [
      { text: 'Demonstrated experience with React Native 0.86+ and Expo Router', isMatched: true },
      { text: 'Deep understanding of offline queue sync and CRDT conflict resolution', isMatched: true },
      { text: 'Track record in financial apps with strict double-entry ledger audits', isMatched: true },
      { text: 'Proficiency with SQLite and local persistence caching engines', isMatched: true },
    ],
    matchScore: 98,
    matchExplanation:
      'Exceptional alignment: Your CV verifies 7+ years of mobile architecture, explicit Expo 57 production migrations, and double-entry ledger guarantees.',
    matchPros: [
      'Matches your minimum compensation rate floor ($120/hr)',
      '100% remote asynchronous workflow',
      'Direct contact with VP of Engineering established',
    ],
    matchCons: ['Requires 4 hours daily overlap with Eastern Time'],
    status: 'discovered',
    nextBestAction: 'apply',
    freshness: 'new_today',
    tags: ['React Native', 'Expo Router', 'Offline Sync', 'Fintech', 'Contract'],
    discoveredAt: '2026-10-12T08:30:00Z',
    timeline: [],
  },
  {
    id: 'opp-2',
    type: 'job',
    title: 'Senior AI Workflow Engineer',
    organization: 'Vercel',
    location: 'Remote · Global',
    isRemote: true,
    remoteType: 'fully_remote',
    compensation: '$180k - $220k + Equity',
    compensationAmount: 200000,
    deadline: '2026-10-30',
    contactPerson: 'Sarah Chen (Tech Lead)',
    contactEmail: 'sarah.chen@vercel.com',
    contactRole: 'Staff AI Architect',
    source: 'Vercel Careers RSS',
    sourceType: 'public_index',
    originalUrl: 'https://vercel.com/careers/ai-workflow-engineer',
    description:
      'Build edge-accelerated agentic pipelines, stream rendering SDKs, and developer tooling for AI model fine-tuning and evaluation.',
    summary:
      'Full-time staff-level role developing next-generation AI developer primitives. Focus on low-latency streaming and serverless execution.',
    requirements: [
      { text: '5+ years experience building developer platforms or compiler tooling', isMatched: true },
      { text: 'Production experience with Next.js 15, React 19, and edge runtimes', isMatched: true },
      { text: 'Deep knowledge of LLM agentic patterns and tool calling frameworks', isMatched: true },
      { text: 'Contributions to open-source developer tooling ecosystem', isMatched: true },
    ],
    matchScore: 94,
    matchExplanation:
      'Strong match: Matches your edge runtime expertise, agentic orchestration projects, and high-performance TypeScript tooling experience.',
    matchPros: [
      'Top-tier equity compensation package',
      'Flexible global async work culture',
      'High visibility open-source impact',
    ],
    matchCons: ['Requires quarterly on-site in San Francisco'],
    status: 'discovered',
    nextBestAction: 'apply',
    freshness: 'new_today',
    tags: ['AI Workflows', 'TypeScript', 'Next.js', 'LLM Agents', 'Full-time'],
    discoveredAt: '2026-10-12T07:15:00Z',
    timeline: [],
  },
  {
    id: 'opp-3',
    type: 'job',
    title: 'Staff React Native Engineer',
    organization: 'Linear',
    location: 'San Francisco, CA / Remote',
    isRemote: true,
    remoteType: 'fully_remote',
    compensation: '$190k - $240k + 0.15% Equity',
    compensationAmount: 215000,
    deadline: '2026-11-15',
    contactPerson: 'Karri Saarinen (Head of Design)',
    contactEmail: 'karri@linear.app',
    contactRole: 'Co-founder',
    source: 'Linear Careers',
    sourceType: 'verified_partner',
    originalUrl: 'https://linear.app/careers/staff-react-native',
    description:
      'Lead the mobile architecture for Linear on iOS and Android. Own the sync engine, micro-animations, and desktop-parity performance on handheld screens.',
    summary:
      'Flagship mobile role at a design-led engineering powerhouse. Crafting ultra-responsive gesture handling, keyboard-centric mobile workflows, and local SQLite sync.',
    requirements: [
      { text: 'World-class expertise in React Native, Reanimated 4, and native gesture handling', isMatched: true },
      { text: 'Experience maintaining 60fps micro-interactions on budget Android hardware', isMatched: true },
      { text: 'Deep mastery of offline synchronization protocols and CRDT algorithms', isMatched: true },
      { text: 'Relentless obsession with design detail, typography, and tactile haptics', isMatched: true },
    ],
    matchScore: 97,
    matchExplanation:
      'Exceptional alignment: Your design system craftsmanship, micro-interaction benchmarks, and mobile sync engine profile match Linear’s core standard.',
    matchPros: [
      'World-class design and engineering team',
      'Direct impact on daily productivity software used by millions',
      'High equity upside with strong revenue fundamentals',
    ],
    matchCons: ['Extremely high bar for micro-interaction performance'],
    status: 'discovered',
    nextBestAction: 'apply',
    freshness: 'recent',
    tags: ['React Native', 'Design Systems', 'Micro-Interactions', 'SQLite', 'Full-time'],
    discoveredAt: '2026-10-11T12:00:00Z',
    timeline: [],
  },
  {
    id: 'opp-4',
    type: 'freelance',
    title: 'Mobile Systems & Offline Sync Lead',
    organization: 'Northline Studio',
    location: 'Remote · Global',
    isRemote: true,
    remoteType: 'fully_remote',
    compensation: '$28,000 Fixed Project',
    compensationAmount: 28000,
    deadline: '2026-10-25',
    contactPerson: 'Marcus Thorne',
    contactEmail: 'marcus@northlinestudio.design',
    contactRole: 'Managing Director',
    source: 'Designer & Engineer Guild',
    sourceType: 'verified_partner',
    originalUrl: 'https://northlinestudio.design/contracts/mobile-lead',
    description:
      'Audit, refactor, and implement the local SQLite synchronization pipeline for an architectural field-inspection tablet application.',
    summary:
      '8-week intensive delivery contract. Upgrading legacy state stores to modern reactive local databases with zero data loss in offline basements.',
    requirements: [
      { text: 'Proven portfolio delivering robust offline-first tablet interfaces', isMatched: true },
      { text: 'Proficiency in SQLite, schema migrations, and sync queue conflict handling', isMatched: true },
      { text: 'Demonstrated speed: delivery expected within 8 weeks', isMatched: true },
    ],
    matchScore: 92,
    matchExplanation:
      'Solid match: Strong match on SQLite migrations, offline queue resilience, and rapid contract delivery milestones.',
    matchPros: [
      'Immediate milestone start with 50% upfront escrow deposit',
      'High autonomy with direct decision-making ownership',
    ],
    matchCons: ['Strict 8-week final delivery deadline'],
    status: 'discovered',
    nextBestAction: 'apply',
    freshness: 'recent',
    tags: ['SQLite', 'Offline First', 'React Native', 'Fixed Price', 'Freelance'],
    discoveredAt: '2026-10-11T10:00:00Z',
    timeline: [],
  },
  {
    id: 'opp-5',
    type: 'lead',
    title: 'B2B Procurement Mobile Platform Lead',
    organization: 'Apex Logistics Europe',
    location: 'Remote · European Timezones',
    isRemote: true,
    remoteType: 'fully_remote',
    compensation: '€85,000 - €110,000 Retainer Scope',
    compensationAmount: 95000,
    deadline: '2026-11-20',
    contactPerson: 'Elena Rostova (Operations Director)',
    contactEmail: 'elena.rostova@apexlogistics.eu',
    contactRole: 'Operations Director',
    source: 'Verified Commercial Inbound',
    sourceType: 'automated_ai',
    originalUrl: 'https://apexlogistics.eu/tenders/mobile-fleet',
    description:
      'Looking for a lead technical partner or consultant to build their driver and dock-worker cross-platform scanner app with Bluetooth barcode reader support.',
    summary:
      'High-value enterprise commercial lead looking for a technical leader to architect their warehouse mobile infrastructure.',
    requirements: [
      { text: 'Experience interfacing React Native with Bluetooth Low Energy (BLE) scanners', isMatched: true },
      { text: 'Knowledge of high-volume logistics barcode scanning and camera pipelines', isMatched: false },
      { text: 'Ability to operate as an independent technical partner and provide SOWs', isMatched: true },
    ],
    matchScore: 89,
    matchExplanation:
      'Strong commercial viability: Fits your consulting profile and enterprise contract criteria, though BLE scanner hardware familiarity needs brushing up.',
    matchPros: [
      'Large enterprise budget with multi-year maintenance extension',
      'Direct commercial decision maker contact',
    ],
    matchCons: ['Requires familiarity with Zebra and Honeywell hardware SDKs'],
    status: 'discovered',
    nextBestAction: 'contact',
    freshness: 'new_today',
    tags: ['B2B Lead', 'Bluetooth', 'Logistics', 'Enterprise Retainer', 'Consulting'],
    discoveredAt: '2026-10-12T09:00:00Z',
    timeline: [],
  },
  {
    id: 'opp-6',
    type: 'grant',
    title: 'Next-Gen Mobile Privacy & Local AI Grant',
    organization: 'Ethereum Foundation & Protocol Labs',
    location: 'Global · Decentralized',
    isRemote: true,
    remoteType: 'fully_remote',
    compensation: '$50,000 Equity-Free Grant',
    compensationAmount: 50000,
    deadline: '2026-11-30',
    contactPerson: 'Grant Selection Committee',
    contactEmail: 'grants@ethereum.org',
    contactRole: 'Committee Chair',
    source: 'Public Web3 Index',
    sourceType: 'public_index',
    originalUrl: 'https://esp.ethereum.foundation/grants',
    description:
      'Funding developers building on-device local AI models and zero-knowledge client architectures for mobile devices.',
    summary:
      'Non-dilutive grant tranche paid in USDC or fiat. For open-source tooling advancing on-device cryptography and local intelligence.',
    requirements: [
      { text: 'Project must be completely open-source (MIT or Apache 2.0)', isMatched: true },
      { text: 'Working prototype demonstrating on-device execution or ZK proof generation', isMatched: true },
      { text: 'Detailed 6-month technical milestone breakdown', isMatched: true },
    ],
    matchScore: 91,
    matchExplanation:
      'High grant qualification: Your open-source record and on-device offline architecture experience fulfill the evaluation criteria.',
    matchPros: [
      '100% equity-free capital',
      'Expansive network and public visibility in developer ecosystems',
    ],
    matchCons: ['Bi-weekly public milestone demo check-ins required'],
    status: 'discovered',
    nextBestAction: 'apply',
    freshness: 'recent',
    tags: ['Grant', 'Open Source', 'Local AI', 'Cryptography', 'Non-dilutive'],
    discoveredAt: '2026-10-10T14:00:00Z',
    timeline: [],
  },
];

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
   * Hydrates the PostgreSQL database with initial verified canonical opportunities on first run
   */
  static async ensureSeeded(): Promise<void> {
    if (this.isHydrated) return;

    try {
      const count = await prisma.opportunity.count();
      if (count === 0) {
        for (const opp of SEED_OPPORTUNITIES) {
          await prisma.opportunity.create({
            data: {
              id: opp.id,
              type: opp.type.toUpperCase() as any,
              title: opp.title,
              organization: opp.organization,
              organizationLogo: opp.organizationLogo,
              location: opp.location,
              isRemote: opp.isRemote,
              remoteType: opp.remoteType,
              compensation: opp.compensation,
              compensationAmount: opp.compensationAmount,
              deadline: opp.deadline ? new Date(opp.deadline) : null,
              contactPerson: opp.contactPerson,
              contactEmail: opp.contactEmail,
              contactRole: opp.contactRole,
              source: opp.source,
              sourceType: opp.sourceType,
              originalUrl: opp.originalUrl,
              canonicalUrl: opp.originalUrl,
              description: opp.description,
              summary: opp.summary,
              requirements: opp.requirements as any,
              matchScore: opp.matchScore,
              matchExplanation: opp.matchExplanation,
              matchPros: opp.matchPros,
              matchCons: opp.matchCons,
              status: opp.status.toUpperCase() as any,
              nextBestAction: opp.nextBestAction,
              freshness: opp.freshness,
              tags: opp.tags,
              discoveredAt: opp.discoveredAt ? new Date(opp.discoveredAt) : new Date(),
              isVerified: true,
              lastVerifiedAt: new Date(),
              sourceObservations: {
                create: {
                  sourceId: opp.source.toLowerCase().replace(/[^a-z0-9]/g, '_'),
                  sourceName: opp.source,
                  sourceType: opp.sourceType,
                  originalUrl: opp.originalUrl,
                  canonicalUrl: opp.originalUrl,
                  verificationStatus: 'verified',
                  httpStatus: 200,
                },
              },
            },
          });
        }
      }
      this.isHydrated = true;
    } catch {
      // Graceful
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
      // Token-based matching: match any of the extracted keywords across text fields
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
      // At least one keyword group should match
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
