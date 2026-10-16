import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { Badge, Button } from '@/components/ui';
import { RadarCard } from '@/components/radar/RadarCard';
import { SAMPLE_RADARS } from '@/constants/mockData';
import { radarService, sourceService } from '@/services';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/theme';
import {
  Add,
  Flash,
  DirectSend,
  Radar2,
  Clock,
  TickCircle,
  Filter,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import type { OpportunityRadar } from '@prospect/types';

const RADAR_TEMPLATES = [
  {
    title: 'High-Yield Mobile Contracts',
    prompt: 'Senior React Native / Expo 57 contracts paying > $120/hr in US/EMEA',
    category: 'contract' as const,
  },
  {
    title: 'Fintech AI Venture Deals',
    prompt: 'Fintech automation & financial ledger leads for seed to Series B',
    category: 'lead' as const,
  },
  {
    title: 'Founding Mobile Architect',
    prompt: 'Staff / Principal mobile engineering roles with significant equity',
    category: 'full-time' as const,
  },
];

export default function RadarScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();

  const [radars, setRadars] = useState<OpportunityRadar[]>(SAMPLE_RADARS);
  const [activeSourcesCount, setActiveSourcesCount] = useState<number>(8);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'paused' | 'contract'>('all');

  const loadData = async () => {
    try {
      const [radarsRes, sourcesRes] = await Promise.all([
        radarService.getRadars(),
        sourceService.getSources(),
      ]);
      if (radarsRes && radarsRes.length > 0) {
        setRadars(radarsRes);
      }
      if (sourcesRes && typeof sourcesRes.activeSources === 'number') {
        setActiveSourcesCount(sourcesRes.activeSources);
      }
    } catch {
      // Graceful fallback
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Filtered list
  const filteredRadars = useMemo(() => {
    return radars.filter((r) => {
      if (selectedFilter === 'active') return r.status === 'active';
      if (selectedFilter === 'paused') return r.status === 'paused';
      if (selectedFilter === 'contract') return r.category === 'contract';
      return true;
    });
  }, [radars, selectedFilter]);

  const totalMatches = useMemo(
    () => radars.reduce((sum, r) => sum + (r.totalFound || 0), 0),
    [radars]
  );
  const totalNewToday = useMemo(
    () => radars.reduce((sum, r) => sum + (r.newSinceLastCheck || 0), 0),
    [radars]
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Top Header Bar */}
      <View style={[styles.headerBar, { borderBottomColor: colors.borderSubtle }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.screenHeading, { color: colors.text }]}>Autonomous Radars</Text>
          <View style={styles.statusLivePill}>
            <View style={styles.greenPulseDot} />
            <Text style={[styles.statusLiveText, { color: colors.textMuted }]}>
              {activeSourcesCount} Portals Connected · 24/7 Scanning
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.deployBtn, { backgroundColor: colors.accent }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/radar/create');
          }}
          activeOpacity={0.85}
        >
          <Add size={16} color="#FFFFFF" variant="Linear" />
          <Text style={styles.deployBtnText}>Deploy</Text>
        </TouchableOpacity>
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
        {/* Modern Radar Pulse Executive Metric Strip */}
        <View
          style={[
            styles.pulseCard,
            {
              backgroundColor: isDark ? colors.card : '#FFFFFF',
              borderColor: colors.borderSubtle,
            },
          ]}
        >
          <View style={styles.kpiCol}>
            <Text style={[styles.kpiVal, { color: colors.text }]}>{radars.length}</Text>
            <View style={styles.kpiSubRow}>
              <Radar2 size={12} color={colors.accent} variant="Bold" />
              <Text style={[styles.kpiSub, { color: colors.textMuted }]}>Radars</Text>
            </View>
          </View>

          <View style={[styles.kpiDivider, { backgroundColor: colors.borderSubtle }]} />

          <View style={styles.kpiCol}>
            <Text style={[styles.kpiVal, { color: colors.text }]}>{totalMatches}</Text>
            <View style={styles.kpiSubRow}>
              <TickCircle size={12} color="#10B981" variant="Bold" />
              <Text style={[styles.kpiSub, { color: colors.textMuted }]}>Matches</Text>
            </View>
          </View>

          <View style={[styles.kpiDivider, { backgroundColor: colors.borderSubtle }]} />

          <View style={styles.kpiCol}>
            <Text style={[styles.kpiVal, { color: colors.accent }]}>+{totalNewToday}</Text>
            <View style={styles.kpiSubRow}>
              <Flash size={12} color={colors.accent} variant="Bold" />
              <Text style={[styles.kpiSub, { color: colors.textMuted }]}>New Today</Text>
            </View>
          </View>
        </View>

        {/* Quick Flow Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterPillsScroll}
        >
          {[
            { id: 'all', label: `All (${radars.length})` },
            { id: 'active', label: 'Active Scanning' },
            { id: 'paused', label: 'Paused' },
            { id: 'contract', label: 'Contracts Only' },
          ].map((item) => {
            const isSelected = selectedFilter === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.filterPill,
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
                  setSelectedFilter(item.id as any);
                }}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    {
                      color: isSelected ? '#FFFFFF' : colors.textSecondary,
                      fontFamily: isSelected ? FONTS.bold : FONTS.medium,
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Radar Cards Feed */}
        <View style={styles.radarsFeed}>
          {filteredRadars.map((radar) => (
            <RadarCard
              key={radar.id}
              radar={radar}
              onPress={() => router.push(`/radar/${radar.id}` as any)}
              onRunScan={async () => {
                setRadars((prev) =>
                  prev.map((r) =>
                    r.id === radar.id
                      ? {
                          ...r,
                          lastRunAt: new Date().toISOString(),
                          totalFound: r.totalFound + 2,
                          newSinceLastCheck: 2,
                        }
                      : r
                  )
                );
              }}
            />
          ))}
        </View>

        {/* Starter Flow Templates Section */}
        <View style={styles.templatesSection}>
          <Text style={[styles.templatesHeading, { color: colors.textSecondary }]}>
            Recommended Radars to Deploy
          </Text>

          <View style={styles.templatesList}>
            {RADAR_TEMPLATES.map((tmpl, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.templateCard,
                  {
                    backgroundColor: isDark ? colors.card : '#FFFFFF',
                    borderColor: colors.borderSubtle,
                  },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push({
                    pathname: '/radar/create',
                    params: { initialPrompt: tmpl.prompt },
                  } as any);
                }}
                activeOpacity={0.8}
              >
                <View style={styles.templateIconWrap}>
                  <Flash size={15} color={colors.accent} variant="Bold" />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.templateTitle, { color: colors.text }]} numberOfLines={1}>
                    {tmpl.title}
                  </Text>
                  <Text style={[styles.templatePrompt, { color: colors.textMuted }]} numberOfLines={1}>
                    {tmpl.prompt}
                  </Text>
                </View>

                <Text style={[styles.templateDeployText, { color: colors.accent }]}>+ Deploy</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
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
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flex: 1,
    gap: 3,
  },
  screenHeading: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    letterSpacing: -0.3,
  },
  statusLivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  greenPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  statusLiveText: {
    fontSize: 11,
    fontFamily: FONTS.regular,
  },
  deployBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BORDER_RADIUS.full,
  },
  deployBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontFamily: FONTS.bold,
  },
  scrollContent: {
    padding: SPACING.md,
    gap: 14,
  },
  pulseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  kpiCol: {
    alignItems: 'center',
    flex: 1,
  },
  kpiVal: {
    fontSize: 18,
    fontFamily: FONTS.bold,
  },
  kpiSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  kpiSub: {
    fontSize: 11,
    fontFamily: FONTS.medium,
  },
  kpiDivider: {
    width: 1,
    height: 24,
  },
  filterPillsScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  filterPill: {
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 12,
  },
  radarsFeed: {
    marginTop: 2,
  },
  templatesSection: {
    gap: 10,
    marginTop: 6,
  },
  templatesHeading: {
    fontSize: 12,
    fontFamily: FONTS.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  templatesList: {
    gap: 8,
  },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    gap: 10,
  },
  templateIconWrap: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 102, 0, 0.1)',
  },
  templateTitle: {
    fontSize: 13,
    fontFamily: FONTS.bold,
  },
  templatePrompt: {
    fontSize: 11.5,
    fontFamily: FONTS.regular,
    marginTop: 1,
  },
  templateDeployText: {
    fontSize: 12,
    fontFamily: FONTS.bold,
  },
});
