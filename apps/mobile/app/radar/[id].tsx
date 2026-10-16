import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Switch,
  ActivityIndicator,
  Share as RNShare,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { Badge, Button, ConfirmBottomSheet, BottomSheet, CustomDateTimePickerSheet } from '@/components/ui';
import { OpportunityCard } from '@/components/opportunities/OpportunityCard';
import { SAMPLE_RADARS, SAMPLE_OPPORTUNITIES } from '@/constants/mockData';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/theme';
import {
  ArrowLeft2,
  Radar2,
  Play,
  Share,
  Trash,
  Flash,
  Timer1,
  TickCircle,
  DocumentCopy,
  Clock,
  Setting2,
  MagicStar,
  DirectSend,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import type { OpportunityRadar, AutonomyLevel, Opportunity } from '@prospect/types';
import { usePipeline } from '@/context/PipelineContext';

export default function RadarDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { isSaved, isApplied, toggleSave, applyToOpportunity, scheduleFollowUp } = usePipeline();

  const foundRadar = SAMPLE_RADARS.find((r) => r.id === id) || SAMPLE_RADARS[0];
  const [radar, setRadar] = useState<OpportunityRadar>(foundRadar);
  const [activeTab, setActiveTab] = useState<'gotten' | 'automate' | 'edit'>('gotten');
  const [isScanning, setIsScanning] = useState(false);
  const [isDeleteSheetOpen, setIsDeleteSheetOpen] = useState(false);

  // BottomSheet Notification State (Zero raw Alert.alert)
  const [noticeSheet, setNoticeSheet] = useState<{
    visible: boolean;
    title: string;
    subtitle: string;
  }>({
    visible: false,
    title: '',
    subtitle: '',
  });

  // Scheduling state using CustomDateTimePickerSheet
  const [schedulingOpp, setSchedulingOpp] = useState<Opportunity | null>(null);

  // Editable local state
  const [editedTitle, setEditedTitle] = useState(radar.title);
  const [editedPrompt, setEditedPrompt] = useState(radar.prompt);
  const [editedFrequency, setEditedFrequency] = useState(radar.frequency);
  const [customCadenceDate, setCustomCadenceDate] = useState<string>(
    radar.frequency === 'custom' ? (radar.scheduleDescription || '') : ''
  );
  const [isCustomCadenceOpen, setIsCustomCadenceOpen] = useState(false);
  const [editedAutonomy, setEditedAutonomy] = useState<AutonomyLevel>(radar.autonomyLevel || 'approve');
  const [isActive, setIsActive] = useState(radar.status === 'active');
  const [instantAlerts, setInstantAlerts] = useState(true);
  const [filterDuplicates, setFilterDuplicates] = useState(true);

  // Discovered matches
  const discoveredOpportunities = SAMPLE_OPPORTUNITIES.filter((opp) => {
    if (radar.category && opp.type === radar.category) return true;
    return opp.matchScore >= 88;
  });

  const handleToggleSave = (oppId: string) => {
    const opp = SAMPLE_OPPORTUNITIES.find((o) => o.id === oppId);
    if (opp) toggleSave(opp);
  };

  const handleAutoApply = (opp: Opportunity) => {
    applyToOpportunity(opp);
    setNoticeSheet({
      visible: true,
      title: 'Autonomous Application Queued',
      subtitle: `Application calibrated for ${opp.organization}. Added to Active Pipeline.`,
    });
  };

  const handleMailPitch = (opp: Opportunity) => {
    router.push(`/composer/${opp.id}` as any);
  };

  const handleRunScan = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsScanning(true);
    await new Promise((res) => setTimeout(res, 1200));
    setIsScanning(false);

    setRadar((prev) => ({
      ...prev,
      lastRunAt: new Date().toISOString(),
      totalFound: prev.totalFound + 2,
      newSinceLastCheck: 2,
    }));

    setNoticeSheet({
      visible: true,
      title: 'Scan Complete',
      subtitle: '2 new verified opportunities detected and added to your matches feed.',
    });
  };

  const handleToggleActive = () => {
    Haptics.selectionAsync();
    const next = !isActive;
    setIsActive(next);
    setRadar((prev) => ({
      ...prev,
      status: next ? 'active' : 'paused',
    }));
  };

  const handleSaveEdits = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const scheduleDesc =
      editedFrequency === 'custom' && customCadenceDate
        ? (customCadenceDate.startsWith('Custom:') ? customCadenceDate : `Custom: ${customCadenceDate}`)
        : `Runs ${editedFrequency} at 08:30 AM`;

    setRadar((prev) => ({
      ...prev,
      title: editedTitle.trim() || prev.title,
      prompt: editedPrompt.trim() || prev.prompt,
      frequency: editedFrequency,
      scheduleDescription: scheduleDesc,
      autonomyLevel: editedAutonomy,
      status: isActive ? 'active' : 'paused',
    }));
    setActiveTab('gotten');
    setNoticeSheet({
      visible: true,
      title: 'Radar Configuration Saved',
      subtitle: `Automated scraping rules and schedule updated (${scheduleDesc}).`,
    });
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await RNShare.share({
        message: `ProspectAI Radar: "${radar.title}"\nQuery: ${radar.prompt}\nMatches: ${radar.totalFound} found across 120+ portals`,
        title: radar.title,
      });
    } catch {}
  };

  const handleDuplicate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setNoticeSheet({
      visible: true,
      title: 'Radar Duplicated',
      subtitle: `A copy of "${radar.title}" has been added to your radar list.`,
    });
  };

  const handleConfirmDelete = () => {
    setIsDeleteSheetOpen(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    router.back();
  };

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

        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerScreenTitle, { color: colors.text }]} numberOfLines={1}>
            {radar.title}
          </Text>
          <Text style={[styles.headerScreenSub, { color: colors.textMuted }]}>
            {radar.scheduleDescription || `Runs ${radar.frequency}`}
          </Text>
        </View>

        <View style={styles.headerActionsRight}>
          <TouchableOpacity
            style={[styles.roundBtn, { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA' }]}
            onPress={handleShare}
            activeOpacity={0.7}
          >
            <Share size={18} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roundBtn, { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA' }]}
            onPress={() => setIsDeleteSheetOpen(true)}
            activeOpacity={0.7}
          >
            <Trash size={18} color={colors.error || '#EF4444'} />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 24) + 40 },
          ]}
        >
          {/* Radar Hero Status Card */}
          <View
            style={[
              styles.heroCard,
              {
                backgroundColor: isDark ? colors.card : '#FFFFFF',
                borderColor: colors.borderSubtle,
              },
            ]}
          >
            <View style={styles.heroTopRow}>
              <View style={styles.heroLeft}>
                <View
                  style={[
                    styles.radarIconBox,
                    { backgroundColor: isActive ? 'rgba(255, 102, 0, 0.12)' : 'rgba(148, 163, 184, 0.15)' },
                  ]}
                >
                  <Radar2 size={22} color={isActive ? colors.accent : colors.textMuted} variant="Bold" />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.heroRadarTitle, { color: colors.text }]} numberOfLines={1}>
                    {radar.title}
                  </Text>
                  <Text style={[styles.heroFrequency, { color: colors.textMuted }]}>
                    {radar.scheduleDescription}
                  </Text>
                </View>
              </View>

              {/* Status Switch */}
              <View style={styles.switchRow}>
                <View style={[styles.pulseBeacon, { backgroundColor: isActive ? '#10B981' : colors.textMuted }]} />
                <Switch
                  value={isActive}
                  onValueChange={handleToggleActive}
                  trackColor={{ false: isDark ? '#334155' : '#CBD5E1', true: colors.accent }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            {/* Prompt Quote */}
            <Text style={[styles.heroPromptQuote, { color: colors.textSecondary }]}>
              "{radar.prompt}"
            </Text>

            {/* Metrics Strip & Scan Button */}
            <View style={[styles.heroFooterRow, { borderTopColor: colors.borderSubtle }]}>
              <View style={styles.heroMetricItem}>
                <Text style={[styles.metricNumber, { color: colors.text }]}>{radar.totalFound}</Text>
                <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Total Matches</Text>
              </View>

              <View style={styles.heroMetricItem}>
                <Text style={[styles.metricNumber, { color: colors.accent }]}>+{radar.newSinceLastCheck}</Text>
                <Text style={[styles.metricLabel, { color: colors.textMuted }]}>New Today</Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.heroScanBtn,
                  {
                    backgroundColor: colors.accent,
                  },
                ]}
                onPress={handleRunScan}
                disabled={isScanning}
                activeOpacity={0.8}
              >
                {isScanning ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Play size={13} color="#FFFFFF" variant="Bold" />
                    <Text style={styles.heroScanBtnText}>Scan Now</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Navigation Tabs */}
          <View style={[styles.tabBarWrap, { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA' }]}>
            {[
              { id: 'gotten', label: `Matches (${discoveredOpportunities.length})` },
              { id: 'automate', label: 'Automation & Rules' },
              { id: 'edit', label: 'Edit Query' },
            ].map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[
                    styles.tabBtn,
                    isSelected && {
                      backgroundColor: isDark ? colors.card : '#FFFFFF',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.1,
                      shadowRadius: 2,
                      elevation: 2,
                    },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setActiveTab(tab.id as any);
                  }}
                >
                  <Text
                    style={[
                      styles.tabBtnText,
                      {
                        color: isSelected ? colors.text : colors.textMuted,
                        fontFamily: isSelected ? FONTS.bold : FONTS.medium,
                      },
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Tab 1: Discovered Opportunities Feed */}
          {activeTab === 'gotten' && (
            <View style={styles.feedSection}>
              {discoveredOpportunities.map((opp) => (
                <OpportunityCard
                  key={opp.id}
                  opportunity={opp}
                  isSaved={isSaved(opp.id)}
                  isApplied={isApplied(opp.id)}
                  onToggleSave={() => handleToggleSave(opp.id)}
                  onAutoApply={() => handleAutoApply(opp)}
                  onMailPitch={() => handleMailPitch(opp)}
                  onSchedule={() => setSchedulingOpp(opp)}
                />
              ))}
            </View>
          )}

          {/* Tab 2: Automation & Rules */}
          {activeTab === 'automate' && (
            <View style={styles.automateSection}>
              {/* Autonomy Level */}
              <View style={styles.formCard}>
                <Text style={[styles.formCardHeading, { color: colors.text }]}>Autonomy Level</Text>
                <Text style={[styles.formCardSub, { color: colors.textMuted }]}>
                  Define how AI acts when high-fit matches are discovered
                </Text>

                <View style={styles.autonomyOptions}>
                  {[
                    { id: 'auto', title: 'Full Autonomous Apply', desc: 'Dispatches tailored proposal immediately upon detection' },
                    { id: 'approve', title: 'Semi-Autonomous (Approve First)', desc: 'Prepares proposal draft and waits for your 1-tap confirmation' },
                    { id: 'notify', title: 'Passive Monitor & Notify', desc: 'Alerts you via push / WhatsApp with match summary' },
                  ].map((level) => {
                    const isSelected = editedAutonomy === level.id;
                    return (
                      <TouchableOpacity
                        key={level.id}
                        style={[
                          styles.autonomyCard,
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
                        onPress={() => {
                          Haptics.selectionAsync();
                          setEditedAutonomy(level.id as any);
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.autonomyTitle,
                              {
                                color: isSelected ? colors.accent : colors.text,
                                fontFamily: isSelected ? FONTS.bold : FONTS.semibold,
                              },
                            ]}
                          >
                            {level.title}
                          </Text>
                          <Text style={[styles.autonomyDesc, { color: colors.textMuted }]}>
                            {level.desc}
                          </Text>
                        </View>
                        {isSelected && <TickCircle size={18} color={colors.accent} variant="Bold" />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Schedule Frequency Cadence */}
              <View style={styles.formCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                  <Text style={[styles.formCardHeading, { color: colors.text }]}>Scan Frequency</Text>
                  {editedFrequency === 'custom' && customCadenceDate ? (
                    <TouchableOpacity onPress={() => setIsCustomCadenceOpen(true)}>
                      <Text style={{ fontFamily: FONTS.semiBold, fontSize: 12, color: colors.accent }}>
                        Edit Timing ✎
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
                <Text style={[styles.formCardSub, { color: colors.textMuted }]}>
                  {editedFrequency === 'custom' && customCadenceDate
                    ? `Configured: ${customCadenceDate}`
                    : 'Select how often this autonomous scout scans new listings'}
                </Text>

                <View style={styles.freqRow}>
                  {(['weekdays', 'daily', 'weekly', 'custom'] as const).map((freq) => {
                    const isSelected = editedFrequency === freq;
                    return (
                      <TouchableOpacity
                        key={freq}
                        style={[
                          styles.freqBtn,
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
                          if (freq === 'custom') {
                            setIsCustomCadenceOpen(true);
                          } else {
                            setEditedFrequency(freq);
                          }
                        }}
                      >
                        <Text
                          style={[
                            styles.freqBtnText,
                            {
                              color: isSelected ? '#FFFFFF' : colors.textSecondary,
                              fontFamily: isSelected ? FONTS.bold : FONTS.medium,
                            },
                          ]}
                        >
                          {freq.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Toggles */}
              <View style={styles.formCard}>
                <View style={styles.toggleItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.toggleHeading, { color: colors.text }]}>Instant Push Alerts</Text>
                    <Text style={[styles.toggleDesc, { color: colors.textMuted }]}>
                      Notify as soon as 90%+ match is confirmed
                    </Text>
                  </View>
                  <Switch
                    value={instantAlerts}
                    onValueChange={setInstantAlerts}
                    trackColor={{ false: '#334155', true: colors.accent }}
                  />
                </View>

                <View style={[styles.toggleItem, { borderTopWidth: 1, borderTopColor: colors.borderSubtle, paddingTop: 10, marginTop: 4 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.toggleHeading, { color: colors.text }]}>Filter Duplicates</Text>
                    <Text style={[styles.toggleDesc, { color: colors.textMuted }]}>
                      Suppress roles reposted on alternate boards
                    </Text>
                  </View>
                  <Switch
                    value={filterDuplicates}
                    onValueChange={setFilterDuplicates}
                    trackColor={{ false: '#334155', true: colors.accent }}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.accent }]}
                onPress={handleSaveEdits}
              >
                <Text style={styles.saveBtnText}>Save Automation Rules</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Tab 3: Edit Query */}
          {activeTab === 'edit' && (
            <View style={styles.editSection}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Radar Title</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: isDark ? colors.card : '#FFFFFF',
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  value={editedTitle}
                  onChangeText={setEditedTitle}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Natural Language Scout Query</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: isDark ? colors.card : '#FFFFFF',
                      borderColor: colors.border,
                      color: colors.text,
                      minHeight: 90,
                    },
                  ]}
                  value={editedPrompt}
                  onChangeText={setEditedPrompt}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.accent }]}
                onPress={handleSaveEdits}
              >
                <Text style={styles.saveBtnText}>Update Radar Spec</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Custom Date Time Picker Sheet (Replaces raw alerts for scheduling) */}
      {schedulingOpp && (
        <CustomDateTimePickerSheet
          visible={!!schedulingOpp}
          onClose={() => setSchedulingOpp(null)}
          title={`Schedule for ${schedulingOpp.organization}`}
          subtitle={schedulingOpp.title}
          onConfirm={(scheduledDate, objective) => {
            scheduleFollowUp(schedulingOpp.id, scheduledDate, objective);
            setNoticeSheet({
              visible: true,
              title: 'Follow-Up Scheduled & Synced',
              subtitle: `Reminder cadence set for ${scheduledDate} (${objective}). Added to your active pipeline.`,
            });
          }}
        />
      )}

      {/* Custom Scan Frequency Picker Sheet */}
      <CustomDateTimePickerSheet
        visible={isCustomCadenceOpen}
        onClose={() => setIsCustomCadenceOpen(false)}
        title="Configure Radar Scan Cadence"
        subtitle={`Set custom execution timing for "${radar.title}"`}
        showObjective={false}
        confirmText="Save Scan Timing"
        onConfirm={(date) => {
          setEditedFrequency('custom');
          setCustomCadenceDate(date);
          setIsCustomCadenceOpen(false);
          setRadar((prev) => ({
            ...prev,
            frequency: 'custom',
            scheduleDescription: `Custom: ${date}`,
          }));
          setNoticeSheet({
            visible: true,
            title: 'Scan Frequency Updated',
            subtitle: `Autonomous scout for "${radar.title}" scheduled for ${date}.`,
          });
        }}
      />

      {/* Confirmation Notification BottomSheet (Zero raw alerts) */}
      <BottomSheet
        visible={noticeSheet.visible}
        onClose={() => setNoticeSheet({ ...noticeSheet, visible: false })}
        title={noticeSheet.title}
        subtitle={noticeSheet.subtitle}
        icon={<TickCircle size={22} color={colors.accent} variant="Bold" />}
      >
        <View style={{ paddingVertical: SPACING.xs }}>
          <Button
            title="Done"
            variant="accent"
            size="md"
            onPress={() => setNoticeSheet({ ...noticeSheet, visible: false })}
          />
        </View>
      </BottomSheet>

      {/* Delete Confirmation Sheet (ConfirmBottomSheet) */}
      <ConfirmBottomSheet
        visible={isDeleteSheetOpen}
        onCancel={() => setIsDeleteSheetOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Radar?"
        description={`Are you sure you want to delete "${radar.title}"? Autonomous background scanning for this query will be discontinued.`}
        confirmText="Delete Radar"
        variant="destructive"
      />
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
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  roundBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    marginHorizontal: 10,
  },
  headerScreenTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
  headerScreenSub: {
    fontSize: 11.5,
    fontFamily: FONTS.regular,
  },
  headerActionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scrollContent: {
    padding: SPACING.md,
    gap: 14,
  },
  heroCard: {
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    padding: SPACING.md,
    gap: 12,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  radarIconBox: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroRadarTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
  heroFrequency: {
    fontSize: 12,
    marginTop: 2,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pulseBeacon: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  heroPromptQuote: {
    fontSize: 13.5,
    fontFamily: FONTS.regular,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  heroFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  heroMetricItem: {
    alignItems: 'flex-start',
  },
  metricNumber: {
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
  metricLabel: {
    fontSize: 11,
    fontFamily: FONTS.regular,
  },
  heroScanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.md,
  },
  heroScanBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontFamily: FONTS.bold,
  },
  tabBarWrap: {
    flexDirection: 'row',
    borderRadius: BORDER_RADIUS.lg,
    padding: 3,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.md,
  },
  tabBtnText: {
    fontSize: 12.5,
  },
  feedSection: {
    gap: 10,
  },
  automateSection: {
    gap: 14,
  },
  formCard: {
    gap: 10,
  },
  formCardHeading: {
    fontSize: 13.5,
    fontFamily: FONTS.bold,
  },
  formCardSub: {
    fontSize: 12,
    lineHeight: 16,
  },
  autonomyOptions: {
    gap: 8,
    marginTop: 2,
  },
  autonomyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.2,
  },
  autonomyTitle: {
    fontSize: 13.5,
  },
  autonomyDesc: {
    fontSize: 11.5,
    marginTop: 2,
  },
  freqRow: {
    flexDirection: 'row',
    gap: 8,
  },
  freqBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  freqBtnText: {
    fontSize: 11.5,
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  toggleHeading: {
    fontSize: 13.5,
    fontFamily: FONTS.semibold,
  },
  toggleDesc: {
    fontSize: 11.5,
    marginTop: 2,
  },
  editSection: {
    gap: 12,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12.5,
    fontFamily: FONTS.semibold,
  },
  textInput: {
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  saveBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: BORDER_RADIUS.md,
    marginTop: 6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FONTS.bold,
  },
});
