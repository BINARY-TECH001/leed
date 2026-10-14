import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { Button, Card, Badge, BottomSheet } from '@/components/ui';
import { SAMPLE_ATTENTION_ITEMS } from '@/constants/mockData';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/theme';
import {
  ArrowLeft2,
  Danger,
  TickCircle,
  Timer1,
  Flash,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';

export default function AttentionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const item =
    SAMPLE_ATTENTION_ITEMS.find((a) => a.id === id) || SAMPLE_ATTENTION_ITEMS[0];

  const [sheetType, setSheetType] = useState<'resolved' | 'snoozed' | null>(null);

  const handleResolve = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSheetType('resolved');
  };

  const handleSnooze = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSheetType('snoozed');
  };

  const isUrgent = item.priority === 'urgent';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Top Header Bar */}
      <View style={[styles.topBar, { borderBottomColor: colors.borderSubtle }]}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA' }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft2 size={20} color={colors.text} variant="Linear" />
        </TouchableOpacity>

        <View style={styles.topBarTitleRow}>
          <Danger size={18} color={isUrgent ? colors.error : colors.warning} variant="Bold" />
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            Attention Review
          </Text>
        </View>

        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Priority Badge */}
        <View style={styles.badgeRow}>
          <Badge
            label={item.priority.toUpperCase()}
            variant={isUrgent ? 'error' : 'warning'}
            size="md"
            dot
          />
          <Badge
            label={item.actionType.replace('_', ' ').toUpperCase()}
            variant="neutral"
            size="md"
          />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {item.subtitle}
        </Text>

        {/* Action Prompt Card */}
        <Card variant="elevated" style={styles.promptCard}>
          <View style={styles.promptHeader}>
            <Flash size={18} color={colors.accent} variant="Bold" />
            <Text style={[styles.promptTitle, { color: colors.text }]}>
              Recommended Autonomous Action
            </Text>
          </View>

          <Text style={[styles.promptText, { color: colors.textSecondary }]}>
            {item.actionablePrompt}
          </Text>
        </Card>

        {/* Context Snippet */}
        {item.contextSnippet && (
          <View style={styles.contextGroup}>
            <Text style={[styles.contextLabel, { color: colors.textMuted }]}>
              Context & Reason
            </Text>
            <View
              style={[
                styles.contextBox,
                {
                  backgroundColor: isDark ? colors.card : '#FFFFFF',
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.contextText, { color: colors.text }]}>
                {item.contextSnippet}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Pinned Bottom CTA Action Bar */}
      <View
        style={[
          styles.bottomActionBar,
          {
            backgroundColor: isDark ? colors.surface : '#FFFFFF',
            borderTopColor: colors.borderSubtle,
          },
        ]}
      >
        <Button
          title="Snooze 24h"
          variant="outline"
          size="lg"
          leftIcon={<Timer1 size={18} color={colors.textSecondary} variant="Linear" />}
          onPress={handleSnooze}
          style={{ flex: 1 }}
        />
        <Button
          title={item.suggestedActionLabel}
          variant="accent"
          size="lg"
          rightIcon={<TickCircle size={18} color="#FFFFFF" variant="Bold" />}
          onPress={handleResolve}
          style={{ flex: 1.5 }}
        />
      </View>

      {/* Responsive Resolution Bottom Sheet */}
      <BottomSheet
        visible={sheetType !== null}
        onClose={() => {
          setSheetType(null);
          router.back();
        }}
        title={sheetType === 'resolved' ? 'Action Executed' : 'Item Snoozed'}
        subtitle={
          sheetType === 'resolved'
            ? 'Opportunity pipeline updated successfully.'
            : 'We will remind you again in 24 hours.'
        }
        icon={
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: (sheetType === 'resolved' ? colors.success : colors.warning) + '20',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {sheetType === 'resolved' ? (
              <TickCircle size={20} color={colors.success} variant="Bold" />
            ) : (
              <Timer1 size={20} color={colors.warning} variant="Bold" />
            )}
          </View>
        }
      >
        <View style={{ paddingVertical: SPACING.sm }}>
          <Text style={{ color: colors.textSecondary, fontSize: 13.5, lineHeight: 20, marginBottom: SPACING.lg }}>
            {sheetType === 'resolved'
              ? 'Your response was processed and logged in your career ledger.'
              : 'This attention item has been temporarily hidden from your active stream.'}
          </Text>
          <Button
            title="Done"
            variant="accent"
            size="md"
            onPress={() => {
              setSheetType(null);
              router.back();
            }}
          />
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: 110,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14.5,
    fontFamily: FONTS.medium,
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  promptCard: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.lg,
  },
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACING.sm,
  },
  promptTitle: {
    fontSize: 15.5,
    fontFamily: FONTS.bold,
  },
  promptText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    lineHeight: 20,
  },
  contextGroup: {
    marginBottom: SPACING.xl,
  },
  contextLabel: {
    fontSize: 12.5,
    fontFamily: FONTS.semibold,
    marginBottom: 6,
  },
  contextBox: {
    padding: 14,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  contextText: {
    fontSize: 13.5,
    fontFamily: FONTS.regular,
    lineHeight: 20,
  },
  bottomActionBar: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
  },
});
