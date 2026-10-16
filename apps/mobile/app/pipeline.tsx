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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { usePipeline, type PipelineRecord, type PipelineStage } from '@/context/PipelineContext';
import { PipelineCard } from '@/components/pipeline/PipelineCard';
import {
  PipelineFilterBottomSheet,
  type PipelineFilterState,
} from '@/components/pipeline/PipelineFilterBottomSheet';
import { PipelineStagePickerSheet } from '@/components/pipeline/PipelineStagePickerSheet';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { EmptyState, Badge, CustomDateTimePickerSheet } from '@/components/ui';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/theme';
import {
  ArrowLeft2,
  FilterEdit,
  SearchNormal1,
  CloseCircle,
  Briefcase,
  Flash,
  DirectSend,
  Calendar,
  TickCircle,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';

export default function PipelineScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ stage?: string; query?: string }>();
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();

  const {
    records,
    updateStage,
    updateNotes,
    scheduleFollowUp,
    stats,
  } = usePipeline();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState(params.query || '');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Initial stage from params if passed (e.g., from /saved or /applied)
  const initialStage = (params.stage as PipelineStage) || 'all';

  const [filters, setFilters] = useState<PipelineFilterState>({
    stage: initialStage,
    remoteOnly: false,
    minComp: 0,
    sortBy: 'urgency',
  });

  // Action BottomSheet States
  const [stagePickerRecord, setStagePickerRecord] = useState<PipelineRecord | null>(null);
  const [schedulingRecord, setSchedulingRecord] = useState<PipelineRecord | null>(null);

  const [noteEditRecord, setNoteEditRecord] = useState<PipelineRecord | null>(null);
  const [tempNoteText, setTempNoteText] = useState('');

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((res) => setTimeout(res, 500));
    setRefreshing(false);
  };

  // Filter & Sort Logic
  const filteredRecords = useMemo(() => {
    let result = [...records];

    // Filter by stage
    if (filters.stage !== 'all') {
      result = result.filter((r) => r.stage === filters.stage);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.opportunity.title.toLowerCase().includes(q) ||
          r.opportunity.organization.toLowerCase().includes(q) ||
          (r.notes && r.notes.toLowerCase().includes(q))
      );
    }

    // Filter by remote
    if (filters.remoteOnly) {
      result = result.filter(
        (r) =>
          r.opportunity.location.toLowerCase().includes('remote') ||
          r.opportunity.type === 'contract'
      );
    }

    // Sort order
    result.sort((a, b) => {
      if (filters.sortBy === 'urgency') {
        const aHasFollowUp = a.followUpDate ? 1 : 0;
        const bHasFollowUp = b.followUpDate ? 1 : 0;
        if (aHasFollowUp !== bHasFollowUp) return bHasFollowUp - aHasFollowUp;
        return b.opportunity.matchScore - a.opportunity.matchScore;
      }
      if (filters.sortBy === 'match') {
        return b.opportunity.matchScore - a.opportunity.matchScore;
      }
      if (filters.sortBy === 'comp') {
        return (b.opportunity.matchScore || 0) - (a.opportunity.matchScore || 0);
      }
      // 'recent'
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return result;
  }, [records, filters, searchQuery]);

  // Active filter count for badge
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.stage !== 'all') count++;
    if (filters.remoteOnly) count++;
    if (filters.minComp > 0) count++;
    if (filters.sortBy !== 'urgency') count++;
    return count;
  }, [filters]);

  const handleOpenSchedule = (rec: PipelineRecord) => {
    setSchedulingRecord(rec);
  };

  const handleOpenNote = (rec: PipelineRecord) => {
    setNoteEditRecord(rec);
    setTempNoteText(rec.notes || '');
  };

  const handleSaveNote = () => {
    if (!noteEditRecord) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateNotes(noteEditRecord.opportunityId, tempNoteText);
    setNoteEditRecord(null);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Top Header App Bar */}
      <View style={[styles.headerBar, { borderBottomColor: colors.borderSubtle }]}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA' }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft2 size={20} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Opportunity Pipeline</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {filteredRecords.length} {filteredRecords.length === 1 ? 'Opportunity' : 'Opportunities'} Tracked
          </Text>
        </View>

        {/* Filter Bottom Sheet Trigger Icon */}
        <TouchableOpacity
          style={[
            styles.filterIconBtn,
            {
              backgroundColor: activeFiltersCount > 0 ? colors.accent : isDark ? colors.surfaceSecondary : '#F0F4FA',
              borderColor: activeFiltersCount > 0 ? colors.accent : colors.borderSubtle,
            },
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setIsFilterSheetOpen(true);
          }}
          activeOpacity={0.75}
        >
          <FilterEdit
            size={18}
            color={activeFiltersCount > 0 ? '#FFFFFF' : colors.text}
            variant={activeFiltersCount > 0 ? 'Bold' : 'Linear'}
          />
          {activeFiltersCount > 0 && (
            <View style={styles.filterCountBadge}>
              <Text style={styles.filterCountText}>{activeFiltersCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        {/* Executive Pulse KPI Card */}
        <View
          style={[
            styles.pulseCard,
            {
              backgroundColor: isDark ? colors.card : '#FFFFFF',
              borderColor: colors.border,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.pulseItem}
            onPress={() => setFilters((p) => ({ ...p, stage: 'all' }))}
          >
            <Text style={[styles.pulseValue, { color: colors.text }]}>{stats.totalTracked}</Text>
            <Text style={[styles.pulseLabel, { color: colors.textSecondary }]}>Total</Text>
          </TouchableOpacity>

          <View style={[styles.pulseDivider, { backgroundColor: colors.borderSubtle }]} />

          <TouchableOpacity
            style={styles.pulseItem}
            onPress={() => setFilters((p) => ({ ...p, stage: 'applied' }))}
          >
            <Text style={[styles.pulseValue, { color: '#0052FF' }]}>{stats.appliedCount}</Text>
            <Text style={[styles.pulseLabel, { color: colors.textSecondary }]}>Applied</Text>
          </TouchableOpacity>

          <View style={[styles.pulseDivider, { backgroundColor: colors.borderSubtle }]} />

          <TouchableOpacity
            style={styles.pulseItem}
            onPress={() => setFilters((p) => ({ ...p, stage: 'interviewing' }))}
          >
            <Text style={[styles.pulseValue, { color: '#10B981' }]}>{stats.interviewingCount}</Text>
            <Text style={[styles.pulseLabel, { color: colors.textSecondary }]}>Interview</Text>
          </TouchableOpacity>

          <View style={[styles.pulseDivider, { backgroundColor: colors.borderSubtle }]} />

          <TouchableOpacity
            style={styles.pulseItem}
            onPress={() => setFilters((p) => ({ ...p, stage: 'follow_up' }))}
          >
            <Text style={[styles.pulseValue, { color: '#F59E0B' }]}>{stats.followUpsDueCount}</Text>
            <Text style={[styles.pulseLabel, { color: colors.textSecondary }]}>Follow-Ups</Text>
          </TouchableOpacity>
        </View>

        {/* Search & Active Filter Bar */}
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
              placeholder="Search role, company, or private notes..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <CloseCircle size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Active Filter Indicator Tag */}
        {activeFiltersCount > 0 && (
          <View style={styles.activeFiltersPills}>
            {filters.stage !== 'all' && (
              <View style={[styles.activePill, { backgroundColor: colors.accent + '15', borderColor: colors.accent + '40' }]}>
                <Text style={[styles.activePillText, { color: colors.accent }]}>
                  Stage: {filters.stage.replace('_', ' ').toUpperCase()}
                </Text>
                <TouchableOpacity onPress={() => setFilters((p) => ({ ...p, stage: 'all' }))}>
                  <CloseCircle size={14} color={colors.accent} variant="Bold" />
                </TouchableOpacity>
              </View>
            )}

            {filters.remoteOnly && (
              <View style={[styles.activePill, { backgroundColor: colors.accent + '15', borderColor: colors.accent + '40' }]}>
                <Text style={[styles.activePillText, { color: colors.accent }]}>Remote Only</Text>
                <TouchableOpacity onPress={() => setFilters((p) => ({ ...p, remoteOnly: false }))}>
                  <CloseCircle size={14} color={colors.accent} variant="Bold" />
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={styles.clearAllTextBtn}
              onPress={() =>
                setFilters({
                  stage: 'all',
                  remoteOnly: false,
                  minComp: 0,
                  sortBy: 'urgency',
                })
              }
            >
              <Text style={[styles.clearAllText, { color: colors.textSecondary }]}>Clear All</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Opportunity Card Stream */}
        {filteredRecords.length > 0 ? (
          <View style={styles.cardList}>
            {filteredRecords.map((record) => (
              <PipelineCard
                key={record.id}
                record={record}
                onChangeStage={(rec) => setStagePickerRecord(rec)}
                onScheduleFollowUp={handleOpenSchedule}
                onEditNote={handleOpenNote}
              />
            ))}
          </View>
        ) : (
          <EmptyState
            title="No Opportunities Found"
            description={
              searchQuery || activeFiltersCount > 0
                ? "No pipeline records matched your active filters or search terms."
                : "Your pipeline is currently empty. Explore discovered opportunities and save or apply to add them here."
            }
            actionTitle={activeFiltersCount > 0 ? "Reset Filters" : "Discover Opportunities"}
            onAction={() => {
              if (activeFiltersCount > 0) {
                setFilters({
                  stage: 'all',
                  remoteOnly: false,
                  minComp: 0,
                  sortBy: 'urgency',
                });
                setSearchQuery('');
              } else {
                router.push('/(tabs)/opportunities' as any);
              }
            }}
          />
        )}
      </ScrollView>

      {/* Filter BottomSheet */}
      <PipelineFilterBottomSheet
        visible={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        filters={filters}
        onApplyFilters={setFilters}
        totalFilteredCount={filteredRecords.length}
      />

      {/* Stage Picker BottomSheet */}
      <PipelineStagePickerSheet
        visible={!!stagePickerRecord}
        onClose={() => setStagePickerRecord(null)}
        record={stagePickerRecord}
        onSelectStage={updateStage}
      />

      {/* Follow-Up Scheduling Custom Date Time Picker Sheet */}
      {schedulingRecord && (
        <CustomDateTimePickerSheet
          visible={!!schedulingRecord}
          onClose={() => setSchedulingRecord(null)}
          title={`Schedule for ${schedulingRecord.opportunity.organization}`}
          subtitle={schedulingRecord.opportunity.title}
          initialObjective="Check application status & recruiter reply"
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

      {/* Note Editor BottomSheet */}
      <BottomSheet
        visible={!!noteEditRecord}
        onClose={() => setNoteEditRecord(null)}
        title="Opportunity Dossier Note"
        subtitle={noteEditRecord?.opportunity.title}
      >
        <View style={{ paddingBottom: 24, gap: 16 }}>
          <TextInput
            style={[
              styles.noteInputArea,
              {
                backgroundColor: isDark ? colors.surfaceSecondary : '#FFFFFF',
                borderColor: colors.borderSubtle,
                color: colors.text,
              },
            ]}
            placeholder="Add internal notes, interview talking points, or compensation milestones…"
            placeholderTextColor={colors.textMuted}
            value={tempNoteText}
            onChangeText={setTempNoteText}
            multiline
            numberOfLines={5}
          />

          <TouchableOpacity
            style={[styles.modalSubmitBtn, { backgroundColor: colors.accent }]}
            onPress={handleSaveNote}
          >
            <Text style={styles.modalSubmitBtnText}>Save Private Note</Text>
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
  filterIconBtn: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    position: 'relative',
  },
  filterCountBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  filterCountText: {
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
    fontSize: 9,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 60,
  },
  pulseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    paddingVertical: 14,
    marginBottom: SPACING.md,
  },
  pulseItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseValue: {
    fontFamily: FONTS.bold,
    fontSize: 18,
  },
  pulseLabel: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    marginTop: 2,
  },
  pulseDivider: {
    width: 1,
    height: 24,
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
  activeFiltersPills: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: SPACING.md,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
  },
  activePillText: {
    fontFamily: FONTS.bold,
    fontSize: 11,
  },
  clearAllTextBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  clearAllText: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    textDecorationLine: 'underline',
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
    marginTop: 4,
  },
  modalSubmitBtnText: {
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
    fontSize: 14,
  },
});
