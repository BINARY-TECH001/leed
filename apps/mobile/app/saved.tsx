import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { usePipeline, type PipelineRecord } from '@/context/PipelineContext';
import { PipelineCard } from '@/components/pipeline/PipelineCard';
import { PipelineStagePickerSheet } from '@/components/pipeline/PipelineStagePickerSheet';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { EmptyState, Badge, CustomDateTimePickerSheet } from '@/components/ui';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/theme';
import {
  ArrowLeft2,
  Bookmark,
  SearchNormal1,
  CloseCircle,
  Calendar,
  Flash,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';

export default function SavedScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();

  const {
    records,
    updateStage,
    updateNotes,
    scheduleFollowUp,
    stats,
  } = usePipeline();

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Sheets
  const [stagePickerRecord, setStagePickerRecord] = useState<PipelineRecord | null>(null);
  const [schedulingRecord, setSchedulingRecord] = useState<PipelineRecord | null>(null);

  const [noteEditRecord, setNoteEditRecord] = useState<PipelineRecord | null>(null);
  const [tempNoteText, setTempNoteText] = useState('');

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((res) => setTimeout(res, 500));
    setRefreshing(false);
  };

  const savedRecords = useMemo(() => {
    let result = records.filter((r) => r.stage === 'saved');
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.opportunity.title.toLowerCase().includes(q) ||
          r.opportunity.organization.toLowerCase().includes(q) ||
          (r.notes && r.notes.toLowerCase().includes(q))
      );
    }
    return result;
  }, [records, searchQuery]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.headerBar, { borderBottomColor: colors.borderSubtle }]}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA' }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft2 size={20} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Saved Opportunities</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {savedRecords.length} Saved in Pipeline
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA' }]}
          onPress={() => router.push({ pathname: '/(tabs)/opportunities', params: { tab: 'pipeline' } } as any)}
        >
          <Bookmark size={18} color={colors.accent} variant="Bold" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        {/* Search Bar */}
        <View style={styles.searchRow}>
          <View
            style={[
              styles.searchBox,
              {
                backgroundColor: isDark ? colors.surfaceSecondary : '#FFFFFF',
                borderColor: colors.borderSubtle,
              },
            ]}
          >
            <SearchNormal1 size={17} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Filter saved opportunities..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <CloseCircle size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Card Stream */}
        {savedRecords.length > 0 ? (
          <View style={styles.cardList}>
            {savedRecords.map((record) => (
              <PipelineCard
                key={record.id}
                record={record}
                onChangeStage={(rec) => setStagePickerRecord(rec)}
                onScheduleFollowUp={(rec) => setSchedulingRecord(rec)}
                onEditNote={(rec) => {
                  setNoteEditRecord(rec);
                  setTempNoteText(rec.notes || '');
                }}
              />
            ))}
          </View>
        ) : (
          <EmptyState
            title="No Saved Opportunities"
            description={
              searchQuery
                ? `No saved roles match "${searchQuery}".`
                : "You haven't bookmarked any opportunities yet. Browse discoveries and save roles you want to target."
            }
            actionTitle="Discover Opportunities"
            onAction={() => router.push('/(tabs)/opportunities' as any)}
          />
        )}
      </ScrollView>

      {/* Stage Picker */}
      <PipelineStagePickerSheet
        visible={!!stagePickerRecord}
        onClose={() => setStagePickerRecord(null)}
        record={stagePickerRecord}
        onSelectStage={updateStage}
      />

      {/* Custom Date Time Picker Sheet */}
      {schedulingRecord && (
        <CustomDateTimePickerSheet
          visible={!!schedulingRecord}
          onClose={() => setSchedulingRecord(null)}
          title={`Set Reminder for ${schedulingRecord.opportunity.organization}`}
          subtitle={schedulingRecord.opportunity.title}
          initialObjective="Prepare application proposal"
          onConfirm={(scheduledDate, objective) => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            scheduleFollowUp(
              schedulingRecord.opportunityId,
              scheduledDate,
              objective
            );
            setSchedulingRecord(null);
          }}
        />
      )}

      {/* Note Sheet */}
      <BottomSheet
        visible={!!noteEditRecord}
        onClose={() => setNoteEditRecord(null)}
        title="Saved Role Notes"
        subtitle={noteEditRecord?.opportunity.title}
      >
        <View style={{ paddingBottom: 24, gap: 14 }}>
          <TextInput
            style={[
              styles.noteInputArea,
              {
                backgroundColor: isDark ? colors.surfaceSecondary : '#FFFFFF',
                borderColor: colors.borderSubtle,
                color: colors.text,
              },
            ]}
            placeholder="Notes on team, compensation, or recruiter outreach…"
            placeholderTextColor={colors.textMuted}
            value={tempNoteText}
            onChangeText={setTempNoteText}
            multiline
            numberOfLines={5}
          />
          <TouchableOpacity
            style={[styles.modalSubmitBtn, { backgroundColor: colors.accent }]}
            onPress={() => {
              if (noteEditRecord) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                updateNotes(noteEditRecord.opportunityId, tempNoteText);
                setNoteEditRecord(null);
              }
            }}
          >
            <Text style={styles.modalSubmitBtnText}>Save Note</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    height: 60,
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
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: FONTS.bold,
    fontSize: 16,
  },
  headerSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 11,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 60,
  },
  searchRow: {
    marginBottom: SPACING.md,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: 13,
  },
  cardList: {
    gap: 2,
  },
  cadencePill: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cadenceInput: {
    height: 44,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
    fontFamily: FONTS.regular,
  },
  noteInputArea: {
    minHeight: 110,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    padding: 12,
    fontSize: 13,
    fontFamily: FONTS.regular,
    textAlignVertical: 'top',
  },
  modalSubmitBtn: {
    height: 48,
    borderRadius: BORDER_RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitBtnText: {
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
    fontSize: 14,
  },
});
