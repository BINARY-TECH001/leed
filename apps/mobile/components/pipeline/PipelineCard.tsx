import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { Badge } from '@/components/ui';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/theme';
import type { PipelineRecord } from '@/context/PipelineContext';
import {
  Buildings,
  Location,
  DollarCircle,
  Calendar,
  Sms,
  ArrowRight2,
  Edit2,
  DirectSend,
  Flash,
  Clock,
  Note1,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';

interface PipelineCardProps {
  record: PipelineRecord;
  onChangeStage: (record: PipelineRecord) => void;
  onScheduleFollowUp: (record: PipelineRecord) => void;
  onEditNote: (record: PipelineRecord) => void;
}

const STAGE_THEMES: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  saved: {
    label: '📌 Saved',
    bg: 'rgba(139, 92, 246, 0.12)',
    text: '#8B5CF6',
    border: 'rgba(139, 92, 246, 0.3)',
  },
  applied: {
    label: '⚡ Applied',
    bg: 'rgba(0, 82, 255, 0.12)',
    text: '#0052FF',
    border: 'rgba(0, 82, 255, 0.3)',
  },
  interviewing: {
    label: '💬 In Interview',
    bg: 'rgba(16, 185, 129, 0.12)',
    text: '#10B981',
    border: 'rgba(16, 185, 129, 0.3)',
  },
  follow_up: {
    label: '📅 Follow-Up Due',
    bg: 'rgba(245, 158, 11, 0.12)',
    text: '#F59E0B',
    border: 'rgba(245, 158, 11, 0.3)',
  },
  won: {
    label: '🏆 Offer Received',
    bg: 'rgba(234, 179, 8, 0.12)',
    text: '#EAB308',
    border: 'rgba(234, 179, 8, 0.3)',
  },
  archived: {
    label: '📦 Archived',
    bg: 'rgba(107, 114, 128, 0.12)',
    text: '#6B7280',
    border: 'rgba(107, 114, 128, 0.3)',
  },
};

