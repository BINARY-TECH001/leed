export interface PushMessagePayload {
  to: string; // Expo push token or Web push endpoint
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: 'default' | null;
  badge?: number;
  priority?: 'default' | 'normal' | 'high';
}

export interface IPushProvider {
  sendPush(payloads: PushMessagePayload[]): Promise<{
    success: boolean;
    sentCount: number;
    receipts?: Array<{ id?: string; status: 'ok' | 'error'; message?: string }>;
  }>;
}
