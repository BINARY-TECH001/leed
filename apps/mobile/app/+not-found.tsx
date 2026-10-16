import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/theme';
import {
  Radar,
  Home2,
  Briefcase,
  Flash,
  ArrowLeft2,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';

export default function NotFoundScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();

  const isTablet = width > 600;
  const contentWidth = Math.min(width - 40, 520);

  const handleGoHome = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace('/(tabs)');
  };

  const handleGoPipeline = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace({ pathname: '/(tabs)/opportunities', params: { tab: 'pipeline' } } as any);
  };

  const handleGoRadars = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/(tabs)/radar');
  };

  const handleGoAction = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/action');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, { borderBottomColor: colors.borderSubtle }]}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA' }]}
          onPress={handleGoHome}
          activeOpacity={0.7}
        >
          <ArrowLeft2 size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: colors.text }]}>Navigation Alert</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, { width: contentWidth, backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Signal Indicator Icon */}
          <View
            style={[
              styles.iconWrapper,
              {
                backgroundColor: isDark ? 'rgba(0, 82, 255, 0.12)' : 'rgba(0, 82, 255, 0.08)',
                borderColor: colors.accent + '33',
              },
            ]}
          >
            <Radar size={48} color={colors.accent} variant="Bulk" />
          </View>

          {/* 404 Badge */}
          <View style={[styles.badgePill, { backgroundColor: colors.accent + '18' }]}>
            <Text style={[styles.badgeText, { color: colors.accent }]}>ERROR 404 • ROUTE UNREACHABLE</Text>
          </View>

          <Text style={[styles.headline, { color: colors.text }]}>Opportunity Signal Lost</Text>
          <Text style={[styles.subtext, { color: colors.textSecondary }]}>
            The screen or destination you requested has relocated, been consolidated into your active Pipeline, or is unavailable.
          </Text>

          {/* Primary Action Button */}
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.accent }]}
            onPress={handleGoHome}
            activeOpacity={0.85}
          >
            <Home2 size={20} color="#FFFFFF" variant="Bold" />
            <Text style={styles.primaryButtonText}>Return to Mission Control</Text>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />

          {/* Quick Destination Hub */}
          <Text style={[styles.quickNavTitle, { color: colors.textMuted }]}>
            QUICK ACCESS HUBS
          </Text>

          <View style={styles.quickGrid}>
            <TouchableOpacity
              style={[
                styles.quickOption,
                { backgroundColor: isDark ? colors.surfaceSecondary : '#F4F7FB', borderColor: colors.borderSubtle },
              ]}
              onPress={handleGoPipeline}
              activeOpacity={0.75}
            >
              <Briefcase size={20} color={colors.accent} variant="Bold" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.quickOptionTitle, { color: colors.text }]}>Active Pipeline</Text>
                <Text style={[styles.quickOptionDesc, { color: colors.textMuted }]}>View saved & applied roles</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.quickOption,
                { backgroundColor: isDark ? colors.surfaceSecondary : '#F4F7FB', borderColor: colors.borderSubtle },
              ]}
              onPress={handleGoRadars}
              activeOpacity={0.75}
            >
              <Radar size={20} color="#10B981" variant="Bold" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.quickOptionTitle, { color: colors.text }]}>Market Radars</Text>
                <Text style={[styles.quickOptionDesc, { color: colors.textMuted }]}>AI scanning streams</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.quickOption,
                { backgroundColor: isDark ? colors.surfaceSecondary : '#F4F7FB', borderColor: colors.borderSubtle },
              ]}
              onPress={handleGoAction}
              activeOpacity={0.75}
            >
              <Flash size={20} color="#F59E0B" variant="Bold" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.quickOptionTitle, { color: colors.text }]}>AI Action & Query</Text>
                <Text style={[styles.quickOptionDesc, { color: colors.textMuted }]}>Run custom opportunity search</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 16,
  },
  scrollContent: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderRadius: BORDER_RADIUS.xxl,
    borderWidth: 1,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  iconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  badgePill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.full,
    marginBottom: SPACING.sm,
  },
  badgeText: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    letterSpacing: 0.8,
  },
  headline: {
    fontFamily: FONTS.bold,
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtext: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: SPACING.lg,
    paddingHorizontal: 10,
  },
  primaryButton: {
    width: '100%',
    height: 52,
    borderRadius: BORDER_RADIUS.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
    fontSize: 15,
  },
  divider: {
    width: '100%',
    height: 1,
    marginVertical: SPACING.lg,
  },
  quickNavTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: SPACING.sm,
    alignSelf: 'flex-start',
  },
  quickGrid: {
    width: '100%',
    gap: 10,
  },
  quickOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
  },
  quickOptionTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
  },
  quickOptionDesc: {
    fontFamily: FONTS.regular,
    fontSize: 12,
  },
});
