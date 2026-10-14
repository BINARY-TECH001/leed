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

export interface OpportunityQueryFilters {
  query?: string;
  category?: OpportunityType | 'all';
  type?: OpportunityType | 'all';
  remoteOnly?: boolean;
  minCompRate?: number;
  highFitOnly?: boolean;
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
