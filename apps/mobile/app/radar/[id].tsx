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
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { Badge, Button, Card } from '@/components/ui';
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
  ArrowRight2,
  Filter,
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
  const [copiedLink, setCopiedLink] = useState(false);

  // Editable local state
  const [editedTitle, setEditedTitle] = useState(radar.title);
  const [editedPrompt, setEditedPrompt] = useState(radar.prompt);
  const [editedFrequency, setEditedFrequency] = useState(radar.frequency);
  const [editedAutonomy, setEditedAutonomy] = useState<AutonomyLevel>(radar.autonomyLevel || 'approve');
  const [isActive, setIsActive] = useState(radar.status === 'active');
  const [instantAlerts, setInstantAlerts] = useState(true);
  const [filterDuplicates, setFilterDuplicates] = useState(true);

  // Opportunities discovered by this radar
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
    Alert.alert('Autonomous Application Dispatched', `Application calibrated for ${opp.organization}. Added to Pipeline.`);
  };

  const handleMailPitch = (opp: Opportunity) => {
    router.push(`/composer/${opp.id}` as any);
  };

  const handleSchedule = (opp: Opportunity) => {
    scheduleFollowUp(opp.id, 'In 3 Days', 'General follow-up check');
    Alert.alert('Follow-Up Scheduled', `Follow-up queued for ${opp.organization}. Added to Pipeline.`);
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
    setRadar((prev) => ({
      ...prev,
      title: editedTitle.trim() || prev.title,
      prompt: editedPrompt.trim() || prev.prompt,
      frequency: editedFrequency,
      scheduleDescription: `Runs ${editedFrequency} at 08:30 AM`,
      autonomyLevel: editedAutonomy,
      status: isActive ? 'active' : 'paused',
    }));
    setActiveTab('gotten');
  };

  const handleShare = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDuplicate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Radar Duplicated', `A copy of "${radar.title}" has been added to your radar list.`);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Radar',
      `Delete "${radar.title}"? Autonomous background discovery for this search will stop.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            router.back();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Top Header Bar */}
      <View style={[styles.topBar, { borderBottomColor: colors.borderSubtle }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.navBtn, { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA' }]}
          activeOpacity={0.7}
        >
          <ArrowLeft2 size={20} color={colors.text} variant="Linear" />
        </TouchableOpacity>

        <View style={styles.titleWrapper}>
          <Text style={[styles.pageTitle, { color: colors.text }]} numberOfLines={1}>
            {radar.title}
          </Text>
          <Text style={[styles.pageSub, { color: colors.textMuted }]}>
            {radar.scheduleDescription}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleShare}
          style={[styles.navBtn, { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA' }]}
          activeOpacity={0.7}
        >
          {copiedLink ? (
            <TickCircle size={18} color={colors.success} variant="Bold" />
          ) : (
            <Share size={18} color={colors.text} variant="Linear" />
          )}
        </TouchableOpacity>
      </View>

      {/* Modern 3-Segment Tab Bar */}
      <View style={[styles.tabBar, { borderBottomColor: colors.borderSubtle }]}>
        {[
          { id: 'gotten', label: `Matches (${radar.totalFound})` },
          { id: 'automate', label: 'Automation' },
          { id: 'edit', label: 'Settings' },
        ].map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => {
                Haptics.selectionAsync();
                setActiveTab(tab.id as any);
              }}
              style={[
                styles.tabItem,
                isSelected && { borderBottomColor: colors.accent, borderBottomWidth: 2.5 },
              ]}
            >
              <Text
                style={[
                  styles.tabItemText,
                  {
                    color: isSelected ? colors.accent : colors.textMuted,
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

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 24) + 85 },
          ]}
        >
          {/* TAB 1: WHAT IT HAS GOTTEN */}
          {activeTab === 'gotten' && (
            <View>
              {/* Clean Metric Stats Card */}
              <View style={styles.metricRow}>
                <View
                  style={[
                    styles.metricBox,
                    { backgroundColor: isDark ? colors.card : '#FFFFFF', borderColor: colors.border },
                  ]}
                >
                  <Text style={[styles.metricNumber, { color: colors.text }]}>
                    {radar.totalFound}
                  </Text>
                  <Text style={[styles.metricLabel, { color: colors.textMuted }]}>
                    Matches
                  </Text>
                </View>

                <View
                  style={[
                    styles.metricBox,
                    { backgroundColor: isDark ? colors.card : '#FFFFFF', borderColor: colors.border },
                  ]}
                >
                  <Text style={[styles.metricNumber, { color: colors.accent }]}>
                    +{radar.newSinceLastCheck}
                  </Text>
                  <Text style={[styles.metricLabel, { color: colors.textMuted }]}>
                    New Today
                  </Text>
                </View>

                <View
                  style={[
                    styles.metricBox,
                    { backgroundColor: isDark ? colors.card : '#FFFFFF', borderColor: colors.border },
                  ]}
                >
                  <Text style={[styles.metricNumber, { color: colors.success }]}>
                    99%
                  </Text>
                  <Text style={[styles.metricLabel, { color: colors.textMuted }]}>
                    Fit Score
                  </Text>
                </View>
              </View>

              {/* Natural Query Preview */}
              <View
                style={[
                  styles.promptCard,
                  { backgroundColor: isDark ? colors.card : '#F8FAFC', borderColor: colors.borderSubtle },
                ]}
              >
                <Text style={[styles.promptCardLabel, { color: colors.textMuted }]}>
                  Search Criteria
                </Text>
                <Text style={[styles.promptCardText, { color: colors.text }]}>
                  "{radar.prompt}"
                </Text>
              </View>

              {/* List of Discovered Opportunities */}
              <View style={styles.listSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Discovered Opportunities ({discoveredOpportunities.length})
                </Text>

                {discoveredOpportunities.map((opp) => (
                  <OpportunityCard
                    key={opp.id}
                    opportunity={opp}
                    isSaved={isSaved(opp.id)}
                    isApplied={isApplied(opp.id)}
                    onToggleSave={handleToggleSave}
                    onAutoApply={handleAutoApply}
                    onMailPitch={handleMailPitch}
                    onSchedule={handleSchedule}
                  />
                ))}
              </View>
            </View>
          )}

          {/* TAB 2: AUTOMATION & APPROACHES */}
          {activeTab === 'automate' && (
            <View>
              {/* Active Switch Card */}
              <View
                style={[
                  styles.cardRow,
                  { backgroundColor: isDark ? colors.card : '#FFFFFF', borderColor: colors.border },
                ]}
              >
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={[styles.cardRowTitle, { color: colors.text }]}>
                    Background Radar Engine
                  </Text>
                  <Text style={[styles.cardRowSub, { color: colors.textMuted }]}>
                    {isActive ? 'Scanning sources automatically' : 'Paused'}
                  </Text>
                </View>
                <Switch
                  value={isActive}
                  onValueChange={handleToggleActive}
                  trackColor={{ false: colors.border, true: colors.accent }}
                />
              </View>

              {/* Autonomy Level */}
              <View style={styles.sectionWrap}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Action Mode
                </Text>

                {[
                  {
                    id: 'assist',
                    title: 'Assist Only',
                    desc: 'Notify when match found. No drafts prepared.',
                  },
                  {
                    id: 'approve',
                    title: 'Review First (Recommended)',
                    desc: 'Pre-draft customized proposals for your 1-tap review.',
                  },
                  {
                    id: 'automate',
                    title: 'Autonomous Outreach',
                    desc: 'Automatically submit proposals for matches over 95%.',
                  },
                ].map((mode) => {
                  const isSelected = editedAutonomy === mode.id;
                  return (
                    <TouchableOpacity
                      key={mode.id}
                      style={[
                        styles.modeCard,
                        {
                          backgroundColor: isSelected
                            ? isDark
                              ? 'rgba(255, 102, 0, 0.12)'
                              : '#FFF5EB'
                            : isDark
                            ? colors.card
                            : '#FFFFFF',
                          borderColor: isSelected ? colors.accent : colors.border,
                        },
                      ]}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setEditedAutonomy(mode.id as AutonomyLevel);
                      }}
                      activeOpacity={0.8}
                    >
                      <View style={styles.modeCardTop}>
                        <Text
                          style={[
                            styles.modeCardName,
                            { color: isSelected ? colors.accent : colors.text },
                          ]}
                        >
                          {mode.title}
                        </Text>
                        {isSelected && <TickCircle size={18} color={colors.accent} variant="Bold" />}
                      </View>
                      <Text style={[styles.modeCardDesc, { color: colors.textSecondary }]}>
                        {mode.desc}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Clean Filter Toggles */}
              <View style={styles.sectionWrap}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Filters
                </Text>

                <View
                  style={[
                    styles.toggleCard,
                    { backgroundColor: isDark ? colors.card : '#FFFFFF', borderColor: colors.border },
                  ]}
                >
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={[styles.toggleCardTitle, { color: colors.text }]}>
                      Instant Alert on High Fit
                    </Text>
                    <Text style={[styles.toggleCardSub, { color: colors.textMuted }]}>
                      Push notification when fit is 90% or higher
                    </Text>
                  </View>
                  <Switch
                    value={instantAlerts}
                    onValueChange={setInstantAlerts}
                    trackColor={{ false: colors.border, true: colors.accent }}
                  />
                </View>

                <View
                  style={[
                    styles.toggleCard,
                    { backgroundColor: isDark ? colors.card : '#FFFFFF', borderColor: colors.border, marginTop: 8 },
                  ]}
                >
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={[styles.toggleCardTitle, { color: colors.text }]}>
                      Filter Duplicate Reposts
                    </Text>
                    <Text style={[styles.toggleCardSub, { color: colors.textMuted }]}>
                      Skip duplicated listings across job boards
                    </Text>
                  </View>
                  <Switch
                    value={filterDuplicates}
                    onValueChange={setFilterDuplicates}
                    trackColor={{ false: colors.border, true: colors.accent }}
                  />
                </View>
              </View>
            </View>
          )}

          {/* TAB 3: SETTINGS & EDIT */}
          {activeTab === 'edit' && (
            <View>
              {/* Radar Title */}
              <View style={styles.inputGroup}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Name</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: isDark ? colors.card : '#FFFFFF',
                      borderColor: colors.border,
                      color: colors.text,
                      fontFamily: FONTS.medium,
                    },
                  ]}
                  value={editedTitle}
                  onChangeText={setEditedTitle}
                  placeholder="Radar Name"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              {/* Natural Query Prompt */}
              <View style={styles.inputGroup}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Search Query</Text>
                <TextInput
                  style={[
                    styles.multilineInput,
                    {
                      backgroundColor: isDark ? colors.card : '#FFFFFF',
                      borderColor: colors.border,
                      color: colors.text,
                      fontFamily: FONTS.regular,
                    },
                  ]}
                  multiline
                  numberOfLines={4}
                  value={editedPrompt}
                  onChangeText={setEditedPrompt}
                  placeholder="Describe criteria, skills, and rates…"
                  placeholderTextColor={colors.textMuted}
                  textAlignVertical="top"
                />
              </View>

              {/* Frequency */}
              <View style={styles.inputGroup}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Frequency</Text>
                <View style={styles.freqRow}>
                  {(['daily', 'weekdays', 'weekly'] as const).map((freq) => {
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
                          setEditedFrequency(freq);
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
                          {freq === 'weekdays' ? 'Weekdays' : freq === 'daily' ? 'Daily' : 'Weekly'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <Button
                title="Save Changes"
                variant="accent"
                size="md"
                onPress={handleSaveEdits}
                style={{ marginTop: 8 }}
              />

              {/* Options */}
              <View style={[styles.optionsGroup, { borderTopColor: colors.borderSubtle }]}>
                <TouchableOpacity
                  style={[
                    styles.optionRow,
                    { backgroundColor: isDark ? colors.card : '#FFFFFF', borderColor: colors.border },
                  ]}
                  onPress={handleDuplicate}
                  activeOpacity={0.75}
                >
                  <DocumentCopy size={18} color={colors.text} variant="Linear" />
                  <Text style={[styles.optionRowText, { color: colors.text }]}>Duplicate Radar</Text>
                  <ArrowRight2 size={14} color={colors.textMuted} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.optionRow,
                    { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5', marginTop: 10 },
                  ]}
                  onPress={handleDelete}
                  activeOpacity={0.75}
                >
                  <Trash size={18} color="#EF4444" variant="Bold" />
                  <Text style={[styles.optionRowText, { color: '#EF4444', fontFamily: FONTS.bold }]}>
                    Delete Radar
                  </Text>
                  <ArrowRight2 size={14} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Sticky Clean Bottom Scan Trigger Bar */}
        <View
          style={[
            styles.bottomStickyBar,
            {
              backgroundColor: isDark ? colors.surface : '#FFFFFF',
              borderTopColor: colors.borderSubtle,
            },
          ]}
        >
          <Button
            title={isScanning ? 'Scanning Live Sources…' : 'Scan Now'}
            variant="accent"
            size="lg"
            isLoading={isScanning}
            leftIcon={!isScanning ? <Play size={17} color="#FFFFFF" variant="Bold" /> : undefined}
            onPress={handleRunScan}
            style={{ width: '100%' }}
          />
        </View>
      </KeyboardAvoidingView>
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
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 1,
  },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrapper: {
    flex: 1,
    marginHorizontal: 10,
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
  pageSub: {
    fontSize: 11.5,
    fontFamily: FONTS.regular,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: SPACING.sm,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  tabItemText: {
    fontSize: 12.5,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.md,
  },
  metricBox: {
    flex: 1,
    padding: 12,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  metricNumber: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 10.5,
    fontFamily: FONTS.regular,
  },
  promptCard: {
    padding: 14,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  promptCardLabel: {
    fontSize: 11.5,
    fontFamily: FONTS.medium,
    marginBottom: 4,
  },
  promptCardText: {
    fontSize: 13.5,
    fontFamily: FONTS.regular,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  listSection: {
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    marginBottom: 8,
  },
  sectionWrap: {
    marginTop: SPACING.lg,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
  },
  cardRowTitle: {
    fontSize: 14.5,
    fontFamily: FONTS.bold,
    marginBottom: 2,
  },
  cardRowSub: {
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  modeCard: {
    padding: 14,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    marginBottom: 8,
  },
  modeCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  modeCardName: {
    fontSize: 14,
    fontFamily: FONTS.bold,
  },
  modeCardDesc: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    lineHeight: 17,
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  toggleCardTitle: {
    fontSize: 13,
    fontFamily: FONTS.semibold,
    marginBottom: 2,
  },
  toggleCardSub: {
    fontSize: 11,
    fontFamily: FONTS.regular,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  fieldLabel: {
    fontSize: 12.5,
    fontFamily: FONTS.semibold,
    marginBottom: 6,
  },
  textInput: {
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  multilineInput: {
    minHeight: 90,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    lineHeight: 20,
  },
  freqRow: {
    flexDirection: 'row',
    gap: 8,
  },
  freqBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  freqBtnText: {
    fontSize: 12,
  },
  optionsGroup: {
    marginTop: SPACING.xl,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    gap: 10,
  },
  optionRowText: {
    fontSize: 13.5,
    fontFamily: FONTS.medium,
    flex: 1,
  },
  bottomStickyBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.lg,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    borderTopWidth: 1,
  },
});
