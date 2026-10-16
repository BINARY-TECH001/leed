import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/theme';
import { Briefcase, Radar2, Calendar, Flash, ArrowRight2 } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';

export interface PipelineHeaderPulseProps {
  totalTracked: number;
  activeRadars: number;
  followUpsDueCount: number;
  interviewingCount: number;
  totalDiscoveries: number;
}

export const PipelineHeaderPulse: React.FC<PipelineHeaderPulseProps> = ({
  totalTracked,
  activeRadars,
  followUpsDueCount,
  interviewingCount,
  totalDiscoveries,
}) => {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  return (
    <View
      style={[
        styles.pulseCard,
        {
          backgroundColor: isDark ? colors.card : '#FFFFFF',
          borderColor: colors.borderSubtle,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.titleWrap}>
          <Text style={[styles.eyebrow, { color: colors.accent }]}>EXECUTIVE RADAR</Text>
          <Text style={[styles.heading, { color: colors.text }]}>Pipeline & Scout Hub</Text>
        </View>

        <TouchableOpacity
          style={[styles.fullPipelineLink, { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA' }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/pipeline' as any);
          }}
          activeOpacity={0.75}
        >
          <Text style={[styles.fullPipelineLinkText, { color: colors.accent }]}>Full Pipeline</Text>
          <ArrowRight2 size={13} color={colors.accent} />
        </TouchableOpacity>
      </View>

      {/* KPI Metrics Grid */}
      <View style={styles.kpiRow}>
        {/* KPI 1: Active In-Flight */}
        <TouchableOpacity
          style={[styles.kpiItem, { borderRightColor: colors.borderSubtle }]}
          onPress={() => router.push('/pipeline' as any)}
        >
          <Text style={[styles.kpiValue, { color: colors.text }]}>{totalTracked}</Text>
          <View style={styles.kpiLabelRow}>
            <Briefcase size={11} color={colors.accent} variant="Bold" />
            <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>Tracked</Text>
          </View>
        </TouchableOpacity>

        {/* KPI 2: Discoveries Available */}
        <View style={[styles.kpiItem, { borderRightColor: colors.borderSubtle }]}>
          <Text style={[styles.kpiValue, { color: colors.accent }]}>{totalDiscoveries}</Text>
          <View style={styles.kpiLabelRow}>
            <Flash size={11} color={colors.accent} variant="Bold" />
            <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>Verified</Text>
          </View>
        </View>

        {/* KPI 3: Due Follow-Ups */}
        <View style={[styles.kpiItem, { borderRightColor: colors.borderSubtle }]}>
          <Text style={[styles.kpiValue, { color: followUpsDueCount > 0 ? '#F59E0B' : colors.text }]}>
            {followUpsDueCount}
          </Text>
          <View style={styles.kpiLabelRow}>
            <Calendar size={11} color="#F59E0B" variant="Bold" />
            <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>Due</Text>
          </View>
        </View>

        {/* KPI 4: Interviews */}
        <View style={styles.kpiItem}>
          <Text style={[styles.kpiValue, { color: '#10B981' }]}>{interviewingCount}</Text>
          <View style={styles.kpiLabelRow}>
            <Radar2 size={11} color="#10B981" variant="Bold" />
            <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>Interview</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  pulseCard: {
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  titleWrap: {
    gap: 2,
  },
  eyebrow: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    letterSpacing: 0.8,
  },
  heading: {
    fontSize: 16.5,
    fontFamily: FONTS.bold,
  },
  fullPipelineLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.full,
  },
  fullPipelineLinkText: {
    fontSize: 12,
    fontFamily: FONTS.semibold,
  },
  kpiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
  },
  kpiItem: {
    flex: 1,
    alignItems: 'center',
    borderRightWidth: 1,
  },
  kpiValue: {
    fontSize: 18,
    fontFamily: FONTS.bold,
  },
  kpiLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  kpiLabel: {
    fontSize: 11,
    fontFamily: FONTS.medium,
  },
});
