import type { OpportunityType } from '@prospect/types';

export interface ConnectorMetadata {
  id: string;
  name: string;
  categories: OpportunityType[];
  homepageUrl: string;
  isConfigured: boolean;
  requiresAuth: boolean;
  rateLimitPerMinute: number;
  description: string;
}

export type ConnectorStatus =
  | 'available'
  | 'disabled'
  | 'missing_credentials'
  | 'rate_limited'
  | 'temporarily_unavailable'
  | 'failed';

export interface ConnectorHealth {
  sourceId: string;
  name: string;
  status: ConnectorStatus;
  lastSuccessfulCollectionAt?: string;
  lastFailedCollectionAt?: string;
  consecutiveFailures: number;
  totalRecordsIngested: number;
  errorMessage?: string;
}

export interface DiscoveryParams {
  query?: string;
  category?: OpportunityType;
  remoteOnly?: boolean;
  minCompensation?: number;
  location?: string;
  limit?: number;
  cursor?: string;
}

export interface NormalizedOpportunityInput {
  externalId: string;
  type: OpportunityType;
  title: string;
  organization: string;
  organizationLogo?: string;
  location: string;
  isRemote: boolean;
  remoteType?: 'fully_remote' | 'hybrid' | 'timezone_flexible' | 'onsite';
  compensation?: string;
  compensationAmount?: number;
  deadline?: Date;
  contactPerson?: string;
  contactEmail?: string;
  contactRole?: string;
  source: string;
  sourceType: string;
  originalUrl: string;
  canonicalUrl?: string;
  description: string;
  summary: string;
  requirements: Array<{ text: string; isMatched: boolean }>;
  tags: string[];
  rawPayload?: Record<string, any>;
  verificationStatus?: 'verified' | 'unverified' | 'expired';
}

export interface ConnectorDiscoveryResult {
  sourceId: string;
  records: NormalizedOpportunityInput[];
  hasMore: boolean;
  nextCursor?: string;
  totalAvailable?: number;
}
