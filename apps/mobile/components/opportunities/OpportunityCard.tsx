import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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
            <View style={styles.locationRow}>
              <Location size={12} color={colors.textMuted} variant="Linear" />
              <Text
                style={[styles.locationText, { color: colors.textMuted }]}
                numberOfLines={1}
              >
                {opp.location}
              </Text>
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

      {/* Action Buttons Toolbar */}
      <View style={[styles.cardActionGrid, { borderTopColor: colors.borderSubtle }]}>
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
            size={13}
            color={isApplied ? colors.success : '#FF6600'}
            variant="Bold"
          />
          <Text
            style={[
              styles.actionPillText,
              { color: isApplied ? colors.success : colors.text, fontWeight: '700' },
            ]}
          >
            {isApplied ? 'Applied ✓' : 'Auto-Apply'}
          </Text>
        </TouchableOpacity>

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
          <Sms size={13} color={colors.accent} variant="Bold" />
          <Text style={[styles.actionPillText, { color: colors.text }]}>Mail</Text>
        </TouchableOpacity>

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
          <Calendar size={13} color={colors.accent} variant="Bold" />
          <Text style={[styles.actionPillText, { color: colors.text }]}>Schedule</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionPillBtn,
            { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA' },
          ]}
          onPress={handleSavePress}
          activeOpacity={0.75}
        >
          <ArchiveAdd
            size={13}
            color={isSaved ? colors.accent : colors.textSecondary}
            variant={isSaved ? 'Bold' : 'Linear'}
          />
          <Text style={[styles.actionPillText, { color: isSaved ? colors.accent : colors.text }]}>
            {isSaved ? 'Saved' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: SPACING.md + 2,
    marginBottom: SPACING.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm + 2,
  },
  orgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SPACING.sm,
  },
  orgAvatar: {
    width: 38,
    height: 38,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  orgInitial: {
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
  orgTextContainer: {
    flex: 1,
  },
  orgName: {
    fontSize: 13,
    fontFamily: FONTS.semibold,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 1,
  },
  locationText: {
    fontSize: 11,
    fontFamily: FONTS.regular,
  },
  actionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveButton: {
    padding: 4,
  },
  title: {
    fontSize: 16.5,
    fontFamily: FONTS.bold,
    letterSpacing: -0.2,
    marginBottom: 6,
    lineHeight: 22,
  },
  summary: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    lineHeight: 18,
    marginBottom: SPACING.md,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACING.sm + 2,
    borderTopWidth: 1,
  },
  compBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  compText: {
    fontSize: 13.5,
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
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(0, 119, 182, 0.08)',
  },
  tagText: {
    fontSize: 10.5,
    fontFamily: FONTS.bold,
    letterSpacing: 0.5,
  },
  cardActionGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 10,
    marginTop: 8,
    borderTopWidth: 1,
  },
  actionPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.md,
  },
  actionPillText: {
    fontSize: 11,
    fontFamily: FONTS.medium,
  },
});
