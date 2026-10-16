import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useTheme } from '@/context/ThemeContext';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/theme';
import type { PipelineRecord, PipelineStage } from '@/context/PipelineContext';
import {
  DirectSend,
  TickCircle,
  ArchiveBox,
  Calendar,
  Star1,
  Flash,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';

interface PipelineStagePickerSheetProps {
  visible: boolean;
  onClose: () => void;
  record: PipelineRecord | null;
  onSelectStage: (oppId: string, stage: PipelineStage) => void;
}

const STAGE_CONFIG: Array<{
  stage: PipelineStage;
  label: string;
  desc: string;
  badgeColor: string;
}> = [
  {
    stage: 'saved',
    label: 'Saved to Pipeline',
    desc: 'Monitoring role, researching recruiters and requirements',
    badgeColor: '#8B5CF6',
  },
  {
    stage: 'applied',
    label: 'Application Dispatched',
    desc: 'Submitted tailored proposal and active CV package',
    badgeColor: '#0052FF',
  },
  {
    stage: 'follow_up',
    label: 'Follow-Up Due',
    desc: 'Scheduled check-in cadence with hiring team or client',
    badgeColor: '#F59E0B',
  },
  {
    stage: 'interviewing',
    label: 'In Active Interview',
    desc: 'Technical screening, architectural rounds or founder chat',
    badgeColor: '#10B981',
  },
  {
    stage: 'won',
    label: 'Offer Received / Won',
    desc: 'Formal offer or contract negotiation stage',
    badgeColor: '#EAB308',
  },
  {
    stage: 'archived',
    label: 'Archived / Closed',
    desc: 'Withdrawn, filled, or postponed indefinitely',
    badgeColor: '#6B7280',
  },
];

export const PipelineStagePickerSheet: React.FC<PipelineStagePickerSheetProps> = ({
  visible,
  onClose,
  record,
  onSelectStage,
}) => {
  const { colors, isDark } = useTheme();

  if (!record) return null;

  const handleSelect = (stage: PipelineStage) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSelectStage(record.opportunityId, stage);
    onClose();
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Update Opportunity Stage"
      subtitle={`${record.opportunity.organization} • ${record.opportunity.title}`}
      icon={<DirectSend size={22} color={colors.accent} variant="Bold" />}
      scrollable
    >
      <View style={styles.container}>
        <View style={styles.stageList}>
          {STAGE_CONFIG.map((item) => {
            const isCurrent = record.stage === item.stage;
            return (
              <TouchableOpacity
                key={item.stage}
                style={[
                  styles.stageCard,
                  {
                    backgroundColor: isCurrent
                      ? isDark
                        ? 'rgba(0, 82, 255, 0.14)'
                        : 'rgba(0, 82, 255, 0.08)'
                      : isDark
                      ? colors.card
                      : '#FFFFFF',
                    borderColor: isCurrent ? colors.accent : colors.borderSubtle,
                  },
                ]}
                onPress={() => handleSelect(item.stage)}
                activeOpacity={0.75}
              >
                <View style={styles.cardHeader}>
                  <Text
                    style={[
                      styles.stageTitle,
                      {
                        color: isCurrent ? colors.accent : colors.text,
                        fontFamily: isCurrent ? FONTS.bold : FONTS.semiBold,
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                  {isCurrent && (
                    <TickCircle size={20} color={colors.accent} variant="Bold" />
                  )}
                </View>

                <Text style={[styles.stageDesc, { color: colors.textSecondary }]}>
                  {item.desc}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: SPACING.xl,
  },
  stageList: {
    gap: 10,
  },
  stageCard: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1.5,
    gap: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stageTitle: {
    fontSize: 15,
  },
  stageDesc: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    lineHeight: 17,
  },
});
