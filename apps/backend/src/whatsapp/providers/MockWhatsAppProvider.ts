import type {
  IWhatsAppProvider,
  WhatsAppButton,
  WhatsAppSendResult,
} from '../types/index.js';

export interface RecordedOutboundMessage {
  id: string;
  to: string;
  type: 'text' | 'interactive_button' | 'template';
  text?: string;
  buttons?: WhatsAppButton[];
  headerText?: string;
  footerText?: string;
  templateName?: string;
  sentAt: Date;
}

export class MockWhatsAppProvider implements IWhatsAppProvider {
  readonly id = 'mock_provider';
  readonly name = 'In-Memory Mock WhatsApp Provider';

  private sentMessages: RecordedOutboundMessage[] = [];
  private shouldFailNextSend = false;
  private failureReason = 'Simulated Meta API network failure';

  async validateCredentials(): Promise<boolean> {
    return true;
  }

  async sendText(to: string, message: string): Promise<WhatsAppSendResult> {
    if (this.shouldFailNextSend) {
      this.shouldFailNextSend = false;
      return { success: false, recipient: to, error: this.failureReason };
    }

    const id = `wamid.mock_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    this.sentMessages.push({
      id,
      to,
      type: 'text',
      text: message,
      sentAt: new Date(),
    });

    return {
      success: true,
      waMessageId: id,
      recipient: to,
    };
  }

  async sendInteractiveButtons(
    to: string,
    bodyText: string,
    buttons: WhatsAppButton[],
    options?: { headerText?: string; footerText?: string }
  ): Promise<WhatsAppSendResult> {
    if (this.shouldFailNextSend) {
      this.shouldFailNextSend = false;
      return { success: false, recipient: to, error: this.failureReason };
    }

    const id = `wamid.mock_interactive_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    this.sentMessages.push({
      id,
      to,
      type: 'interactive_button',
      text: bodyText,
      buttons,
      headerText: options?.headerText,
      footerText: options?.footerText,
      sentAt: new Date(),
    });

    return {
      success: true,
      waMessageId: id,
      recipient: to,
    };
  }

  async sendTemplate(
    to: string,
    templateName: string,
    _languageCode: string = 'en',
    _components?: any[]
  ): Promise<WhatsAppSendResult> {
    if (this.shouldFailNextSend) {
      this.shouldFailNextSend = false;
      return { success: false, recipient: to, error: this.failureReason };
    }

    const id = `wamid.mock_template_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    this.sentMessages.push({
      id,
      to,
      type: 'template',
      templateName,
      sentAt: new Date(),
    });

    return {
      success: true,
      waMessageId: id,
      recipient: to,
    };
  }

  // Test inspection utilities
  getSentMessages(): RecordedOutboundMessage[] {
    return [...this.sentMessages];
  }

  getLastMessage(): RecordedOutboundMessage | undefined {
    return this.sentMessages[this.sentMessages.length - 1];
  }

  clearHistory(): void {
    this.sentMessages = [];
  }

  simulateFailure(reason: string = 'Simulated Meta API network failure'): void {
    this.shouldFailNextSend = true;
    this.failureReason = reason;
  }
}
