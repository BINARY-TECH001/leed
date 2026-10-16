import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Linking,
  Share as RNShare,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { usePipeline } from '@/context/PipelineContext';
import { Badge, Button, BottomSheet } from '@/components/ui';
import { SAMPLE_OPPORTUNITIES } from '@/constants/mockData';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/theme';
import {
  ArrowLeft2,
  Flash,
  Copy,
  DirectSend,
  TickCircle,
  Sms,
  Buildings,
  DollarCircle,
  MagicStar,
  Refresh,
  MessageQuestion,
  Global,
  Clock,
  Share,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import type { Opportunity } from '@prospect/types';

const CHANNELS = [
  { id: 'email', label: 'Email Outreach', icon: Sms, desc: 'Direct recruiting inbox' },
  { id: 'linkedin', label: 'LinkedIn InMail', icon: Global, desc: 'Connection pitch & note' },
  { id: 'followup', label: 'Follow-Up Ping', icon: Clock, desc: 'Polite status check' },
] as const;

const TONES = [
  { id: 'Executive', label: 'Executive', icon: '🎯', desc: 'Strategic ROI & architecture impact' },
  { id: 'Direct', label: 'Direct', icon: '⚡', desc: 'Concise, immediate deliverables' },
  { id: 'Technical', label: 'Technical', icon: '🛠️', desc: 'Deep stack overlap & benchmarks' },
  { id: 'Warm', label: 'Warm', icon: '✨', desc: 'Relationship-first & mission alignment' },
] as const;

export default function ComposerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { applyToOpportunity, isApplied } = usePipeline();
  const { width } = useWindowDimensions();

  const opp: Opportunity =
    SAMPLE_OPPORTUNITIES.find((o) => o.id === id) || SAMPLE_OPPORTUNITIES[0];

  const [channel, setChannel] = useState<'email' | 'linkedin' | 'followup'>('email');
  const [tone, setTone] = useState<'Executive' | 'Direct' | 'Technical' | 'Warm'>('Executive');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isQueuedSheetOpen, setIsQueuedSheetOpen] = useState(false);

  const contactName = opp.contactPerson ? opp.contactPerson.split(' ')[0] : 'Hiring Lead';
  const recipientEmail =
    opp.contactEmail || `recruiting@${opp.organization.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;

  // Dynamic pitch generation based on tone and channel
  const generatedPitch = useMemo(() => {
    const sender = user?.name || 'Alex Rivers';
    const topSkills = opp.tags.slice(0, 3).join(', ');

    if (channel === 'followup') {
      return (
        `Hi ${contactName},\n\n` +
        `Following up on my previous note regarding the ${opp.title} initiative at ${opp.organization}.\n\n` +
        `Given your current focus on high-reliability execution, I would welcome 10 minutes this week to discuss how my track record in ${topSkills} can de-risk your deployment milestones.\n\n` +
        `Best regards,\n${sender}`
      );
    }

    if (channel === 'linkedin') {
      return (
        `Hi ${contactName} — Saw ${opp.organization}'s focus on ${opp.title}. ` +
        `My background centers on ${topSkills} with zero-regression delivery. ` +
        `Would love to connect and share a 2-minute architectural teardown if you're exploring advisory or contract leadership!\n\n` +
        `Best,\n${sender}`
      );
    }

    switch (tone) {
      case 'Direct':
        return (
          `Hi ${contactName},\n\n` +
          `Reaching out regarding the ${opp.title} position at ${opp.organization}.\n\n` +
          `I deliver immediate production-grade outputs in ${topSkills} with zero onboarding friction. My track record includes architecting financial data persistence, sub-50ms render profiling, and automated test harnesses.\n\n` +
          `Are you open to a 10-minute introductory call this Wednesday?\n\n` +
          `Best,\n${sender}`
        );
      case 'Technical':
        return (
          `Hello ${contactName},\n\n` +
          `I analyzed the technical specifications for ${opp.title} at ${opp.organization}. My stack directly intersects with your core requirements:\n` +
          `• Production architecture using ${topSkills}\n` +
          `• Offline-first synchronization, ACID state invariants, and memory leak mitigation\n` +
          `• Native module bridging and deterministic transaction pipelines\n\n` +
          `I would welcome an architectural discussion with your technical leadership team.\n\n` +
          `Best regards,\n${sender}`
        );
      case 'Warm':
        return (
          `Hi ${contactName},\n\n` +
          `I've been following ${opp.organization}'s product momentum with great admiration. When I saw the ${opp.title} opening, it immediately resonated with my passions in ${topSkills}.\n\n` +
          `Having delivered similar solutions in high-velocity environments, I'd love to learn more about the team's upcoming challenges and explore how my experience can support your mission.\n\n` +
          `Warm regards,\n${sender}`
        );
      case 'Executive':
      default:
        return (
          `Dear ${contactName},\n\n` +
          `I noticed ${opp.organization}'s strategic focus on scaling the ${opp.title} initiative.\n\n` +
          `Having led high-reliability deployments with ${topSkills}, I offer proven technical leadership that accelerates product delivery while safeguarding data integrity and performance standards.\n\n` +
          `I would be delighted to explore how my background aligns with your roadmap objectives for this quarter.\n\n` +
          `Best regards,\n${sender}`
        );
    }
  }, [channel, tone, opp, contactName, user]);

  const [subject, setSubject] = useState(
    `Re: ${opp.title} — Technical Alignment (${opp.organization})`
  );
  const [body, setBody] = useState(generatedPitch);

  // Update body when tone/channel changes if user hasn't heavily customized
  const handleSelectTone = (newTone: typeof TONES[number]['id']) => {
    Haptics.selectionAsync();
    setTone(newTone);
    setIsGenerating(true);
    setTimeout(() => {
      setBody(generatedPitch);
      setIsGenerating(false);
    }, 250);
  };

  const handleSelectChannel = (newChannel: typeof CHANNELS[number]['id']) => {
    Haptics.selectionAsync();
    setChannel(newChannel);
    setIsGenerating(true);
    setTimeout(() => {
      setBody(generatedPitch);
      setIsGenerating(false);
    }, 250);
  };

  const handleCopy = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeMail = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const mailUrl = `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    Linking.openURL(mailUrl).catch(() => {
      handleCopy();
    });
  };

  const handleQueueOutreach = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    applyToOpportunity(opp, `Proposal generated (${tone} tone, ${channel.toUpperCase()})`);
    setIsQueuedSheetOpen(true);
  };

  const wordCount = body.trim().split(/\s+/).filter(Boolean).length;
  const readTimeSeconds = Math.max(15, Math.round((wordCount / 200) * 60));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Top Header */}
      <View style={[styles.headerBar, { borderBottomColor: colors.borderSubtle }]}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA' }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft2 size={20} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={[styles.screenTitle, { color: colors.text }]}>AI Pitch Composer</Text>
          <Text style={[styles.screenSub, { color: colors.textMuted }]} numberOfLines={1}>
            {opp.title}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.actionIconBtn, { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA' }]}
          onPress={handleCopy}
          activeOpacity={0.7}
        >
          {copied ? (
            <TickCircle size={18} color={colors.success} variant="Bold" />
          ) : (
            <Copy size={18} color={colors.accent} variant="Linear" />
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 24) + 85 },
          ]}
        >
          {/* Opportunity Snippet Header Card */}
          <View
            style={[
              styles.oppContextCard,
              {
                backgroundColor: isDark ? colors.card : '#FFFFFF',
                borderColor: colors.borderSubtle,
              },
            ]}
          >
            <View style={styles.oppTopRow}>
              <View style={[styles.orgAvatar, { backgroundColor: colors.accent + '15' }]}>
                <Buildings size={22} color={colors.accent} variant="Bold" />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.orgName, { color: colors.textSecondary }]} numberOfLines={1}>
                  {opp.organization}
                </Text>
                <Text style={[styles.oppTitle, { color: colors.text }]} numberOfLines={1}>
                  {opp.title}
                </Text>
              </View>

              <Badge
                label={`${opp.matchScore}% Match`}
                variant={opp.matchScore >= 90 ? 'success' : 'accent'}
                size="sm"
                dot
              />
            </View>

            <View style={[styles.oppMetaBar, { borderTopColor: colors.borderSubtle }]}>
              <View style={styles.metaChip}>
                <DollarCircle size={13} color={colors.accent} variant="Bold" />
                <Text style={[styles.metaChipText, { color: colors.text }]}>{opp.compensation}</Text>
              </View>

              <View style={styles.metaChip}>
                <Sms size={13} color={colors.textSecondary} variant="Linear" />
                <Text style={[styles.metaChipText, { color: colors.textSecondary }]}>
                  {recipientEmail}
                </Text>
              </View>
            </View>
          </View>

          {/* Section 1: Outreach Channel Selector */}
          <View style={styles.sectionBlock}>
            <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
              Outreach Channel
            </Text>

            <View style={styles.channelsGrid}>
              {CHANNELS.map((ch) => {
                const isSelected = channel === ch.id;
                const IconComponent = ch.icon;
                return (
                  <TouchableOpacity
                    key={ch.id}
                    style={[
                      styles.channelCard,
                      {
                        backgroundColor: isSelected
                          ? isDark
                            ? 'rgba(255, 102, 0, 0.12)'
                            : '#FFF6F0'
                          : isDark
                          ? colors.card
                          : '#FFFFFF',
                        borderColor: isSelected ? colors.accent : colors.border,
                      },
                    ]}
                    onPress={() => handleSelectChannel(ch.id)}
                    activeOpacity={0.8}
                  >
                    <IconComponent
                      size={18}
                      color={isSelected ? colors.accent : colors.textMuted}
                      variant={isSelected ? 'Bold' : 'Linear'}
                    />
                    <Text
                      style={[
                        styles.channelLabel,
                        {
                          color: isSelected ? colors.accent : colors.text,
                          fontFamily: isSelected ? FONTS.bold : FONTS.medium,
                        },
                      ]}
                    >
                      {ch.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Section 2: Strategic Tone Selector */}
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeadingRow}>
              <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
                Strategic Pitch Tone
              </Text>
              <Text style={[styles.toneSubtext, { color: colors.textMuted }]}>
                {TONES.find((t) => t.id === tone)?.desc}
              </Text>
            </View>

            <View style={styles.tonePillsRow}>
              {TONES.map((t) => {
                const isSelected = tone === t.id;
                return (
                  <TouchableOpacity
                    key={t.id}
                    style={[
                      styles.tonePill,
                      {
                        backgroundColor: isSelected
                          ? colors.accent
                          : isDark
                          ? colors.card
                          : '#FFFFFF',
                        borderColor: isSelected ? colors.accent : colors.border,
                      },
                    ]}
                    onPress={() => handleSelectTone(t.id)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.toneIconEmoji}>{t.icon}</Text>
                    <Text
                      style={[
                        styles.tonePillText,
                        {
                          color: isSelected ? '#FFFFFF' : colors.text,
                          fontFamily: isSelected ? FONTS.bold : FONTS.medium,
                        },
                      ]}
                    >
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Section 3: Subject Line */}
          {channel !== 'linkedin' && (
            <View style={styles.sectionBlock}>
              <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
                Subject Line
              </Text>

              <View
                style={[
                  styles.subjectBox,
                  {
                    backgroundColor: isDark ? colors.card : '#FFFFFF',
                    borderColor: colors.border,
                  },
                ]}
              >
                <TextInput
                  style={[styles.subjectInput, { color: colors.text, fontFamily: FONTS.semibold }]}
                  value={subject}
                  onChangeText={setSubject}
                  placeholder="Subject line…"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>
          )}

          {/* Section 4: Pitch Draft Editor */}
          <View style={styles.sectionBlock}>
            <View style={styles.editorHeaderRow}>
              <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
                Proposal Pitch Draft
              </Text>

              <View style={styles.statsIndicatorPill}>
                <Text style={[styles.statsIndicatorText, { color: colors.textMuted }]}>
                  {wordCount} words · ~{readTimeSeconds}s read
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.editorBox,
                {
                  backgroundColor: isDark ? colors.card : '#FFFFFF',
                  borderColor: colors.border,
                },
              ]}
            >
              <TextInput
                style={[styles.editorInput, { color: colors.text, fontFamily: FONTS.regular }]}
                value={body}
                onChangeText={setBody}
                multiline
                numberOfLines={12}
                textAlignVertical="top"
                placeholder="Compose your tailored pitch…"
                placeholderTextColor={colors.textMuted}
              />

              {/* Editor Bottom Actions Toolbar */}
              <View style={[styles.editorToolbar, { borderTopColor: colors.borderSubtle }]}>
                <TouchableOpacity
                  style={[styles.editorToolBtn, { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA' }]}
                  onPress={handleNativeMail}
                  activeOpacity={0.7}
                >
                  <Sms size={14} color={colors.accent} variant="Bold" />
                  <Text style={[styles.editorToolBtnText, { color: colors.text }]}>Open in Mail</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.editorToolBtn, { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA' }]}
                  onPress={handleCopy}
                  activeOpacity={0.7}
                >
                  <Copy size={14} color={colors.accent} variant="Linear" />
                  <Text style={[styles.editorToolBtnText, { color: colors.text }]}>
                    {copied ? 'Copied!' : 'Copy Pitch'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Pinned Bottom CTA Bar */}
        <View
          style={[
            styles.bottomCTAContainer,
            {
              backgroundColor: isDark ? colors.surface : '#FFFFFF',
              borderTopColor: colors.borderSubtle,
              bottom: insets.bottom,
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.primaryCTA, { backgroundColor: colors.accent }]}
            onPress={handleQueueOutreach}
            activeOpacity={0.88}
          >
            <DirectSend size={18} color="#FFFFFF" variant="Bold" />
            <Text style={styles.primaryCTAText}>Queue Outreach & Track</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Confirmation BottomSheet (Zero raw alerts) */}
      <BottomSheet
        visible={isQueuedSheetOpen}
        onClose={() => {
          setIsQueuedSheetOpen(false);
          router.back();
        }}
        title="Outreach Draft Queued"
        subtitle={`Tracked in Active Pipeline for ${opp.organization}`}
        icon={<DirectSend size={22} color={colors.accent} variant="Bold" />}
      >
        <View style={styles.successSheetContent}>
          <Text style={[styles.successSheetDesc, { color: colors.textSecondary }]}>
            Your calibrated proposal with {tone} tone has been attached to {opp.organization}. Automated follow-up trackers are now active in your pipeline.
          </Text>

          <View style={styles.successButtonsRow}>
            <TouchableOpacity
              style={[styles.mailLaunchBtn, { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA' }]}
              onPress={handleNativeMail}
            >
              <Sms size={16} color={colors.accent} variant="Bold" />
              <Text style={[styles.mailLaunchBtnText, { color: colors.text }]}>Launch Email App</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.doneBtn, { backgroundColor: colors.accent }]}
              onPress={() => {
                setIsQueuedSheetOpen(false);
                router.back();
              }}
            >
              <Text style={styles.doneBtnText}>Return to Opportunity</Text>
            </TouchableOpacity>
          </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    marginHorizontal: 12,
  },
  screenTitle: {
    fontSize: 16.5,
    fontFamily: FONTS.bold,
  },
  screenSub: {
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  actionIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    gap: 16,
  },
  oppContextCard: {
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    padding: SPACING.md,
    gap: 10,
  },
  oppTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  orgAvatar: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orgName: {
    fontSize: 12,
    fontFamily: FONTS.medium,
  },
  oppTitle: {
    fontSize: 14.5,
    fontFamily: FONTS.bold,
    marginTop: 1,
  },
  oppMetaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaChipText: {
    fontSize: 11.5,
    fontFamily: FONTS.medium,
  },
  sectionBlock: {
    gap: 8,
  },
  sectionHeading: {
    fontSize: 12,
    fontFamily: FONTS.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toneSubtext: {
    fontSize: 11.5,
    fontFamily: FONTS.regular,
  },
  channelsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  channelCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.2,
  },
  channelLabel: {
    fontSize: 12,
  },
  tonePillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tonePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
  },
  toneIconEmoji: {
    fontSize: 13,
  },
  tonePillText: {
    fontSize: 12.5,
  },
  subjectBox: {
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  subjectInput: {
    fontSize: 13.5,
    padding: 0,
  },
  editorHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statsIndicatorPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.xs,
  },
  statsIndicatorText: {
    fontSize: 11,
    fontFamily: FONTS.medium,
  },
  editorBox: {
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  editorInput: {
    fontSize: 14,
    lineHeight: 22,
    minHeight: 180,
    padding: 0,
  },
  editorToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  editorToolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.md,
  },
  editorToolBtnText: {
    fontSize: 11.5,
    fontFamily: FONTS.semibold,
  },
  bottomCTAContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  primaryCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.lg,
    gap: 8,
  },
  primaryCTAText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontFamily: FONTS.bold,
  },
  successSheetContent: {
    paddingVertical: SPACING.xs,
    gap: 16,
  },
  successSheetDesc: {
    fontSize: 13.5,
    lineHeight: 20,
  },
  successButtonsRow: {
    gap: 10,
    marginTop: 4,
  },
  mailLaunchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: BORDER_RADIUS.md,
  },
  mailLaunchBtnText: {
    fontSize: 13.5,
    fontFamily: FONTS.semibold,
  },
  doneBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: BORDER_RADIUS.md,
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FONTS.bold,
  },
});
