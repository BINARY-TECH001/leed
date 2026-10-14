import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Platform,
  Share as RNShare,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { usePipeline, type PipelineStage, type PipelineRecord } from '@/context/PipelineContext';
import { Badge, EmptyState, Button, Card } from '@/components/ui';
import { OpportunityCard } from '@/components/opportunities/OpportunityCard';
import { SAMPLE_OPPORTUNITIES } from '@/constants/mockData';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/theme';
import {
  SearchNormal1,
  CloseCircle,
  Briefcase,
  Flash,
  DocumentText,
  DirectSend,
  DollarCircle,
  FilterSearch,
  TickCircle,
  Calendar,
  Edit2,
  Trash,
  ArrowRight2,
  Bookmark,
  Share,
  Clock,
  Send2,
  MessageQuestion,
  ArchiveBox,
  ExportCurve,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import type { Opportunity, OpportunityType } from '@prospect/types';

const STAGE_LABELS: Record<PipelineStage, { label: string; color: string }> = {
  saved: { label: 'Saved', color: '#6B7280' },
  applied: { label: 'Applied', color: '#0052FF' },
  follow_up: { label: 'Follow-Up Due', color: '#F59E0B' },
  interviewing: { label: 'In Interview', color: '#10B981' },
  won: { label: 'Offer Received', color: '#8B5CF6' },
  archived: { label: 'Archived', color: '#9CA3AF' },
};

const PROMPT_SUGGESTIONS = [
  'Expo 57 contract > $120/hr in US/EMEA',
  'Fintech AI automation venture leads',
  'Staff React Native offline-first roles',
  'Mobile architect advisory contracts',
];

export default function OpportunitiesScreen() {
  const params = useLocalSearchParams<{ initialQuery?: string; tab?: string }>();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const {
    records,
    savedIds,
    appliedIds,
    isSaved,
    isApplied,
    toggleSave,
    applyToOpportunity,
    scheduleFollowUp,
    updateStage,
    updateNotes,
    removeFromPipeline,
    stats,
  } = usePipeline();

  // Top Segmented Switcher: 'discoveries' vs 'pipeline'
  const [activeSegment, setActiveSegment] = useState<'discoveries' | 'pipeline'>(
    params.tab === 'pipeline' ? 'pipeline' : 'discoveries'
  );

  // Discoveries View State
  const [opportunities] = useState(SAMPLE_OPPORTUNITIES);
  const [searchQuery, setSearchQuery] = useState(params.initialQuery || '');
  const [activeFilter, setActiveFilter] = useState<'all' | OpportunityType | 'high_fit'>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Tailor Filters State (Inline collapsible bar, no bottom sheet)
  const [isTailorOpen, setIsTailorOpen] = useState(false);
  const [activeCvName, setActiveCvName] = useState('Principal Mobile Architect (2026).pdf');
  const [minCompRate, setMinCompRate] = useState<number>(120);
  const [remoteOnly, setRemoteOnly] = useState<boolean>(true);

  // Pipeline Stage Filter State
  const [pipelineStageFilter, setPipelineStageFilter] = useState<'all' | PipelineStage>('all');

  // Follow-up & Note Modals
  const [editingNoteRecord, setEditingNoteRecord] = useState<PipelineRecord | null>(null);
  const [tempNoteText, setTempNoteText] = useState('');
  const [schedulingRecord, setSchedulingRecord] = useState<PipelineRecord | null>(null);
  const [selectedCadence, setSelectedCadence] = useState<'Tomorrow' | 'In 3 Days' | 'In 1 Week'>('In 3 Days');
  const [selectedObjective, setSelectedObjective] = useState('Follow up on application status');

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((res) => setTimeout(res, 500));
    setRefreshing(false);
  };

  const handleToggleSave = (id: string) => {
    const opp = opportunities.find((o) => o.id === id);
    if (opp) {
      toggleSave(opp);
    }
  };

  const handleAutoApply = (opp: Opportunity) => {
    applyToOpportunity(opp);
    Alert.alert(
      'Autonomous Application Dispatched',
      `Proposal calibrated with "${activeCvName}" has been dispatched for ${opp.organization}. Added to Active Pipeline.`
    );
  };

  const handleMailPitch = (opp: Opportunity) => {
    router.push(`/composer/${opp.id}` as any);
  };

  const handleScheduleFromDiscovery = (opp: Opportunity) => {
    const rec = records.find((r) => r.opportunityId === opp.id);
    if (rec) {
      setSchedulingRecord(rec);
    } else {
      scheduleFollowUp(opp.id, 'In 3 Days', 'Initial follow-up check');
      Alert.alert('Follow-Up Scheduled', `Follow-up set for 3 days from now. Added to Active Pipeline.`);
    }
  };

  // Filtered Discoveries
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((opp) => {
      if (activeFilter === 'high_fit' && opp.matchScore < 90) return false;
      if (activeFilter !== 'all' && activeFilter !== 'high_fit' && opp.type !== activeFilter) {
        return false;
      }
      if (remoteOnly && !opp.isRemote) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = opp.title.toLowerCase().includes(query);
        const matchesOrg = opp.organization.toLowerCase().includes(query);
        const matchesTags = opp.tags.some((t: string) => t.toLowerCase().includes(query));
        return matchesTitle || matchesOrg || matchesTags;
      }

      return true;
    });
  }, [opportunities, activeFilter, searchQuery, remoteOnly]);

  // Filtered Pipeline Records
  const filteredPipelineRecords = useMemo(() => {
    return records.filter((r) => {
      if (pipelineStageFilter !== 'all' && r.stage !== pipelineStageFilter) {
        return false;
      }
      return true;
    });
  }, [records, pipelineStageFilter]);

  const saveEditedNote = () => {
    if (editingNoteRecord) {
      updateNotes(editingNoteRecord.opportunityId, tempNoteText);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setEditingNoteRecord(null);
    }
  };

  const confirmScheduledFollowUp = () => {
    if (schedulingRecord) {
      scheduleFollowUp(schedulingRecord.opportunityId, selectedCadence, selectedObjective);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSchedulingRecord(null);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Top Clean Header with Segmented Navigation */}
      <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
        <View style={styles.segmentContainer}>
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              activeSegment === 'discoveries' && {
                backgroundColor: isDark ? colors.card : '#FFFFFF',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.08,
                shadowRadius: 3,
                elevation: 2,
              },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveSegment('discoveries');
            }}
          >
            <Text
              style={[
                styles.segmentText,
                {
                  color: activeSegment === 'discoveries' ? colors.text : colors.textMuted,
                  fontFamily: activeSegment === 'discoveries' ? FONTS.bold : FONTS.medium,
                },
              ]}
            >
              Discoveries ({filteredOpportunities.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentBtn,
              activeSegment === 'pipeline' && {
                backgroundColor: isDark ? colors.card : '#FFFFFF',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.08,
                shadowRadius: 3,
                elevation: 2,
              },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveSegment('pipeline');
            }}
          >
            <View style={styles.segmentLabelRow}>
              <Text
                style={[
                  styles.segmentText,
                  {
                    color: activeSegment === 'pipeline' ? colors.text : colors.textMuted,
                    fontFamily: activeSegment === 'pipeline' ? FONTS.bold : FONTS.medium,
                  },
                ]}
              >
                Active Pipeline
              </Text>
              {records.length > 0 && (
                <View style={[styles.segmentCountPill, { backgroundColor: colors.accent }]}>
                  <Text style={styles.segmentCountText}>{records.length}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
      >
        {activeSegment === 'discoveries' ? (
          <>
            {/* AI Prominent Search Input Box */}
            <View
              style={[
                styles.aiSearchBox,
                {
                  backgroundColor: isDark ? colors.card : '#FFFFFF',
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.inputRow}>
                <SearchNormal1 size={18} color={colors.accent} variant="Linear" />
                <TextInput
                  style={[styles.mainInput, { color: colors.text, fontFamily: FONTS.regular }]}
                  placeholder="Ask AI: e.g. Contract roles > $120/hr matching my CV…"
                  placeholderTextColor={colors.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  returnKeyType="search"
                />
                {searchQuery ? (
                  <TouchableOpacity
                    onPress={() => setSearchQuery('')}
                    style={styles.clearBtn}
                  >
                    <CloseCircle size={18} color={colors.textMuted} variant="Bold" />
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Quick Calibration Bar */}
              <View style={[styles.contextToolsRow, { borderTopColor: colors.borderSubtle }]}>
                <TouchableOpacity
                  style={[styles.contextToolChip, { backgroundColor: isDark ? colors.surfaceSecondary : '#F3F5F9' }]}
                  onPress={() => setIsTailorOpen(!isTailorOpen)}
                >
                  <DocumentText size={12} color={colors.accent} variant="Bold" />
                  <Text style={[styles.contextToolText, { color: colors.textSecondary }]} numberOfLines={1}>
                    {activeCvName.slice(0, 20)}…
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.contextToolChip,
                    {
                      backgroundColor: remoteOnly
                        ? colors.accent + '15'
                        : isDark
                        ? colors.surfaceSecondary
                        : '#F3F5F9',
                    },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setRemoteOnly(!remoteOnly);
                  }}
                >
                  <TickCircle
                    size={12}
                    color={remoteOnly ? colors.accent : colors.textMuted}
                    variant={remoteOnly ? 'Bold' : 'Linear'}
                  />
                  <Text
                    style={[
                      styles.contextToolText,
                      { color: remoteOnly ? colors.accent : colors.textSecondary },
                    ]}
                  >
                    {remoteOnly ? 'Remote Verified' : 'All Workplaces'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.contextToolChip,
                    { backgroundColor: isDark ? colors.surfaceSecondary : '#F3F5F9' },
                  ]}
                  onPress={() => setIsTailorOpen(!isTailorOpen)}
                >
                  <FilterSearch size={12} color={colors.accent} variant="Bold" />
                  <Text style={[styles.contextToolText, { color: colors.textSecondary }]}>
                    ≥ ${minCompRate}/hr
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Inline Expandable Tailor Calibration Panel */}
              {isTailorOpen && (
                <View style={[styles.inlineTailorPanel, { borderTopColor: colors.borderSubtle }]}>
                  <Text style={[styles.tailorHeading, { color: colors.text }]}>
                    Calibrate Search Criteria
                  </Text>
                  <View style={styles.ratePillsRow}>
                    {[90, 110, 120, 140, 160].map((rate) => {
                      const isSel = minCompRate === rate;
                      return (
                        <TouchableOpacity
                          key={rate}
                          style={[
                            styles.rateChip,
                            {
                              backgroundColor: isSel
                                ? colors.accent
                                : isDark
                                ? colors.surfaceSecondary
                                : '#F3F5F9',
                              borderColor: isSel ? colors.accent : colors.border,
                            },
                          ]}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setMinCompRate(rate);
                          }}
                        >
                          <Text
                            style={[
                              styles.rateChipText,
                              { color: isSel ? '#FFF' : colors.text },
                            ]}
                          >
                            ${rate}/hr+
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>

            {/* Category Filter Chips Bar */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryFiltersScroll}
            >
              {(
                [
                  { label: 'All', value: 'all' },
                  { label: 'Contracts', value: 'contract' },
                  { label: 'Full-time', value: 'job' },
                  { label: 'Freelance', value: 'freelance' },
                  { label: 'B2B Leads', value: 'lead' },
                  { label: 'Grants', value: 'grant' },
                  { label: 'Scholarships', value: 'scholarship' },
                  { label: '⭐ 90%+ Fit', value: 'high_fit' },
                ] as const
              ).map((f) => {
                const isSelected = activeFilter === f.value;
                return (
                  <TouchableOpacity
                    key={f.value}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: isSelected
                          ? colors.accent
                          : isDark
                          ? colors.card
                          : '#FFFFFF',
                        borderColor: isSelected ? colors.accent : colors.border,
                      },
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setActiveFilter(f.value);
                    }}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        {
                          color: isSelected ? '#FFFFFF' : colors.textSecondary,
                          fontFamily: isSelected ? FONTS.bold : FONTS.medium,
                        },
                      ]}
                    >
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Results Counter */}
            <View style={styles.resultsHeaderRow}>
              <Text style={[styles.resultsCountText, { color: colors.text }]}>
                {filteredOpportunities.length} Verified Discoveries
              </Text>
              <Badge label="Auto-Screened" variant="success" size="sm" dot />
            </View>

            {/* Discoveries List */}
            {filteredOpportunities.length > 0 ? (
              filteredOpportunities.map((opp) => (
                <OpportunityCard
                  key={opp.id}
                  opportunity={opp}
                  isSaved={isSaved(opp.id)}
                  isApplied={isApplied(opp.id)}
                  onToggleSave={handleToggleSave}
                  onAutoApply={handleAutoApply}
                  onMailPitch={handleMailPitch}
                  onSchedule={handleScheduleFromDiscovery}
                />
              ))
            ) : (
              <EmptyState
                icon={<Briefcase size={36} color={colors.textMuted} variant="Linear" />}
                title="No Matching Discoveries"
                description="Adjust keywords or expand your criteria."
                actionTitle="Reset Filters"
                onAction={() => {
                  setActiveFilter('all');
                  setSearchQuery('');
                  setRemoteOnly(false);
                }}
                style={{ marginTop: 24 }}
              />
            )}
          </>
        ) : (
          /* Active Pipeline Kanban / Lifecycle Tracking View */
          <>
            {/* Pipeline Executive Summary Metrics Card */}
            <View
              style={[
                styles.pipelineMetricsCard,
                {
                  backgroundColor: isDark ? colors.card : '#FFFFFF',
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.metricItem}>
                <Text style={[styles.metricValue, { color: colors.accent }]}>
                  {stats.totalTracked}
                </Text>
                <Text style={[styles.metricLabel, { color: colors.textMuted }]}>
                  Tracked
                </Text>
              </View>

              <View style={[styles.metricDivider, { backgroundColor: colors.borderSubtle }]} />

              <View style={styles.metricItem}>
                <Text style={[styles.metricValue, { color: '#0052FF' }]}>
                  {stats.appliedCount}
                </Text>
                <Text style={[styles.metricLabel, { color: colors.textMuted }]}>
                  Applied
                </Text>
              </View>

              <View style={[styles.metricDivider, { backgroundColor: colors.borderSubtle }]} />

              <View style={styles.metricItem}>
                <Text style={[styles.metricValue, { color: '#10B981' }]}>
                  {stats.interviewingCount}
                </Text>
                <Text style={[styles.metricLabel, { color: colors.textMuted }]}>
                  Interview
                </Text>
              </View>

              <View style={[styles.metricDivider, { backgroundColor: colors.borderSubtle }]} />

              <View style={styles.metricItem}>
                <Text style={[styles.metricValue, { color: '#F59E0B' }]}>
                  {stats.followUpsDueCount}
                </Text>
                <Text style={[styles.metricLabel, { color: colors.textMuted }]}>
                  Follow-ups
                </Text>
              </View>
            </View>

            {/* Pipeline Stage Tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryFiltersScroll}
            >
              {(
                [
                  { label: 'All Active', value: 'all' },
                  { label: '⚡ Applied', value: 'applied' },
                  { label: '💬 In Interview', value: 'interviewing' },
                  { label: '📅 Follow-Up Due', value: 'follow_up' },
                  { label: '📌 Saved', value: 'saved' },
                  { label: '🏆 Offers', value: 'won' },
                  { label: '📦 Archived', value: 'archived' },
                ] as const
              ).map((tab) => {
                const isSelected = pipelineStageFilter === tab.value;
                return (
                  <TouchableOpacity
                    key={tab.value}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: isSelected
                          ? colors.accent
                          : isDark
                          ? colors.card
                          : '#FFFFFF',
                        borderColor: isSelected ? colors.accent : colors.border,
                      },
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setPipelineStageFilter(tab.value as any);
                    }}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        {
                          color: isSelected ? '#FFFFFF' : colors.textSecondary,
                          fontFamily: isSelected ? FONTS.bold : FONTS.medium,
                        },
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Pipeline Records Feed */}
            {filteredPipelineRecords.length > 0 ? (
              filteredPipelineRecords.map((record) => {
                const opp = record.opportunity;
                const stageMeta = STAGE_LABELS[record.stage] || { label: record.stage, color: colors.accent };

                return (
                  <View
                    key={record.id}
                    style={[
                      styles.pipelineCard,
                      {
                        backgroundColor: isDark ? colors.card : '#FFFFFF',
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    {/* Header: Company & Stage Badge */}
                    <TouchableOpacity
                      onPress={() => router.push(`/opportunity/${opp.id}` as any)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.cardHeaderRow}>
                        <View style={styles.cardTitleWrap}>
                          <Text style={[styles.cardOrgText, { color: colors.textSecondary }]} numberOfLines={1}>
                            {opp.organization}
                          </Text>
                          <Text style={[styles.cardTitleText, { color: colors.text }]} numberOfLines={2}>
                            {opp.title}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.stageBadge,
                            { backgroundColor: stageMeta.color + '18', borderColor: stageMeta.color + '40' },
                          ]}
                        >
                          <Text style={[styles.stageBadgeText, { color: stageMeta.color }]}>
                            {stageMeta.label}
                          </Text>
                        </View>
                      </View>

                      {/* Value & Match Score */}
                      <View style={styles.cardMetaRow}>
                        <Text style={[styles.cardValueText, { color: colors.accent }]}>
                          {opp.compensation}
                        </Text>
                        <Text style={[styles.cardDot, { color: colors.textMuted }]}>•</Text>
                        <Text style={[styles.cardLocationText, { color: colors.textMuted }]}>
                          {opp.location}
                        </Text>
                        <Text style={[styles.cardDot, { color: colors.textMuted }]}>•</Text>
                        <Text style={[styles.cardScoreText, { color: '#10B981' }]}>
                          {opp.matchScore}% Match
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {/* Follow-up Reminder Banner if Present */}
                    {record.followUpDate ? (
                      <View
                        style={[
                          styles.followUpBanner,
                          {
                            backgroundColor: record.followUpDate.includes('Today') || record.followUpDate.includes('Tomorrow')
                              ? '#FEF3C7'
                              : isDark
                              ? colors.surfaceSecondary
                              : '#F8FAFC',
                          },
                        ]}
                      >
                        <Calendar
                          size={15}
                          color={
                            record.followUpDate.includes('Today') ? '#D97706' : colors.accent
                          }
                          variant="Bold"
                        />
                        <View style={styles.followUpTextWrap}>
                          <Text
                            style={[
                              styles.followUpDateText,
                              {
                                color: record.followUpDate.includes('Today') ? '#92400E' : colors.text,
                                fontFamily: FONTS.bold,
                              },
                            ]}
                          >
                            Follow-Up: {record.followUpDate}
                          </Text>
                          {record.followUpObjective ? (
                            <Text
                              style={[
                                styles.followUpObjectiveText,
                                { color: isDark ? colors.textSecondary : '#475569' },
                              ]}
                              numberOfLines={1}
                            >
                              {record.followUpObjective}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                    ) : null}

                    {/* Private Notes Preview */}
                    {record.notes ? (
                      <View style={[styles.notesBox, { backgroundColor: isDark ? colors.surfaceSecondary : '#F8FAFC' }]}>
                        <Text style={[styles.notesHeading, { color: colors.textMuted }]}>
                          Private Note:
                        </Text>
                        <Text style={[styles.notesText, { color: colors.textSecondary }]} numberOfLines={2}>
                          {record.notes}
                        </Text>
                      </View>
                    ) : null}

                    {/* Stage Transition Selector Chips */}
                    <View style={[styles.stageTransitionRow, { borderTopColor: colors.borderSubtle }]}>
                      <Text style={[styles.transitionTitle, { color: colors.textMuted }]}>
                        Move Stage:
                      </Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stageChipsScroll}>
                        {(['saved', 'applied', 'interviewing', 'won', 'archived'] as PipelineStage[]).map((st) => {
                          const isCurrent = record.stage === st;
                          return (
                            <TouchableOpacity
                              key={st}
                              style={[
                                styles.stageChip,
                                {
                                  backgroundColor: isCurrent
                                    ? colors.accent
                                    : isDark
                                    ? colors.surfaceSecondary
                                    : '#F1F5F9',
                                },
                              ]}
                              onPress={() => updateStage(opp.id, st)}
                            >
                              <Text
                                style={[
                                  styles.stageChipText,
                                  {
                                    color: isCurrent ? '#FFFFFF' : colors.textSecondary,
                                    fontFamily: isCurrent ? FONTS.bold : FONTS.medium,
                                  },
                                ]}
                              >
                                {STAGE_LABELS[st].label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>

                    {/* Action Toolbar on Pipeline Card */}
                    <View style={[styles.pipelineCardActions, { borderTopColor: colors.borderSubtle }]}>
                      <TouchableOpacity
                        style={styles.cardActionBtn}
                        onPress={() => router.push(`/composer/${opp.id}` as any)}
                      >
                        <Send2 size={15} color={colors.accent} variant="Bold" />
                        <Text style={[styles.cardActionBtnText, { color: colors.accent }]}>
                          Outreach Pitch
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.cardActionBtn}
                        onPress={() => setSchedulingRecord(record)}
                      >
                        <Calendar size={15} color={colors.textSecondary} variant="Bold" />
                        <Text style={[styles.cardActionBtnText, { color: colors.textSecondary }]}>
                          Schedule
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.cardActionBtn}
                        onPress={() => {
                          setEditingNoteRecord(record);
                          setTempNoteText(record.notes || '');
                        }}
                      >
                        <Edit2 size={15} color={colors.textSecondary} variant="Bold" />
                        <Text style={[styles.cardActionBtnText, { color: colors.textSecondary }]}>
                          Note
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.cardActionIconOnly}
                        onPress={() => removeFromPipeline(opp.id)}
                      >
                        <Trash size={16} color={colors.textMuted} variant="Linear" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            ) : (
              <EmptyState
                icon={<Briefcase size={36} color={colors.textMuted} variant="Linear" />}
                title="Pipeline Empty"
                description="Save or auto-apply to opportunities in Discoveries to track them here."
                actionTitle="Browse Discoveries"
                onAction={() => setActiveSegment('discoveries')}
                style={{ marginTop: 28 }}
              />
            )}
          </>
        )}
      </ScrollView>

      {/* Note Editing Modal */}
      <Modal
        visible={!!editingNoteRecord}
        animationType="slide"
        transparent
        onRequestClose={() => setEditingNoteRecord(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContentCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Private Note
              </Text>
              <TouchableOpacity onPress={() => setEditingNoteRecord(null)}>
                <CloseCircle size={22} color={colors.textMuted} variant="Bold" />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSub, { color: colors.textMuted }]}>
              {editingNoteRecord?.opportunity.organization} · {editingNoteRecord?.opportunity.title}
            </Text>

            <TextInput
              style={[
                styles.modalTextInput,
                {
                  color: colors.text,
                  backgroundColor: isDark ? colors.surfaceSecondary : '#F8FAFC',
                  borderColor: colors.border,
                },
              ]}
              placeholder="Record strategic talking points, compensation notes, or feedback…"
              placeholderTextColor={colors.textMuted}
              multiline
              value={tempNoteText}
              onChangeText={setTempNoteText}
            />

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                onPress={() => setEditingNoteRecord(null)}
              >
                <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, { backgroundColor: colors.accent }]}
                onPress={saveEditedNote}
              >
                <Text style={styles.modalSubmitText}>Save Note</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Schedule Follow-Up Modal */}
      <Modal
        visible={!!schedulingRecord}
        animationType="slide"
        transparent
        onRequestClose={() => setSchedulingRecord(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContentCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Schedule Follow-Up
              </Text>
              <TouchableOpacity onPress={() => setSchedulingRecord(null)}>
                <CloseCircle size={22} color={colors.textMuted} variant="Bold" />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSub, { color: colors.textMuted }]}>
              {schedulingRecord?.opportunity.organization}
            </Text>

            <Text style={[styles.fieldLabel, { color: colors.text }]}>Cadence</Text>
            <View style={styles.modalCadenceRow}>
              {(['Tomorrow', 'In 3 Days', 'In 1 Week'] as const).map((cadence) => {
                const isSel = selectedCadence === cadence;
                return (
                  <TouchableOpacity
                    key={cadence}
                    style={[
                      styles.cadenceChip,
                      {
                        backgroundColor: isSel
                          ? colors.accent
                          : isDark
                          ? colors.surfaceSecondary
                          : '#F3F5F9',
                      },
                    ]}
                    onPress={() => setSelectedCadence(cadence)}
                  >
                    <Text
                      style={[
                        styles.cadenceChipText,
                        { color: isSel ? '#FFF' : colors.text },
                      ]}
                    >
                      {cadence}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.fieldLabel, { color: colors.text, marginTop: 12 }]}>Objective</Text>
            <TextInput
              style={[
                styles.modalTextInputSingle,
                {
                  color: colors.text,
                  backgroundColor: isDark ? colors.surfaceSecondary : '#F8FAFC',
                  borderColor: colors.border,
                },
              ]}
              value={selectedObjective}
              onChangeText={setSelectedObjective}
              placeholder="e.g. Check proposal status with hiring lead"
              placeholderTextColor={colors.textMuted}
            />

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                onPress={() => setSchedulingRecord(null)}
              >
                <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, { backgroundColor: colors.accent }]}
                onPress={confirmScheduledFollowUp}
              >
                <Text style={styles.modalSubmitText}>Set Follow-Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: BORDER_RADIUS.full,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.full,
  },
  segmentText: {
    fontSize: 13,
  },
  segmentLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  segmentCountPill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BORDER_RADIUS.full,
  },
  segmentCountText: {
    color: '#FFF',
    fontSize: 10.5,
    fontFamily: FONTS.bold,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: 130, // Clearance for floating tab bar
  },
  aiSearchBox: {
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1.2,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: SPACING.md,
    gap: 10,
  },
  mainInput: {
    flex: 1,
    height: '100%',
    fontSize: 13.5,
  },
  clearBtn: {
    padding: 4,
  },
  contextToolsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  contextToolChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  contextToolText: {
    fontSize: 11,
    fontFamily: FONTS.medium,
  },
  inlineTailorPanel: {
    padding: SPACING.md,
    borderTopWidth: 1,
  },
  tailorHeading: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    marginBottom: 8,
  },
  ratePillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  rateChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
  },
  rateChipText: {
    fontSize: 11,
    fontFamily: FONTS.semibold,
  },
  categoryFiltersScroll: {
    gap: 6,
    paddingVertical: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  filterChip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipText: {
    fontSize: 12,
  },
  resultsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: SPACING.md,
  },
  resultsCountText: {
    fontSize: 14.5,
    fontFamily: FONTS.bold,
  },
  pipelineMetricsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 19,
    fontFamily: FONTS.bold,
    letterSpacing: -0.3,
  },
  metricLabel: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 24,
  },
  pipelineCard: {
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardTitleWrap: {
    flex: 1,
    marginRight: 8,
  },
  cardOrgText: {
    fontSize: 12,
    fontFamily: FONTS.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  cardTitleText: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    lineHeight: 20,
  },
  stageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
  },
  stageBadgeText: {
    fontSize: 10.5,
    fontFamily: FONTS.bold,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 10,
  },
  cardValueText: {
    fontSize: 13,
    fontFamily: FONTS.bold,
  },
  cardDot: {
    fontSize: 12,
  },
  cardLocationText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  cardScoreText: {
    fontSize: 12,
    fontFamily: FONTS.bold,
  },
  followUpBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: 10,
  },
  followUpTextWrap: {
    flex: 1,
  },
  followUpDateText: {
    fontSize: 12,
  },
  followUpObjectiveText: {
    fontSize: 11,
    marginTop: 1,
  },
  notesBox: {
    padding: 10,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: 10,
  },
  notesHeading: {
    fontSize: 10.5,
    fontFamily: FONTS.semibold,
    marginBottom: 2,
  },
  notesText: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  stageTransitionRow: {
    paddingTop: 8,
    borderTopWidth: 1,
    marginBottom: 8,
  },
  transitionTitle: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    marginBottom: 6,
  },
  stageChipsScroll: {
    gap: 6,
  },
  stageChip: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  stageChipText: {
    fontSize: 11,
  },
  pipelineCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  cardActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  cardActionBtnText: {
    fontSize: 12,
    fontFamily: FONTS.semibold,
  },
  cardActionIconOnly: {
    padding: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  modalContentCard: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: FONTS.bold,
  },
  modalSub: {
    fontSize: 12,
    marginTop: 2,
    marginBottom: SPACING.md,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    marginBottom: 6,
  },
  modalCadenceRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.sm,
  },
  cadenceChip: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.md,
  },
  cadenceChipText: {
    fontSize: 12,
    fontFamily: FONTS.semibold,
  },
  modalTextInput: {
    height: 100,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    padding: 10,
    textAlignVertical: 'top',
    fontSize: 13,
  },
  modalTextInputSingle: {
    height: 42,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 13,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: SPACING.md,
  },
  modalCancelBtn: {
    flex: 1,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  modalCancelText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
  },
  modalSubmitBtn: {
    flex: 1,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.md,
  },
  modalSubmitText: {
    color: '#FFF',
    fontSize: 13,
    fontFamily: FONTS.bold,
  },
});
