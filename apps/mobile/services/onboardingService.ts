import { api } from './api';

export interface OnboardingPayload {
  categories?: string[];
  roleOrFocus?: string;
  locations?: string[];
  headline?: string;
  minMatchScore?: number;
  completeNow?: boolean;
}

export const onboardingService = {
  async saveStep(step: number, payload: OnboardingPayload) {
    try {
      const response = await api.post('/onboarding/step', { step, payload });
      return response.data;
    } catch (err) {
      console.warn('Error saving onboarding step:', err);
      return null;
    }
  },

  async executeInitialScan() {
    try {
      const response = await api.post('/onboarding/initial-scan');
      return response.data?.data;
    } catch (err) {
      console.warn('Initial scan error:', err);
      return null;
    }
  },

  async complete() {
    try {
      const response = await api.post('/onboarding/complete');
      return response.data;
    } catch (err) {
      console.warn('Error completing onboarding on server:', err);
      return null;
    }
  },
};
