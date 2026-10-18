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
      return freshUser;
    } catch (err: any) {
      // If unauthorized, token is no longer valid
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

          if (storedProfile.onboardingCompleted) {
            setAuthState('authenticated');
          } else {
            setAuthState('onboarding');
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

      // Seed & invalidate TanStack Query cache
      queryClient.setQueryData(authKeys.me(), data.user);
      await queryClient.invalidateQueries({ queryKey: authKeys.all });

      setAuthState(data.user.onboardingCompleted ? 'authenticated' : 'onboarding');
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

      // Seed & invalidate TanStack Query cache
      queryClient.setQueryData(authKeys.me(), data.user);
      await queryClient.invalidateQueries({ queryKey: authKeys.all });

      setAuthState('onboarding');
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
      // Invalidate and clear all TanStack Query cached data
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
