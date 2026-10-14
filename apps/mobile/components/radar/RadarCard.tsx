import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Card, Badge, Button } from '@/components/ui';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/theme';
import { Radar2, Play, Timer1, ArrowRight2, Setting2 } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import type { OpportunityRadar } from '@prospect/types';

export interface RadarCardProps {
  radar: OpportunityRadar;
  onPress?: () => void;
  onRunScan?: (id: string) => Promise<void>;
}

export const RadarCard: React.FC<RadarCardProps> = ({ radar, onPress, onRunScan }) => {
  const { colors, isDark } = useTheme();
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = async (e?: any) => {
    e?.stopPropagation?.();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsRunning(true);
    if (onRunScan) {
      await onRunScan(radar.id);
    } else {
      await new Promise((res) => setTimeout(res, 1200));
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
        <View style={styles.headerRow}>
          <View style={styles.titleArea}>
            <View
              style={[
                styles.radarIcon,
                { backgroundColor: radar.status === 'active' ? 'rgba(255, 102, 0, 0.12)' : 'rgba(148, 163, 184, 0.15)' },
              ]}
            >
              <Radar2
                size={20}
                color={radar.status === 'active' ? colors.accent : colors.textMuted}
                variant="Bold"
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                {radar.title}
              </Text>
              <View style={styles.scheduleRow}>
                <Timer1 size={12} color={colors.textMuted} variant="Linear" />
                <Text style={[styles.schedule, { color: colors.textMuted }]}>
                  {radar.scheduleDescription}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.headerRightBadges}>
            <Badge
              label={radar.status.toUpperCase()}
              variant={radar.status === 'active' ? 'success' : 'neutral'}
              size="sm"
              dot
            />
            {onPress && (
              <View style={styles.chevronWrap}>
                <ArrowRight2 size={14} color={colors.textMuted} />
              </View>
            )}
          </View>
        </View>

        <Text
          style={[styles.promptText, { color: colors.textSecondary }]}
          numberOfLines={2}
        >
          "{radar.prompt}"
        </Text>

        <View style={[styles.statsRow, { borderTopColor: colors.borderSubtle }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {radar.totalFound}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>
              Qualified Matches
            </Text>
          </View>

          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.accent }]}>
              +{radar.newSinceLastCheck}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>
              New Today
            </Text>
          </View>

          <View style={styles.actionsRightRow}>
            <Button
              title={isRunning ? 'Scanning…' : 'Scan'}
              size="sm"
              variant="outline"
              isLoading={isRunning}
              leftIcon={!isRunning ? <Play size={12} color={colors.accent} variant="Bold" /> : undefined}
              onPress={handleRun}
              style={styles.scanBtn}
            />
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  titleArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
    marginRight: SPACING.xs,
  },
  radarIcon: {
    width: 38,
    height: 38,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    letterSpacing: -0.2,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  schedule: {
    fontSize: 11.5,
    fontFamily: FONTS.regular,
  },
  headerRightBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chevronWrap: {
    paddingLeft: 2,
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
    paddingTop: SPACING.sm + 2,
    borderTopWidth: 1,
  },
  statItem: {
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
  actionsRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scanBtn: {
    minWidth: 80,
  },
});
