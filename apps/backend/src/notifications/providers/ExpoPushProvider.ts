import type { IPushProvider, PushMessagePayload } from './IPushProvider.js';

export class ExpoPushProvider implements IPushProvider {
  private isDryRun: boolean;
  public sentPayloads: PushMessagePayload[] = [];

  constructor() {
    this.isDryRun = process.env.PUSH_DRY_RUN === 'true' || process.env.NODE_ENV === 'test';
  }

  async sendPush(payloads: PushMessagePayload[]): Promise<{
    success: boolean;
    sentCount: number;
    receipts?: Array<{ id?: string; status: 'ok' | 'error'; message?: string }>;
  }> {
    this.sentPayloads.push(...payloads);

    if (this.isDryRun) {
      return {
        success: true,
        sentCount: payloads.length,
        receipts: payloads.map((_, idx) => ({
          id: `expo_mock_${Date.now()}_${idx}`,
          status: 'ok',
        })),
      };
    }

    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payloads),
      });

      const json = (await response.json()) as any;
      if (!response.ok) {
        return {
          success: false,
          sentCount: 0,
          receipts: [{ status: 'error', message: 'Expo push service responded with HTTP error' }],
        };
      }

      const tickets = json.data || [];
      const receipts = tickets.map((t: any) => ({
        id: t.id,
        status: t.status === 'ok' ? 'ok' : 'error',
        message: t.message,
      }));

      const successfulCount = receipts.filter((r: any) => r.status === 'ok').length;
      return {
        success: successfulCount > 0,
        sentCount: successfulCount,
        receipts,
      };
    } catch (err: any) {
      return {
        success: false,
        sentCount: 0,
        receipts: [{ status: 'error', message: err.message }],
      };
    }
  }
}
