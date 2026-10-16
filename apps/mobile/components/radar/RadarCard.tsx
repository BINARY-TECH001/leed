import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Card, Badge } from '@/components/ui';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/theme';
import {
  Radar2,
  Play,
  Timer1,
  ArrowRight2,
  Setting2,
  Flash,
  Clock,
  Briefcase,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import type { OpportunityRadar } from '@prospect/types';

export interface RadarCardProps {
  radar: OpportunityRadar;
  onPress?: () => void;
  onRunScan?: (id: string) => Promise<void>;
  onToggleStatus?: (id: string) => void;
}

const CATEGORY_COLORS: Record<string, { color: string; bg: string }> = {
  contract: { color: '#FF6600', bg: 'rgba(255, 102, 0, 0.1)' },
  'full-time': { color: '#0052FF', bg: 'rgba(0, 82, 255, 0.1)' },
  lead: { color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' },
  grant: { color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)' },
};

export const RadarCard: React.FC<RadarCardProps> = ({
  radar,
  onPress,
  onRunScan,
  onToggleStatus,
}) => {
  const { colors, isDark } = useTheme();
  const [isRunning, setIsRunning] = useState(false);

  const isActive = radar.status === 'active';
  const catTheme = (radar.category && CATEGORY_COLORS[radar.category]) || {
    color: colors.accent,
    bg: 'rgba(255, 102, 0, 0.1)',
  };

  const handleRun = async (e?: any) => {
    e?.stopPropagation?.();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsRunning(true);
    if (onRunScan) {
      await onRunScan(radar.id);
    } else {
      await new Promise((res) => setTimeout(res, 1000));
    }
    setIsRunning(false);
  };

  const handleCardPress = () => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.88 : 1}
      onPress={handleCardPress}
      style={{ marginBottom: SPACING.md }}
    >
      <Card variant="elevated" style={styles.card}>
        {/* Top Header Row */}
        <View style={styles.topRow}>
          <View style={styles.titleArea}>
            <View
              style={[
                styles.radarIcon,
                {
                  backgroundColor: isActive
                    ? 'rgba(255, 102, 0, 0.12)'
                    : 'rgba(148, 163, 184, 0.15)',
                },
              ]}
            >
              <Radar2
                size={20}
                color={isActive ? colors.accent : colors.textMuted}
                variant="Bold"
              />
            </View>

            <View style={{ flex: 1 }}>
              <View style={styles.nameCategoryRow}>
                <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                  {radar.title}
                </Text>
              </View>

              <View style={styles.scheduleRow}>
                <Clock size={11} color={colors.textMuted} variant="Linear" />
                <Text style={[styles.scheduleText, { color: colors.textMuted }]}>
                  {radar.scheduleDescription || `Runs ${radar.frequency}`}
                </Text>
              </View>
            </View>
          </View>

          {/* Category Badge & Status */}
          <View style={styles.headerRightWrap}>
            {radar.category && (
              <View style={[styles.categoryBadge, { backgroundColor: catTheme.bg }]}>
                <Text style={[styles.categoryBadgeText, { color: catTheme.color }]}>
                  {radar.category.toUpperCase()}
                </Text>
              </View>
            )}

            <View
              style={[
                styles.statusIndicator,
                { backgroundColor: isActive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(148, 163, 184, 0.15)' },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isActive ? '#10B981' : colors.textMuted },
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  { color: isActive ? '#10B981' : colors.textMuted },
                ]}
              >
                {isActive ? 'ACTIVE' : 'PAUSED'}
              </Text>
            </View>
          </View>
        </View>

        {/* Search Query Prompt */}
        <Text
          style={[styles.promptText, { color: colors.textSecondary }]}
          numberOfLines={2}
        >
          "{radar.prompt}"
        </Text>

        {/* Stats & Actions Footer */}
        <View style={[styles.statsRow, { borderTopColor: colors.borderSubtle }]}>
          <View style={styles.statGroup}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {radar.totalFound}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>
              Matches Found
            </Text>
          </View>

          <View style={styles.statGroup}>
            <Text style={[styles.statValue, { color: colors.accent }]}>
              +{radar.newSinceLastCheck}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>
              New Today
            </Text>
          </View>

          {/* Quick Scan Button */}
          <TouchableOpacity
            style={[
              styles.scanBtn,
              {
                backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA',
                borderColor: colors.borderSubtle,
              },
            ]}
            onPress={handleRun}
            disabled={isRunning}
            activeOpacity={0.75}
          >
            {isRunning ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <>
                <Play size={12} color={colors.accent} variant="Bold" />
                <Text style={[styles.scanBtnText, { color: colors.text }]}>Scan Now</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  titleArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  radarIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 15,
    fontFamily: FONTS.bold,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  scheduleText: {
    fontSize: 11,
    fontFamily: FONTS.regular,
  },
  headerRightWrap: {
    alignItems: 'flex-end',
    gap: 4,
  },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: BORDER_RADIUS.xs,
  },
  categoryBadgeText: {
    fontSize: 9.5,
    fontFamily: FONTS.bold,
    letterSpacing: 0.5,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusText: {
    fontSize: 9.5,
    fontFamily: FONTS.bold,
    letterSpacing: 0.5,
  },
  promptText: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    fontStyle: 'italic',
    lineHeight: 18,
    marginBottom: SPACING.md,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  statGroup: {
    alignItems: 'flex-start',
  },
  statValue: {
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: FONTS.regular,
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  scanBtnText: {
    fontSize: 12,
    fontFamily: FONTS.semibold,
  },
});
