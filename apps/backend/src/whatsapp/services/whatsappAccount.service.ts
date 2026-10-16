import crypto from 'node:crypto';
import { prisma } from '../../utils/prisma.js';
import { getWhatsAppProvider } from '../providers/index.js';
import type { OpportunityType } from '@prospect/types';

export interface LinkPhoneResult {
  success: boolean;
  phoneNumber: string;
  expiresAt: Date;
  verificationCode?: string; // Included only in test/dry-run environments
  error?: string;
}

export interface VerifyCodeResult {
  success: boolean;
  isVerified: boolean;
  phoneNumber: string;
  error?: string;
}

export class WhatsAppAccountService {
  /**
   * Cleans and normalizes an input phone number to E.164 format (+[country][number]).
   */
  static normalizePhoneNumber(raw: string): string {
    const digits = raw.replace(/\D/g, '');
    if (digits.length < 8 || digits.length > 15) {
      throw new Error(`Invalid phone number length: ${raw}. Must be 8 to 15 digits.`);
    }
    return `+${digits}`;
  }

  /**
   * Generates a 6-digit numeric verification code
   */
  private static generateCode(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Step 1 of account linkage: User provides phone number.
   * Generates a 15-minute verification code, stores it, and dispatches via WhatsApp.
   */
  static async linkPhoneNumber(userId: string, rawPhone: string): Promise<LinkPhoneResult> {
    const phoneNumber = this.normalizePhoneNumber(rawPhone);
    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    // Check if phone number is already linked to another user
    const existing = await prisma.whatsAppAccount.findUnique({
      where: { phoneNumber },
    });

    if (existing && existing.userId !== userId && existing.isVerified) {
      throw new Error('This WhatsApp phone number is already verified on another account.');
    }

    const account = await prisma.whatsAppAccount.upsert({
      where: { userId },
      create: {
        userId,
        phoneNumber,
        isVerified: false,
        verificationCode: code,
        verificationExpiresAt: expiresAt,
        status: 'pending_verification',
        consentGiven: false,
      },
      update: {
        phoneNumber,
        isVerified: false,
        verificationCode: code,
        verificationExpiresAt: expiresAt,
        status: 'pending_verification',
      },
    });

    // Send verification code via active WhatsApp provider
    const provider = getWhatsAppProvider();
    const msg = `🔐 Your Leed verification code is: *${code}*\n\nEnter this code in the app to connect your personal opportunity agent. Valid for 15 minutes.`;

    await provider.sendText(phoneNumber, msg);

    return {
      success: true,
      phoneNumber: account.phoneNumber,
      expiresAt,
      verificationCode: code,
    };
  }

  /**
   * Step 2 of account linkage: User enters the 6-digit verification code.
   * Validates code, activates account, records explicit consent, and sends welcome greeting.
   */
  static async verifyCode(userId: string, code: string): Promise<VerifyCodeResult> {
    const account = await prisma.whatsAppAccount.findUnique({
      where: { userId },
    });

    if (!account) {
      return { success: false, isVerified: false, phoneNumber: '', error: 'No WhatsApp connection request found.' };
    }

    if (!account.verificationCode || !account.verificationExpiresAt) {
      return { success: false, isVerified: false, phoneNumber: account.phoneNumber, error: 'No pending verification code.' };
    }

    if (new Date() > account.verificationExpiresAt) {
      return { success: false, isVerified: false, phoneNumber: account.phoneNumber, error: 'Verification code has expired. Please request a new code.' };
    }

    if (account.verificationCode !== code.trim()) {
      return { success: false, isVerified: false, phoneNumber: account.phoneNumber, error: 'Invalid verification code.' };
    }

    const now = new Date();
    await prisma.whatsAppAccount.update({
      where: { userId },
      data: {
        isVerified: true,
        verificationCode: null,
        verificationExpiresAt: null,
        consentGiven: true,
        consentGivenAt: now,
        status: 'active',
      },
    });

    // Ensure conversation record is initialized
    const cleanWaId = account.phoneNumber.replace(/\D/g, '');
    let conversation = await prisma.whatsAppConversation.findFirst({
      where: { userId, waId: cleanWaId },
    });

    if (!conversation) {
      conversation = await prisma.whatsAppConversation.create({
        data: {
          userId,
          waId: cleanWaId,
          lastInteractionAt: now,
        },
      });
    }

    // Send welcome greeting with interactive action guidance
    const provider = getWhatsAppProvider();
    const welcome =
      `🎉 *Welcome to Leed — Your Personal Opportunity Agent!*\n\n` +
      `Your WhatsApp number is now securely connected.\n` +
      `I will continuously monitor verified job boards, research grants, fellowships, and business directories for matches aligned with your profile.\n\n` +
      `💡 *You can message me anytime with:*\n` +
      `• _"Show details"_ on any match\n` +
      `• _"Apply"_ to prepare custom materials\n` +
      `• _"Save"_ to bookmark\n` +
      `• _"Pause alerts"_ or _"Resume alerts"_`;

    await provider.sendText(account.phoneNumber, welcome);

    return {
      success: true,
      isVerified: true,
      phoneNumber: account.phoneNumber,
    };
  }

  /**
   * Retrieves user's WhatsApp connection status and preferences.
   */
  static async getStatus(userId: string) {
    const account = await prisma.whatsAppAccount.findUnique({
      where: { userId },
    });

    if (!account) {
      return {
        isConnected: false,
        isVerified: false,
        status: 'disconnected',
      };
    }

    return {
      isConnected: account.status === 'active',
      isVerified: account.isVerified,
      phoneNumber: account.phoneNumber,
      status: account.status,
      consentGiven: account.consentGiven,
      consentGivenAt: account.consentGivenAt?.toISOString(),
      quietHoursStart: account.quietHoursStart,
      quietHoursEnd: account.quietHoursEnd,
      maxDailyNotifications: account.maxDailyNotifications,
      notificationsSentToday: account.notificationsSentToday,
      preferredCategories: account.preferredCategories,
      minMatchScore: account.minMatchScore,
    };
  }

  /**
   * Updates user notification preferences (quiet hours, frequency limits, categories).
   */
  static async updatePreferences(
    userId: string,
    prefs: {
      quietHoursStart?: string;
      quietHoursEnd?: string;
      maxDailyNotifications?: number;
      preferredCategories?: OpportunityType[];
      minMatchScore?: number;
    }
  ) {
    const account = await prisma.whatsAppAccount.findUnique({
      where: { userId },
    });

    if (!account) {
      throw new Error('WhatsApp account not found for user');
    }

    return prisma.whatsAppAccount.update({
      where: { userId },
      data: {
        quietHoursStart: prefs.quietHoursStart ?? account.quietHoursStart,
        quietHoursEnd: prefs.quietHoursEnd ?? account.quietHoursEnd,
        maxDailyNotifications: prefs.maxDailyNotifications ?? account.maxDailyNotifications,
        preferredCategories: prefs.preferredCategories
          ? (prefs.preferredCategories.map((c) => c.toUpperCase()) as any)
          : account.preferredCategories,
        minMatchScore: prefs.minMatchScore ?? account.minMatchScore,
      },
    });
  }

  /**
   * Pauses, resumes, or disconnects WhatsApp notifications.
   */
  static async setStatus(userId: string, status: 'active' | 'paused' | 'disconnected') {
    return prisma.whatsAppAccount.update({
      where: { userId },
      data: {
        status,
        consentGiven: status !== 'disconnected',
      },
    });
  }

  /**
   * Disconnects phone and revokes notification consent.
   */
  static async disconnect(userId: string) {
    return prisma.whatsAppAccount.update({
      where: { userId },
      data: {
        status: 'disconnected',
        consentGiven: false,
        isVerified: false,
      },
    });
  }
}
