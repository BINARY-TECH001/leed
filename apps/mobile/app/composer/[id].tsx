import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { usePipeline } from '@/context/PipelineContext';
import { Button, Card, Badge, BottomSheet } from '@/components/ui';
import { SAMPLE_OPPORTUNITIES } from '@/constants/mockData';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/theme';
import {
  ArrowLeft2,
  Flash,
  Copy,
  Send2,
  TickCircle,
  Sms,
  DirectSend,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';

export default function ComposerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { applyToOpportunity } = usePipeline();

  const opp =
    SAMPLE_OPPORTUNITIES.find((o) => o.id === id) || SAMPLE_OPPORTUNITIES[0];

  const [channel, setChannel] = useState<'email' | 'linkedin' | 'followup'>('email');
  const [tone, setTone] = useState<'Executive' | 'Direct' | 'Technical'>('Executive');
  const [copied, setCopied] = useState(false);

  const [subject, setSubject] = useState(
    `Re: ${opp.title} — Mobile Architecture Alignment`
  );

  const [body, setBody] = useState(
    `Dear ${opp.contactPerson?.split(' ')[0] || 'Hiring Team'},\n\n` +
      `I noticed ${opp.organization}'s focus on high-reliability mobile infrastructure. Having led React Native and Expo Router production migrations with strict double-entry ledger audits, I wanted to reach out regarding the ${opp.title} position.\n\n` +
      `Specifically, my recent work focused on:\n` +
      `• Expo 57 and React 19 architecture with offline-first persistence\n` +
      `• Zero floating-point financial transactions and ACID ledger guarantees\n` +
      `• High-frequency event indexing and WebSocket sync pipelines\n\n` +
      `I would love to share a quick walkthrough of these architectures if relevant to your roadmap.\n\n` +
      `Best regards,\nAlex Rivers`
  );

  const [isSuccessSheetOpen, setIsSuccessSheetOpen] = useState(false);

  const handleCopy = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendOrSchedule = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    applyToOpportunity(opp, `Proposal dispatched via Composer (${tone} tone, ${channel.toUpperCase()})`);
    setIsSuccessSheetOpen(true);
  };

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

        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Proposal Composer</Text>
          <Text style={[styles.headerSub, { color: colors.textMuted }]}>{opp.organization}</Text>
        </View>

        <Badge label="15 Credits" variant="accent" size="sm" />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* Channel Segmented Pills */}
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Channel</Text>
            <View style={styles.channelRow}>
              {(['email', 'linkedin', 'followup'] as const).map((ch) => {
                const isSelected = channel === ch;
                return (
                  <TouchableOpacity
                    key={ch}
                    style={[
                      styles.channelChip,
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
                      setChannel(ch);
                    }}
                  >
                    <Text
                      style={[
                        styles.channelChipText,
                        {
                          color: isSelected ? '#FFFFFF' : colors.textSecondary,
                          fontFamily: isSelected ? FONTS.bold : FONTS.medium,
                        },
                      ]}
                    >
                      {ch.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Tone Selector */}
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Tone</Text>
            <View style={styles.toneRow}>
              {(['Executive', 'Direct', 'Technical'] as const).map((t) => {
                const isSelected = tone === t;
                return (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.toneChip,
                      {
                        backgroundColor: isSelected
                          ? isDark
                            ? colors.surfaceSecondary
                            : '#14213D'
                          : isDark
                          ? colors.card
                          : '#FFFFFF',
                        borderColor: isSelected ? colors.accent : colors.border,
                      },
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setTone(t);
                    }}
                  >
                    <Text
                      style={[
                        styles.toneChipText,
                        {
                          color: isSelected ? '#FFFFFF' : colors.textSecondary,
                          fontFamily: isSelected ? FONTS.bold : FONTS.medium,
                        },
                      ]}
                    >
                      {t}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Subject Line Input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Subject</Text>
            <TextInput
              style={[
                styles.subjectInput,
                {
                  backgroundColor: isDark ? colors.card : '#FFFFFF',
                  borderColor: colors.border,
                  color: colors.text,
                  fontFamily: FONTS.medium,
                },
              ]}
              value={subject}
              onChangeText={setSubject}
            />
          </View>

          {/* Proposal Body Editor */}
          <View style={styles.inputGroup}>
            <View style={styles.bodyHeaderRow}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Proposal Draft</Text>
              <TouchableOpacity
                onPress={handleCopy}
                style={styles.copyBtn}
                activeOpacity={0.7}
              >
                {copied ? (
                  <TickCircle size={15} color={colors.success} variant="Bold" />
                ) : (
                  <Copy size={15} color={colors.accent} variant="Linear" />
                )}
                <Text
                  style={[
                    styles.copyBtnText,
                    { color: copied ? colors.success : colors.accent },
                  ]}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={[
                styles.bodyInput,
                {
                  backgroundColor: isDark ? colors.card : '#FFFFFF',
                  borderColor: colors.border,
                  color: colors.text,
                  fontFamily: FONTS.regular,
                },
              ]}
              multiline
              numberOfLines={10}
              value={body}
              onChangeText={setBody}
              textAlignVertical="top"
            />
          </View>
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
            title="Save & Queue Outreach"
            variant="accent"
            size="lg"
            rightIcon={<DirectSend size={18} color="#FFFFFF" variant="Bold" />}
            onPress={handleSendOrSchedule}
            style={styles.ctaButton}
          />
        </View>
      </KeyboardAvoidingView>

      <BottomSheet
        visible={isSuccessSheetOpen}
        onClose={() => {
          setIsSuccessSheetOpen(false);
          router.back();
        }}
        title="Outreach Draft Queued"
        subtitle="15 AI Credits deducted from balance."
        icon={
          <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: colors.accent + '20', alignItems: 'center', justifyContent: 'center' }}>
            <DirectSend size={20} color={colors.accent} variant="Bold" />
          </View>
        }
      >
        <View style={{ paddingVertical: SPACING.sm }}>
          <Text style={{ color: colors.textSecondary, fontSize: 13.5, lineHeight: 20, marginBottom: SPACING.lg }}>
            Your proposal for {opp.organization} has been packaged and queued in your pipeline with automated follow-up trackers.
          </Text>
          <Button
            title="Done"
            variant="accent"
            size="md"
            onPress={() => {
              setIsSuccessSheetOpen(false);
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
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
  headerSub: {
    fontSize: 12,
    fontFamily: FONTS.medium,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: 110,
  },
  sectionRow: {
    marginBottom: SPACING.md,
  },
  sectionLabel: {
    fontSize: 12.5,
    fontFamily: FONTS.semibold,
    marginBottom: 6,
  },
  channelRow: {
    flexDirection: 'row',
    gap: 8,
  },
  channelChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelChipText: {
    fontSize: 12,
  },
  toneRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toneChip: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toneChipText: {
    fontSize: 12.5,
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  inputLabel: {
    fontSize: 12.5,
    fontFamily: FONTS.semibold,
    marginBottom: 6,
  },
  subjectInput: {
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  bodyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  copyBtnText: {
    fontSize: 12.5,
    fontFamily: FONTS.bold,
  },
  bodyInput: {
    minHeight: 220,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    padding: 14,
    fontSize: 14,
    lineHeight: 22,
  },
  bottomActionBar: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
  },
  ctaButton: {
    width: '100%',
  },
});
