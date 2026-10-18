import { api } from './api';
import type { OpportunityRadar, AutonomyLevel, OpportunityType } from '@prospect/types';

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
      if (response.data?.success && Array.isArray(response.data.data)) {
        return response.data.data;
      }
    } catch (err) {
      console.warn('Network error fetching radars:', err);
    }
    return [];
  },

  async getRadarById(id: string): Promise<OpportunityRadar> {
    const response = await api.get<{ success: boolean; data: OpportunityRadar }>(`/radars/${id}`);
    if (response.data?.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(`Radar ${id} not found`);
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
      totalFound: 0,
      newSinceLastCheck: 0,
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
    } catch (err) {
      console.warn('Could not persist radar to backend API:', err);
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
    } catch (err) {
      console.warn('Scan trigger error:', err);
    }

    return {
      totalFound: 0,
      newFound: 0,
    };
  },
};
