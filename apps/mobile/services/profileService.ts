import { api } from './api';

export interface ProfilePersonal {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string;
  preferredDisplayName: string;
  phone?: string | null;
  phoneVerified: boolean;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  country?: string | null;
  city?: string | null;
  timezone?: string;
  preferredLanguage?: string;
  accountStatus: string;
  createdAt: string;
}

export interface ProfileSkill {
  id: string;
  name: string;
  category: string;
  yearsExperience?: number | null;
  isTopSkill: boolean;
}

export interface ProfileExperience {
  id: string;
  role: string;
  company: string;
  period: string;
  description: string;
  highlights: string[];
}

export interface ProfileDocument {
  id: string;
  name: string;
  type: string;
  fileUrl?: string | null;
  fileSize?: string | null;
  extractedText?: string | null;
  uploadedAt: string;
}

export interface FullProfileResponse {
  personal: ProfilePersonal;
  professional: {
    headline?: string | null;
    currentRole?: string | null;
    careerGoals?: string | null;
    bio?: string | null;
    targetOutcome?: string | null;
    targetRoles: string[];
    targetIndustries: string[];
    targetLocations: string[];
    remotePreference?: string | null;
    minCompensation?: string | null;
    salaryCurrency: string;
    yearsOfExperience: number;
    skills: ProfileSkill[];
    experiences: ProfileExperience[];
  };
  documents: ProfileDocument[];
  connections: {
    whatsapp: {
      isConfigured: boolean;
      phoneNumber?: string | null;
      status: string;
    };
    telegram: {
      isConfigured: boolean;
      username?: string | null;
      status: string;
    };
    email: {
      isConfigured: boolean;
      email: string;
      frequency: string;
    };
  };
  completeness: {
    percentage: number;
    missingFields: string[];
  };
}

export const profileService = {
  /**
   * Fetches full unified user profile (personal, professional, documents, connections).
   */
  async getFullProfile(): Promise<FullProfileResponse> {
    const res = await api.get<{ success: boolean; data: FullProfileResponse }>('/profile');
    return res.data.data;
  },

  /**
   * Updates personal details including display name, avatarUrl, coverUrl, phone, location.
   */
  async updatePersonal(data: {
    name?: string;
    preferredDisplayName?: string;
    avatarUrl?: string;
    coverUrl?: string;
    phone?: string;
    country?: string;
    city?: string;
    timezone?: string;
    preferredLanguage?: string;
  }): Promise<ProfilePersonal> {
    const res = await api.put<{ success: boolean; data: ProfilePersonal }>('/profile/personal', data);
    return res.data.data;
  },

  /**
   * Updates professional and matching preferences.
   */
  async updateProfessional(data: {
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
  }): Promise<any> {
    const res = await api.put<{ success: boolean; data: any }>('/profile/professional', data);
    return res.data.data;
  },

  /**
   * Registers an uploaded CV or portfolio document.
   */
  async uploadDocument(doc: {
    name: string;
    type: string;
    fileUrl?: string;
    fileSize?: string;
    extractedText?: string;
  }): Promise<ProfileDocument> {
    const res = await api.post<{ success: boolean; data: ProfileDocument }>('/profile/documents', doc);
    return res.data.data;
  },

  /**
   * Deletes a document by ID.
   */
  async deleteDocument(documentId: string): Promise<boolean> {
    const res = await api.delete<{ success: boolean }>(`/profile/documents/${documentId}`);
    return res.data.success;
  },

  /**
   * Adds a work experience entry.
   */
  async addExperience(exp: {
    role: string;
    company: string;
    period: string;
    description?: string;
    highlights?: string[];
  }): Promise<ProfileExperience> {
    const res = await api.post<{ success: boolean; data: ProfileExperience }>('/profile/experiences', exp);
    return res.data.data;
  },

  /**
   * Deletes a work experience entry.
   */
  async deleteExperience(experienceId: string): Promise<boolean> {
    const res = await api.delete<{ success: boolean }>(`/profile/experiences/${experienceId}`);
    return res.data.success;
  },

  /**
   * Adds a skill to the user's profile.
   */
  async addSkill(skill: {
    name: string;
    category?: string;
    yearsExperience?: number;
    isTopSkill?: boolean;
  }): Promise<ProfileSkill> {
    const res = await api.post<{ success: boolean; data: ProfileSkill }>('/profile/skills', skill);
    return res.data.data;
  },

  /**
   * Deletes a skill from the profile.
   */
  async deleteSkill(skillId: string): Promise<boolean> {
    const res = await api.delete<{ success: boolean }>(`/profile/skills/${skillId}`);
    return res.data.success;
  },
};
