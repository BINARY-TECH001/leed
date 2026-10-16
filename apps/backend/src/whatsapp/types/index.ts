import type { OpportunityType } from '@prospect/types';

export type WhatsAppMessageType =
  | 'text'
  | 'interactive_button'
  | 'interactive_list'
  | 'template';

export interface WhatsAppButton {
  id: string; // Payload string sent back when tapped (e.g. "APPLY_opp-1", "SAVE_opp-1")
  title: string; // Max 20 chars per Meta spec
}

export interface WhatsAppOutboundPayload {
  to: string; // E.164 phone number
  type: WhatsAppMessageType;
  text?: string;
  headerText?: string;
  footerText?: string;
  buttons?: WhatsAppButton[];
  templateName?: string;
  templateLanguage?: string;
  templateComponents?: any[];
}

export interface WhatsAppSendResult {
  success: boolean;
  waMessageId?: string;
  recipient: string;
  error?: string;
}

export interface WhatsAppInboundMessage {
  from: string; // E.164 without plus or as provided
  waId: string;
  waMessageId: string;
  timestamp: string;
  type: 'text' | 'button_reply' | 'list_reply' | 'unsupported';
  text?: string;
  buttonId?: string;
  buttonTitle?: string;
  rawPayload: Record<string, any>;
}

export interface WhatsAppDeliveryStatus {
  waMessageId: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  recipient: string;
  timestamp: string;
  error?: string;
}

export interface IWhatsAppProvider {
  readonly id: string;
  readonly name: string;
  validateCredentials(): Promise<boolean>;
  sendText(to: string, message: string): Promise<WhatsAppSendResult>;
  sendInteractiveButtons(
    to: string,
    bodyText: string,
    buttons: WhatsAppButton[],
    options?: { headerText?: string; footerText?: string }
  ): Promise<WhatsAppSendResult>;
  sendTemplate(
    to: string,
    templateName: string,
    languageCode?: string,
    components?: any[]
  ): Promise<WhatsAppSendResult>;
}

export type WhatsAppIntentType =
  | 'OPPORTUNITY_DETAILS'
  | 'EXPLAIN_MATCH'
  | 'SAVE_OPPORTUNITY'
  | 'PREPARE_APPLICATION'
  | 'SUBMIT_APPLICATION'
  | 'CHECK_APPLICATION_STATUS'
  | 'LIST_SAVED'
  | 'UPDATE_PREFERENCES'
  | 'PAUSE_NOTIFICATIONS'
  | 'RESUME_NOTIFICATIONS'
  | 'HELP'
  | 'UNKNOWN';

export interface ParsedWhatsAppIntent {
  intent: WhatsAppIntentType;
  confidence: number;
  opportunityId?: string;
  category?: OpportunityType;
  parameters?: Record<string, any>;
  rawText: string;
  requiresConfirmation: boolean;
  confirmationPrompt?: string;
}
