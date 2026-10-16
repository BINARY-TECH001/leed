import type { Request } from 'express';
import type { OpportunityType, AutonomyLevel, OpportunityStatus } from '@prospect/types';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    [key: string]: any;
  };
  error?: string;
}

export interface QueryPlan {
  originalPrompt: string;
  category?: OpportunityType;
  keywords: string[];
  skills: string[];
  isRemote?: boolean;
  minCompensation?: number;
  compensationType?: 'hourly' | 'annual' | 'fixed';
  location?: string;
  organizations?: string[];
  intentBadges: string[];
  confidence: number;
  interpretedBy: 'deterministic_heuristic' | 'ai_model';
}

export interface OpportunityQueryFilters {
  query?: string;
  keywords?: string[];
  category?: OpportunityType | 'all';
  type?: OpportunityType | 'all';
  remoteOnly?: boolean;
  minCompRate?: number;
  highFitOnly?: boolean;
  tags?: string[];
  location?: string;
  organization?: string;
  page?: number;
  limit?: number;
  sort?: 'match' | 'comp' | 'newest' | 'org';
}

export interface CreateRadarInput {
  title: string;
  prompt: string;
  category: OpportunityType;
  frequency: 'daily' | 'weekdays' | 'weekly' | 'custom';
  autonomyLevel: AutonomyLevel;
}

export interface UpdatePipelineStageInput {
  opportunityId: string;
  stage: 'saved' | 'applied' | 'follow_up' | 'interviewing' | 'won' | 'archived';
  notes?: string;
}

export interface ScheduleFollowUpInput {
  opportunityId: string;
  date: string;
  objective: string;
}
