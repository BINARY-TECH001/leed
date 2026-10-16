import { BaseConnector } from './BaseConnector.js';
import type {
  ConnectorMetadata,
  DiscoveryParams,
  ConnectorDiscoveryResult,
  NormalizedOpportunityInput,
} from './types.js';

export class GreenhouseConnector extends BaseConnector {
  readonly metadata: ConnectorMetadata = {
    id: 'greenhouse',
    name: 'Greenhouse Public Job Board API',
    categories: ['job', 'contract'],
    homepageUrl: 'https://developers.greenhouse.io/job-board.html',
    isConfigured: true,
    requiresAuth: false,
    rateLimitPerMinute: 60,
    description: 'Official public ATS endpoints indexing technology career portals.',
  };

  private boardTokens: string[];

  constructor(boardTokens: string[] = ['figma', 'stripe', 'linear', 'discord', 'vercel']) {
    super();
    this.boardTokens = boardTokens;
    this.initHealth();
  }

  async validateConfig(): Promise<boolean> {
    try {
      const sample = this.boardTokens[0] || 'figma';
      const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${sample}/jobs`, {
        headers: {
          'User-Agent': 'Leed-Discovery-Engine/1.0.0 (+https://leed.dev)',
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  private cleanHtml(html: string): string {
    if (!html) return '';
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();
  }

  async discover(params: DiscoveryParams): Promise<ConnectorDiscoveryResult> {
    const allRecords: NormalizedOpportunityInput[] = [];
    const limit = params.limit || 50;

    for (const token of this.boardTokens) {
      if (allRecords.length >= limit) break;

      try {
        const url = `https://boards-api.greenhouse.io/v1/boards/${token}/jobs?content=true`;
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Leed-Discovery-Engine/1.0.0 (+https://leed.dev)',
            Accept: 'application/json',
          },
          signal: AbortSignal.timeout(10000),
        });

        if (!res.ok) {
          continue;
        }

        const data: any = await res.json();
        const jobs: any[] = data.jobs || [];

        const orgName = token.charAt(0).toUpperCase() + token.slice(1);

        for (const job of jobs) {
          if (allRecords.length >= limit) break;

          const locationName = job.location?.name || 'Remote';
          const isRemote =
            locationName.toLowerCase().includes('remote') ||
            (job.title && job.title.toLowerCase().includes('remote'));

          // Filter by remoteOnly if requested
          if (params.remoteOnly && !isRemote) {
            continue;
          }

          // Filter by query if requested
          if (params.query && params.query.trim()) {
            const q = params.query.toLowerCase().trim();
            const textMatch =
              job.title.toLowerCase().includes(q) ||
              locationName.toLowerCase().includes(q) ||
              orgName.toLowerCase().includes(q);
            if (!textMatch) continue;
          }

          const plainDesc = this.cleanHtml(job.content || '');
          const isContract = job.title.toLowerCase().includes('contract') || job.title.toLowerCase().includes('freelance');

          const record: NormalizedOpportunityInput = {
            externalId: `gh-${token}-${job.id}`,
            type: isContract ? 'contract' : 'job',
            title: job.title,
            organization: orgName,
            location: locationName,
            isRemote,
            remoteType: isRemote ? 'fully_remote' : 'hybrid',
            compensation: 'Competitive (Disclosed on Application)',
            source: `Greenhouse (${orgName})`,
            sourceType: 'official_ats_api',
            originalUrl: job.absolute_url,
            description: plainDesc.slice(0, 3000),
            summary: plainDesc.slice(0, 280) || `${job.title} role at ${orgName}`,
            requirements: [
              { text: `Relevant engineering experience for ${job.title}`, isMatched: true },
              { text: `Location compatibility: ${locationName}`, isMatched: true },
            ],
            tags: [orgName, isRemote ? 'Remote' : 'Onsite', isContract ? 'Contract' : 'Full-time'],
            rawPayload: {
              board: token,
              greenhouseJobId: job.id,
              updatedAt: job.updated_at,
              departments: job.departments,
              offices: job.offices,
            },
            verificationStatus: 'verified',
          };

          allRecords.push(record);
        }
      } catch (err: any) {
        this.recordFailure(err.message);
      }
    }

    this.recordSuccess(allRecords.length);

    return {
      sourceId: this.metadata.id,
      records: allRecords,
      hasMore: false,
      totalAvailable: allRecords.length,
    };
  }
}
