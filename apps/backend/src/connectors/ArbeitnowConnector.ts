import { BaseConnector } from './BaseConnector.js';
import type {
  ConnectorMetadata,
  DiscoveryParams,
  ConnectorDiscoveryResult,
  NormalizedOpportunityInput,
} from './types.js';

export class ArbeitnowConnector extends BaseConnector {
  readonly metadata: ConnectorMetadata = {
    id: 'arbeitnow',
    name: 'Arbeitnow Job Board API',
    categories: ['job', 'contract', 'freelance'],
    homepageUrl: 'https://www.arbeitnow.com/api/job-board-api',
    isConfigured: true,
    requiresAuth: false,
    rateLimitPerMinute: 60,
    description: 'Public REST API indexing European and global remote technology roles.',
  };

  constructor() {
    super();
    this.initHealth();
  }

  async validateConfig(): Promise<boolean> {
    try {
      const res = await fetch('https://www.arbeitnow.com/api/job-board-api', {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(12000),
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
    try {
      const url = new URL('https://www.arbeitnow.com/api/job-board-api');
      if (params.cursor) {
        url.searchParams.set('page', params.cursor);
      }

      const res = await fetch(url.toString(), {
        headers: {
          'User-Agent': 'Leed-Discovery-Engine/1.0.0 (+https://leed.dev)',
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) {
        this.recordFailure(`HTTP ${res.status}: ${res.statusText}`);
        return { sourceId: this.metadata.id, records: [], hasMore: false };
      }

      const payload: any = await res.json();
      const rawJobs: any[] = payload.data || [];
      const limit = params.limit || 50;
      const records: NormalizedOpportunityInput[] = [];

      for (const item of rawJobs) {
        if (records.length >= limit) break;

        const isRemote = Boolean(item.remote);
        if (params.remoteOnly && !isRemote) continue;

        if (params.query && params.query.trim()) {
          const q = params.query.toLowerCase().trim();
          const match =
            item.title.toLowerCase().includes(q) ||
            item.company_name.toLowerCase().includes(q) ||
            (Array.isArray(item.tags) && item.tags.some((t: string) => t.toLowerCase().includes(q)));
          if (!match) continue;
        }

        const isContract =
          item.title.toLowerCase().includes('contract') ||
          (Array.isArray(item.job_types) && item.job_types.some((t: string) => t.toLowerCase().includes('contract')));

        const plainDesc = this.cleanHtml(item.description || '');

        const normalized: NormalizedOpportunityInput = {
          externalId: `arbeitnow-${item.slug}`,
          type: isContract ? 'contract' : 'job',
          title: item.title,
          organization: item.company_name,
          location: item.location || 'Remote',
          isRemote,
          remoteType: isRemote ? 'fully_remote' : 'hybrid',
          compensation: 'Competitive (Salary on Request)',
          source: 'Arbeitnow Job Board',
          sourceType: 'public_job_board_api',
          originalUrl: item.url,
          description: plainDesc.slice(0, 3000),
          summary: plainDesc.slice(0, 280) || `${item.title} at ${item.company_name}`,
          requirements: [
            { text: `Proficiency in ${(item.tags || []).slice(0, 3).join(', ') || 'required skills'}`, isMatched: true },
            { text: `Location: ${item.location || 'Remote'}`, isMatched: true },
          ],
          tags: Array.isArray(item.tags) ? item.tags.slice(0, 6) : ['Tech'],
          rawPayload: {
            slug: item.slug,
            jobTypes: item.job_types,
            createdAt: item.created_at,
          },
          verificationStatus: 'verified',
        };

        records.push(normalized);
      }

      this.recordSuccess(records.length);

      return {
        sourceId: this.metadata.id,
        records,
        hasMore: Boolean(payload.links?.next),
        nextCursor: payload.links?.next ? '2' : undefined,
        totalAvailable: payload.meta?.total,
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
