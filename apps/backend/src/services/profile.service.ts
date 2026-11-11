import { prisma } from '../utils/prisma.js';

export interface ProfileCompletenessResult {
  score: number; // 0 - 100
  completedSections: string[];
  missingRecommendations: Array<{
    field: string;
    action: string;
    impactScore: number;
  }>;
}

export class ProfileService {
  /**
   * Fetches the complete aggregated profile, completeness score, and preferences.
   */
  static async getFullProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: {
          include: {
            skills: true,
            experiences: true,
          },
        },
        documents: {
          orderBy: { uploadedAt: 'desc' },
        },
        whatsAppAccount: true,
        telegramAccount: true,
        emailPreference: true,
        pushDeviceTokens: { where: { isActive: true } },
        notificationPreference: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const completeness = this.calculateCompleteness(user);

    return {
      personal: {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        name: user.name,
        preferredDisplayName: user.preferredDisplayName || user.name,
        phone: user.phone,
        phoneVerified: user.phoneVerified,
        avatarUrl: user.avatarUrl,
        coverUrl: user.coverUrl,
        country: user.country,
        city: user.city,
        timezone: user.timezone,
        preferredLanguage: user.preferredLanguage,
        accountStatus: user.status,
        createdAt: user.createdAt,
      },
      professional: {
        headline: user.profile?.headline,
        currentRole: user.profile?.currentRole,
        careerGoals: user.profile?.careerGoals,
        bio: user.profile?.bio,
        targetOutcome: user.profile?.targetOutcome,
        targetRoles: user.profile?.targetRoles || [],
        targetIndustries: user.profile?.targetIndustries || [],
        targetLocations: user.profile?.targetLocations || [],
        remotePreference: user.profile?.remotePreference,
        minCompensation: user.profile?.minCompensation,
        salaryCurrency: user.profile?.salaryCurrency || 'USD',
        yearsOfExperience: user.profile?.yearsOfExperience || 0,
        skills: user.profile?.skills || [],
        experiences: user.profile?.experiences || [],
      },
      categorySpecific: {
        targetFundingAmount: user.profile?.targetFundingAmount,
        studyLevel: user.profile?.studyLevel,
        scholarshipPreferences: user.profile?.scholarshipPreferences,
        grantPreferences: user.profile?.grantPreferences,
        businessProspectPreferences: user.profile?.businessProspectPreferences,
      },
      opportunityPreferences: {
        targetCategories: user.profile?.targetCategories || [],
        minMatchScore: user.profile?.minMatchScore || 60,
        excludedKeywords: user.profile?.excludedKeywords || [],
        excludedOrganizations: user.profile?.excludedOrganizations || [],
      },
      privacyAndRetention: {
        aiPersonalizationEnabled: user.profile?.aiPersonalizationEnabled ?? true,
        dataRetentionMonths: user.profile?.dataRetentionMonths ?? 12,
      },
      documents: user.documents,
      connections: {
        whatsapp: {
          connected: Boolean(user.whatsAppAccount?.isVerified && user.whatsAppAccount?.status === 'active'),
          phone: user.whatsAppAccount?.phoneNumber,
          status: user.whatsAppAccount?.status || 'disconnected',
        },
        telegram: {
          connected: Boolean(user.telegramAccount?.isVerified && user.telegramAccount?.status === 'active'),
          username: user.telegramAccount?.telegramUsername,
          status: user.telegramAccount?.status || 'disconnected',
        },
        email: {
          connected: Boolean(user.emailPreference?.status === 'active'),
          email: user.emailPreference?.email || user.email,
          status: user.emailPreference?.status || 'active',
        },
        push: {
          connected: user.pushDeviceTokens.length > 0,
          deviceCount: user.pushDeviceTokens.length,
        },
      },
      completeness,
    };
  }

  /**
   * Calculates profile completeness and actionable suggestions.
   */
  static calculateCompleteness(user: any): ProfileCompletenessResult {
    let score = 20; // Base for verified account registration
    const completedSections: string[] = ['Account Registered'];
    const missingRecommendations: Array<{ field: string; action: string; impactScore: number }> = [];

    if (user.preferredDisplayName || user.country) {
      score += 15;
      completedSections.push('Personal Details');
    } else {
      missingRecommendations.push({
        field: 'personal',
        action: 'Add your country, city, and preferred display name',
        impactScore: 15,
      });
    }

    if (user.profile?.headline || user.profile?.currentRole) {
      score += 20;
      completedSections.push('Professional Identity');
    } else {
      missingRecommendations.push({
        field: 'professional',
        action: 'Add your headline or current role for better discovery matching',
        impactScore: 20,
      });
    }

    if (user.profile?.skills && user.profile.skills.length > 0) {
      score += 20;
      completedSections.push('Key Skills');
    } else {
      missingRecommendations.push({
        field: 'skills',
        action: 'List at least 3 skills or areas of expertise',
        impactScore: 20,
      });
    }

    if (user.documents && user.documents.length > 0) {
      score += 15;
      completedSections.push('CV / Materials Uploaded');
    } else {
      missingRecommendations.push({
        field: 'documents',
        action: 'Upload a CV or credential document for tailored application drafting',
        impactScore: 15,
      });
    }

    if (user.telegramAccount?.isVerified || user.whatsAppAccount?.isVerified || user.pushDeviceTokens?.length > 0) {
      score += 10;
      completedSections.push('Notification Channel Connected');
    } else {
      missingRecommendations.push({
        field: 'connections',
        action: 'Connect Telegram, WhatsApp, or Push for instant opportunity alerts',
        impactScore: 10,
      });
    }

    return {
      score: Math.min(score, 100),
      completedSections,
      missingRecommendations,
    };
  }

  /**
   * Updates personal profile information.
   */
  static async updatePersonal(
    userId: string,
    data: {
      name?: string;
      preferredDisplayName?: string;
      avatarUrl?: string;
      coverUrl?: string;
      phone?: string;
      country?: string;
      city?: string;
      timezone?: string;
      preferredLanguage?: string;
    }
  ) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        preferredDisplayName: data.preferredDisplayName,
        avatarUrl: data.avatarUrl,
        coverUrl: data.coverUrl,
        phone: data.phone,
        country: data.country,
        city: data.city,
        timezone: data.timezone,
        preferredLanguage: data.preferredLanguage,
      },
    });
  }

  /**
   * Updates professional and educational profile.
   */
  static async updateProfessional(
    userId: string,
    data: {
      headline?: string;
      currentRole?: string;
      careerGoals?: string;
      bio?: string;
      targetRoles?: string[];
      targetIndustries?: string[];
      targetLocations?: string[];
      remotePreference?: string;
      minCompensation?: string;
      salaryCurrency?: string;
      yearsOfExperience?: number;
      targetFundingAmount?: string;
      studyLevel?: string;
      scholarshipPreferences?: any;
      grantPreferences?: any;
      businessProspectPreferences?: any;
    }
  ) {
    return prisma.profile.upsert({
      where: { userId },
      create: {
        userId,
        targetOutcome: data.headline || 'Opportunity Discovery',
        headline: data.headline,
        currentRole: data.currentRole,
        careerGoals: data.careerGoals,
        bio: data.bio,
        targetRoles: data.targetRoles || [],
        targetIndustries: data.targetIndustries || [],
        targetLocations: data.targetLocations || [],
        remotePreference: data.remotePreference || 'remote_only',
        minCompensation: data.minCompensation,
        salaryCurrency: data.salaryCurrency || 'USD',
        yearsOfExperience: data.yearsOfExperience || 0,
        targetFundingAmount: data.targetFundingAmount,
        studyLevel: data.studyLevel,
        scholarshipPreferences: data.scholarshipPreferences,
        grantPreferences: data.grantPreferences,
        businessProspectPreferences: data.businessProspectPreferences,
      },
      update: {
        headline: data.headline,
        currentRole: data.currentRole,
        careerGoals: data.careerGoals,
        bio: data.bio,
        targetRoles: data.targetRoles,
        targetIndustries: data.targetIndustries,
        targetLocations: data.targetLocations,
        remotePreference: data.remotePreference,
        minCompensation: data.minCompensation,
        salaryCurrency: data.salaryCurrency,
        yearsOfExperience: data.yearsOfExperience,
        targetFundingAmount: data.targetFundingAmount,
        studyLevel: data.studyLevel,
        scholarshipPreferences: data.scholarshipPreferences,
        grantPreferences: data.grantPreferences,
        businessProspectPreferences: data.businessProspectPreferences,
      },
    });
  }

  /**
   * Updates opportunity matching preferences.
   */
  static async updateOpportunityPreferences(
    userId: string,
    data: {
      targetCategories?: any[];
      minMatchScore?: number;
      excludedKeywords?: string[];
      excludedOrganizations?: string[];
    }
  ) {
    return prisma.profile.update({
      where: { userId },
      data: {
        targetCategories: data.targetCategories ? (data.targetCategories.map((c: string) => c.toUpperCase()) as any) : undefined,
        minMatchScore: data.minMatchScore,
        excludedKeywords: data.excludedKeywords,
        excludedOrganizations: data.excludedOrganizations,
      },
    });
  }

  /**
   * Updates privacy, AI personalization, and data retention preferences.
   */
  static async updatePrivacy(
    userId: string,
    data: {
      aiPersonalizationEnabled?: boolean;
      dataRetentionMonths?: number;
    }
  ) {
    return prisma.profile.update({
      where: { userId },
      data: {
        aiPersonalizationEnabled: data.aiPersonalizationEnabled,
        dataRetentionMonths: data.dataRetentionMonths,
      },
    });
  }

  /**
   * Adds or registers a CV document.
   */
  static async addDocument(
    userId: string,
    doc: {
      name: string;
      type: string;
      fileUrl?: string;
      fileSize?: string;
      extractedText?: string;
    }
  ) {
    return prisma.document.create({
      data: {
        userId,
        name: doc.name,
        type: doc.type,
        fileUrl: doc.fileUrl,
        fileSize: doc.fileSize,
        extractedText: doc.extractedText,
      },
    });
  }

  /**
   * Deletes a document owned by the user.
   */
  static async deleteDocument(userId: string, documentId: string) {
    return prisma.document.deleteMany({
      where: { id: documentId, userId },
    });
  }

  /**
   * Adds a professional experience entry.
   */
  static async addExperience(
    userId: string,
    exp: {
      role: string;
      company: string;
      period: string;
      description?: string;
      highlights?: string[];
    }
  ) {
    let profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) {
      profile = await prisma.profile.create({
        data: { userId, targetOutcome: 'Career Growth' },
      });
    }

    return prisma.experience.create({
      data: {
        profileId: profile.id,
        role: exp.role,
        company: exp.company,
        period: exp.period,
        description: exp.description || '',
        highlights: exp.highlights || [],
      },
    });
  }

  /**
   * Deletes a professional experience entry.
   */
  static async deleteExperience(userId: string, experienceId: string) {
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) return { count: 0 };
    return prisma.experience.deleteMany({
      where: { id: experienceId, profileId: profile.id },
    });
  }

  /**
   * Adds a skill to the user's profile.
   */
  static async addSkill(
    userId: string,
    skill: {
      name: string;
      category?: string;
      yearsExperience?: number;
      isTopSkill?: boolean;
    }
  ) {
    let profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) {
      profile = await prisma.profile.create({
        data: { userId, targetOutcome: 'Career Growth' },
      });
    }

    return prisma.skill.create({
      data: {
        profileId: profile.id,
        name: skill.name,
        category: skill.category || 'General',
        yearsExperience: skill.yearsExperience || 1,
        isTopSkill: skill.isTopSkill ?? false,
      },
    });
  }

  /**
   * Deletes a skill from the user's profile.
   */
  static async deleteSkill(userId: string, skillId: string) {
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) return { count: 0 };
    return prisma.skill.deleteMany({
      where: { id: skillId, profileId: profile.id },
    });
  }

  /**
   * Deletes a user account and associated personal data.
   */
  static async deleteAccount(userId: string) {
    return prisma.user.delete({
      where: { id: userId },
    });
  }
}
