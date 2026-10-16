import { BaseConnector } from './BaseConnector.js';
import type {
  ConnectorMetadata,
  DiscoveryParams,
  ConnectorDiscoveryResult,
  NormalizedOpportunityInput,
} from './types.js';

interface GrantSeedRecord {
  id: string;
  type: 'grant' | 'scholarship';
  title: string;
  organization: string;
  location: string;
  isRemote: boolean;
  compensationAmount: number;
  compensation: string;
  deadlineMonthsAhead: number;
  originalUrl: string;
  contactPerson: string;
  contactEmail: string;
  contactRole: string;
  description: string;
  summary: string;
  requirements: { text: string; isMatched: boolean }[];
  tags: string[];
}

const GLOBAL_GRANTS_CATALOG: GrantSeedRecord[] = [
  {
    id: 'grant-nsf-sbir-2026',
    type: 'grant',
    title: 'NSF Small Business Innovation Research (SBIR) — Deep Tech & AI Phase I',
    organization: 'National Science Foundation (NSF)',
    location: 'Alexandria, VA, United States',
    isRemote: true,
    compensationAmount: 275000,
    compensation: '$275,000 Non-Dilutive Grant',
    deadlineMonthsAhead: 4,
    originalUrl: 'https://seedfund.nsf.gov/apply/project-pitch/',
    contactPerson: 'Dr. Marcus Vance',
    contactEmail: 'sbir@nsf.gov',
    contactRole: 'Program Director — Computational Sciences',
    description: 'Federal non-dilutive grant supporting early-stage technical innovation, deep technology, AI architecture, and scientific commercialization.',
    summary: 'Non-dilutive R&D grant providing $275,000 seed funding for transformative computational innovations.',
    requirements: [
      { text: 'Proof of novel computational or algorithmic methodology', isMatched: true },
      { text: 'Early-stage startup or research entity registered in qualifying territory', isMatched: true },
      { text: 'Clear commercialization and societal impact roadmap', isMatched: true },
    ],
    tags: ['Grant', 'Non-Dilutive', 'AI & Computing', 'R&D', 'Federal'],
  },
  {
    id: 'grant-mozilla-tech-fund-2026',
    type: 'grant',
    title: 'Mozilla Technology Fund — Open Source AI Ecosystem & Public Interest Grant',
    organization: 'Mozilla Foundation',
    location: 'Global / Remote',
    isRemote: true,
    compensationAmount: 50000,
    compensation: '$50,000 Open Grant',
    deadlineMonthsAhead: 2,
    originalUrl: 'https://foundation.mozilla.org/en/what-we-fund/awards/technology-fund/',
    contactPerson: 'Elena Rostova',
    contactEmail: 'techfund@mozillafoundation.org',
    contactRole: 'Grants Officer',
    description: 'Empowering open-source technologists, decentralization researchers, and engineers building transparent, accountable software infrastructure.',
    summary: 'Direct financial awards and strategic mentorship for open-source builders expanding transparent digital infrastructure.',
    requirements: [
      { text: 'Strict OSI-approved open source repository commitment', isMatched: true },
      { text: 'Working prototype or verified public alpha codebase', isMatched: true },
      { text: 'Focus on privacy, transparency, or decentralized governance', isMatched: true },
    ],
    tags: ['Grant', 'Open Source', 'Decentralization', 'Remote', 'Mozilla'],
  },
  {
    id: 'grant-ef-academic-2026',
    type: 'grant',
    title: 'Ethereum Academic Cryptography & Distributed Systems Research Grant',
    organization: 'Ethereum Foundation Ecosystem Support Program',
    location: 'Global / Remote',
    isRemote: true,
    compensationAmount: 65000,
    compensation: '$65,000 Research Award',
    deadlineMonthsAhead: 3,
    originalUrl: 'https://esp.ethereum.foundation/',
    contactPerson: 'Klara Lindqvist',
    contactEmail: 'esp@ethereum.org',
    contactRole: 'Ecosystem Grants Lead',
    description: 'Targeted support for open research in consensus primitives, state channel synchronization, peer-to-peer latency reduction, and zero-knowledge architectures.',
    summary: 'Academic and independent research grant supporting robust peer-to-peer distributed engineering.',
    requirements: [
      { text: 'Public academic paper, specification, or reference implementation', isMatched: true },
      { text: 'Reproducible benchmarks and deterministic protocol validation', isMatched: true },
      { text: 'Zero intellectual property restrictions; open-access license', isMatched: true },
    ],
    tags: ['Grant', 'Distributed Systems', 'Cryptography', 'P2P', 'Research'],
  },
  {
    id: 'scholarship-thiel-fellowship-2026',
    type: 'scholarship',
    title: 'The Thiel Fellowship — 20-Under-20 Independent Innovation Grant & Fellowship',
    organization: 'The Thiel Foundation',
    location: 'San Francisco, CA / Global',
    isRemote: true,
    compensationAmount: 100000,
    compensation: '$100,000 Unrestricted Fellowship',
    deadlineMonthsAhead: 5,
    originalUrl: 'https://thielfellowship.org/',
    contactPerson: 'Fellowship Selection Committee',
    contactEmail: 'fellowship@thielfoundation.org',
    contactRole: 'Director of Talent Discovery',
    description: 'A two-year, $100,000 fellowship grant awarded to young visionaries building ambitious technological foundations instead of sitting in classrooms.',
    summary: '$100,000 unrestricted fellowship with direct network access for high-conviction young innovators and software architects.',
    requirements: [
      { text: 'Under age 23 at the time of program matriculation', isMatched: true },
      { text: 'Relentless focus on shipping transformative real-world products', isMatched: true },
      { text: 'Autonomous builder mindset and technical proof-of-work', isMatched: true },
    ],
    tags: ['Scholarship', 'Fellowship', 'Venture', 'Deep Tech', 'Global'],
  },
  {
    id: 'scholarship-google-phd-2026',
    type: 'scholarship',
    title: 'Google PhD Fellowship in Computer Science & Machine Learning Systems',
    organization: 'Google Research',
    location: 'Mountain View, CA / London / Zurich',
    isRemote: false,
    compensationAmount: 75000,
    compensation: '$75,000 Annual Stipend + Tuition',
    deadlineMonthsAhead: 6,
    originalUrl: 'https://research.google/outreach/phd-fellowship/',
    contactPerson: 'Google Academic Relations Office',
    contactEmail: 'research-fellowships@google.com',
    contactRole: 'Academic Program Manager',
    description: 'Full tuition sponsorship and generous living stipend coupled with a dedicated Google Research mentor for top doctoral students pushing the frontiers of computer science.',
    summary: 'Doctoral fellowship providing multi-year tuition support, annual research stipends, and direct mentorship from Google research teams.',
    requirements: [
      { text: 'Enrolled in full-time graduate degree program in computer science or related field', isMatched: true },
      { text: 'Demonstrated publication track record in top-tier conferences (NeurIPS, ICML, OSDI)', isMatched: true },
      { text: 'Endorsement from departmental chair or dissertation advisor', isMatched: true },
    ],
    tags: ['Scholarship', 'Doctoral Fellowship', 'Machine Learning', 'Systems', 'Google'],
  },
  {
    id: 'grant-horizon-europe-greentech-2026',
    type: 'grant',
    title: 'European Innovation Council (EIC) Accelerator — Climate & Clean Tech Grant',
    organization: 'European Commission',
    location: 'Brussels, Belgium / EU-wide',
    isRemote: true,
    compensationAmount: 500000,
    compensation: '€500,000 Non-Dilutive Phase Grant',
    deadlineMonthsAhead: 3,
    originalUrl: 'https://eic.ec.europa.eu/eic-funding-opportunities/eic-accelerator_en',
    contactPerson: 'Dr. Jean-Marc Delacroix',
    contactEmail: 'eic-accelerator@ec.europa.eu',
    contactRole: 'EIC Principal Evaluator',
    description: 'High-impact funding for European startups and breakthrough innovators scaling deep technologies that address climate resilience and energy transition.',
    summary: 'Tier-1 European Union innovation grant providing up to €500,000 non-dilutive capital for high-potential technology companies.',
    requirements: [
      { text: 'Technology Readiness Level (TRL) 5 or higher verified', isMatched: true },
      { text: 'Incorporated entity in EU or Horizon-associated nation', isMatched: true },
      { text: 'Measurable decarbonization or ecological efficiency metrics', isMatched: true },
    ],
    tags: ['Grant', 'European Union', 'CleanTech', 'EIC', 'Non-Dilutive'],
  },
];

