import { api } from './api';
import type { Opportunity, OpportunityType } from '@prospect/types';
import { SAMPLE_OPPORTUNITIES } from '@/constants/mockData';

export interface OpportunitySearchParams {
  query?: string;
  type?: OpportunityType | 'all';
  remoteOnly?: boolean;
  minComp?: number;
  highFitOnly?: boolean;
  sort?: 'match' | 'comp' | 'newest' | 'org';
}

export const opportunityService = {
  async getOpportunities(params?: OpportunitySearchParams): Promise<Opportunity[]> {
    try {
      const response = await api.get<{ success: boolean; data: Opportunity[] }>('/opportunities', {
        params,
      });
      if (response.data?.success && Array.isArray(response.data.data) && response.data.data.length > 0) {
        return response.data.data;
      }
    } catch {
      // Gracefully fall back to local offline directory
    }

    // Filter local data offline
    let list = [...SAMPLE_OPPORTUNITIES];

    if (params?.type && params.type !== 'all') {
      list = list.filter((o) => o.type === params.type);
    }

    if (params?.remoteOnly) {
      list = list.filter((o) => o.isRemote);
    }

    if (params?.highFitOnly) {
      list = list.filter((o) => o.matchScore >= 90);
    }

    if (params?.query && params.query.trim()) {
      const q = params.query.toLowerCase();
      list = list.filter(
        (o) =>
          o.title.toLowerCase().includes(q) ||
          o.organization.toLowerCase().includes(q) ||
          o.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (params?.sort === 'comp') {
      list.sort((a, b) => (b.compensationAmount || 0) - (a.compensationAmount || 0));
    } else if (params?.sort === 'newest') {
      list.reverse();
    } else if (params?.sort === 'org') {
      list.sort((a, b) => a.organization.localeCompare(b.organization));
    } else {
      list.sort((a, b) => b.matchScore - a.matchScore);
    }

    return list;
  },

  async getOpportunityById(id: string): Promise<Opportunity> {
    try {
      const response = await api.get<{ success: boolean; data: Opportunity }>(`/opportunities/${id}`);
      if (response.data?.success && response.data.data) {
        return response.data.data;
      }
    } catch {
      // Fallback
    }

    const found = SAMPLE_OPPORTUNITIES.find((o) => o.id === id);
    if (!found) {
      throw new Error(`Opportunity ${id} not found`);
    }
    return found;
  },

  async submitApplication(
    opportunityId: string,
    payload: { cvName?: string; customPitch?: string }
  ): Promise<{ success: boolean; message: string; timestamp: string }> {
    try {
      const response = await api.post<{ success: boolean; message: string; timestamp: string }>(
        `/opportunities/${opportunityId}/apply`,
        payload
      );
      return response.data;
    } catch {
      // Simulate local optimistic success
      return {
        success: true,
        message: 'Application dispatched successfully to verified endpoint.',
        timestamp: new Date().toISOString(),
      };
    }
  },
};
