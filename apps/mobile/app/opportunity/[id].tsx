import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
  Share as RNShare,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { Button, Card, Badge } from '@/components/ui';
import { SAMPLE_OPPORTUNITIES } from '@/constants/mockData';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/theme';
import {
  ArrowLeft2,
  ArchiveAdd,
  Location,
  DollarCircle,
  TickCircle,
  Danger,
  Send2,
  Buildings,
  Flash,
  ExportCurve,
  Global,
  Sms,
  Calendar,
  ArrowRight2,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { usePipeline } from '@/context/PipelineContext';

export default function OpportunityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const {
    isSaved: isSavedInPipeline,
    isApplied: isAppliedInPipeline,
    getRecord,
    toggleSave,
    applyToOpportunity,
    scheduleFollowUp,
    updateNotes,
  } = usePipeline();

  const opp =
    SAMPLE_OPPORTUNITIES.find((o) => o.id === id) || SAMPLE_OPPORTUNITIES[0];
  const record = getRecord(opp.id);

  const isSaved = isSavedInPipeline(opp.id);
  const isApplied = isAppliedInPipeline(opp.id);
  const [followUpDate, setFollowUpDate] = useState<string | null>(record?.followUpDate || null);
  const [privateNote, setPrivateNote] = useState(record?.notes || '');

  const handleToggleSave = () => {
    toggleSave(opp);
  };

  const handleAutoApply = () => {
    applyToOpportunity(opp);
    Alert.alert(
      'Autonomous Application Dispatched',
      `Proposal calibrated with your active CV has been queued for ${opp.organization}. Added to Pipeline.`
    );
  };

  const handlePrepareAction = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/composer/${opp.id}` as any);
  };

  const handleScheduleFollowUp = (cadence: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setFollowUpDate(cadence);
    scheduleFollowUp(opp.id, `In ${cadence}`, `Follow-up on ${opp.title}`);
    Alert.alert(
      'Follow-Up Queued',
      `Follow-up cadence for ${opp.organization} set for ${cadence}. Added to Pipeline.`
    );
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await RNShare.share({
        message: `${opp.title} at ${opp.organization} (${opp.compensation}). Verified source: ${opp.originalUrl || 'Partner Index'}`,
        title: opp.title,
      });
    } catch {}
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Top App Bar */}
      <View style={[styles.topBar, { borderBottomColor: colors.borderSubtle }]}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA' }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft2 size={20} color={colors.text} variant="Linear" />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.text }]}>Opportunity Dossier</Text>

        <View style={{ flexDirection: 'row', gap: 6 }}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA' }]}
            onPress={handleShare}
            activeOpacity={0.7}
          >
            <ExportCurve size={18} color={colors.text} variant="Linear" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA' }]}
            onPress={handleToggleSave}
            activeOpacity={0.7}
          >
            <ArchiveAdd
              size={18}
              color={isSaved ? colors.accent : colors.text}
              variant={isSaved ? 'Bold' : 'Linear'}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Organization & Title Header Card */}
        <View style={styles.orgHeader}>
          <View
            style={[
              styles.orgAvatarLarge,
              { backgroundColor: colors.accent + '20' },
            ]}
          >
            <Buildings size={32} color={colors.accent} variant="Bold" />
          </View>
          <Text style={[styles.orgName, { color: colors.textSecondary }]}>
            {opp.organization}
          </Text>
          <Text style={[styles.title, { color: colors.text }]}>{opp.title}</Text>

          <View style={styles.badgeRow}>
            <Badge
              label={`${opp.matchScore}% Match Fit`}
              variant={opp.matchScore >= 90 ? 'success' : 'accent'}
              size="md"
              dot
            />
            <Badge
              label={opp.type.toUpperCase()}
              variant="neutral"
              size="md"
            />
            {isApplied && (
              <Badge
                label="APPLIED ✓"
                variant="success"
                size="md"
              />
            )}
          </View>
        </View>

        {/* Fact Pills Row */}
        <View style={styles.factsRow}>
          <View
            style={[
              styles.factPill,
              {
                backgroundColor: isDark ? colors.card : '#FFFFFF',
                borderColor: colors.border,
              },
            ]}
          >
            <DollarCircle size={18} color={colors.accent} variant="Bold" />
            <Text style={[styles.factText, { color: colors.text }]}>
              {opp.compensation}
            </Text>
          </View>

          <View
            style={[
              styles.factPill,
              {
                backgroundColor: isDark ? colors.card : '#FFFFFF',
                borderColor: colors.border,
              },
            ]}
          >
            <Location size={18} color={colors.accent} variant="Bold" />
            <Text style={[styles.factText, { color: colors.text }]}>
              {opp.location}
            </Text>
          </View>
        </View>

        {/* AI Fit Analysis Card */}
        <Card variant="elevated" style={styles.analysisCard}>
          <View style={styles.analysisHeader}>
            <Flash size={18} color={colors.accent} variant="Bold" />
            <Text style={[styles.analysisTitle, { color: colors.text }]}>
              AI Qualification Analysis
            </Text>
          </View>

          <Text style={[styles.reasoningText, { color: colors.textSecondary }]}>
            {opp.matchExplanation}
          </Text>

          {opp.matchPros && opp.matchPros.length > 0 && (
            <View style={styles.pointsGroup}>
              <Text style={[styles.pointsHeading, { color: colors.success }]}>
                Strong Alignment Factors
              </Text>
              {opp.matchPros.map((pro: string, i: number) => (
                <View key={i} style={styles.pointRow}>
                  <TickCircle size={15} color={colors.success} variant="Bold" />
                  <Text style={[styles.pointText, { color: colors.text }]}>
                    {pro}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {opp.matchCons && opp.matchCons.length > 0 && (
            <View style={styles.pointsGroup}>
              <Text style={[styles.pointsHeading, { color: colors.warning }]}>
                Important Considerations
              </Text>
              {opp.matchCons.map((con: string, i: number) => (
                <View key={i} style={styles.pointRow}>
                  <Danger size={15} color={colors.warning} variant="Bold" />
                  <Text style={[styles.pointText, { color: colors.text }]}>
                    {con}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* Description Section */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionHeading, { color: colors.text }]}>
            Scope & Overview
          </Text>
          <Text style={[styles.descText, { color: colors.textSecondary }]}>
            {opp.description}
          </Text>
        </View>

        {/* Requirements Checklist (Web Feature) */}
        {opp.requirements && opp.requirements.length > 0 && (
          <View style={styles.sectionBlock}>
            <Text style={[styles.sectionHeading, { color: colors.text }]}>
              Core Requirements Checklist
            </Text>
            <View style={{ gap: 8 }}>
              {opp.requirements.map((req, rIdx) => (
                <View
                  key={rIdx}
                  style={[
                    styles.reqRow,
                    {
                      backgroundColor: isDark ? colors.card : '#FFFFFF',
                      borderColor: colors.borderSubtle,
                    },
                  ]}
                >
                  <TickCircle size={16} color={colors.success} variant="Bold" />
                  <Text style={[styles.reqText, { color: colors.text }]} numberOfLines={2}>
                    {req.text}
                  </Text>
                  <Badge label="VERIFIED" variant="success" size="sm" />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Verified Original Source (Web Feature) */}
        {opp.originalUrl ? (
          <View style={styles.sectionBlock}>
            <Text style={[styles.sectionHeading, { color: colors.text }]}>
              Verified Source Listing
            </Text>
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
                <Text style={[styles.sourceTitle, { color: colors.text }]} numberOfLines={1}>
                  {opp.source || 'Original Career Portal'}
                </Text>
                <Text style={[styles.sourceUrl, { color: colors.textMuted }]} numberOfLines={1}>
                  {opp.originalUrl}
                </Text>
              </View>
              <ArrowRight2 size={16} color={colors.accent} />
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Plan a Follow-Up Cadence */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionHeading, { color: colors.text }]}>
            Follow-Up Cadence
          </Text>
          <View style={styles.followUpRow}>
            {[
              { id: '3 Days', label: 'In 3 Days' },
              { id: '1 Week', label: 'In 1 Week' },
              { id: '2 Weeks', label: 'In 2 Weeks' },
            ].map((cad) => {
              const isSelected = followUpDate === cad.id;
              return (
                <TouchableOpacity
                  key={cad.id}
                  style={[
                    styles.followUpPill,
                    {
                      backgroundColor: isSelected
                        ? colors.accent
                        : isDark
                        ? colors.card
                        : '#FFFFFF',
                      borderColor: isSelected ? colors.accent : colors.borderSubtle,
                    },
                  ]}
                  onPress={() => handleScheduleFollowUp(cad.id)}
                >
                  <Calendar size={13} color={isSelected ? '#FFF' : colors.accent} />
                  <Text
                    style={[
                      styles.followUpPillText,
                      { color: isSelected ? '#FFF' : colors.text },
                    ]}
                  >
                    {cad.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Private Dossier Notes */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionHeading, { color: colors.text }]}>
            Your Notes (Private to Device)
          </Text>
          <TextInput
            style={[
              styles.notesInput,
              {
                backgroundColor: isDark ? colors.card : '#FFFFFF',
                borderColor: colors.borderSubtle,
                color: colors.text,
              },
            ]}
            placeholder="Add personal prep notes, interview dates, or recruiter compensation limits…"
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={4}
            value={privateNote}
            onChangeText={(text) => {
              setPrivateNote(text);
              updateNotes(opp.id, text);
            }}
          />
        </View>

        {/* Tech Stack Skills */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionHeading, { color: colors.text }]}>
            Required Technical Stack
          </Text>
          <View style={styles.tagsWrap}>
            {opp.tags.map((tag: string, index: number) => (
              <View
                key={index}
                style={[
                  styles.tagPill,
                  {
                    backgroundColor: isDark ? colors.card : '#FFFFFF',
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={[styles.tagText, { color: colors.text }]}>{tag}</Text>
              </View>
            ))}
          </View>
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
        <TouchableOpacity
          style={[styles.bottomSmallBtn, { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA' }]}
          onPress={() => router.push(`/composer/${opp.id}` as any)}
        >
          <Sms size={16} color={colors.accent} variant="Bold" />
          <Text style={[styles.bottomSmallBtnText, { color: colors.text }]}>Outreach</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.bottomPrimaryBtn,
            { backgroundColor: isApplied ? '#10B981' : colors.accent },
          ]}
          onPress={isApplied ? handlePrepareAction : handleAutoApply}
        >
          <Flash size={16} color="#FFFFFF" variant="Bold" />
          <Text style={styles.bottomPrimaryText}>
            {isApplied ? 'Application Dispatched ✓' : 'Auto-Apply with Active CV'}
          </Text>
        </TouchableOpacity>
      </View>
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
  headerTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: 110,
  },
  orgHeader: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  orgAvatarLarge: {
    width: 64,
    height: 64,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  orgName: {
    fontSize: 14,
    fontFamily: FONTS.semibold,
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    textAlign: 'center',
    letterSpacing: -0.4,
    marginBottom: SPACING.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  factsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: SPACING.lg,
  },
  factPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
  },
  factText: {
    fontSize: 13,
    fontFamily: FONTS.semibold,
  },
  analysisCard: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.xl,
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACING.sm,
  },
  analysisTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
  reasoningText: {
    fontSize: 13.5,
    fontFamily: FONTS.regular,
    lineHeight: 19,
    marginBottom: SPACING.md,
  },
  pointsGroup: {
    marginTop: SPACING.sm,
  },
  pointsHeading: {
    fontSize: 12.5,
    fontFamily: FONTS.bold,
    marginBottom: 6,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  pointText: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    flex: 1,
  },
  sectionBlock: {
    marginBottom: SPACING.xl,
  },
  sectionHeading: {
    fontSize: 17,
    fontFamily: FONTS.bold,
    letterSpacing: -0.3,
    marginBottom: SPACING.sm,
  },
  descText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    lineHeight: 22,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 12.5,
    fontFamily: FONTS.medium,
  },
  bottomActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
  },
  bottomSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
  },
  bottomSmallBtnText: {
    fontSize: 13,
    fontFamily: FONTS.semibold,
  },
  bottomPrimaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
  },
  bottomPrimaryText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontFamily: FONTS.bold,
  },
  reqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  reqText: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONTS.medium,
  },
  sourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  sourceTitle: {
    fontSize: 14,
    fontFamily: FONTS.bold,
  },
  sourceUrl: {
    fontSize: 11.5,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  followUpRow: {
    flexDirection: 'row',
    gap: 8,
  },
  followUpPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  followUpPillText: {
    fontSize: 12,
    fontFamily: FONTS.semibold,
  },
  notesInput: {
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    padding: 12,
    fontSize: 13,
    minHeight: 90,
    textAlignVertical: 'top',
  },
});
