export type NotificationChannel = 'whatsapp' | 'telegram' | 'email' | 'push' | 'in_app';

export type NotificationEventType =
  | 'OPPORTUNITY_MATCHED'
  | 'HIGH_PRIORITY_MATCH'
  | 'APPLICATION_ACTION_REQUIRED'
  | 'APPLICATION_PREPARED'
  | 'APPLICATION_SUBMITTED'
  | 'APPLICATION_FAILED'
  | 'DEADLINE_APPROACHING'
  | 'ACCOUNT_ACTION_REQUIRED'
  | 'CHANNEL_TEST';

export interface NotificationDomainEvent {
  eventId?: string;
  eventType: NotificationEventType;
  userId: string;
  title: string;
  body: string;
  priority?: 'URGENT' | 'ACTION_REQUIRED' | 'IMPORTANT' | 'RECOMMENDED' | 'INFO';
  opportunityId?: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
  suggestedActions?: Array<{
    id: string;
    label: string;
    url?: string;
  }>;
}

export interface ChannelDispatchAttempt {
  channel: NotificationChannel;
  status: 'queued' | 'sent' | 'delivered' | 'failed' | 'skipped_budget' | 'skipped_quiet_hours' | 'skipped_disabled';
  recipient?: string;
  providerMessageId?: string;
  costEstimateUsd?: number;
  error?: string;
}

export interface DispatchResult {
  eventId: string;
  userId: string;
  inAppNotificationId?: string;
  channels: ChannelDispatchAttempt[];
  timestamp: Date;
}

export interface CostGuardrailConfig {
  whatsAppMonthlyBudgetUsd: number;
  whatsAppEstimatedCostPerMessageUsd: number;
  whatsAppEnabled: boolean;
  telegramEnabled: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
}
