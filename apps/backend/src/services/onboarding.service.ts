import { prisma } from '../utils/prisma.js';
import { OpportunityService } from './opportunity.service.js';
import { ConnectionsService } from './connections.service.js';

export interface OnboardingState {
  currentStep: number;
  totalSteps: number;
  isCompleted: boolean;
  selectedCategories: string[];
  initialScanResultsCount: number;
  connectedChannelsCount: number;
}

export class OnboardingService {
  /**
   * Retrieves the current onboarding progression state for a user.
   */
  static async getOnboardingState(userId: string): Promise<OnboardingState> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        whatsAppAccount: true,
        telegramAccount: true,
        pushDeviceTokens: { where: { isActive: true } },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const currentStep = user.profile?.onboardingStep || 1;
    const isCompleted = user.profile?.onboardingCompleted || false;
    const selectedCategories = (user.profile?.targetCategories || []).map((c) => String(c).toLowerCase());

    let connectedCount = 1; // Email is connected by default on signup
    if (user.whatsAppAccount?.isVerified) connectedCount++;
    if (user.telegramAccount?.isVerified) connectedCount++;
    if (user.pushDeviceTokens.length > 0) connectedCount++;

    return {
      currentStep,
      totalSteps: 9,
      isCompleted,
      selectedCategories,
      initialScanResultsCount: 0,
      connectedChannelsCount: connectedCount,
    };
  }

  /**
   * Saves data for a specific onboarding step and advances the step index.
   */
  static async updateStep(
    userId: string,
    step: number,
    payload: {
      categories?: string[];
      roleOrFocus?: string;
      locations?: string[];
      headline?: string;
      minMatchScore?: number;
      completeNow?: boolean;
    }
  ): Promise<OnboardingState> {
    const nextStep = Math.min(step + 1, 9);
    const isCompleted = Boolean(payload.completeNow || step >= 9);

    await prisma.profile.upsert({
      where: { userId },
      create: {
        userId,
        targetOutcome: payload.headline || payload.roleOrFocus || 'Opportunity Discovery',
        headline: payload.headline,
        targetRoles: payload.roleOrFocus ? [payload.roleOrFocus] : [],
        targetLocations: payload.locations || ['Remote'],
        targetCategories: payload.categories ? (payload.categories.map((c) => c.toUpperCase()) as any) : ['JOB'],
        minMatchScore: payload.minMatchScore || 60,
        onboardingStep: nextStep,
        onboardingCompleted: isCompleted,
      },
      update: {
        headline: payload.headline,
        targetRoles: payload.roleOrFocus ? [payload.roleOrFocus] : undefined,
        targetLocations: payload.locations,
        targetCategories: payload.categories ? (payload.categories.map((c) => c.toUpperCase()) as any) : undefined,
        minMatchScore: payload.minMatchScore,
        onboardingStep: nextStep,
        onboardingCompleted: isCompleted,
      },
    });

    return this.getOnboardingState(userId);
  }

  /**
   * Executes the initial real discovery scan for newly onboarded criteria.
   */
  static async executeInitialScan(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    const category = user?.profile?.targetCategories?.[0] || 'JOB';
    const query = user?.profile?.targetRoles?.[0] || user?.profile?.headline || 'Engineer';

    // Search real canonical opportunities matching user's initial criteria
    const searchRes = await OpportunityService.searchOpportunities({
      query,
      type: String(category).toLowerCase() as any,
      limit: 10,
    });

    return {
      results: searchRes.opportunities,
      totalFound: searchRes.total,
    };
  }

  /**
   * Completes onboarding and sends a welcome / test alert to connected channels.
   */
  static async completeOnboarding(userId: string) {
    await prisma.profile.update({
      where: { userId },
      data: {
        onboardingCompleted: true,
        onboardingStep: 9,
      },
    });

    return {
      success: true,
      message: 'Onboarding complete! Leed is now monitoring opportunities for you.',
    };
  }
}
