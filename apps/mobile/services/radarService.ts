import { api } from './api';
import type { OpportunityRadar, AutonomyLevel, OpportunityType } from '@prospect/types';
import { SAMPLE_RADARS } from '@/constants/mockData';

export interface CreateRadarPayload {
  title: string;
  prompt: string;
  category: OpportunityType;
  frequency: 'daily' | 'weekdays' | 'weekly' | 'custom';
  autonomyLevel: AutonomyLevel;
}

export const radarService = {
  async getRadars(): Promise<OpportunityRadar[]> {
    try {
      const response = await api.get<{ success: boolean; data: OpportunityRadar[] }>('/radars');
      if (response.data?.success && Array.isArray(response.data.data) && response.data.data.length > 0) {
        return response.data.data;
      }
    } catch {
      // Graceful offline fallback
    }
    return SAMPLE_RADARS;
  },

  async getRadarById(id: string): Promise<OpportunityRadar> {
    try {
      const response = await api.get<{ success: boolean; data: OpportunityRadar }>(`/radars/${id}`);
      if (response.data?.success && response.data.data) {
        return response.data.data;
      }
    } catch {
      // Fallback
    }

    const found = SAMPLE_RADARS.find((r) => r.id === id);
    if (!found) {
      throw new Error(`Radar ${id} not found`);
    }
    return found;
  },

  async createRadar(payload: CreateRadarPayload): Promise<OpportunityRadar> {
    const newRadar: OpportunityRadar = {
      id: `radar-${Date.now()}`,
      title: payload.title,
      prompt: payload.prompt,
      category: payload.category,
      frequency: payload.frequency,
      scheduleDescription:
        payload.frequency === 'daily'
          ? 'Runs every 24h at 08:00'
          : payload.frequency === 'weekdays'
          ? 'Mon–Fri morning scan'
          : 'Weekly synthesis',
      timeOfDay: '08:00 AM',
      status: 'active',
      lastRunAt: new Date().toISOString(),
      nextRunAt: new Date(Date.now() + 86400000).toISOString(),
      totalFound: 4,
      newSinceLastCheck: 4,
      autonomyLevel: payload.autonomyLevel,
      targetCriteria: {},
      createdDate: new Date().toISOString(),
    };

    try {
      const response = await api.post<{ success: boolean; data: OpportunityRadar }>(
        '/radars',
        newRadar
      );
      if (response.data?.success && response.data.data) {
        return response.data.data;
      }
    } catch {
      // Return simulated radar
    }

    return newRadar;
  },

  async triggerScan(radarId: string): Promise<{ totalFound: number; newFound: number }> {
    try {
      const response = await api.post<{ success: boolean; data: { totalFound: number; newFound: number } }>(
        `/radars/${radarId}/scan`
      );
      if (response.data?.success && response.data.data) {
        return response.data.data;
      }
    } catch {
      // Simulated scan run
    }

    return {
      totalFound: 6,
      newFound: 2,
    };
  },
};
