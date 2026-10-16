import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/theme';
import { type PipelineRecord, type PipelineStage } from '@/context/PipelineContext';
import {
  Briefcase,
  ArrowRight2,
  Calendar,
  Clock,
  DollarCircle,
  TickCircle,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';

export interface ActivePipelineRailProps {
  records: PipelineRecord[];
  onSelectRecord?: (record: PipelineRecord) => void;
  onOpenStagePicker?: (record: PipelineRecord) => void;
}

const STAGE_CONFIG: Record<PipelineStage, { label: string; color: string; bg: string }> = {
  saved: { label: 'Saved', color: '#6B7280', bg: 'rgba(107, 114, 128, 0.1)' },
  applied: { label: 'Applied', color: '#0052FF', bg: 'rgba(0, 82, 255, 0.1)' },
  follow_up: { label: 'Follow-Up', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },
  interviewing: { label: 'Interview', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' },
  won: { label: 'Offer', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)' },
  archived: { label: 'Archived', color: '#9CA3AF', bg: 'rgba(156, 163, 175, 0.1)' },
};

export const ActivePipelineRail: React.FC<ActivePipelineRailProps> = ({
  records,
  onSelectRecord,
  onOpenStagePicker,
}) => {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  if (records.length === 0) return null;

  return (
    <View style={styles.container}>
      {/* Rail Title Header */}
      <View style={styles.railHeaderRow}>
        <View style={styles.railTitleRow}>
          <Briefcase size={15} color={colors.accent} variant="Bold" />
          <Text style={[styles.railTitle, { color: colors.text }]}>Active Deals In Flight</Text>
          <View style={[styles.countBadge, { backgroundColor: colors.accent }]}>
            <Text style={styles.countBadgeText}>{records.length}</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/pipeline' as any)}
          style={styles.viewAllBtn}
          activeOpacity={0.7}
        >
          <Text style={[styles.viewAllText, { color: colors.accent }]}>Manage All</Text>
          <ArrowRight2 size={12} color={colors.accent} />
        </TouchableOpacity>
      </View>

      {/* Horizontal Carousel */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollList}
      >
        {records.map((rec) => {
          const stageCfg = STAGE_CONFIG[rec.stage] || STAGE_CONFIG.saved;
          return (
            <TouchableOpacity
              key={rec.id}
              style={[
                styles.railCard,
                {
                  backgroundColor: isDark ? colors.card : '#FFFFFF',
                  borderColor: colors.borderSubtle,
                },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(`/opportunity/${rec.opportunityId}` as any);
              }}
              activeOpacity={0.8}
            >
              {/* Top: Stage badge + Org */}
              <View style={styles.cardHeader}>
                <View style={[styles.stagePill, { backgroundColor: stageCfg.bg }]}>
                  <Text style={[styles.stagePillText, { color: stageCfg.color }]}>
                    {stageCfg.label}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.stageAdvanceBtn, { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA' }]}
                  onPress={(e) => {
                    e.stopPropagation();
                    Haptics.selectionAsync();
                    onOpenStagePicker?.(rec);
                  }}
                >
                  <Text style={[styles.stageAdvanceText, { color: colors.textSecondary }]}>Advance</Text>
                </TouchableOpacity>
              </View>

              {/* Title & Organization */}
              <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
                {rec.opportunity.title}
              </Text>
              <Text style={[styles.cardOrg, { color: colors.textMuted }]} numberOfLines={1}>
                {rec.opportunity.organization}
              </Text>

              {/* Bottom Info: Follow-up / Rate */}
              <View style={[styles.cardFooter, { borderTopColor: colors.borderSubtle }]}>
                {rec.followUpDate ? (
                  <View style={styles.footerItem}>
                    <Calendar size={11} color="#F59E0B" variant="Bold" />
                    <Text style={[styles.footerText, { color: '#F59E0B' }]} numberOfLines={1}>
                      {rec.followUpDate}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.footerItem}>
                    <DollarCircle size={11} color={colors.accent} variant="Bold" />
                    <Text style={[styles.footerText, { color: colors.textSecondary }]} numberOfLines={1}>
                      {rec.opportunity.compensation}
                    </Text>
                  </View>
                )}

                <Text style={[styles.matchScoreText, { color: colors.accent }]}>
                  {rec.opportunity.matchScore}%
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  railHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  railTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  railTitle: {
    fontSize: 14,
    fontFamily: FONTS.bold,
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BORDER_RADIUS.full,
  },
  countBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: FONTS.bold,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  viewAllText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
  },
  scrollList: {
    gap: 10,
    paddingRight: SPACING.md,
  },
  railCard: {
    width: 220,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    padding: 12,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  stagePill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.xs,
  },
  stagePillText: {
    fontSize: 10.5,
    fontFamily: FONTS.bold,
    textTransform: 'uppercase',
  },
  stageAdvanceBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.xs,
  },
  stageAdvanceText: {
    fontSize: 10,
    fontFamily: FONTS.semibold,
  },
  cardTitle: {
    fontSize: 13.5,
    fontFamily: FONTS.bold,
  },
  cardOrg: {
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    marginTop: 4,
    borderTopWidth: 1,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  footerText: {
    fontSize: 11,
    fontFamily: FONTS.medium,
  },
  matchScoreText: {
    fontSize: 11,
    fontFamily: FONTS.bold,
  },
});
