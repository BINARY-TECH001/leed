import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { AuthSessionSkeleton } from '@/components/ui';

export default function IndexScreen() {
  const router = useRouter();
  const { authState, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (authState === 'authenticated') {
      router.replace('/(tabs)');
    } else if (authState === 'verification_required') {
      router.replace('/(auth)/verify-email');
    } else if (authState === 'onboarding') {
      router.replace('/(auth)/onboarding');
    } else {
      router.replace('/(auth)/landing');
    }
  }, [authState, isLoading, router]);

  return <AuthSessionSkeleton />;
}
