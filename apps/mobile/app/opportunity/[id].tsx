import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  Share as RNShare,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { Badge, Card, CustomDateTimePickerSheet } from '@/components/ui';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { PipelineStagePickerSheet } from '@/components/pipeline/PipelineStagePickerSheet';
import { SAMPLE_OPPORTUNITIES } from '@/constants/mockData';
import { opportunityService } from '@/services/opportunityService';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/theme';
import {
  ArrowLeft2,
  Bookmark,
  Location,
  DollarCircle,
  TickCircle,
  Danger,
  Buildings,
  Flash,
  ExportCurve,
  Global,
  Sms,
  Calendar,
  DirectSend,
  MessageQuestion,
  Chart21,
  Note1,
  Award,
  Verify,
  Clock,
  ArrowRight2,
  MagicStar,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { usePipeline, type PipelineStage } from '@/context/PipelineContext';
import type { Opportunity } from '@prospect/types';

export default function OpportunityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();

  const {
    isSaved: isSavedInPipeline,
    isApplied: isAppliedInPipeline,
    getRecord,
    toggleSave,
    applyToOpportunity,
    scheduleFollowUp,
    updateStage,
    updateNotes,
  } = usePipeline();

  const [opp, setOpp] = useState<Opportunity>(
    () => SAMPLE_OPPORTUNITIES.find((o) => o.id === id) || SAMPLE_OPPORTUNITIES[0]
  );
  const [loading, setLoading] = useState(false);

  // Active Tool Tab: 'dossier' | 'interview_prep' | 'compensation' | 'notes'
  const [activeTab, setActiveTab] = useState<'dossier' | 'interview_prep' | 'compensation' | 'notes'>('dossier');

  // BottomSheets
  const [isStageSheetOpen, setIsStageSheetOpen] = useState(false);
  const [isCadenceSheetOpen, setIsCadenceSheetOpen] = useState(false);
  const [isApplyConfirmSheetOpen, setIsApplyConfirmSheetOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (id) {
      setLoading(true);
      opportunityService
        .getOpportunityById(id)
        .then((data) => {
          if (isMounted && data) {
            setOpp(data);
          }
        })
        .catch(() => {})
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [id]);

  const record = getRecord(opp.id);
  const isSaved = isSavedInPipeline(opp.id);
  const isApplied = isAppliedInPipeline(opp.id);

  const [privateNote, setPrivateNote] = useState(record?.notes || '');

  // Keep notes synchronized
  useEffect(() => {
    if (record?.notes !== undefined) {
      setPrivateNote(record.notes);
    }
  }, [record?.notes]);

  const handleToggleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleSave(opp);
  };

  const handleConfirmApply = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    applyToOpportunity(opp);
    setIsApplyConfirmSheetOpen(false);
  };

  const handleOpenComposer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/composer/${opp.id}` as any);
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await RNShare.share({
        message: `${opp.title} at ${opp.organization} (${opp.compensation}). Fit: ${opp.matchScore}%. Source: ${opp.originalUrl || 'ProspectAI Index'}`,
        title: opp.title,
      });
    } catch {}
  };

  // Responsive font scaling
  const titleFontSize = width < 380 ? 19 : 22;

  // Mocked AI Interview Prep Questions customized to this role
  const interviewQuestions = useMemo(() => [
    {
      question: `How would you architect high-scale systems specifically for ${opp.organization}'s product domain?`,
      talkingPoint: `Highlight past production experience with ${opp.tags.slice(0, 2).join(' and ')}, zero-downtime rollouts, and latency benchmarks.`,
    },
    {
      question: `Explain how you handle ambiguous trade-offs between delivery speed and system maintainability.`,
      talkingPoint: `Reference concrete metrics from your previous senior roles where you shipped early MVPs while preserving extensible core contracts.`,
    },
    {
      question: `Why is ${opp.organization} your top choice right now, and what excites you about this specific scope?`,
      talkingPoint: `Mention their recent engineering blog or product launches and connect your skills in ${opp.tags[0] || 'core engineering'} directly to their immediate bottleneck.`,
    },
  ], [opp]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Top Header Bar */}
      <View style={[styles.topBar, { borderBottomColor: colors.borderSubtle }]}>
        <TouchableOpacity
          style={[styles.roundBtn, { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA' }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft2 size={20} color={colors.text} />
        </TouchableOpacity>

        <Text style={[styles.topBarTitle, { color: colors.text }]} numberOfLines={1}>
          Opportunity Intelligence
        </Text>

        <View style={styles.topBarActions}>
          <TouchableOpacity
            style={[styles.roundBtn, { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA' }]}
            onPress={handleShare}
            activeOpacity={0.7}
          >
            <ExportCurve size={18} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.roundBtn,
              {
                backgroundColor: isSaved
                  ? 'rgba(139, 92, 246, 0.15)'
                  : isDark
                  ? colors.surfaceSecondary
                  : '#F0F4FA',
              },
            ]}
            onPress={handleToggleSave}
            activeOpacity={0.7}
          >
            <Bookmark
              size={18}
              color={isSaved ? '#8B5CF6' : colors.text}
              variant={isSaved ? 'Bold' : 'Linear'}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Executive Header Card */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: isDark ? colors.card : '#FFFFFF',
              borderColor: colors.border,
            },
          ]}
        >
          {/* Top Company Info & Match Score Capsule */}
          <View style={styles.companyHeaderRow}>
            <View style={styles.companyInfoLeft}>
              <View
                style={[
                  styles.orgAvatar,
                  { backgroundColor: colors.accent + '15', borderColor: colors.accent + '30' },
                ]}
              >
                <Buildings size={24} color={colors.accent} variant="Bold" />
              </View>

              <View style={styles.companyNameWrap}>
                <Text style={[styles.orgName, { color: colors.textSecondary }]} numberOfLines={1}>
                  {opp.organization}
                </Text>
                <View style={styles.locationSubtitleRow}>
                  <Location size={12} color={colors.textMuted} />
                  <Text style={[styles.locationSubText, { color: colors.textMuted }]} numberOfLines={1}>
                    {opp.location}
                  </Text>
                </View>
              </View>
            </View>

            {/* Match Score Capsule */}
            <View
              style={[
                styles.matchScoreCapsule,
                {
                  backgroundColor: opp.matchScore >= 90 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 102, 0, 0.12)',
                  borderColor: opp.matchScore >= 90 ? '#10B981' : colors.accent,
                },
              ]}
            >
              <MagicStar
                size={13}
                color={opp.matchScore >= 90 ? '#10B981' : colors.accent}
                variant="Bold"
              />
              <Text
                style={[
                  styles.matchScoreText,
                  { color: opp.matchScore >= 90 ? '#10B981' : colors.accent },
                ]}
              >
                {opp.matchScore}% Fit
              </Text>
            </View>
          </View>

          {/* Full-Width Role Title (Clean, airy, perfectly readable) */}
          <Text
            style={[
              styles.fullHeroTitle,
              { color: colors.text, fontSize: titleFontSize },
            ]}
          >
            {opp.title}
          </Text>

          {/* Quick Metrics Strip */}
          <View style={styles.metaRow}>
            <View
              style={[
                styles.metaChip,
                { backgroundColor: isDark ? colors.surfaceSecondary : '#F4F7FB' },
              ]}
            >
              <DollarCircle size={15} color={colors.accent} variant="Bold" />
              <Text style={[styles.metaChipText, { color: colors.text }]}>{opp.compensation}</Text>
            </View>

            <View
              style={[
                styles.metaChip,
                { backgroundColor: isDark ? colors.surfaceSecondary : '#F4F7FB' },
              ]}
            >
              <Location size={15} color={colors.textSecondary} />
              <Text style={[styles.metaChipText, { color: colors.textSecondary }]}>
                {opp.location}
              </Text>
            </View>

            <View
              style={[
                styles.metaChip,
                { backgroundColor: isDark ? colors.surfaceSecondary : '#F4F7FB' },
              ]}
            >
              <Verify size={15} color="#10B981" variant="Bold" />
              <Text style={[styles.metaChipText, { color: colors.text }]}>
                {opp.type.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Interactive Stage Tracker Bar */}
          <TouchableOpacity
            style={[
              styles.stageProgressBar,
              {
                backgroundColor: isDark ? colors.surfaceSecondary : '#F8FAFC',
                borderColor: colors.borderSubtle,
              },
            ]}
            onPress={() => setIsStageSheetOpen(true)}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <DirectSend size={15} color={colors.accent} />
              <Text style={[styles.stageBarLabel, { color: colors.textSecondary }]}>
                Pipeline Stage:
              </Text>
              <Text style={[styles.stageBarValue, { color: colors.accent }]}>
                {(record?.stage || (isApplied ? 'applied' : isSaved ? 'saved' : 'Discovery')).toUpperCase()}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={[styles.stageBarAction, { color: colors.accent }]}>Update</Text>
              <ArrowRight2 size={13} color={colors.accent} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Tool Navigation Switcher */}
        <View
          style={[
            styles.tabBar,
            {
              backgroundColor: isDark ? colors.card : '#FFFFFF',
              borderColor: colors.borderSubtle,
            },
          ]}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
            {[
              { id: 'dossier', label: 'Overview & Fit', icon: Flash },
              { id: 'interview_prep', label: 'AI Interview Prep', icon: MessageQuestion },
              { id: 'compensation', label: 'Comp & Benchmark', icon: Chart21 },
              { id: 'notes', label: 'Private Notes', icon: Note1 },
            ].map((tab) => {
              const isSel = activeTab === tab.id;
              const IconComp = tab.icon;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[
                    styles.tabItem,
                    {
                      backgroundColor: isSel
                        ? colors.accent
                        : isDark
                        ? colors.surfaceSecondary
                        : '#F0F4FA',
                    },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setActiveTab(tab.id as any);
                  }}
                >
                  <IconComp size={15} color={isSel ? '#FFFFFF' : colors.textSecondary} variant={isSel ? 'Bold' : 'Linear'} />
                  <Text
                    style={[
                      styles.tabItemText,
                      {
                        color: isSel ? '#FFFFFF' : colors.text,
                        fontFamily: isSel ? FONTS.bold : FONTS.medium,
                      },
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* TAB 1: Dossier & Qualification */}
        {activeTab === 'dossier' && (
          <View style={styles.tabContentGroup}>
            {/* AI Fit Analysis Box */}
            <Card variant="elevated" style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Flash size={18} color={colors.accent} variant="Bold" />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  AI Qualification Analysis
                </Text>
              </View>

              <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
                {opp.matchExplanation}
              </Text>

              {opp.matchPros && opp.matchPros.length > 0 && (
                <View style={styles.bulletList}>
                  <Text style={[styles.bulletHeader, { color: '#10B981' }]}>Key Alignment Factors</Text>
                  {opp.matchPros.map((pro: string, i: number) => (
                    <View key={i} style={styles.bulletRow}>
                      <TickCircle size={15} color="#10B981" variant="Bold" />
                      <Text style={[styles.bulletText, { color: colors.text }]}>{pro}</Text>
                    </View>
                  ))}
                </View>
              )}

              {opp.matchCons && opp.matchCons.length > 0 && (
                <View style={styles.bulletList}>
                  <Text style={[styles.bulletHeader, { color: '#F59E0B' }]}>Areas to Address in Outreach</Text>
                  {opp.matchCons.map((con: string, i: number) => (
                    <View key={i} style={styles.bulletRow}>
                      <Danger size={15} color="#F59E0B" variant="Bold" />
                      <Text style={[styles.bulletText, { color: colors.text }]}>{con}</Text>
                    </View>
                  ))}
                </View>
              )}
            </Card>

            {/* Scope & Overview */}
            <View
              style={[
                styles.sectionCard,
                {
                  backgroundColor: isDark ? colors.card : '#FFFFFF',
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Scope & Role Overview</Text>
              <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
                {opp.description}
              </Text>
            </View>

            {/* Requirements Checklist */}
            {opp.requirements && opp.requirements.length > 0 && (
              <View
                style={[
                  styles.sectionCard,
                  {
                    backgroundColor: isDark ? colors.card : '#FFFFFF',
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Core Requirements</Text>
                <View style={{ gap: 8, marginTop: 8 }}>
                  {opp.requirements.map((req, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.reqItem,
                        {
                          backgroundColor: isDark ? colors.surfaceSecondary : '#F8FAFC',
                          borderColor: colors.borderSubtle,
                        },
                      ]}
                    >
                      <TickCircle size={16} color="#10B981" variant="Bold" />
                      <Text style={[styles.reqItemText, { color: colors.text }]}>
                        {req.text}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Technical Stack */}
            <View
              style={[
                styles.sectionCard,
                {
                  backgroundColor: isDark ? colors.card : '#FFFFFF',
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Required Technical Stack</Text>
              <View style={styles.tagsGrid}>
                {opp.tags.map((tag: string, idx: number) => (
                  <View
                    key={idx}
                    style={[
                      styles.tagBadge,
                      {
                        backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA',
                        borderColor: colors.borderSubtle,
                      },
                    ]}
                  >
                    <Text style={[styles.tagBadgeText, { color: colors.text }]}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Verified Provenance */}
            {opp.originalUrl ? (
              <TouchableOpacity
                style={[
                  styles.sourceCard,
                  {
                    backgroundColor: isDark ? colors.card : '#FFFFFF',
                    borderColor: colors.borderSubtle,
                  },
                ]}
                onPress={() => Linking.openURL(opp.originalUrl)}
                activeOpacity={0.8}
              >
                <Global size={20} color={colors.accent} variant="Bold" />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sourceCardTitle, { color: colors.text }]}>
                    Original Career Portal & Listing
                  </Text>
                  <Text style={[styles.sourceCardUrl, { color: colors.textSecondary }]} numberOfLines={1}>
                    {opp.originalUrl}
                  </Text>
                </View>
                <ArrowRight2 size={16} color={colors.accent} />
              </TouchableOpacity>
            ) : null}
          </View>
        )}

        {/* TAB 2: AI Interview Prep Simulator */}
        {activeTab === 'interview_prep' && (
          <View style={styles.tabContentGroup}>
            <View
              style={[
                styles.toolBanner,
                {
                  backgroundColor: isDark ? 'rgba(0, 82, 255, 0.12)' : 'rgba(0, 82, 255, 0.08)',
                  borderColor: colors.accent + '33',
                },
              ]}
            >
              <MessageQuestion size={22} color={colors.accent} variant="Bold" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.toolBannerTitle, { color: colors.accent }]}>
                  AI Interview Simulator
                </Text>
                <Text style={[styles.toolBannerSub, { color: colors.textSecondary }]}>
                  High-probability technical and behavioral questions calibrated for {opp.organization}.
                </Text>
              </View>
            </View>

            {interviewQuestions.map((item, idx) => (
              <View
                key={idx}
                style={[
                  styles.qaCard,
                  {
                    backgroundColor: isDark ? colors.card : '#FFFFFF',
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.qaHeader}>
                  <View style={[styles.qaNumberPill, { backgroundColor: colors.accent }]}>
                    <Text style={styles.qaNumberText}>Q{idx + 1}</Text>
                  </View>
                  <Text style={[styles.qaQuestion, { color: colors.text }]}>
                    {item.question}
                  </Text>
                </View>

                <View
                  style={[
                    styles.qaAnswerBox,
                    {
                      backgroundColor: isDark ? colors.surfaceSecondary : '#F8FAFC',
                      borderColor: colors.borderSubtle,
                    },
                  ]}
                >
                  <Text style={[styles.qaAnswerLabel, { color: colors.accent }]}>
                    STRATEGIC TALKING POINT:
                  </Text>
                  <Text style={[styles.qaAnswerText, { color: colors.textSecondary }]}>
                    {item.talkingPoint}
                  </Text>
                </View>
              </View>
            ))}

            <TouchableOpacity
              style={[styles.fullWidthToolBtn, { backgroundColor: colors.accent }]}
              onPress={handleOpenComposer}
            >
              <Sms size={18} color="#FFFFFF" variant="Bold" />
              <Text style={styles.fullWidthToolBtnText}>Draft Custom Proposal with These Answers</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* TAB 3: Compensation & Negotiation Benchmark */}
        {activeTab === 'compensation' && (
          <View style={styles.tabContentGroup}>
            <View
              style={[
                styles.sectionCard,
                {
                  backgroundColor: isDark ? colors.card : '#FFFFFF',
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.sectionHeaderRow}>
                <Chart21 size={20} color={colors.accent} variant="Bold" />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Market Compensation Benchmark
                </Text>
              </View>

              <View style={styles.compStatsGrid}>
                <View style={[styles.compBox, { backgroundColor: isDark ? colors.surfaceSecondary : '#F4F7FB' }]}>
                  <Text style={[styles.compBoxLabel, { color: colors.textSecondary }]}>Posted Offering</Text>
                  <Text style={[styles.compBoxVal, { color: colors.accent }]}>{opp.compensation}</Text>
                </View>

                <View style={[styles.compBox, { backgroundColor: isDark ? colors.surfaceSecondary : '#F4F7FB' }]}>
                  <Text style={[styles.compBoxLabel, { color: colors.textSecondary }]}>Market 75th %ile</Text>
                  <Text style={[styles.compBoxVal, { color: '#10B981' }]}>$160k - $210k</Text>
                </View>
              </View>

              <Text style={[styles.negotiationHeader, { color: colors.text, marginTop: 16 }]}>
                Executive Negotiation Leverage:
              </Text>
              <View style={styles.bulletList}>
                <View style={styles.bulletRow}>
                  <TickCircle size={15} color="#10B981" variant="Bold" />
                  <Text style={[styles.bulletText, { color: colors.text }]}>
                    High-demand tech stack ({opp.tags.slice(0, 2).join(', ')}) commands a 15% premium over median.
                  </Text>
                </View>
                <View style={styles.bulletRow}>
                  <TickCircle size={15} color="#10B981" variant="Bold" />
                  <Text style={[styles.bulletText, { color: colors.text }]}>
                    Remote contract roles in this bracket regularly approve performance milestone bonuses.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* TAB 4: Private Dossier Notes */}
        {activeTab === 'notes' && (
          <View style={styles.tabContentGroup}>
            <View
              style={[
                styles.sectionCard,
                {
                  backgroundColor: isDark ? colors.card : '#FFFFFF',
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.sectionHeaderRow}>
                <Note1 size={20} color={colors.accent} variant="Bold" />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Private Dossier Notes
                </Text>
              </View>
              <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
                Encrypted locally on this device. Record interviewer names, target compensation ceilings, or personal reflections.
              </Text>

              <TextInput
                style={[
                  styles.notesEditor,
                  {
                    backgroundColor: isDark ? colors.surfaceSecondary : '#F8FAFC',
                    borderColor: colors.borderSubtle,
                    color: colors.text,
                  },
                ]}
                placeholder="Write private notes about this opportunity…"
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={6}
                value={privateNote}
                onChangeText={(text) => {
                  setPrivateNote(text);
                  updateNotes(opp.id, text);
                }}
              />
            </View>

            {/* Quick Follow-Up Cadence Action */}
            <TouchableOpacity
              style={[
                styles.followUpActionCard,
                {
                  backgroundColor: isDark ? colors.card : '#FFFFFF',
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setIsCadenceSheetOpen(true)}
            >
              <Calendar size={20} color="#F59E0B" variant="Bold" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.qaQuestion, { color: colors.text }]}>
                  Schedule Cadence Reminder
                </Text>
                <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
                  {record?.followUpDate ? `Active: ${record.followUpDate}` : 'No cadence set yet'}
                </Text>
              </View>
              <ArrowRight2 size={16} color={colors.accent} />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Pinned Bottom CTA Action Bar */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: isDark ? colors.surface : '#FFFFFF',
            borderTopColor: colors.borderSubtle,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.secondaryBtn,
            { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA' },
          ]}
          onPress={handleOpenComposer}
          activeOpacity={0.8}
        >
          <Sms size={17} color={colors.accent} variant="Bold" />
          <Text style={[styles.secondaryBtnText, { color: colors.text }]}>AI Pitch</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.primaryBtn,
            { backgroundColor: isApplied ? '#10B981' : colors.accent },
          ]}
          onPress={() => {
            if (isApplied) {
              handleOpenComposer();
            } else {
              setIsApplyConfirmSheetOpen(true);
            }
          }}
          activeOpacity={0.85}
        >
          <Flash size={18} color="#FFFFFF" variant="Bold" />
          <Text style={styles.primaryBtnText}>
            {isApplied ? 'Application Sent ✓' : 'Autonomous Apply'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stage Picker Sheet */}
      <PipelineStagePickerSheet
        visible={isStageSheetOpen}
        onClose={() => setIsStageSheetOpen(false)}
        record={record || {
          id: `pipe-${opp.id}`,
          opportunityId: opp.id,
          opportunity: opp,
          stage: isApplied ? 'applied' : isSaved ? 'saved' : 'saved',
          updatedAt: new Date().toISOString(),
        }}
        onSelectStage={updateStage}
      />

      {/* Follow-Up Cadence Custom Date Time Picker Sheet */}
      <CustomDateTimePickerSheet
        visible={isCadenceSheetOpen}
        onClose={() => setIsCadenceSheetOpen(false)}
        title={`Schedule Follow-Up for ${opp.organization}`}
        subtitle={opp.title}
        initialObjective="Follow up on application status & recruiter reply"
        onConfirm={(scheduledDate, objective) => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          scheduleFollowUp(opp.id, scheduledDate, objective);
          setIsCadenceSheetOpen(false);
        }}
      />

      {/* Autonomous Apply Confirmation BottomSheet (Zero Alerts) */}
      <BottomSheet
        visible={isApplyConfirmSheetOpen}
        onClose={() => setIsApplyConfirmSheetOpen(false)}
        title="Dispatch Application"
        subtitle={`Target: ${opp.organization}`}
        icon={<Flash size={22} color={colors.accent} variant="Bold" />}
      >
        <View style={{ paddingBottom: 24, gap: 14 }}>
          <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
            ProspectAI will calibrate your active CV dossier and package a tailored cover letter calibrated for the <Text style={{ fontFamily: FONTS.bold, color: colors.text }}>{opp.title}</Text> role.
          </Text>

          <View style={[styles.applyFactBox, { backgroundColor: isDark ? colors.surfaceSecondary : '#F4F7FB' }]}>
            <Text style={[styles.applyFactTitle, { color: colors.text }]}>✓ Matched Requirements: {opp.requirements?.length || 4}</Text>
            <Text style={[styles.applyFactTitle, { color: colors.text }]}>✓ Active Target: {opp.compensation}</Text>
            <Text style={[styles.applyFactTitle, { color: colors.text }]}>✓ Tracked in Pipeline automatically</Text>
          </View>

          <TouchableOpacity
            style={[styles.submitSheetBtn, { backgroundColor: colors.accent }]}
            onPress={handleConfirmApply}
          >
            <Text style={styles.submitSheetBtnText}>Confirm & Dispatch Proposal</Text>
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
  topBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
  },
  roundBtn: {
    width: 38,
    height: 38,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontFamily: FONTS.bold,
    fontSize: 15,
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 80,
  },
  heroCard: {
    borderRadius: BORDER_RADIUS.xxl,
    borderWidth: 1,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    gap: 12,
  },
  companyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  companyInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  companyNameWrap: {
    flex: 1,
    gap: 2,
  },
  orgAvatar: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orgName: {
    fontFamily: FONTS.semibold,
    fontSize: 14,
  },
  locationSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  locationSubText: {
    fontFamily: FONTS.regular,
    fontSize: 11.5,
  },
  matchScoreCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1.2,
  },
  matchScoreText: {
    fontFamily: FONTS.bold,
    fontSize: 12,
  },
  fullHeroTitle: {
    fontFamily: FONTS.bold,
    lineHeight: 28,
    marginTop: 4,
    letterSpacing: -0.3,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.md,
  },
  metaChipText: {
    fontFamily: FONTS.medium,
    fontSize: 12,
  },
  stageProgressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
  },
  stageBarLabel: {
    fontFamily: FONTS.medium,
    fontSize: 12,
  },
  stageBarValue: {
    fontFamily: FONTS.bold,
    fontSize: 12,
  },
  stageBarAction: {
    fontFamily: FONTS.bold,
    fontSize: 12,
  },
  tabBar: {
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    padding: 6,
    marginBottom: SPACING.md,
  },
  tabScroll: {
    flexDirection: 'row',
    gap: 8,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.lg,
  },
  tabItemText: {
    fontSize: 13,
  },
  tabContentGroup: {
    gap: SPACING.md,
  },
  sectionCard: {
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    padding: SPACING.lg,
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontFamily: FONTS.bold,
    fontSize: 16,
  },
  bodyText: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    lineHeight: 20,
  },
  bulletList: {
    gap: 6,
    marginTop: 6,
  },
  bulletHeader: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    marginBottom: 2,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletText: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  reqItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 10,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  reqItemText: {
    flex: 1,
    fontFamily: FONTS.medium,
    fontSize: 13,
    lineHeight: 18,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  tagBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  tagBadgeText: {
    fontFamily: FONTS.medium,
    fontSize: 12,
  },
  sourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
  },
  sourceCardTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
  },
  sourceCardUrl: {
    fontFamily: FONTS.regular,
    fontSize: 11,
  },
  toolBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
  },
  toolBannerTitle: {
    fontFamily: FONTS.bold,
    fontSize: 15,
  },
  toolBannerSub: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    marginTop: 2,
  },
  qaCard: {
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    padding: SPACING.md,
    gap: 10,
  },
  qaHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  qaNumberPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.md,
  },
  qaNumberText: {
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
    fontSize: 11,
  },
  qaQuestion: {
    flex: 1,
    fontFamily: FONTS.bold,
    fontSize: 14,
    lineHeight: 20,
  },
  qaAnswerBox: {
    padding: 10,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    gap: 4,
  },
  qaAnswerLabel: {
    fontFamily: FONTS.bold,
    fontSize: 10,
    letterSpacing: 0.6,
  },
  qaAnswerText: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    lineHeight: 18,
  },
  fullWidthToolBtn: {
    height: 48,
    borderRadius: BORDER_RADIUS.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  fullWidthToolBtnText: {
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
    fontSize: 14,
  },
  compStatsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  compBox: {
    flex: 1,
    padding: 12,
    borderRadius: BORDER_RADIUS.lg,
    gap: 4,
  },
  compBoxLabel: {
    fontFamily: FONTS.medium,
    fontSize: 11,
  },
  compBoxVal: {
    fontFamily: FONTS.bold,
    fontSize: 16,
  },
  negotiationHeader: {
    fontFamily: FONTS.bold,
    fontSize: 13,
  },
  notesEditor: {
    minHeight: 120,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    padding: 12,
    fontSize: 13,
    fontFamily: FONTS.regular,
    textAlignVertical: 'top',
    marginTop: 6,
  },
  followUpActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  secondaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: BORDER_RADIUS.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  secondaryBtnText: {
    fontFamily: FONTS.bold,
    fontSize: 14,
  },
  primaryBtn: {
    flex: 2,
    height: 48,
    borderRadius: BORDER_RADIUS.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
    fontSize: 14,
  },
  cadencePill: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cadenceInput: {
    height: 44,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
    fontFamily: FONTS.regular,
  },
  submitSheetBtn: {
    height: 48,
    borderRadius: BORDER_RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitSheetBtnText: {
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
    fontSize: 14,
  },
  applyFactBox: {
    padding: 12,
    borderRadius: BORDER_RADIUS.lg,
    gap: 6,
  },
  applyFactTitle: {
    fontFamily: FONTS.medium,
    fontSize: 13,
  },
});
