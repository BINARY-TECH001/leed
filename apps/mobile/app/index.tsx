import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

export default function IndexScreen() {
  const router = useRouter();
  const { authState, isLoading } = useAuth();
  const { colors } = useTheme();

  useEffect(() => {
    if (isLoading) return;

    if (authState === 'authenticated') {
      router.replace('/(tabs)');
    } else if (authState === 'onboarding') {
      router.replace('/(auth)/onboarding');
    } else {
      router.replace('/(auth)/landing');
    }
  }, [authState, isLoading, router]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
