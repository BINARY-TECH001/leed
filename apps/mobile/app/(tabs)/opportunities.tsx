import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { usePipeline, type PipelineRecord } from '@/context/PipelineContext';
import { Badge, EmptyState, CustomDateTimePickerSheet, OpportunityCardSkeleton } from '@/components/ui';
import { OpportunityCard } from '@/components/opportunities/OpportunityCard';
import { ActivePipelineRail } from '@/components/opportunities/ActivePipelineRail';
import {
  DiscoveriesFilterBottomSheet,
  type DiscoveriesFilterState,
} from '@/components/opportunities/DiscoveriesFilterBottomSheet';
import { PipelineStagePickerSheet } from '@/components/pipeline/PipelineStagePickerSheet';
import { opportunityService } from '@/services/opportunityService';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/theme';
import {
  SearchNormal1,
  CloseCircle,
  Filter,
  RotateLeft,
  Add,
  Flash,
  DirectSend,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import type { Opportunity } from '@prospect/types';

export default function OpportunitiesScreen() {
  const params = useLocalSearchParams<{ initialQuery?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { width } = useWindowDimensions();

  const {
    records,
    isSaved,
    isApplied,
    toggleSave,
    applyToOpportunity,
    scheduleFollowUp,
    updateStage,
    stats,
  } = usePipeline();

  // Search input state
  const [searchQuery, setSearchQuery] = useState(params.initialQuery || '');
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter state for discoveries (Controlled via responsive BottomSheet)
  const [filterState, setFilterState] = useState<DiscoveriesFilterState>({
    type: 'all',
    remoteOnly: false,
    minCompRate: 0,
    source: 'all',
    sortBy: 'match',
  });
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  // Stage picker sheet state
  const [stagePickerRecord, setStagePickerRecord] = useState<PipelineRecord | null>(null);

  // Custom Date Time Picker Sheet state
  const [schedulingOpp, setSchedulingOpp] = useState<Opportunity | null>(null);

  // Fetch opportunities with server search
  const fetchOpportunities = async () => {
    setIsLoading(true);
    try {
      const data = await opportunityService.getOpportunities({
        query: searchQuery.trim() || undefined,
        type: filterState.type !== 'all' && filterState.type !== 'high_fit' ? filterState.type : undefined,
        remoteOnly: filterState.remoteOnly,
        highFitOnly: filterState.type === 'high_fit',
        minComp: filterState.minCompRate > 0 ? filterState.minCompRate : undefined,
      });
      setOpportunities(data || []);
    } catch (err) {
      console.warn('Could not fetch opportunities:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, [searchQuery, filterState]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOpportunities();
    setRefreshing(false);
  };

  // Distinct sources for filters
  const availableSources = useMemo(() => {
    const set = new Set<string>();
    opportunities.forEach((o) => {
      if (o.source) set.add(o.source);
    });
    return Array.from(set);
  }, [opportunities]);

  // Filtered Discoveries Feed
  const filteredOpportunities = useMemo(() => {
    return opportunities
      .filter((opp) => {
        // Category
        if (filterState.type === 'high_fit' && opp.matchScore < 90) return false;
        if (filterState.type !== 'all' && filterState.type !== 'high_fit' && opp.type !== filterState.type) {
          return false;
        }

        // Remote
        if (filterState.remoteOnly && !opp.isRemote) return false;

        // Rate
        if (filterState.minCompRate > 0 && (opp.compensationAmount || 0) < filterState.minCompRate) {
          return false;
        }

        // Source
        if (filterState.source !== 'all' && opp.source !== filterState.source) {
          return false;
        }

        // Search text
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = opp.title.toLowerCase().includes(q);
          const matchesOrg = opp.organization.toLowerCase().includes(q);
          const matchesTags = opp.tags.some((t: string) => t.toLowerCase().includes(q));
          return matchesTitle || matchesOrg || matchesTags;
        }

        return true;
      })
      .sort((a, b) => {
        if (filterState.sortBy === 'match') return b.matchScore - a.matchScore;
        if (filterState.sortBy === 'comp') return (b.compensationAmount || 0) - (a.compensationAmount || 0);
        return new Date(b.discoveredAt).getTime() - new Date(a.discoveredAt).getTime();
      });
  }, [opportunities, filterState, searchQuery]);

  // Active filter count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filterState.type !== 'all') count++;
    if (filterState.remoteOnly) count++;
    if (filterState.minCompRate > 0) count++;
    if (filterState.source !== 'all') count++;
    if (filterState.sortBy !== 'match') count++;
    return count;
  }, [filterState]);

  // Clear all filters
  const handleClearFilters = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFilterState({
      type: 'all',
      remoteOnly: false,
      minCompRate: 0,
      source: 'all',
      sortBy: 'match',
    });
    setSearchQuery('');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Search & Filter Bar Directly at the Top (No Screen Title Header) */}
      <View style={[styles.topSearchHeader, { borderBottomColor: colors.borderSubtle }]}>
        <View style={styles.searchRow}>
          <View
            style={[
              styles.searchBox,
              {
                backgroundColor: isDark ? colors.card : '#FFFFFF',
                borderColor: searchQuery ? colors.accent : colors.border,
              },
            ]}
          >
            <SearchNormal1 size={18} color={colors.accent} />
            <TextInput
              style={[styles.searchInput, { color: colors.text, fontFamily: FONTS.regular }]}
              placeholder="Search roles, skills, or target firms…"
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
                <CloseCircle size={17} color={colors.textMuted} variant="Bold" />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Filter Icon Button (Opens Filter BottomSheet Responsively) */}
          <TouchableOpacity
            style={[
              styles.filterIconButton,
              {
                backgroundColor: activeFiltersCount > 0
                  ? isDark
                    ? 'rgba(255, 102, 0, 0.15)'
                    : '#FFF6F0'
                  : isDark
                  ? colors.card
                  : '#FFFFFF',
                borderColor: activeFiltersCount > 0 ? colors.accent : colors.border,
              },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setIsFilterSheetOpen(true);
            }}
            activeOpacity={0.75}
          >
            <Filter
              size={19}
              color={activeFiltersCount > 0 ? colors.accent : colors.textSecondary}
              variant="Bold"
            />
            {activeFiltersCount > 0 && (
              <View style={[styles.activeFilterCountDot, { backgroundColor: colors.accent }]}>
                <Text style={styles.activeFilterCountText}>{activeFiltersCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Active Filter Tags (If filters are active) */}
        {activeFiltersCount > 0 && (
          <View style={styles.activeFilterTagsRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagsScroll}>
              {filterState.type !== 'all' && (
                <View style={[styles.filterTag, { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA', borderColor: colors.borderSubtle }]}>
                  <Text style={[styles.filterTagText, { color: colors.textSecondary }]}>
                    {filterState.type.toUpperCase()}
                  </Text>
                </View>
              )}

              {filterState.remoteOnly && (
                <View style={[styles.filterTag, { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA', borderColor: colors.borderSubtle }]}>
                  <Text style={[styles.filterTagText, { color: colors.textSecondary }]}>
                    100% Remote
                  </Text>
                </View>
              )}

              {filterState.minCompRate > 0 && (
                <View style={[styles.filterTag, { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA', borderColor: colors.borderSubtle }]}>
                  <Text style={[styles.filterTagText, { color: colors.textSecondary }]}>
                    ≥ ${filterState.minCompRate}/hr
                  </Text>
                </View>
              )}

              {filterState.source !== 'all' && (
                <View style={[styles.filterTag, { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA', borderColor: colors.borderSubtle }]}>
                  <Text style={[styles.filterTagText, { color: colors.textSecondary }]}>
                    {filterState.source}
                  </Text>
                </View>
              )}

              <TouchableOpacity onPress={handleClearFilters} style={styles.clearAllFiltersBtn}>
                <RotateLeft size={11} color={colors.accent} />
                <Text style={[styles.clearAllFiltersText, { color: colors.accent }]}>Clear</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {/* Category Filter Pills Bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryPillsScroll}
        >
          {[
            { id: 'all', label: 'All' },
            { id: 'contract', label: 'Contracts' },
            { id: 'job', label: 'Full-time' },
            { id: 'freelance', label: 'Freelance' },
            { id: 'lead', label: 'B2B Leads' },
            { id: 'high_fit', label: '⭐ 90%+ Fit' },
          ].map((f) => {
            const isSelected = filterState.type === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                style={[
                  styles.categoryPill,
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
                  Haptics.selectionAsync();
                  setFilterState((prev) => ({ ...prev, type: f.id as any }));
                }}
              >
                <Text
                  style={[
                    styles.categoryPillText,
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
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 85 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
      >
        {/* Active Deals In Flight (Placed Immediately After Search) */}
        {records.length > 0 && (
          <ActivePipelineRail
            records={records}
            onOpenStagePicker={(rec) => setStagePickerRecord(rec)}
          />
        )}

        {/* Verified Discoveries Section */}
        <View style={styles.discoveriesSection}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleBlock}>
              <Text style={[styles.sectionHeading, { color: colors.text }]}>Verified Discoveries</Text>
              <Text style={[styles.sectionSub, { color: colors.textMuted }]}>
                Screened against your verified CV and compensation floor
              </Text>
            </View>

            <Badge label={`${filteredOpportunities.length} Available`} variant="success" size="sm" dot />
          </View>

          {/* Opportunities Feed with Skeleton Loader */}
          {isLoading && opportunities.length === 0 ? (
            <>
              <OpportunityCardSkeleton />
              <OpportunityCardSkeleton />
              <OpportunityCardSkeleton />
            </>
          ) : filteredOpportunities.length > 0 ? (
            filteredOpportunities.map((opp) => (
              <OpportunityCard
                key={opp.id}
                opportunity={opp}
                isSaved={isSaved(opp.id)}
                isApplied={isApplied(opp.id)}
                onToggleSave={() => toggleSave(opp)}
                onAutoApply={() => applyToOpportunity(opp)}
                onMailPitch={() => router.push(`/composer/${opp.id}` as any)}
                onSchedule={() => setSchedulingOpp(opp)}
              />
            ))
          ) : (
            <EmptyState
              title="No Discoveries Match Filters"
              description="Adjust your rate, type, or remote constraints to view more verified opportunities."
              actionTitle="Reset Discoveries Filters"
              onAction={handleClearFilters}
            />
          )}
        </View>
      </ScrollView>

      {/* Filter BottomSheet (Shows up responsively when user clicks filter icon) */}
      <DiscoveriesFilterBottomSheet
        visible={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        filters={filterState}
        onChangeFilters={setFilterState}
        totalMatchesCount={filteredOpportunities.length}
        availableSources={availableSources}
      />

      {/* Custom Date Time Picker Sheet (Custom Date & Time + Presets) */}
      {schedulingOpp && (
        <CustomDateTimePickerSheet
          visible={!!schedulingOpp}
          onClose={() => setSchedulingOpp(null)}
          title={`Schedule Follow-Up for ${schedulingOpp.organization}`}
          subtitle={schedulingOpp.title}
          onConfirm={(scheduledDate, objective) => {
            scheduleFollowUp(schedulingOpp.id, scheduledDate, objective);
          }}
        />
      )}

      {/* Pipeline Stage Picker BottomSheet */}
      {stagePickerRecord && (
        <PipelineStagePickerSheet
          visible={!!stagePickerRecord}
          onClose={() => setStagePickerRecord(null)}
          record={stagePickerRecord}
          onSelectStage={(oppId, newStage) => {
            updateStage(oppId, newStage);
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topSearchHeader: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.sm,
    gap: 10,
    borderBottomWidth: 1,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  discoveriesSection: {
    marginTop: 4,
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitleBlock: {
    flex: 1,
    gap: 2,
    marginRight: 8,
  },
  sectionHeading: {
    fontSize: 16.5,
    fontFamily: FONTS.bold,
  },
  sectionSub: {
    fontSize: 11.5,
    fontFamily: FONTS.regular,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    padding: 0,
  },
  clearSearchBtn: {
    padding: 2,
  },
  filterIconButton: {
    width: 42,
    height: 42,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeFilterCountDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 17,
    height: 17,
    borderRadius: 8.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeFilterCountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: FONTS.bold,
  },
  activeFilterTagsRow: {
    paddingVertical: 2,
  },
  tagsScroll: {
    gap: 6,
    alignItems: 'center',
  },
  filterTag: {
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
  },
  filterTagText: {
    fontSize: 10.5,
    fontFamily: FONTS.medium,
  },
  clearAllFiltersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  clearAllFiltersText: {
    fontSize: 11,
    fontFamily: FONTS.bold,
  },
  categoryPillsScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  categoryPill: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
  },
  categoryPillText: {
    fontSize: 12,
  },
});
