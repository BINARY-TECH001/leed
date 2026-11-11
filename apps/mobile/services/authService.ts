import { api } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONFIG } from '@/constants/Config';
import type { UserProfile } from '@prospect/types';

export interface AuthResponseData {
  user: UserProfile;
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  name: string;
  email: string;
  password: string;
}

export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
  profile: () => [...authKeys.all, 'profile'] as const,
};

export const authService = {
  /**
   * Authenticate user with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponseData> {
    const response = await api.post<{
      success: boolean;
      data: AuthResponseData;
      message?: string;
    }>('/auth/login', {
      email: credentials.email.trim().toLowerCase(),
      password: credentials.password,
    });

    const data = response.data?.data;
    if (!data || !data.accessToken) {
      throw new Error(response.data?.message || 'Login failed. Please check your credentials.');
    }

    await AsyncStorage.multiSet([
      [CONFIG.STORAGE_KEYS.AUTH_TOKEN, data.accessToken],
      [CONFIG.STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken],
      [CONFIG.STORAGE_KEYS.USER_PROFILE, JSON.stringify(data.user)],
    ]);

    return data;
  },

  /**
   * Register a new user account
   */
  async signup(credentials: SignupCredentials): Promise<AuthResponseData> {
    const response = await api.post<{
      success: boolean;
      data: AuthResponseData;
      message?: string;
    }>('/auth/signup', {
      name: credentials.name.trim(),
      email: credentials.email.trim().toLowerCase(),
      password: credentials.password,
    });

    const data = response.data?.data;
    if (!data || !data.accessToken) {
      throw new Error(response.data?.message || 'Signup failed. Please try again.');
    }

    await AsyncStorage.multiSet([
      [CONFIG.STORAGE_KEYS.AUTH_TOKEN, data.accessToken],
      [CONFIG.STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken],
      [CONFIG.STORAGE_KEYS.USER_PROFILE, JSON.stringify(data.user)],
    ]);

    return data;
  },

  /**
   * Fetch current authenticated user profile from backend
   */
  async getMe(): Promise<UserProfile> {
    const response = await api.get<{
      success: boolean;
      data: UserProfile;
    }>('/auth/me');

    if (!response.data?.data) {
      throw new Error('Could not retrieve user profile.');
    }

    const user = response.data.data;
    await AsyncStorage.setItem(CONFIG.STORAGE_KEYS.USER_PROFILE, JSON.stringify(user));
    return user;
  },

  /**
   * Terminate active session and purge cached credentials
   */
  async logout(): Promise<void> {
    try {
      const refreshToken = await AsyncStorage.getItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken }).catch(() => {});
      }
    } finally {
      await AsyncStorage.multiRemove([
        CONFIG.STORAGE_KEYS.AUTH_TOKEN,
        CONFIG.STORAGE_KEYS.REFRESH_TOKEN,
        CONFIG.STORAGE_KEYS.USER_PROFILE,
      ]);
    }
  },

  /**
   * Request email verification code sent to user email
   */
  async sendVerificationEmail(): Promise<{ message: string; email: string }> {
    const response = await api.post<{
      success: boolean;
      message: string;
      data?: { email: string };
    }>('/auth/send-verification-email');

    return {
      message: response.data?.message || 'Verification code dispatched.',
      email: response.data?.data?.email || '',
    };
  },

  /**
   * Submit 6-digit email verification code
   */
  async verifyEmail(code: string): Promise<UserProfile> {
    const response = await api.post<{
      success: boolean;
      data: UserProfile;
      message?: string;
    }>('/auth/verify-email', { code: code.trim() });

    if (!response.data?.data) {
      throw new Error(response.data?.message || 'Invalid or expired verification code.');
    }

    const updatedUser = response.data.data;
    await AsyncStorage.setItem(CONFIG.STORAGE_KEYS.USER_PROFILE, JSON.stringify(updatedUser));
    return updatedUser;
  },

  /**
   * Authenticate with Google or Apple
   */
  async socialAuth(payload: {
    provider: 'google' | 'apple';
    email: string;
    name?: string;
    avatarUrl?: string;
  }): Promise<AuthResponseData> {
    const response = await api.post<{
      success: boolean;
      data: AuthResponseData;
      message?: string;
    }>('/auth/social', payload);

    const data = response.data?.data;
    if (!data || !data.accessToken) {
      throw new Error(response.data?.message || 'Social authentication failed.');
    }

    await AsyncStorage.multiSet([
      [CONFIG.STORAGE_KEYS.AUTH_TOKEN, data.accessToken],
      [CONFIG.STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken],
      [CONFIG.STORAGE_KEYS.USER_PROFILE, JSON.stringify(data.user)],
    ]);

    return data;
  },

  /**
   * Update personal profile information (name, avatar, cover, phone, etc.)
   */
  async updatePersonalProfile(data: {
    name?: string;
    preferredDisplayName?: string;
    avatarUrl?: string;
    coverUrl?: string;
    phone?: string;
    country?: string;
    city?: string;
  }): Promise<UserProfile> {
    const response = await api.put<{
      success: boolean;
      data: any;
      message?: string;
    }>('/profile/personal', data);

    const updatedUser = response.data?.data;
    if (updatedUser) {
      const existing = await this.getStoredProfile();
      const merged = { ...existing, ...updatedUser };
      await AsyncStorage.setItem(CONFIG.STORAGE_KEYS.USER_PROFILE, JSON.stringify(merged));
      return merged;
    }
    throw new Error(response.data?.message || 'Failed to update profile');
  },

  /**
   * Complete onboarding process
   */
  async completeOnboarding(payload?: any): Promise<void> {
    await api.post('/onboarding/complete', payload || {}).catch(() => {});
  },

  /**
   * Read stored profile from local storage
   */
  async getStoredProfile(): Promise<UserProfile | null> {
    try {
      const stored = await AsyncStorage.getItem(CONFIG.STORAGE_KEYS.USER_PROFILE);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  /**
   * Read stored access token
   */
  async getStoredToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
    } catch {
      return null;
    }
  },
};
