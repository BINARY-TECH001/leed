import type {
  IWhatsAppProvider,
  WhatsAppButton,
  WhatsAppSendResult,
} from '../types/index.js';

export interface MetaCloudConfig {
  phoneNumberId: string;
  accessToken: string;
  businessAccountId?: string;
  apiVersion?: string;
}

export class MetaWhatsAppCloudProvider implements IWhatsAppProvider {
  readonly id = 'meta_cloud';
  readonly name = 'Official Meta WhatsApp Business Cloud API';

  private phoneNumberId: string;
  private accessToken: string;
  private apiVersion: string;

  constructor(config?: Partial<MetaCloudConfig>) {
    this.phoneNumberId = config?.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    this.accessToken = config?.accessToken || process.env.WHATSAPP_ACCESS_TOKEN || '';
    this.apiVersion = config?.apiVersion || process.env.WHATSAPP_API_VERSION || 'v21.0';
  }

  private cleanRecipientNumber(phone: string): string {
    // Meta requires digits only without leading '+' or formatting symbols
    return phone.replace(/\D/g, '');
  }

  private getEndpointUrl(): string {
    return `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
  }

  async validateCredentials(): Promise<boolean> {
    if (!this.phoneNumberId || !this.accessToken) {
      return false;
    }

    try {
      // Validate phone number node on Meta Graph API
      const res = await fetch(
        `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}?fields=verified_name,code_verification_status,quality_rating`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
          signal: AbortSignal.timeout(8000),
        }
      );
      return res.ok;
    } catch {
      return false;
    }
  }

  async sendText(to: string, message: string): Promise<WhatsAppSendResult> {
    const cleanTo = this.cleanRecipientNumber(to);

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: cleanTo,
      type: 'text',
      text: {
        preview_url: true,
        body: message,
      },
    };

    return this.executeSend(cleanTo, payload);
  }

  async sendInteractiveButtons(
    to: string,
    bodyText: string,
    buttons: WhatsAppButton[],
    options?: { headerText?: string; footerText?: string }
  ): Promise<WhatsAppSendResult> {
    const cleanTo = this.cleanRecipientNumber(to);

    // Meta limits reply buttons to max 3 items
    const limitedButtons = buttons.slice(0, 3).map((btn) => ({
      type: 'reply',
      reply: {
        id: btn.id.substring(0, 256), // Max 256 chars
        title: btn.title.substring(0, 20), // Max 20 chars per Meta specification
      },
    }));

    const interactiveObject: Record<string, any> = {
      type: 'button',
      body: {
        text: bodyText,
      },
      action: {
        buttons: limitedButtons,
      },
    };

    if (options?.headerText) {
      interactiveObject.header = {
        type: 'text',
        text: options.headerText.substring(0, 60),
      };
    }

    if (options?.footerText) {
      interactiveObject.footer = {
        text: options.footerText.substring(0, 60),
      };
    }

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: cleanTo,
      type: 'interactive',
      interactive: interactiveObject,
    };

    return this.executeSend(cleanTo, payload);
  }

  async sendTemplate(
    to: string,
    templateName: string,
    languageCode: string = 'en',
    components?: any[]
  ): Promise<WhatsAppSendResult> {
    const cleanTo = this.cleanRecipientNumber(to);

    const payload: Record<string, any> = {
      messaging_product: 'whatsapp',
      to: cleanTo,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: languageCode,
        },
      },
    };

    if (components && components.length > 0) {
      payload.template.components = components;
    }

    return this.executeSend(cleanTo, payload);
  }

  private async executeSend(cleanTo: string, payload: Record<string, any>): Promise<WhatsAppSendResult> {
    if (!this.phoneNumberId || !this.accessToken) {
      return {
        success: false,
        recipient: cleanTo,
        error: 'Meta WhatsApp credentials missing: WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN not set',
      };
    }

    try {
      const res = await fetch(this.getEndpointUrl(), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
      });

      const json = (await res.json()) as any;

      if (!res.ok) {
        const errorMsg = json.error?.message || `Meta API HTTP ${res.status}`;
        return {
          success: false,
          recipient: cleanTo,
          error: errorMsg,
        };
      }

      const waMessageId = json.messages?.[0]?.id;
      return {
        success: true,
        waMessageId,
        recipient: cleanTo,
      };
    } catch (err: any) {
      return {
        success: false,
        recipient: cleanTo,
        error: err.message || 'Network error communicating with Meta Graph API',
      };
    }
  }
}