export const PipelineCard: React.FC<PipelineCardProps> = ({
  record,
  onChangeStage,
  onScheduleFollowUp,
  onEditNote,
}) => {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();

  const opp = record.opportunity;
  const stageTheme = STAGE_THEMES[record.stage] || STAGE_THEMES.saved;

  const handleCardPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/opportunity/${opp.id}` as any);
  };

  const handleOutreachPress = (e: any) => {
    e.stopPropagation();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/composer/${opp.id}` as any);
  };

  const handleChangeStagePress = (e: any) => {
    e.stopPropagation();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChangeStage(record);
  };

  const handleFollowUpPress = (e: any) => {
    e.stopPropagation();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onScheduleFollowUp(record);
  };

  const handleNotePress = (e: any) => {
    e.stopPropagation();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onEditNote(record);
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: isDark ? colors.card : '#FFFFFF',
          borderColor: colors.border,
        },
      ]}
      onPress={handleCardPress}
      activeOpacity={0.88}
    >
      {/* Top Header Row: Org & Stage & Match Score */}
      <View style={styles.topRow}>
        <View style={styles.orgInfoGroup}>
          <View
            style={[
              styles.avatarBox,
              { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA' },
            ]}
          >
            <Buildings size={18} color={colors.accent} variant="Bold" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.orgName, { color: colors.textSecondary }]} numberOfLines={1}>
              {opp.organization}
            </Text>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
              {opp.title}
            </Text>
          </View>
        </View>

        <View style={styles.scoreBadgeWrap}>
          <Badge
            label={`${opp.matchScore}%`}
            variant={opp.matchScore >= 90 ? 'success' : 'accent'}
            size="sm"
          />
        </View>
      </View>

      {/* Meta Fact Pills: Comp, Location, Stage */}
      <View style={styles.pillsRow}>
        <View
          style={[
            styles.stageBadge,
            {
              backgroundColor: stageTheme.bg,
              borderColor: stageTheme.border,
            },
          ]}
        >
          <Text style={[styles.stageBadgeText, { color: stageTheme.text }]}>
            {stageTheme.label}
          </Text>
        </View>

        <View
          style={[
            styles.metaPill,
            { backgroundColor: isDark ? colors.surfaceSecondary : '#F4F7FB' },
          ]}
        >
          <DollarCircle size={13} color={colors.accent} variant="Bold" />
          <Text style={[styles.metaPillText, { color: colors.text }]} numberOfLines={1}>
            {opp.compensation}
          </Text>
        </View>

        <View
          style={[
            styles.metaPill,
            { backgroundColor: isDark ? colors.surfaceSecondary : '#F4F7FB' },
          ]}
        >
          <Location size={13} color={colors.textSecondary} />
          <Text style={[styles.metaPillText, { color: colors.textSecondary }]} numberOfLines={1}>
            {opp.location}
          </Text>
        </View>
      </View>

      {/* Follow-up / Deadline Tracker Banner (if scheduled) */}
      {record.followUpDate && (
        <View
          style={[
            styles.followUpBanner,
            {
              backgroundColor: isDark ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.08)',
              borderColor: 'rgba(245, 158, 11, 0.3)',
            },
          ]}
        >
          <Clock size={14} color="#F59E0B" variant="Bold" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.followUpTitle, { color: '#F59E0B' }]}>
              {record.followUpDate}
            </Text>
            {record.followUpObjective && (
              <Text style={[styles.followUpSub, { color: colors.textSecondary }]} numberOfLines={1}>
                {record.followUpObjective}
              </Text>
            )}
          </View>
          <TouchableOpacity onPress={handleFollowUpPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Edit2 size={13} color="#F59E0B" />
          </TouchableOpacity>
        </View>
      )}

      {/* Notes Snippet (if user added note) */}
      {record.notes && (
        <TouchableOpacity
          style={[
            styles.noteBox,
            {
              backgroundColor: isDark ? colors.surfaceSecondary : '#F8FAFC',
              borderColor: colors.borderSubtle,
            },
          ]}
          onPress={handleNotePress}
        >
          <Note1 size={13} color={colors.accent} />
          <Text style={[styles.noteText, { color: colors.textSecondary }]} numberOfLines={1}>
            {record.notes}
          </Text>
        </TouchableOpacity>
      )}

      {/* Action Strip */}
      <View style={[styles.actionStrip, { borderTopColor: colors.borderSubtle }]}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA' },
          ]}
          onPress={handleChangeStagePress}
        >
          <DirectSend size={14} color={colors.accent} />
          <Text style={[styles.actionBtnText, { color: colors.text }]}>Move Stage</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA' },
          ]}
          onPress={handleFollowUpPress}
        >
          <Calendar size={14} color={colors.accent} />
          <Text style={[styles.actionBtnText, { color: colors.text }]}>Cadence</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.primaryActionBtn, { backgroundColor: colors.accent }]}
          onPress={handleOutreachPress}
        >
          <Sms size={14} color="#FFFFFF" variant="Bold" />
          <Text style={styles.primaryActionBtnText}>Outreach</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  orgInfoGroup: {
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  avatarBox: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orgName: {
    fontFamily: FONTS.medium,
    fontSize: 12,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    lineHeight: 20,
    marginTop: 2,
  },
  scoreBadgeWrap: {
    alignItems: 'flex-end',
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  stageBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
  },
  stageBadgeText: {
    fontFamily: FONTS.bold,
    fontSize: 11,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.md,
  },
  metaPillText: {
    fontFamily: FONTS.medium,
    fontSize: 11,
  },
  followUpBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  followUpTitle: {
    fontFamily: FONTS.bold,
    fontSize: 12,
  },
  followUpSub: {
    fontFamily: FONTS.regular,
    fontSize: 11,
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  noteText: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: 12,
  },
  actionStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  actionButton: {
    flex: 1,
    height: 36,
    borderRadius: BORDER_RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  actionBtnText: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
  },
  primaryActionBtn: {
    flex: 1.1,
    height: 36,
    borderRadius: BORDER_RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
    fontSize: 12,
  },
});
