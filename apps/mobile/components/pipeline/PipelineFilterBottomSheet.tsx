import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useTheme } from '@/context/ThemeContext';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/theme';
import type { PipelineStage } from '@/context/PipelineContext';
import {
  FilterEdit,
  TickCircle,
  RotateLeft,
  DollarCircle,
  Global,
  Sort,
  Flash,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';

export interface PipelineFilterState {
  stage: 'all' | PipelineStage;
  remoteOnly: boolean;
  minComp: number; // 0, 100, 150, 200
  sortBy: 'urgency' | 'match' | 'recent' | 'comp';
}

interface PipelineFilterBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  filters: PipelineFilterState;
  onApplyFilters: (filters: PipelineFilterState) => void;
  totalFilteredCount: number;
}

const STAGES: Array<{ id: 'all' | PipelineStage; label: string; icon: string }> = [
  { id: 'all', label: 'All Lifecycle Stages', icon: '⚡' },
  { id: 'interviewing', label: 'In Interview', icon: '💬' },
  { id: 'applied', label: 'Applied', icon: '🚀' },
  { id: 'follow_up', label: 'Follow-Up Due', icon: '📅' },
  { id: 'saved', label: 'Saved for Later', icon: '📌' },
  { id: 'won', label: 'Offer Received', icon: '🏆' },
  { id: 'archived', label: 'Archived', icon: '📦' },
];

const COMP_LEVELS = [
  { label: 'Any Comp', value: 0 },
  { label: '$120k+', value: 120 },
  { label: '$160k+', value: 160 },
  { label: '$200k+', value: 200 },
];

const SORT_OPTIONS: Array<{ id: PipelineFilterState['sortBy']; label: string }> = [
  { id: 'urgency', label: 'Urgency & Deadlines' },
  { id: 'match', label: 'Match Score (Highest)' },
  { id: 'recent', label: 'Recently Updated' },
  { id: 'comp', label: 'Compensation (Highest)' },
];

