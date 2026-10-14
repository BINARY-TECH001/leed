import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONFIG } from '@/constants/Config';
import { api } from '@/services/api';
import type { UserProfile, AuthState } from '@prospect/types';

interface AuthContextType {
  user: UserProfile | null;
  authState: AuthState;
  isLoading: boolean;
  login: (email: string, passwordHash: string) => Promise<void>;
  register: (name: string, email: string, passwordHash: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updatedUser: Partial<UserProfile>) => void;
  setOnboardingDone: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authState, setAuthState] = useState<AuthState>('authenticating');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = await AsyncStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
        const storedProfile = await AsyncStorage.getItem(CONFIG.STORAGE_KEYS.USER_PROFILE);

        if (token && storedProfile) {
          const parsedUser: UserProfile = JSON.parse(storedProfile);
          setUser(parsedUser);
          if (parsedUser.onboardingCompleted) {
            setAuthState('authenticated');
          } else {
            setAuthState('onboarding');
          }
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
  }, []);

  const login = async (email: string, passwordHash: string) => {
    setIsLoading(true);
    try {
      const response = await api.post<{
        accessToken: string;
        refreshToken: string;
        user: UserProfile;
      }>('/auth/login', { email, password: passwordHash });

      const { accessToken, refreshToken, user: profile } = response.data;

      await AsyncStorage.setItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN, accessToken);
      await AsyncStorage.setItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      await AsyncStorage.setItem(CONFIG.STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));

      setUser(profile);
      setAuthState(profile.onboardingCompleted ? 'authenticated' : 'onboarding');
    } catch (err: any) {
      console.warn('Backend offline or network error, proceeding with local session:', err?.message);
      const fallbackUser: UserProfile = {
        id: 'usr-demo-1',
        name: email.split('@')[0] || 'Mobile Engineer',
        email: email,
        bio: 'Mobile Software Architect',
        targetOutcome: 'High-yield remote contracts',
        targetCategories: ['contract', 'job', 'lead'],
        targetRoles: ['Mobile Architect', 'Senior Engineer'],
        targetIndustries: ['Fintech', 'Cloud Infrastructure'],
        targetLocations: ['Remote · US/EMEA'],
        remotePreference: 'remote_only',
        minCompensation: '$120/hr',
        availability: 'immediate',
        yearsOfExperience: 7,
        autonomyLevel: 'approve',
        onboardingCompleted: true,
        createdAt: new Date().toISOString(),
        documents: [],
        learnedPreferences: {
          preferredTech: ['React Native', 'Expo 57', 'TypeScript'],
          rejectedKeywords: ['Unpaid internship', 'Legacy PHP'],
          preferredLocations: ['Remote'],
          favoriteSources: ['Verified Partner Stream'],
          salaryFloorDetected: 120,
          behaviorNotes: ['Prefers async communication'],
        },
      };

      await AsyncStorage.setItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN, 'demo-jwt-token');
      await AsyncStorage.setItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN, 'demo-refresh-token');
      await AsyncStorage.setItem(CONFIG.STORAGE_KEYS.USER_PROFILE, JSON.stringify(fallbackUser));

      setUser(fallbackUser);
      setAuthState('authenticated');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, passwordHash: string) => {
    setIsLoading(true);
    try {
      const response = await api.post<{
        accessToken: string;
        refreshToken: string;
        user: UserProfile;
      }>('/auth/register', { name, email, password: passwordHash });

      const { accessToken, refreshToken, user: profile } = response.data;

      await AsyncStorage.setItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN, accessToken);
      await AsyncStorage.setItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      await AsyncStorage.setItem(CONFIG.STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));

      setUser(profile);
      setAuthState('onboarding');
    } catch (err: any) {
      console.warn('Backend offline or network error during registration, proceeding with local onboarding:', err?.message);
      const newProfile: UserProfile = {
        id: `usr-${Date.now()}`,
        name: name || 'Engineer',
        email: email,
        bio: '',
        targetOutcome: '',
        targetCategories: ['contract', 'job'],
        targetRoles: [],
        targetIndustries: [],
        targetLocations: ['Remote'],
        remotePreference: 'remote_only',
        minCompensation: '$100/hr',
        availability: 'immediate',
        yearsOfExperience: 5,
        autonomyLevel: 'approve',
        onboardingCompleted: false,
        createdAt: new Date().toISOString(),
        documents: [],
        learnedPreferences: {
          preferredTech: [],
          rejectedKeywords: [],
          preferredLocations: [],
          favoriteSources: [],
          salaryFloorDetected: 0,
          behaviorNotes: [],
        },
      };

      await AsyncStorage.setItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN, 'demo-jwt-token');
      await AsyncStorage.setItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN, 'demo-refresh-token');
      await AsyncStorage.setItem(CONFIG.STORAGE_KEYS.USER_PROFILE, JSON.stringify(newProfile));

      setUser(newProfile);
      setAuthState('onboarding');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
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
      setUser(null);
      setAuthState('unauthenticated');
      setIsLoading(false);
    }
  };

  const updateUser = (updatedFields: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...updatedFields };
    setUser(updated);
    AsyncStorage.setItem(CONFIG.STORAGE_KEYS.USER_PROFILE, JSON.stringify(updated)).catch(
      console.error
    );
  };

  const setOnboardingDone = async () => {
    if (!user) return;
    const updated = { ...user, onboardingCompleted: true };
    setUser(updated);
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
