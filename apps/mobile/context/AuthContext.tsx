import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONFIG } from '@/constants/Config';
import { authService, authKeys, LoginCredentials, SignupCredentials } from '@/services/authService';
import { queryClient } from '@/services/queryClient';
import type { UserProfile, AuthState } from '@prospect/types';

interface AuthContextType {
  user: UserProfile | null;
  authState: AuthState;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<UserProfile>;
  register: (credentials: SignupCredentials) => Promise<UserProfile>;
  verifyEmail: (code: string) => Promise<UserProfile>;
  socialLogin: (payload: {
    provider: 'google' | 'apple';
    email: string;
    name?: string;
    avatarUrl?: string;
  }) => Promise<UserProfile>;
  logout: () => Promise<void>;
  updateUser: (updatedUser: Partial<UserProfile>) => void;
  setOnboardingDone: () => Promise<void>;
  refreshProfile: () => Promise<UserProfile | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authState, setAuthState] = useState<AuthState>('authenticating');
  const [isLoading, setIsLoading] = useState(true);

  // Background token & profile sync
  const refreshProfile = useCallback(async (): Promise<UserProfile | null> => {
    try {
      const freshUser = await authService.getMe();
      setUser(freshUser);
      queryClient.setQueryData(authKeys.me(), freshUser);

      // Re-evaluate auth state based on server truth
      if (!freshUser.emailVerified) {
        setAuthState('verification_required');
      } else if (!freshUser.onboardingCompleted) {
        setAuthState('onboarding');
      } else {
        setAuthState('authenticated');
      }

      return freshUser;
    } catch (err: any) {
      if (err?.response?.status === 401) {
        await logout();
      }
      return null;
    }
  }, []);

  // Initialize cached session on startup
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = await authService.getStoredToken();
        const storedProfile = await authService.getStoredProfile();

        if (token && storedProfile) {
          // Instant hydration from cache
          setUser(storedProfile);
          queryClient.setQueryData(authKeys.me(), storedProfile);

          if (!storedProfile.emailVerified) {
            setAuthState('verification_required');
          } else if (!storedProfile.onboardingCompleted) {
            setAuthState('onboarding');
          } else {
            setAuthState('authenticated');
          }

          // Verify with live backend in background
          refreshProfile().catch(() => {});
        } else {
          setAuthState('unauthenticated');
        }
      } catch (err) {
        console.error('Error initializing auth state:', err);
        setAuthState('unauthenticated');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [refreshProfile]);

  const login = async (credentials: LoginCredentials): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      const data = await authService.login(credentials);
      setUser(data.user);

      queryClient.setQueryData(authKeys.me(), data.user);
      await queryClient.invalidateQueries({ queryKey: authKeys.all });

      if (!data.user.emailVerified) {
        setAuthState('verification_required');
      } else if (!data.user.onboardingCompleted) {
        setAuthState('onboarding');
      } else {
        setAuthState('authenticated');
      }
      return data.user;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (credentials: SignupCredentials): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      const data = await authService.signup(credentials);
      setUser(data.user);

      queryClient.setQueryData(authKeys.me(), data.user);
      await queryClient.invalidateQueries({ queryKey: authKeys.all });

      // Always require verification first for new signups
      setAuthState('verification_required');
      return data.user;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmail = async (code: string): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      const updatedUser = await authService.verifyEmail(code);
      setUser(updatedUser);
      queryClient.setQueryData(authKeys.me(), updatedUser);
      await AsyncStorage.setItem(CONFIG.STORAGE_KEYS.USER_PROFILE, JSON.stringify(updatedUser));

      if (!updatedUser.onboardingCompleted) {
        setAuthState('onboarding');
      } else {
        setAuthState('authenticated');
      }
      return updatedUser;
    } finally {
      setIsLoading(false);
    }
  };

  const socialLogin = async (payload: {
    provider: 'google' | 'apple';
    email: string;
    name?: string;
    avatarUrl?: string;
  }): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      const data = await authService.socialAuth(payload);
      setUser(data.user);
      queryClient.setQueryData(authKeys.me(), data.user);
      await queryClient.invalidateQueries({ queryKey: authKeys.all });

      if (!data.user.emailVerified) {
        setAuthState('verification_required');
      } else if (!data.user.onboardingCompleted) {
        setAuthState('onboarding');
      } else {
        setAuthState('authenticated');
      }
      return data.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } finally {
      queryClient.clear();
      setUser(null);
      setAuthState('unauthenticated');
      setIsLoading(false);
    }
  };

  const updateUser = (updatedFields: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...updatedFields };
    setUser(updated);
    queryClient.setQueryData(authKeys.me(), updated);

    AsyncStorage.setItem(CONFIG.STORAGE_KEYS.USER_PROFILE, JSON.stringify(updated)).catch(
      console.error
    );
  };

  const setOnboardingDone = async () => {
    if (!user) return;
    const updated = { ...user, onboardingCompleted: true };
    setUser(updated);
    queryClient.setQueryData(authKeys.me(), updated);
    setAuthState('authenticated');
    await AsyncStorage.setItem(CONFIG.STORAGE_KEYS.USER_PROFILE, JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        authState,
        isLoading,
        login,
        register,
        verifyEmail,
        socialLogin,
        logout,
        updateUser,
        setOnboardingDone,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
