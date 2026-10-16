import { api } from './api';

export interface ChannelStatus {
  id: string;
  name: string;
  icon: string;
  category: 'Messaging' | 'Email' | 'Push';
  description: string;
  status: 'connected' | 'pending_verification' | 'paused' | 'disconnected' | 'active';
  isVerified: boolean;
  consentGiven: boolean;
  recipientIdentifier?: string;
  lastDeliveryAt?: string | null;
  permissions: string[];
  costPolicy: string;
  actions: {
    canConnect: boolean;
    canDisconnect: boolean;
    canPause: boolean;
    canTest: boolean;
  };
}

export interface ConnectionsResponse {
  channels: ChannelStatus[];
  activeCount: number;
  totalAvailable: number;
}

export const connectionService = {
  /**
   * Fetches the unified status of all notification and messaging connections.
   */
  async getStatus(): Promise<ConnectionsResponse> {
    try {
      const res = await api.get('/connections/status');
      return res.data.data;
    } catch {
      // Offline fallback state
      return {
        channels: [
          {
            id: 'telegram',
            name: 'Telegram Bot',
            icon: 'Send2',
            category: 'Messaging',
            description: 'Free instant alerts and interactive replies.',
            status: 'disconnected',
            isVerified: false,
            consentGiven: false,
            permissions: ['Match alerts', 'Interactive actions'],
            costPolicy: '100% Free',
            actions: { canConnect: true, canDisconnect: false, canPause: false, canTest: false },
          },
          {
            id: 'whatsapp',
            name: 'WhatsApp Agent',
            icon: 'Whatsapp',
            category: 'Messaging',
            description: 'Conversational assistant with verification.',
            status: 'disconnected',
            isVerified: false,
            consentGiven: false,
            permissions: ['Verified match alerts', 'Application drafts'],
            costPolicy: 'Budget Guardrailed',
            actions: { canConnect: true, canDisconnect: false, canPause: false, canTest: false },
          },
          {
            id: 'email',
            name: 'Email Notifications',
            icon: 'DirectInbox',
            category: 'Email',
            description: 'Match briefings and weekly digests.',
            status: 'active',
            isVerified: true,
            consentGiven: true,
            permissions: ['Match digests', 'Action reminders'],
            costPolicy: 'Zero-Cost Free Tier',
            actions: { canConnect: false, canDisconnect: true, canPause: true, canTest: true },
          },
          {
            id: 'push',
            name: 'Push Notifications',
            icon: 'NotificationBing',
            category: 'Push',
            description: 'Real-time lock-screen alerts.',
            status: 'disconnected',
            isVerified: false,
            consentGiven: false,
            permissions: ['Device notifications', 'Badge counts'],
            costPolicy: '100% Free',
            actions: { canConnect: true, canDisconnect: false, canPause: false, canTest: false },
          },
        ],
        activeCount: 1,
        totalAvailable: 4,
      };
    }
  },

  /**
   * Generates a single-use Telegram account linking token and deep link.
   */
  async getTelegramLinkToken(): Promise<{ linkingToken: string; botDeepLink: string }> {
    const res = await api.post('/connections/telegram/link-token');
    return res.data.data;
  },

  /**
   * Disconnects Telegram account.
   */
  async disconnectTelegram(): Promise<void> {
    await api.post('/connections/telegram/disconnect');
  },

  /**
   * Registers a device push token with the backend.
   */
  async registerPushToken(token: string, platform: string, deviceName?: string): Promise<void> {
    await api.post('/connections/push/register', { token, platform, deviceName });
  },

  /**
   * Dispatches a test notification to verify a specific connected channel.
   */
  async sendTestNotification(channel: string): Promise<any> {
    const res = await api.post('/connections/test', { channel });
    return res.data.data;
  },

  /**
   * Fetches full profile and completeness score.
   */
  async getProfile(): Promise<any> {
    const res = await api.get('/profile');
    return res.data.data;
  },

  /**
   * Updates personal details.
   */
  async updatePersonal(data: any): Promise<any> {
    const res = await api.put('/profile/personal', data);
    return res.data.data;
  },

  /**
   * Updates professional and educational profile.
   */
  async updateProfessional(data: any): Promise<any> {
    const res = await api.put('/profile/professional', data);
    return res.data.data;
  },

  /**
   * Updates opportunity matching preferences.
   */
  async updatePreferences(data: any): Promise<any> {
    const res = await api.put('/profile/preferences', data);
    return res.data.data;
  },
};
