import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Share as RNShare,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { usePipeline } from '@/context/PipelineContext';
import { Badge, Card, EmptyState, CustomDateTimePickerSheet, BottomSheet } from '@/components/ui';
import { OpportunityCard } from '@/components/opportunities/OpportunityCard';
import { SAMPLE_OPPORTUNITIES } from '@/constants/mockData';
import { opportunityService } from '@/services/opportunityService';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/theme';
import {
  ArrowLeft2,
  SearchNormal1,
  ExportCurve,
  Filter,
  TickSquare,
  Flash,
  ArchiveAdd,
  Global,
  DollarCircle,
  Clock,
  MagicStar,
  CloseCircle,
  DocumentText,
  Share,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import type { Opportunity, OpportunityType } from '@prospect/types';

export default function SearchResultsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { width } = useWindowDimensions();

  const {
    isSaved,
    isApplied,
    toggleSave,
    applyToOpportunity,
    scheduleFollowUp,
  } = usePipeline();

  const params = useLocalSearchParams<{
    query?: string;
    type?: string;
    remoteOnly?: string;
    minComp?: string;
  }>();

  // Search state
  const [searchQuery, setSearchQuery] = useState(params.query || '');
  const [results, setResults] = useState<Opportunity[]>(SAMPLE_OPPORTUNITIES);
  const [loading, setLoading] = useState(false);

  // Filters & Sorting
  const [selectedType, setSelectedType] = useState<string>(params.type || 'all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [remoteOnly, setRemoteOnly] = useState(params.remoteOnly === 'true');
  const [minCompRate, setMinCompRate] = useState<number>(
    params.minComp ? parseInt(params.minComp, 10) : 0
  );
  const [sortBy, setSortBy] = useState<'match' | 'comp' | 'newest'>('match');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  // Multi-Select & Batch Actions
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Export Modal
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'CSV' | 'JSON' | 'TEXT'>('CSV');

  // Schedule Sheet
  const [scheduleOpp, setScheduleOpp] = useState<Opportunity | null>(null);

  // Fetch or filter opportunities
  useEffect(() => {
    let active = true;
    const fetchResults = async () => {
      setLoading(true);
      try {
        if (searchQuery.trim()) {
          const res = await opportunityService.searchOpportunities(searchQuery.trim());
          if (active && res && res.results.length > 0) {
            setResults(res.results);
            return;
          }
        }
      } catch {
        // Fallback
      } finally {
        if (active) setLoading(false);
      }

      // Offline client search
      const q = searchQuery.toLowerCase().trim();
      const filtered = SAMPLE_OPPORTUNITIES.filter((opp) => {
        if (!q) return true;
        return (
          opp.title.toLowerCase().includes(q) ||
          opp.organization.toLowerCase().includes(q) ||
          opp.description.toLowerCase().includes(q) ||
          opp.tags.some((t) => t.toLowerCase().includes(q))
        );
      });
      if (active) {
        setResults(filtered.length > 0 ? filtered : SAMPLE_OPPORTUNITIES);
        setLoading(false);
      }
    };

    fetchResults();
    return () => {
      active = false;
    };
  }, [searchQuery]);

  // Unique sources for source filtering
  const availableSources = useMemo(() => {
    const set = new Set<string>();
    SAMPLE_OPPORTUNITIES.forEach((o) => {
      if (o.source) set.add(o.source);
    });
    return Array.from(set);
  }, []);

  // Filtered & Sorted items
  const displayedLeads = useMemo(() => {
    return results
      .filter((opp) => {
        if (selectedType !== 'all' && opp.type !== selectedType) return false;
        if (selectedSource !== 'all' && opp.source !== selectedSource) return false;
        if (remoteOnly && !opp.isRemote) return false;
        if (minCompRate > 0 && (opp.compensationAmount || 0) < minCompRate) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'match') return b.matchScore - a.matchScore;
        if (sortBy === 'comp') return (b.compensationAmount || 0) - (a.compensationAmount || 0);
        return new Date(b.discoveredAt).getTime() - new Date(a.discoveredAt).getTime();
      });
  }, [results, selectedType, selectedSource, remoteOnly, minCompRate, sortBy]);

  // Export handler
  const handleExport = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const target = selectedIds.length > 0
      ? displayedLeads.filter((l) => selectedIds.includes(l.id))
      : displayedLeads;

    let text = '';
    if (exportFormat === 'JSON') {
      text = JSON.stringify(target, null, 2);
    } else if (exportFormat === 'TEXT') {
      text = target
        .map(
          (l, i) =>
            `${i + 1}. ${l.title} at ${l.organization}\n   Source: ${l.source || 'Verified Index'}\n   Comp: ${l.compensation} | Location: ${l.location}\n   Match: ${l.matchScore}%`
        )
        .join('\n\n');
    } else {
      text =
        'Title,Organization,Source,Type,Compensation,Location,Match\n' +
        target
          .map(
            (l) =>
              `"${l.title}","${l.organization}","${l.source || 'Direct'}","${l.type}","${l.compensation}","${l.location}",${l.matchScore}%`
          )
          .join('\n');
    }

    try {
      await RNShare.share({
        message: text,
        title: `ProspectAI Scout Export (${target.length} leads)`,
      });
    } catch {}
    setIsExportModalOpen(false);
  };

  // Batch actions
  const handleToggleSelectLead = (id: string) => {
    Haptics.selectionAsync();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    Haptics.selectionAsync();
    if (selectedIds.length === displayedLeads.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(displayedLeads.map((l) => l.id));
    }
  };

  const handleBatchAutoApply = () => {
    if (selectedIds.length === 0) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const toApply = displayedLeads.filter((l) => selectedIds.includes(l.id));
    toApply.forEach((opp) => applyToOpportunity(opp));
    setSelectedIds([]);
    setIsSelectionMode(false);
  };

  const handleBatchSave = () => {
    if (selectedIds.length === 0) return;
    Haptics.selectionAsync();
    const toSave = displayedLeads.filter((l) => selectedIds.includes(l.id));
    toSave.forEach((opp) => {
      if (!isSaved(opp.id)) toggleSave(opp);
    });
    setSelectedIds([]);
    setIsSelectionMode(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Top Header Bar */}
      <View style={[styles.headerBar, { borderBottomColor: colors.borderSubtle }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA' }]}
          activeOpacity={0.7}
        >
          <ArrowLeft2 size={20} color={colors.text} />
        </TouchableOpacity>

        {/* Search Query Chip */}
        <View style={[styles.queryPill, { backgroundColor: isDark ? colors.card : '#FFFFFF', borderColor: colors.border }]}>
          <SearchNormal1 size={14} color={colors.accent} />
          <TextInput
            style={[styles.queryInput, { color: colors.text }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search discovered leads…"
            placeholderTextColor={colors.textMuted}
            returnKeyType="search"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <CloseCircle size={15} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Export Button */}
        <TouchableOpacity
          style={[styles.headerIconBtn, { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA' }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setIsExportModalOpen(true);
          }}
          activeOpacity={0.7}
        >
          <ExportCurve size={18} color={colors.accent} variant="Bold" />
        </TouchableOpacity>
      </View>

      {/* Tools Row: Filter trigger, source summary, selection mode toggle */}
      <View style={[styles.toolsBar, { borderBottomColor: colors.borderSubtle }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolsScroll}>
          {/* Filter BottomSheet Trigger */}
          <TouchableOpacity
            style={[
              styles.filterPill,
              {
                backgroundColor:
                  selectedType !== 'all' || selectedSource !== 'all' || remoteOnly || minCompRate > 0
                    ? isDark
                      ? 'rgba(255, 102, 0, 0.15)'
                      : '#FFF6F0'
                    : isDark
                    ? colors.card
                    : '#FFFFFF',
                borderColor:
                  selectedType !== 'all' || selectedSource !== 'all' || remoteOnly || minCompRate > 0
                    ? colors.accent
                    : colors.border,
              },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setIsFilterSheetOpen(true);
            }}
            activeOpacity={0.75}
          >
            <Filter size={13} color={colors.accent} variant="Bold" />
            <Text style={[styles.filterPillText, { color: colors.text }]}>Filters</Text>
            {(selectedType !== 'all' || selectedSource !== 'all' || remoteOnly || minCompRate > 0) && (
              <View style={[styles.filterCountBadge, { backgroundColor: colors.accent }]}>
                <Text style={styles.filterCountBadgeText}>●</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Quick Source Pill */}
          <TouchableOpacity
            style={[
              styles.sourcePill,
              {
                backgroundColor: isDark ? colors.card : '#FFFFFF',
                borderColor: colors.border,
              },
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              setIsFilterSheetOpen(true);
            }}
          >
            <Global size={13} color={colors.secondary} variant="Bold" />
            <Text style={[styles.sourcePillText, { color: colors.textSecondary }]}>
              {selectedSource === 'all' ? 'All Portals' : selectedSource}
            </Text>
          </TouchableOpacity>

          {/* Sort Selector */}
          <TouchableOpacity
            style={[
              styles.sortPill,
              {
                backgroundColor: isDark ? colors.card : '#FFFFFF',
                borderColor: colors.border,
              },
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              setSortBy((prev) => (prev === 'match' ? 'comp' : prev === 'comp' ? 'newest' : 'match'));
            }}
          >
            <MagicStar size={13} color={colors.accent} variant="Bold" />
            <Text style={[styles.sortPillText, { color: colors.textSecondary }]}>
              {sortBy === 'match' ? 'Best Match' : sortBy === 'comp' ? 'Highest Rate' : 'Newest'}
            </Text>
          </TouchableOpacity>

          {/* Multi-Select Toggle */}
          <TouchableOpacity
            style={[
              styles.selectModeBtn,
              {
                backgroundColor: isSelectionMode
                  ? colors.accent
                  : isDark
                  ? colors.card
                  : '#FFFFFF',
                borderColor: isSelectionMode ? colors.accent : colors.border,
              },
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              setIsSelectionMode(!isSelectionMode);
              if (isSelectionMode) setSelectedIds([]);
            }}
          >
            <TickSquare
              size={13}
              color={isSelectionMode ? '#FFFFFF' : colors.textSecondary}
              variant={isSelectionMode ? 'Bold' : 'Linear'}
            />
            <Text
              style={[
                styles.selectModeBtnText,
                { color: isSelectionMode ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              {isSelectionMode ? 'Cancel Selection' : 'Batch Select'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Main Results Feed */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + (isSelectionMode ? 90 : 40) },
        ]}
      >
        {/* Results Count Strip */}
        <View style={styles.resultsCountStrip}>
          <Text style={[styles.resultsCountTitle, { color: colors.text }]}>
            {displayedLeads.length} Discovered Opportunities
          </Text>
          <Badge label="Verified Portals" variant="accent" size="sm" dot />
        </View>

        {displayedLeads.length > 0 ? (
          displayedLeads.map((opp) => {
            const isSelected = selectedIds.includes(opp.id);
            return (
              <View key={opp.id} style={styles.leadCardWrap}>
                {isSelectionMode && (
                  <TouchableOpacity
                    style={[
                      styles.checkboxItem,
                      {
                        backgroundColor: isSelected ? colors.accent : isDark ? colors.surfaceSecondary : '#FFFFFF',
                        borderColor: isSelected ? colors.accent : colors.border,
                      },
                    ]}
                    onPress={() => handleToggleSelectLead(opp.id)}
                    activeOpacity={0.8}
                  >
                    <TickSquare
                      size={18}
                      color={isSelected ? '#FFFFFF' : colors.textMuted}
                      variant={isSelected ? 'Bold' : 'Linear'}
                    />
                  </TouchableOpacity>
                )}

                <View style={{ flex: 1 }}>
                  <OpportunityCard
                    opportunity={opp}
                    isSaved={isSaved(opp.id)}
                    isApplied={isApplied(opp.id)}
                    onToggleSave={() => toggleSave(opp)}
                    onAutoApply={() => applyToOpportunity(opp)}
                    onMailPitch={() => router.push(`/composer/${opp.id}` as any)}
                    onSchedule={() => setScheduleOpp(opp)}
                  />
                </View>
              </View>
            );
          })
        ) : (
          <EmptyState
            title="No Leads Found"
            description="Try relaxing your filters or modifying your scout query."
            actionTitle="Reset Filters"
            onAction={() => {
              setSelectedType('all');
              setSelectedSource('all');
              setRemoteOnly(false);
              setMinCompRate(0);
              setSearchQuery('');
            }}
          />
        )}
      </ScrollView>

      {/* Batch Floating Bar when in Selection Mode */}
      {isSelectionMode && (
        <View
          style={[
            styles.batchFloatingBar,
            {
              backgroundColor: isDark ? 'rgba(20, 33, 61, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              borderColor: colors.border,
              bottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          <TouchableOpacity onPress={handleSelectAll} style={styles.batchSelectAllBtn}>
            <Text style={[styles.batchCountText, { color: colors.text }]}>
              {selectedIds.length === displayedLeads.length ? 'Deselect All' : `Select All (${displayedLeads.length})`}
            </Text>
          </TouchableOpacity>

          <View style={styles.batchActionsRight}>
            <TouchableOpacity
              style={[styles.batchApplyBtn, { backgroundColor: colors.accent }]}
              onPress={handleBatchAutoApply}
              disabled={selectedIds.length === 0}
            >
              <Flash size={14} color="#FFFFFF" variant="Bold" />
              <Text style={styles.batchApplyBtnText}>Apply ({selectedIds.length})</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.batchSaveBtn, { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA' }]}
              onPress={handleBatchSave}
              disabled={selectedIds.length === 0}
            >
              <ArchiveAdd size={14} color={colors.accent} variant="Bold" />
              <Text style={[styles.batchSaveBtnText, { color: colors.text }]}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Custom Date Time Picker Sheet for Scheduling Follow-ups */}
      {scheduleOpp && (
        <CustomDateTimePickerSheet
          visible={!!scheduleOpp}
          onClose={() => setScheduleOpp(null)}
          title={`Schedule for ${scheduleOpp.organization}`}
          subtitle={scheduleOpp.title}
          onConfirm={(scheduledDate, objective) => {
            scheduleFollowUp(scheduleOpp.id, scheduledDate, objective);
          }}
        />
      )}

      {/* Comprehensive Filter BottomSheet */}
      <BottomSheet
        visible={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        title="Filter & Refine Leads"
        subtitle="Narrow by verified source, contract type, and rate floor"
        icon={<Filter size={22} color={colors.accent} variant="Bold" />}
      >
        <View style={styles.filterSheetContent}>
          {/* Opportunity Type */}
          <View style={styles.filterGroup}>
            <Text style={[styles.filterGroupTitle, { color: colors.textSecondary }]}>Opportunity Type</Text>
            <View style={styles.chipsWrap}>
              {[
                { id: 'all', label: 'All Types' },
                { id: 'contract', label: 'Contracts' },
                { id: 'job', label: 'Full-time' },
                { id: 'freelance', label: 'Freelance' },
                { id: 'lead', label: 'B2B Leads' },
              ].map((item) => {
                const isSelected = selectedType === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.filterSheetChip,
                      {
                        backgroundColor: isSelected ? colors.accent : isDark ? colors.card : '#FFFFFF',
                        borderColor: isSelected ? colors.accent : colors.border,
                      },
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedType(item.id);
                    }}
                  >
                    <Text
                      style={[
                        styles.filterSheetChipText,
                        { color: isSelected ? '#FFFFFF' : colors.text },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Lead Source / Where it is from */}
          <View style={styles.filterGroup}>
            <Text style={[styles.filterGroupTitle, { color: colors.textSecondary }]}>Discovered Source Portal</Text>
            <View style={styles.chipsWrap}>
              <TouchableOpacity
                style={[
                  styles.filterSheetChip,
                  {
                    backgroundColor: selectedSource === 'all' ? colors.accent : isDark ? colors.card : '#FFFFFF',
                    borderColor: selectedSource === 'all' ? colors.accent : colors.border,
                  },
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedSource('all');
                }}
              >
                <Text style={[styles.filterSheetChipText, { color: selectedSource === 'all' ? '#FFFFFF' : colors.text }]}>
                  All Portals
                </Text>
              </TouchableOpacity>

              {availableSources.map((source) => {
                const isSelected = selectedSource === source;
                return (
                  <TouchableOpacity
                    key={source}
                    style={[
                      styles.filterSheetChip,
                      {
                        backgroundColor: isSelected ? colors.accent : isDark ? colors.card : '#FFFFFF',
                        borderColor: isSelected ? colors.accent : colors.border,
                      },
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedSource(source);
                    }}
                  >
                    <Text
                      style={[
                        styles.filterSheetChipText,
                        { color: isSelected ? '#FFFFFF' : colors.text },
                      ]}
                    >
                      {source}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Remote Only Toggle */}
          <TouchableOpacity
            style={[
              styles.sheetToggleRow,
              { backgroundColor: isDark ? colors.card : '#FFFFFF', borderColor: colors.border },
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              setRemoteOnly(!remoteOnly);
            }}
          >
            <View>
              <Text style={[styles.toggleTitle, { color: colors.text }]}>100% Remote Only</Text>
              <Text style={[styles.toggleSub, { color: colors.textMuted }]}>Hide location-bound positions</Text>
            </View>
            <View style={[styles.checkIndicator, { backgroundColor: remoteOnly ? colors.accent : 'transparent', borderColor: colors.border }]}>
              {remoteOnly && <TickSquare size={16} color="#FFFFFF" variant="Bold" />}
            </View>
          </TouchableOpacity>

          {/* Close / Apply Button */}
          <TouchableOpacity
            style={[styles.applyFilterBtn, { backgroundColor: colors.accent }]}
            onPress={() => setIsFilterSheetOpen(false)}
          >
            <Text style={styles.applyFilterBtnText}>Show {displayedLeads.length} Results</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>

      {/* Export Format BottomSheet */}
      <BottomSheet
        visible={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Export Discovered Leads"
        subtitle="Share or download your search data across tools"
        icon={<ExportCurve size={22} color={colors.accent} variant="Bold" />}
      >
        <View style={styles.exportSheetContent}>
          <Text style={[styles.exportInfoText, { color: colors.textMuted }]}>
            Exporting {selectedIds.length > 0 ? selectedIds.length : displayedLeads.length} leads matching your current criteria.
          </Text>

          <View style={styles.formatRow}>
            {(['CSV', 'JSON', 'TEXT'] as const).map((fmt) => {
              const isSelected = exportFormat === fmt;
              return (
                <TouchableOpacity
                  key={fmt}
                  style={[
                    styles.formatCard,
                    {
                      backgroundColor: isSelected ? (isDark ? 'rgba(255, 102, 0, 0.12)' : '#FFF6F0') : isDark ? colors.card : '#FFFFFF',
                      borderColor: isSelected ? colors.accent : colors.border,
                    },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setExportFormat(fmt);
                  }}
                >
                  <DocumentText size={20} color={isSelected ? colors.accent : colors.textMuted} variant="Bold" />
                  <Text style={[styles.formatCardText, { color: isSelected ? colors.accent : colors.text }]}>
                    .{fmt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[styles.exportActionBtn, { backgroundColor: colors.accent }]}
            onPress={handleExport}
          >
            <Share size={18} color="#FFFFFF" variant="Bold" />
            <Text style={styles.exportActionBtnText}>Share & Export</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: 10,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  queryPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  queryInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
    fontFamily: FONTS.medium,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolsBar: {
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  toolsScroll: {
    paddingHorizontal: SPACING.md,
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 12,
    fontFamily: FONTS.semibold,
  },
  filterCountBadge: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  filterCountBadgeText: {
    color: '#FFFFFF',
    fontSize: 5,
  },
  sourcePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
  },
  sourcePillText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
  },
  sortPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
  },
  sortPillText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
  },
  selectModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
  },
  selectModeBtnText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  resultsCountStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  resultsCountTitle: {
    fontSize: 14,
    fontFamily: FONTS.bold,
  },
  leadCardWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkboxItem: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  batchFloatingBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 8,
  },
  batchSelectAllBtn: {
    paddingVertical: 4,
  },
  batchCountText: {
    fontSize: 12.5,
    fontFamily: FONTS.semibold,
  },
  batchActionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  batchApplyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BORDER_RADIUS.md,
  },
  batchApplyBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: FONTS.bold,
  },
  batchSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: BORDER_RADIUS.md,
  },
  batchSaveBtnText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
  },
  filterSheetContent: {
    gap: 16,
    paddingVertical: SPACING.xs,
  },
  filterGroup: {
    gap: 8,
  },
  filterGroupTitle: {
    fontSize: 12,
    fontFamily: FONTS.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterSheetChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
  },
  filterSheetChipText: {
    fontSize: 12.5,
    fontFamily: FONTS.medium,
  },
  sheetToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  toggleTitle: {
    fontSize: 14,
    fontFamily: FONTS.semibold,
  },
  toggleSub: {
    fontSize: 12,
    marginTop: 2,
  },
  checkIndicator: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyFilterBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: BORDER_RADIUS.md,
    marginTop: 6,
  },
  applyFilterBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FONTS.bold,
  },
  exportSheetContent: {
    gap: 16,
    paddingVertical: SPACING.xs,
  },
  exportInfoText: {
    fontSize: 13,
    lineHeight: 18,
  },
  formatRow: {
    flexDirection: 'row',
    gap: 10,
  },
  formatCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    gap: 6,
  },
  formatCardText: {
    fontSize: 13,
    fontFamily: FONTS.bold,
  },
  exportActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: BORDER_RADIUS.md,
    gap: 8,
    marginTop: 4,
  },
  exportActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FONTS.bold,
  },
});