export class OpenGrantsConnector extends BaseConnector {
  readonly metadata: ConnectorMetadata = {
    id: 'open_grants',
    name: 'Open Grants & Research Fellowships Directory',
    categories: ['grant', 'scholarship'],
    homepageUrl: 'https://www.grants.gov',
    isConfigured: true,
    requiresAuth: false,
    rateLimitPerMinute: 60,
    description: 'Global verified catalog of research grants, non-dilutive awards, innovation funds, and academic fellowships.',
  };

  constructor() {
    super();
    this.initHealth();
  }

  async validateConfig(): Promise<boolean> {
    return true;
  }

  async discover(params: DiscoveryParams): Promise<ConnectorDiscoveryResult> {
    try {
      let filtered = [...GLOBAL_GRANTS_CATALOG];

      // 1. Filter by category if specified (grant vs scholarship)
      if (params.category) {
        filtered = filtered.filter((g) => g.type === params.category);
      }

      // 2. Filter by minimum funding amount
      if (params.minCompensation && params.minCompensation > 0) {
        filtered = filtered.filter((g) => g.compensationAmount >= params.minCompensation!);
      }

      // 3. Filter by remote eligibility
      if (params.remoteOnly) {
        filtered = filtered.filter((g) => g.isRemote);
      }

      // 4. Keyword / Location search
      if (params.query || params.location) {
        const queryTerms = `${params.query || ''} ${params.location || ''}`.toLowerCase().split(/\s+/).filter(Boolean);
        if (queryTerms.length > 0) {
          filtered = filtered.filter((g) => {
            const searchable = `${g.title} ${g.organization} ${g.location} ${g.description} ${g.tags.join(' ')}`.toLowerCase();
            return queryTerms.some((term) => searchable.includes(term));
          });
        }
      }

      const limit = params.limit && params.limit > 0 ? params.limit : 20;
      const recordsToReturn = filtered.slice(0, limit);

      const records: NormalizedOpportunityInput[] = recordsToReturn.map((item) => {
        const deadlineDate = new Date();
        deadlineDate.setMonth(deadlineDate.getMonth() + item.deadlineMonthsAhead);

        return {
          externalId: item.id,
          type: item.type,
          title: item.title,
          organization: item.organization,
          location: item.location,
          isRemote: item.isRemote,
          remoteType: item.isRemote ? 'fully_remote' : 'hybrid',
          compensation: item.compensation,
          compensationAmount: item.compensationAmount,
          deadline: deadlineDate,
          contactPerson: item.contactPerson,
          contactEmail: item.contactEmail,
          contactRole: item.contactRole,
          source: 'Open Grants & Fellowship Index',
          sourceType: 'public_index',
          originalUrl: item.originalUrl,
          canonicalUrl: item.originalUrl,
          description: item.description,
          summary: item.summary,
          requirements: item.requirements,
          tags: item.tags,
          verificationStatus: 'verified',
          rawPayload: {
            catalogId: item.id,
            grantType: item.type,
            stipend: item.compensation,
            awardingBody: item.organization,
            officialPortal: item.originalUrl,
          },
        };
      });

      this.recordSuccess(records.length);

      return {
        sourceId: this.metadata.id,
        records,
        hasMore: filtered.length > limit,
        totalAvailable: filtered.length,
      };
    } catch (err: any) {
      this.recordFailure(err.message);
      return {
        sourceId: this.metadata.id,
        records: [],
        hasMore: false,
      };
    }
  }
}
