import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/theme';
import {
  Filter,
  TickSquare,
  DollarCircle,
  Global,
  MagicStar,
  RotateLeft,
  TickCircle,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import type { OpportunityType } from '@prospect/types';

export interface DiscoveriesFilterState {
  type: OpportunityType | 'all' | 'high_fit';
  remoteOnly: boolean;
  minCompRate: number;
  source: string;
  sortBy: 'match' | 'comp' | 'newest';
}

export interface DiscoveriesFilterBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  filters: DiscoveriesFilterState;
  onChangeFilters: (newFilters: DiscoveriesFilterState) => void;
  totalMatchesCount?: number;
  availableSources?: string[];
}

export const DiscoveriesFilterBottomSheet: React.FC<DiscoveriesFilterBottomSheetProps> = ({
  visible,
  onClose,
  filters,
  onChangeFilters,
  totalMatchesCount,
  availableSources = ['Verified Partner Index', 'LinkedIn Jobs', 'Y Combinator', 'Upwork'],
}) => {
  const { colors, isDark } = useTheme();

  const handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChangeFilters({
      type: 'all',
      remoteOnly: false,
      minCompRate: 0,
      source: 'all',
      sortBy: 'match',
    });
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Filter Discoveries"
      subtitle="Calibrate match scoring, verified portals, and rates"
      icon={<Filter size={22} color={colors.accent} variant="Bold" />}
    >
      <View style={styles.container}>
        {/* Reset Top Bar */}
        <View style={styles.resetRow}>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Active Filters
          </Text>
          <TouchableOpacity onPress={handleReset} style={styles.resetBtn}>
            <RotateLeft size={13} color={colors.accent} />
            <Text style={[styles.resetText, { color: colors.accent }]}>Reset All</Text>
          </TouchableOpacity>
        </View>

        {/* 1. Opportunity Type / Category */}
        <View style={styles.filterSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Opportunity Category</Text>
          <View style={styles.chipsWrap}>
            {[
              { id: 'all', label: 'All Opportunities' },
              { id: 'contract', label: 'Contracts' },
              { id: 'job', label: 'Full-time' },
              { id: 'freelance', label: 'Freelance' },
              { id: 'lead', label: 'B2B Client Leads' },
              { id: 'high_fit', label: '⭐ 90%+ Match' },
            ].map((item) => {
              const isSelected = filters.type === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.chip,
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
                    onChangeFilters({ ...filters, type: item.id as any });
                  }}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color: isSelected ? '#FFFFFF' : colors.text,
                        fontFamily: isSelected ? FONTS.bold : FONTS.medium,
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 2. Remote Work Toggle */}
        <TouchableOpacity
          style={[
            styles.toggleRow,
            {
              backgroundColor: isDark ? colors.card : '#FFFFFF',
              borderColor: filters.remoteOnly ? colors.accent : colors.border,
            },
          ]}
          onPress={() => {
            Haptics.selectionAsync();
            onChangeFilters({ ...filters, remoteOnly: !filters.remoteOnly });
          }}
          activeOpacity={0.8}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.toggleTitle, { color: colors.text }]}>100% Remote Positions</Text>
            <Text style={[styles.toggleSubtitle, { color: colors.textMuted }]}>
              Exclude in-person and hybrid commitments
            </Text>
          </View>

          <View
            style={[
              styles.checkboxBox,
              {
                backgroundColor: filters.remoteOnly ? colors.accent : 'transparent',
                borderColor: filters.remoteOnly ? colors.accent : colors.border,
              },
            ]}
          >
            {filters.remoteOnly && <TickCircle size={16} color="#FFFFFF" variant="Bold" />}
          </View>
        </TouchableOpacity>

        {/* 3. Minimum Rate Floor */}
        <View style={styles.filterSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Minimum Rate Floor</Text>
          <View style={styles.chipsWrap}>
            {[
              { label: 'Any Rate', val: 0 },
              { label: '≥ $80/hr', val: 80 },
              { label: '≥ $100/hr', val: 100 },
              { label: '≥ $120/hr', val: 120 },
              { label: '≥ $140/hr', val: 140 },
            ].map((item) => {
              const isSelected = filters.minCompRate === item.val;
              return (
                <TouchableOpacity
                  key={item.val}
                  style={[
                    styles.chip,
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
                    onChangeFilters({ ...filters, minCompRate: item.val });
                  }}
                  activeOpacity={0.75}
                >
                  <DollarCircle
                    size={13}
                    color={isSelected ? '#FFFFFF' : colors.accent}
                    variant={isSelected ? 'Bold' : 'Linear'}
                  />
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color: isSelected ? '#FFFFFF' : colors.text,
                        fontFamily: isSelected ? FONTS.bold : FONTS.medium,
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 4. Portal Source Tracking */}
        <View style={styles.filterSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Verified Source Portal</Text>
          <View style={styles.chipsWrap}>
            <TouchableOpacity
              style={[
                styles.chip,
                {
                  backgroundColor: filters.source === 'all'
                    ? colors.accent
                    : isDark
                    ? colors.card
                    : '#FFFFFF',
                  borderColor: filters.source === 'all' ? colors.accent : colors.border,
                },
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                onChangeFilters({ ...filters, source: 'all' });
              }}
            >
              <Global
                size={13}
                color={filters.source === 'all' ? '#FFFFFF' : colors.accent}
                variant="Bold"
              />
              <Text
                style={[
                  styles.chipText,
                  {
                    color: filters.source === 'all' ? '#FFFFFF' : colors.text,
                    fontFamily: filters.source === 'all' ? FONTS.bold : FONTS.medium,
                  },
                ]}
              >
                All Portals
              </Text>
            </TouchableOpacity>

            {availableSources.map((s) => {
              const isSelected = filters.source === s;
              return (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.chip,
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
                    onChangeFilters({ ...filters, source: s });
                  }}
                >
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color: isSelected ? '#FFFFFF' : colors.text,
                        fontFamily: isSelected ? FONTS.bold : FONTS.medium,
                      },
                    ]}
                  >
                    {s}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 5. Sort Ordering */}
        <View style={styles.filterSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Sort Results By</Text>
          <View style={styles.chipsWrap}>
            {[
              { id: 'match', label: 'Best Match Score' },
              { id: 'comp', label: 'Highest Compensation' },
              { id: 'newest', label: 'Newest First' },
            ].map((item) => {
              const isSelected = filters.sortBy === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.chip,
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
                    onChangeFilters({ ...filters, sortBy: item.id as any });
                  }}
                >
                  <MagicStar
                    size={13}
                    color={isSelected ? '#FFFFFF' : colors.accent}
                    variant={isSelected ? 'Bold' : 'Linear'}
                  />
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color: isSelected ? '#FFFFFF' : colors.text,
                        fontFamily: isSelected ? FONTS.bold : FONTS.medium,
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Done / Apply Button */}
        <TouchableOpacity
          style={[styles.applyBtn, { backgroundColor: colors.accent }]}
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onClose();
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.applyBtnText}>
            {totalMatchesCount !== undefined
              ? `Show ${totalMatchesCount} Discoveries`
              : 'Apply Filters'}
          </Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.xs,
    gap: 16,
  },
  resetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionSubtitle: {
    fontSize: 12,
    fontFamily: FONTS.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
  },
  resetText: {
    fontSize: 12,
    fontFamily: FONTS.semibold,
  },
  filterSection: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13.5,
    fontFamily: FONTS.bold,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.2,
  },
  toggleTitle: {
    fontSize: 13.5,
    fontFamily: FONTS.bold,
  },
  toggleSubtitle: {
    fontSize: 11.5,
    marginTop: 2,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: BORDER_RADIUS.md,
    marginTop: 4,
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FONTS.bold,
  },
});