export const PipelineFilterBottomSheet: React.FC<PipelineFilterBottomSheetProps> = ({
  visible,
  onClose,
  filters,
  onApplyFilters,
  totalFilteredCount,
}) => {
  const { colors, isDark } = useTheme();
  const [draft, setDraft] = React.useState<PipelineFilterState>(filters);

  React.useEffect(() => {
    if (visible) {
      setDraft(filters);
    }
  }, [visible, filters]);

  const handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const resetState: PipelineFilterState = {
      stage: 'all',
      remoteOnly: false,
      minComp: 0,
      sortBy: 'urgency',
    };
    setDraft(resetState);
  };

  const handleApply = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onApplyFilters(draft);
    onClose();
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Filter & Refine Pipeline"
      subtitle="Focus on high-leverage opportunities"
      icon={<FilterEdit size={22} color={colors.accent} variant="Bold" />}
      scrollable
    >
      <View style={styles.container}>
        {/* Stage Filter */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Pipeline Stage</Text>
          <View style={styles.chipsWrap}>
            {STAGES.map((s) => {
              const isSelected = draft.stage === s.id;
              return (
                <TouchableOpacity
                  key={s.id}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isSelected
                        ? colors.accent
                        : isDark
                        ? colors.surfaceSecondary
                        : '#F0F4FA',
                      borderColor: isSelected ? colors.accent : colors.borderSubtle,
                    },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setDraft((prev) => ({ ...prev, stage: s.id }));
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={styles.stageEmoji}>{s.icon}</Text>
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color: isSelected ? '#FFFFFF' : colors.text,
                        fontFamily: isSelected ? FONTS.bold : FONTS.medium,
                      },
                    ]}
                  >
                    {s.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Remote Only Toggle */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Work Arrangement</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[
                styles.toggleBtn,
                {
                  backgroundColor: !draft.remoteOnly
                    ? colors.accent
                    : isDark
                    ? colors.surfaceSecondary
                    : '#F0F4FA',
                  borderColor: !draft.remoteOnly ? colors.accent : colors.borderSubtle,
                },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setDraft((p) => ({ ...p, remoteOnly: false }));
              }}
            >
              <Text
                style={[
                  styles.toggleBtnText,
                  { color: !draft.remoteOnly ? '#FFFFFF' : colors.text },
                ]}
              >
                All Workplaces
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toggleBtn,
                {
                  backgroundColor: draft.remoteOnly
                    ? colors.accent
                    : isDark
                    ? colors.surfaceSecondary
                    : '#F0F4FA',
                  borderColor: draft.remoteOnly ? colors.accent : colors.borderSubtle,
                },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setDraft((p) => ({ ...p, remoteOnly: true }));
              }}
            >
              <Global size={16} color={draft.remoteOnly ? '#FFFFFF' : colors.accent} />
              <Text
                style={[
                  styles.toggleBtnText,
                  { color: draft.remoteOnly ? '#FFFFFF' : colors.text },
                ]}
              >
                100% Remote Only
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Minimum Target Compensation */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Minimum Compensation</Text>
          <View style={styles.compRow}>
            {COMP_LEVELS.map((c) => {
              const isSelected = draft.minComp === c.value;
              return (
                <TouchableOpacity
                  key={c.value}
                  style={[
                    styles.compChip,
                    {
                      backgroundColor: isSelected
                        ? colors.accent
                        : isDark
                        ? colors.surfaceSecondary
                        : '#F0F4FA',
                      borderColor: isSelected ? colors.accent : colors.borderSubtle,
                    },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setDraft((p) => ({ ...p, minComp: c.value }));
                  }}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.compChipText,
                      {
                        color: isSelected ? '#FFFFFF' : colors.text,
                        fontFamily: isSelected ? FONTS.bold : FONTS.medium,
                      },
                    ]}
                  >
                    {c.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Sorting Engine */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Sort Order</Text>
          <View style={styles.sortList}>
            {SORT_OPTIONS.map((opt) => {
              const isSelected = draft.sortBy === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[
                    styles.sortOption,
                    {
                      backgroundColor: isSelected
                        ? isDark
                          ? 'rgba(0, 82, 255, 0.15)'
                          : 'rgba(0, 82, 255, 0.08)'
                        : isDark
                        ? colors.card
                        : '#FFFFFF',
                      borderColor: isSelected ? colors.accent : colors.borderSubtle,
                    },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setDraft((p) => ({ ...p, sortBy: opt.id }));
                  }}
                >
                  <Text
                    style={[
                      styles.sortText,
                      {
                        color: isSelected ? colors.accent : colors.text,
                        fontFamily: isSelected ? FONTS.bold : FONTS.medium,
                      },
                    ]}
                  >
                    {opt.label}
                  </Text>
                  {isSelected && <TickCircle size={18} color={colors.accent} variant="Bold" />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Bottom CTA Row */}
        <View style={styles.footerRow}>
          <TouchableOpacity
            style={[
              styles.resetBtn,
              {
                backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA',
                borderColor: colors.borderSubtle,
              },
            ]}
            onPress={handleReset}
          >
            <RotateLeft size={16} color={colors.textSecondary} />
            <Text style={[styles.resetText, { color: colors.textSecondary }]}>Reset</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.applyBtn, { backgroundColor: colors.accent }]}
            onPress={handleApply}
            activeOpacity={0.85}
          >
            <Text style={styles.applyBtnText}>
              Apply Filters
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: SPACING.xl,
    gap: SPACING.lg,
  },
  section: {
    gap: SPACING.xs,
  },
  sectionTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
  },
  stageEmoji: {
    fontSize: 13,
  },
  chipText: {
    fontSize: 13,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  toggleBtn: {
    flex: 1,
    height: 42,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  toggleBtnText: {
    fontFamily: FONTS.medium,
    fontSize: 13,
  },
  compRow: {
    flexDirection: 'row',
    gap: 8,
  },
  compChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compChipText: {
    fontSize: 12,
  },
  sortList: {
    gap: 6,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  sortText: {
    fontSize: 14,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: SPACING.md,
  },
  resetBtn: {
    height: 48,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  resetText: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
  },
  applyBtn: {
    flex: 1,
    height: 48,
    borderRadius: BORDER_RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
    fontSize: 14,
  },
});
