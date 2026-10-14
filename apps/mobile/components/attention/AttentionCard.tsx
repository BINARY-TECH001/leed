import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { Card, Badge, Button } from '@/components/ui';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/theme';
import { Danger, ArrowRight2, Flash } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import type { AttentionItem } from '@prospect/types';

export interface AttentionCardProps {
  item: AttentionItem;
  onResolve?: (id: string) => void;
}

export const AttentionCard: React.FC<AttentionCardProps> = ({ item }) => {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const isUrgent = item.priority === 'urgent';
  const accentColor = isUrgent ? colors.error : colors.warning;

  const handleAction = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (item.actionType === 'approve_application') {
      router.push(`/composer/${item.relatedOpportunityId}` as any);
    } else {
      router.push(`/attention/${item.id}` as any);
    }
  };

  return (
    <Card
      variant="elevated"
      style={[
        styles.card,
        {
          borderRadius: BORDER_RADIUS.xl,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.badgeRow}>
          <Danger size={16} color={accentColor} variant="Bold" />
          <Badge
            label={item.priority.toUpperCase()}
            variant={isUrgent ? 'error' : 'warning'}
            size="sm"
          />
        </View>
        <Text style={[styles.timeAgo, { color: colors.textMuted }]}>Action Required</Text>
      </View>

      <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {item.subtitle}
      </Text>

      {item.contextSnippet ? (
        <View
          style={[
            styles.snippetBox,
            { backgroundColor: isDark ? colors.surfaceSecondary : '#F3F5F9' },
          ]}
        >
          <Text
            style={[styles.snippetText, { color: colors.textMuted }]}
            numberOfLines={2}
          >
            {item.contextSnippet}
          </Text>
        </View>
      ) : null}

      <Text style={[styles.promptText, { color: colors.text }]}>
        {item.actionablePrompt}
      </Text>

      <Button
        title={item.suggestedActionLabel}
        variant={isUrgent ? 'accent' : 'primary'}
        size="sm"
        rightIcon={<ArrowRight2 size={14} color="#FFF" />}
        onPress={handleAction}
        style={styles.actionBtn}
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeAgo: {
    fontSize: 11,
    fontFamily: FONTS.medium,
  },
  title: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    marginBottom: SPACING.sm,
  },
  snippetBox: {
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  snippetText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    fontStyle: 'italic',
  },
  promptText: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    lineHeight: 18,
    marginBottom: SPACING.md,
  },
  actionBtn: {
    alignSelf: 'flex-start',
  },
});
