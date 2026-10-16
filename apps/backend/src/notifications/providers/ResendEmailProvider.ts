import type { IEmailProvider } from './IEmailProvider.js';

export class ResendEmailProvider implements IEmailProvider {
  private apiKey: string;
  private fromAddress: string;
  private isDryRun: boolean;
  public sentEmails: Array<{ to: string; subject: string; html: string; timestamp: Date }> = [];

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY || '';
    this.fromAddress = process.env.EMAIL_FROM || 'Leed Alerts <notifications@leed.app>';
    this.isDryRun = process.env.EMAIL_DRY_RUN === 'true' || !this.apiKey;
  }

  async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    this.sentEmails.push({
      to: options.to,
      subject: options.subject,
      html: options.html,
      timestamp: new Date(),
    });

    if (this.isDryRun) {
      const mockId = `resend_mock_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      return { success: true, messageId: mockId };
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.fromAddress,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text,
        }),
      });

      const data = (await response.json()) as any;
      if (!response.ok) {
        return { success: false, error: data.message || 'Resend API request failed' };
      }

      return { success: true, messageId: data.id };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}
