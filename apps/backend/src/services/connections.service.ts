import crypto from 'node:crypto';
import { prisma } from '../utils/prisma.js';
import { NotificationDispatcherService } from '../notifications/services/notificationDispatcher.service.js';
import { getTelegramProvider } from '../notifications/providers/index.js';

export interface ChannelCardStatus {
  id: string;
  name: string;
  icon: string;
  category: 'Messaging' | 'Email' | 'Push';
  description: string;
  status: 'connected' | 'pending_verification' | 'paused' | 'disconnected' | 'active';
  isVerified: boolean;
  consentGiven: boolean;
  recipientIdentifier?: string;
  lastDeliveryAt?: Date | null;
  permissions: string[];
  costPolicy: '100% Free' | 'Zero-Cost Free Tier' | 'Budget Guardrailed';
  actions: {
    canConnect: boolean;
    canDisconnect: boolean;
    canPause: boolean;
    canTest: boolean;
  };
}

export class ConnectionsService {
  /**
   * Fetches unified status of all supported notification and messaging channels.
   */
  static async getConnectionsStatus(userId: string): Promise<{
    channels: ChannelCardStatus[];
    activeCount: number;
    totalAvailable: number;
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        whatsAppAccount: true,
        telegramAccount: true,
        emailPreference: true,
        pushDeviceTokens: { where: { isActive: true } },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Get last delivery records for each channel
    const lastDeliveries = await prisma.channelDeliveryRecord.findMany({
      where: { userId, status: { in: ['sent', 'delivered'] } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const getLastDelivery = (channel: string) =>
      lastDeliveries.find((d) => d.channel === channel)?.createdAt || null;

    const channels: ChannelCardStatus[] = [
      // 1. Telegram
      {
        id: 'telegram',
        name: 'Telegram Bot',
        icon: 'Send2',
        category: 'Messaging',
        description: 'Instant opportunity alerts, interactive action buttons (Apply, Save, Details) directly via Telegram.',
        status: (user.telegramAccount?.status as any) || 'disconnected',
        isVerified: user.telegramAccount?.isVerified ?? false,
        consentGiven: user.telegramAccount?.consentGiven ?? false,
        recipientIdentifier: user.telegramAccount?.telegramUsername
          ? `@${user.telegramAccount.telegramUsername}`
          : user.telegramAccount?.telegramChatId || undefined,
        lastDeliveryAt: getLastDelivery('telegram'),
        permissions: ['Receive opportunity matches', 'Submit conversational actions', 'Interactive inline button taps'],
        costPolicy: '100% Free',
        actions: {
          canConnect: !user.telegramAccount?.isVerified,
          canDisconnect: Boolean(user.telegramAccount?.isVerified),
          canPause: user.telegramAccount?.status === 'active',
          canTest: Boolean(user.telegramAccount?.isVerified && user.telegramAccount.status === 'active'),
        },
      },
      // 2. WhatsApp
      {
        id: 'whatsapp',
        name: 'WhatsApp Agent',
        icon: 'Whatsapp',
        category: 'Messaging',
        description: 'Personal opportunity agent on WhatsApp with two-way conversation and verified application preparation.',
        status: (user.whatsAppAccount?.status as any) || 'disconnected',
        isVerified: user.whatsAppAccount?.isVerified ?? false,
        consentGiven: user.whatsAppAccount?.consentGiven ?? false,
        recipientIdentifier: user.whatsAppAccount?.phoneNumber || undefined,
        lastDeliveryAt: user.whatsAppAccount?.lastNotificationSentAt || getLastDelivery('whatsapp'),
        permissions: ['Receive verified matches', 'Reply with natural language commands', 'Prepare tailored applications'],
        costPolicy: 'Budget Guardrailed',
        actions: {
          canConnect: !user.whatsAppAccount?.isVerified,
          canDisconnect: Boolean(user.whatsAppAccount?.isVerified),
          canPause: user.whatsAppAccount?.status === 'active',
          canTest: Boolean(user.whatsAppAccount?.isVerified && user.whatsAppAccount.status === 'active'),
        },
      },
      // 3. Email
      {
        id: 'email',
        name: 'Email Notifications',
        icon: 'DirectInbox',
        category: 'Email',
        description: 'Comprehensive opportunity briefings, transaction updates, and daily or weekly curated digests.',
        status: (user.emailPreference?.status as any) || 'active',
        isVerified: user.emailVerified || (user.emailPreference?.isVerified ?? true),
        consentGiven: user.emailPreference?.consentGiven ?? true,
        recipientIdentifier: user.emailPreference?.email || user.email,
        lastDeliveryAt: getLastDelivery('email'),
        permissions: ['Receive transaction emails', 'Receive match summaries', 'Manage frequency & unsubscribe'],
        costPolicy: 'Zero-Cost Free Tier',
        actions: {
          canConnect: false, // Default registered email is connected by default
          canDisconnect: user.emailPreference?.status !== 'unsubscribed',
          canPause: user.emailPreference?.status === 'active',
          canTest: true,
        },
      },
      // 4. Native & Web Push
      {
        id: 'push',
        name: 'Push Notifications',
        icon: 'NotificationBing',
        category: 'Push',
        description: 'Real-time lock-screen notifications on mobile and web browser without opening the application.',
        status: user.pushDeviceTokens.length > 0 ? 'connected' : 'disconnected',
        isVerified: user.pushDeviceTokens.length > 0,
        consentGiven: user.pushDeviceTokens.length > 0,
        recipientIdentifier: `${user.pushDeviceTokens.length} active device(s)`,
        lastDeliveryAt: getLastDelivery('push'),
        permissions: ['Push notifications on device', 'Badge updates', 'Background alert dispatch'],
        costPolicy: '100% Free',
        actions: {
          canConnect: true,
          canDisconnect: user.pushDeviceTokens.length > 0,
          canPause: false,
          canTest: user.pushDeviceTokens.length > 0,
        },
      },
    ];

    const activeCount = channels.filter((c) => c.status === 'connected' || c.status === 'active').length;

    return {
      channels,
      activeCount,
      totalAvailable: channels.length,
    };
  }

  /**
   * Generates a short-lived, single-use, cryptographically secure Telegram linking token.
   */
  static async generateTelegramLinkingToken(userId: string): Promise<{
    linkingToken: string;
    botDeepLink: string;
    expiresAt: Date;
  }> {
    const linkingToken = `leed_link_${crypto.randomUUID().replace(/-/g, '')}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes TTL
    const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'LeedOpportunityBot';

    await prisma.telegramAccount.upsert({
      where: { userId },
      create: {
        userId,
        linkingToken,
        linkingTokenExpiresAt: expiresAt,
        status: 'pending_verification',
      },
      update: {
        linkingToken,
        linkingTokenExpiresAt: expiresAt,
        status: 'pending_verification',
      },
    });

    return {
      linkingToken,
      botDeepLink: `https://t.me/${botUsername}?start=${linkingToken}`,
      expiresAt,
    };
  }

  /**
   * Validates Telegram /start callback token and links the user's account securely.
   */
  static async handleTelegramStartCallback(
    linkingToken: string,
    chatId: string,
    username?: string
  ): Promise<{ success: boolean; userId?: string; message: string }> {
    const account = await prisma.telegramAccount.findFirst({
      where: {
        linkingToken,
        linkingTokenExpiresAt: { gt: new Date() },
      },
    });

    if (!account) {
      return {
        success: false,
        message: 'Invalid or expired linking token. Please generate a new connection link from Leed settings.',
      };
    }

    // Update account as verified and clear linking token to prevent replay
    await prisma.telegramAccount.update({
      where: { id: account.id },
      data: {
        telegramChatId: chatId,
        telegramUsername: username || null,
        isVerified: true,
        consentGiven: true,
        consentGivenAt: new Date(),
        status: 'active',
        linkingToken: null,
        linkingTokenExpiresAt: null,
      },
    });

    // Send confirmation message to Telegram chat
    const tgProvider = getTelegramProvider();
    await tgProvider.sendMessage(
      chatId,
      `🎉 *Welcome to Leed Opportunity Agent!*\n\nYour Telegram account is now securely linked. You will receive real-time, verified opportunity alerts directly here.\n\nReply anytime with *"Help"* or tap buttons on incoming alerts to take action.`,
      {
        parseMode: 'Markdown',
        buttons: [
          [
            { text: '🔍 View Current Matches', callbackData: 'VIEW_MATCHES' },
            { text: '⚙️ My Preferences', callbackData: 'VIEW_PREFERENCES' },
          ],
        ],
      }
    );

    return {
      success: true,
      userId: account.userId,
      message: 'Telegram account successfully connected and verified.',
    };
  }

  /**
   * Disconnects a Telegram account.
   */
  static async disconnectTelegram(userId: string) {
    return prisma.telegramAccount.update({
      where: { userId },
      data: {
        status: 'disconnected',
        isVerified: false,
        consentGiven: false,
        telegramChatId: null,
        telegramUsername: null,
        linkingToken: null,
      },
    });
  }

  /**
   * Registers a device push token.
   */
  static async registerPushToken(userId: string, token: string, platform: string, deviceName?: string) {
    return prisma.pushDeviceToken.upsert({
      where: { token },
      create: {
        userId,
        token,
        platform,
        deviceName,
        isActive: true,
      },
      update: {
        userId,
        platform,
        deviceName,
        isActive: true,
      },
    });
  }

  /**
   * Unregisters a device push token.
   */
  static async unregisterPushToken(token: string) {
    return prisma.pushDeviceToken.deleteMany({
      where: { token },
    });
  }

  /**
   * Triggers a test notification to verify a specific connected channel.
   */
  static async sendTestNotification(userId: string, channel: string) {
    return NotificationDispatcherService.dispatch({
      eventType: 'CHANNEL_TEST',
      userId,
      title: 'Leed Opportunity Agent — Test Notification',
      body: `This is a test notification verifying your ${channel.toUpperCase()} connection. All systems operational.`,
      priority: 'INFO',
      actionUrl: 'https://leed.app/settings/connections',
    });
  }
}
