import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { Card, Badge } from '@/components/ui';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/theme';
import {
  Location,
  DollarCircle,
  Bookmark,
  Flash,
  ArrowRight2,
  Sms,
  Calendar,
  ArchiveAdd,
  Global,
  Clock,
  Briefcase,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import type { Opportunity } from '@prospect/types';

export interface OpportunityCardProps {
  opportunity: Opportunity;
  isSaved?: boolean;
  isApplied?: boolean;
  onToggleSave?: (id: string) => void;
  onAutoApply?: (opp: Opportunity) => void;
  onMailPitch?: (opp: Opportunity) => void;
  onSchedule?: (opp: Opportunity) => void;
}

export const OpportunityCard: React.FC<OpportunityCardProps> = ({
  opportunity: opp,
  isSaved = false,
  isApplied = false,
  onToggleSave,
  onAutoApply,
  onMailPitch,
  onSchedule,
}) => {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();

  // Screen-width responsive adjustments
  const isCompact = width < 370;

  const handleCardPress = () => {
    router.push(`/opportunity/${opp.id}` as any);
  };

  const handleSavePress = (e: any) => {
    e.stopPropagation?.();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggleSave?.(opp.id);
  };

  const getScoreVariant = (score: number) => {
    if (score >= 90) return 'success';
    if (score >= 75) return 'accent';
    return 'neutral';
  };

  const sourceName = opp.source || 'Verified Partner';

  return (
    <Card variant="elevated" style={styles.card} onPress={handleCardPress}>
      {/* Top Header Row */}
      <View style={styles.topRow}>
        <View style={styles.orgRow}>
          <View
            style={[
              styles.orgAvatar,
              {
                backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA',
              },
            ]}
          >
            <Text style={[styles.orgInitial, { color: colors.accent }]}>
              {opp.organization.charAt(0)}
            </Text>
          </View>
          <View style={styles.orgTextContainer}>
            <Text
              style={[styles.orgName, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {opp.organization}
            </Text>
            <View style={styles.metaRow}>
              <View style={styles.locationRow}>
                <Location size={11} color={colors.textMuted} variant="Linear" />
                <Text
                  style={[styles.locationText, { color: colors.textMuted }]}
                  numberOfLines={1}
                >
                  {opp.location}
                </Text>
              </View>

              {/* Source Origin Badge */}
              <View style={[styles.sourceBadge, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9' }]}>
                <Global size={10} color={colors.accent} variant="Bold" />
                <Text style={[styles.sourceBadgeText, { color: colors.textSecondary }]} numberOfLines={1}>
                  {sourceName.replace('Verified ', '')}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.actionsRight}>
          <Badge
            label={`${opp.matchScore}% Match`}
            variant={getScoreVariant(opp.matchScore)}
            size="sm"
            dot
          />
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSavePress}
            activeOpacity={0.7}
          >
            <Bookmark
              size={18}
              color={isSaved ? colors.accent : colors.textMuted}
              variant={isSaved ? 'Bold' : 'Linear'}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Role Title */}
      <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
        {opp.title}
      </Text>

      {/* Summary Snippet */}
      <Text
        style={[styles.summary, { color: colors.textMuted }]}
        numberOfLines={2}
      >
        {opp.summary || opp.description}
      </Text>

      {/* Compensation & Type Footer */}
      <View style={[styles.footerRow, { borderTopColor: colors.borderSubtle }]}>
        <View style={styles.compBadge}>
          <DollarCircle size={15} color={colors.accent} variant="Bold" />
          <Text style={[styles.compText, { color: colors.text }]}>
            {opp.compensation}
          </Text>
        </View>

        <View style={styles.rightActionRow}>
          <View style={styles.tagPill}>
            <Flash size={11} color={colors.secondary} variant="Bold" />
            <Text style={[styles.tagText, { color: colors.secondary }]}>
              {opp.type.toUpperCase()}
            </Text>
          </View>
          <ArrowRight2 size={14} color={colors.textMuted} />
        </View>
      </View>

      {/* Fully Responsive Action Buttons Toolbar */}
      <View style={[styles.cardActionGrid, { borderTopColor: colors.borderSubtle }]}>
        {/* 1. Auto-Apply Button */}
        <TouchableOpacity
          style={[
            styles.actionPillBtn,
            {
              backgroundColor: isApplied
                ? '#ECFDF5'
                : isDark
                ? colors.surfaceSecondary
                : '#F0F4FA',
            },
          ]}
          onPress={(e) => {
            e.stopPropagation?.();
            onAutoApply?.(opp);
          }}
          activeOpacity={0.75}
        >
          <Flash
            size={12}
            color={isApplied ? colors.success : '#FF6600'}
            variant="Bold"
          />
          <Text
            style={[
              styles.actionPillText,
              { color: isApplied ? colors.success : colors.text, fontWeight: '700' },
            ]}
            numberOfLines={1}
          >
            {isApplied ? 'Applied' : isCompact ? 'Apply' : 'Auto-Apply'}
          </Text>
        </TouchableOpacity>

        {/* 2. Mail Pitch Button */}
        <TouchableOpacity
          style={[
            styles.actionPillBtn,
            { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA' },
          ]}
          onPress={(e) => {
            e.stopPropagation?.();
            onMailPitch?.(opp);
          }}
          activeOpacity={0.75}
        >
          <Sms size={12} color={colors.accent} variant="Bold" />
          <Text
            style={[styles.actionPillText, { color: colors.text }]}
            numberOfLines={1}
          >
            Mail
          </Text>
        </TouchableOpacity>

        {/* 3. Schedule Follow-Up Button */}
        <TouchableOpacity
          style={[
            styles.actionPillBtn,
            { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA' },
          ]}
          onPress={(e) => {
            e.stopPropagation?.();
            onSchedule?.(opp);
          }}
          activeOpacity={0.75}
        >
          <Calendar size={12} color={colors.accent} variant="Bold" />
          <Text
            style={[styles.actionPillText, { color: colors.text }]}
            numberOfLines={1}
          >
            Schedule
          </Text>
        </TouchableOpacity>

        {/* 4. Save to Pipeline Button */}
        <TouchableOpacity
          style={[
            styles.actionPillBtn,
            {
              backgroundColor: isSaved
                ? isDark
                  ? 'rgba(255, 102, 0, 0.14)'
                  : '#FFF6F0'
                : isDark
                ? colors.surfaceSecondary
                : '#F0F4FA',
            },
          ]}
          onPress={handleSavePress}
          activeOpacity={0.75}
        >
          <ArchiveAdd
            size={12}
            color={isSaved ? colors.accent : colors.textSecondary}
            variant={isSaved ? 'Bold' : 'Linear'}
          />
          <Text
            style={[
              styles.actionPillText,
              { color: isSaved ? colors.accent : colors.text },
            ]}
            numberOfLines={1}
          >
            {isSaved ? 'Saved' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: SPACING.md,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  orgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SPACING.xs,
  },
  orgAvatar: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  orgInitial: {
    fontSize: 15,
    fontFamily: FONTS.bold,
  },
  orgTextContainer: {
    flex: 1,
  },
  orgName: {
    fontSize: 13,
    fontFamily: FONTS.semibold,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
    flexWrap: 'wrap',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  locationText: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    maxWidth: 120,
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: BORDER_RADIUS.xs,
  },
  sourceBadgeText: {
    fontSize: 10,
    fontFamily: FONTS.medium,
  },
  actionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  saveButton: {
    padding: 3,
  },
  title: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    letterSpacing: -0.2,
    marginBottom: 6,
    lineHeight: 21,
  },
  summary: {
    fontSize: 12.5,
    fontFamily: FONTS.regular,
    lineHeight: 18,
    marginBottom: SPACING.sm + 2,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
  },
  compBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  compText: {
    fontSize: 13,
    fontFamily: FONTS.bold,
  },
  rightActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(0, 119, 182, 0.08)',
  },
  tagText: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    letterSpacing: 0.5,
  },
  cardActionGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    paddingTop: 8,
    marginTop: 8,
    borderTopWidth: 1,
    width: '100%',
  },
  actionPillBtn: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 4,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.md,
  },
  actionPillText: {
    fontSize: 10.5,
    fontFamily: FONTS.medium,
  },
});
