import { api } from './api';

export interface WhatsAppStatus {
  isConnected: boolean;
  isVerified: boolean;
  phoneNumber?: string;
  status: 'active' | 'paused' | 'disconnected' | 'pending_verification';
  consentGiven?: boolean;
  consentGivenAt?: string;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  maxDailyNotifications?: number;
  notificationsSentToday?: number;
}

export const whatsappService = {
  /**
   * Request phone number linkage & verification code
   */
  async linkPhone(phoneNumber: string): Promise<{
    success: boolean;
    phoneNumber: string;
    expiresAt: string;
    verificationCode?: string;
  }> {
    const res = await api.post<{
      success: boolean;
      message: string;
      data: {
        success: boolean;
        phoneNumber: string;
        expiresAt: string;
        verificationCode?: string;
      };
    }>('/whatsapp/link', { phoneNumber });

    if (!res.data?.data) {
      throw new Error(res.data?.message || 'Failed to dispatch verification code');
    }
    return res.data.data;
  },

  /**
   * Verify 6-digit code
   */
  async verifyCode(code: string): Promise<{
    success: boolean;
    isVerified: boolean;
    phoneNumber: string;
  }> {
    const res = await api.post<{
      success: boolean;
      message: string;
      data: {
        success: boolean;
        isVerified: boolean;
        phoneNumber: string;
      };
    }>('/whatsapp/verify', { code: code.trim() });

    if (!res.data?.data) {
      throw new Error(res.data?.message || 'Failed to verify WhatsApp code');
    }
    return res.data.data;
  },

  /**
   * Fetch current connection status
   */
  async getStatus(): Promise<WhatsAppStatus> {
    try {
      const res = await api.get('/whatsapp/status');
      return res.data.data;
    } catch {
      return {
        isConnected: false,
        isVerified: false,
        status: 'disconnected',
      };
    }
  },

  /**
   * Update quiet hours and notification frequency
   */
  async updatePreferences(prefs: {
    quietHoursStart?: string;
    quietHoursEnd?: string;
    maxDailyNotifications?: number;
  }): Promise<boolean> {
    try {
      await api.patch('/whatsapp/preferences', prefs);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Disconnect WhatsApp
   */
  async disconnect(): Promise<boolean> {
    try {
      await api.post('/whatsapp/disconnect');
      return true;
    } catch {
      return false;
    }
  },
};
