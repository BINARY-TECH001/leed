import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { Badge } from '@/components/ui';
import { RadarCard } from '@/components/radar/RadarCard';
import { SAMPLE_RADARS } from '@/constants/mockData';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/theme';
import {
  Add,
  Flash,
  DirectSend,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import type { OpportunityRadar } from '@prospect/types';

export default function RadarScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const [radars, setRadars] = useState<OpportunityRadar[]>(SAMPLE_RADARS);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((res) => setTimeout(res, 600));
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Clean, minimalist header — NO heavy title at top */}
      <View style={[styles.headerBar, { borderBottomColor: colors.borderSubtle }]}>
        <View style={styles.streamStatusPill}>
          <View style={styles.greenLiveDot} />
          <Text style={[styles.streamStatusText, { color: colors.textSecondary }]}>
            124 active crawlers
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.newRadarBtn, { backgroundColor: colors.accent }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/radar/create');
          }}
          activeOpacity={0.85}
        >
          <Add size={16} color="#FFFFFF" variant="Linear" />
          <Text style={styles.newRadarBtnText}>New Radar</Text>
        </TouchableOpacity>
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
        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Active Radars ({radars.length})
          </Text>
          <Badge label="Autonomous" variant="success" size="sm" dot />
        </View>

        {/* Clean Radar Cards List - Each taps into full page /radar/[id] */}
        {radars.map((radar) => (
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

        {/* Quiet footer tip */}
        <View style={[styles.footerInfoBox, { borderColor: colors.borderSubtle }]}>
          <Text style={[styles.footerInfoText, { color: colors.textMuted }]}>
            Radars poll verified repositories, dealflows, and career endpoints continuously. Tap any radar to review matches or configure automation.
          </Text>
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
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.sm + 2,
    borderBottomWidth: 1,
  },
  streamStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  greenLiveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
  },
  streamStatusText: {
    fontSize: 12.5,
    fontFamily: FONTS.medium,
  },
  newRadarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BORDER_RADIUS.full,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  newRadarBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: FONTS.bold,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: 130, // Space so content scrolls seamlessly underneath floating tab bar
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: FONTS.bold,
    letterSpacing: -0.2,
  },
  footerInfoBox: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  footerInfoText: {
    fontSize: 11.5,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 17,
  },
});
