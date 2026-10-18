import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { usePipeline } from '@/context/PipelineContext';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/theme';
import {
  Add,
  DirectSend,
  Microphone2,
  Radar2,
  DocumentText,
  MagicStar,
  Briefcase,
  DollarCircle,
  Location,
  Link2,
  Note,
  Flash,
  TickCircle,
  Buildings,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import type { OpportunityType } from '@prospect/types';

export interface CreateLeadSheetProps {
  visible: boolean;
  onClose: () => void;
}

const PROMPT_STARTERS = [
  'Remote Expo 57 contracts paying >$120/hr in US/EMEA',
  'Fintech AI automation leads for venture-backed startups',
  'Staff React Native mobile roles with equity advisory',
  'B2B mobile audit and performance consulting contracts',
];

export const CreateLeadSheet: React.FC<CreateLeadSheetProps> = ({
  visible,
  onClose,
}) => {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { toggleSave } = usePipeline();

  // Mode: 'ai_scout' | 'manual_entry'
  const [activeTab, setActiveTab] = useState<'ai_scout' | 'manual_entry'>('ai_scout');

  // AI Scout States
  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [selectedType, setSelectedType] = useState<OpportunityType | 'all'>('all');
  const [remoteOnly, setRemoteOnly] = useState(true);
  const [minCompRate, setMinCompRate] = useState<number>(120);

  // Manual Lead Form States
  const [leadTitle, setLeadTitle] = useState('');
  const [organization, setOrganization] = useState('');
  const [compensation, setCompensation] = useState('');
  const [location, setLocation] = useState('Remote · Global');
  const [leadType, setLeadType] = useState<OpportunityType>('contract');
  const [sourceUrl, setSourceUrl] = useState('');
  const [leadNotes, setLeadNotes] = useState('');
  const [isSavingManual, setIsSavingManual] = useState(false);

  const inputRef = useRef<TextInput>(null);

  // Voice toggle
  const handleVoiceToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!isListening) {
      setIsListening(true);
      setTimeout(() => {
        const sampleVoice = 'Principal React Native contracts paying >$130/hr in US/EMEA';
        setQuery(sampleVoice);
        setIsListening(false);
      }, 1400);
    } else {
      setIsListening(false);
    }
  };

  // Submit AI Scout -> Navigates to dedicated Search & Scout Results screen
  const handleExecuteSearch = (customQuery?: string) => {
    const text = customQuery !== undefined ? customQuery : query;
    if (!text.trim()) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
    router.push({
      pathname: '/search-results',
      params: {
        query: text.trim(),
        type: selectedType,
        remoteOnly: remoteOnly ? 'true' : 'false',
        minComp: minCompRate.toString(),
      },
    } as any);
  };

  // Submit Manual Lead Creation
  const handleCreateManualLead = () => {
    if (!leadTitle.trim() || !organization.trim()) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsSavingManual(true);

    const newLead = {
      id: `manual-lead-${Date.now()}`,
      title: leadTitle.trim(),
      organization: organization.trim(),
      location: location.trim() || 'Remote',
      isRemote: location.toLowerCase().includes('remote'),
      remoteType: 'fully_remote' as const,
      compensation: compensation.trim() || '$120 - $150 / hr',
      compensationAmount: 130,
      deadline: new Date(Date.now() + 14 * 86400000).toISOString(),
      type: leadType,
      source: 'Direct Manual Creation',
      sourceType: 'manual_lead',
      originalUrl: sourceUrl.trim() || 'https://internal.pipeline',
      description: leadNotes.trim() || `Manually tracked lead for ${organization.trim()}`,
      summary: leadNotes.trim() || `Direct opportunity at ${organization.trim()}`,
      requirements: [{ text: 'Direct client conversation', isMatched: true }],
      matchScore: 95,
      matchExplanation: 'Manually entered opportunity into your executive pipeline.',
      status: 'discovered' as const,
      freshness: 'new_today' as const,
      tags: ['Direct Lead', leadType.toUpperCase()],
      discoveredAt: new Date().toISOString(),
      timeline: [],
    };

    toggleSave(newLead as any);
    setIsSavingManual(false);
    onClose();

    // Navigate to pipeline with the new lead
    router.push('/pipeline' as any);
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Create & Scout Leads"
      subtitle="Discover high-yield contracts or log direct opportunities"
      icon={<Add size={22} color={colors.accent} variant="Linear" />}
    >
      <View style={styles.sheetContainer}>
        {/* Navigation Switcher Tab */}
        <View style={[styles.tabBar, { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA' }]}>
          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === 'ai_scout' && {
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
              setActiveTab('ai_scout');
            }}
            activeOpacity={0.8}
          >
            <MagicStar
              size={15}
              color={activeTab === 'ai_scout' ? colors.accent : colors.textMuted}
              variant={activeTab === 'ai_scout' ? 'Bold' : 'Linear'}
            />
            <Text
              style={[
                styles.tabBtnText,
                {
                  color: activeTab === 'ai_scout' ? colors.text : colors.textMuted,
                  fontFamily: activeTab === 'ai_scout' ? FONTS.bold : FONTS.medium,
                },
              ]}
            >
              AI Deep Scout
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === 'manual_entry' && {
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
              setActiveTab('manual_entry');
            }}
            activeOpacity={0.8}
          >
            <Briefcase
              size={15}
              color={activeTab === 'manual_entry' ? colors.accent : colors.textMuted}
              variant={activeTab === 'manual_entry' ? 'Bold' : 'Linear'}
            />
            <Text
              style={[
                styles.tabBtnText,
                {
                  color: activeTab === 'manual_entry' ? colors.text : colors.textMuted,
                  fontFamily: activeTab === 'manual_entry' ? FONTS.bold : FONTS.medium,
                },
              ]}
            >
              Manual Lead Entry
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'ai_scout' ? (
          /* TAB 1: AI SCOUT */
          <View style={styles.scoutSection}>
            {/* Main AI Prompt Box */}
            <View
              style={[
                styles.promptBox,
                {
                  backgroundColor: isDark ? colors.card : '#FFFFFF',
                  borderColor: query.length > 0 ? colors.accent : colors.border,
                },
              ]}
            >
              <TextInput
                ref={inputRef}
                style={[
                  styles.promptInput,
                  { color: colors.text, fontFamily: FONTS.regular },
                ]}
                placeholder="Ask LeedAI: e.g. Contract roles > $120/hr matching my CV in US/Europe…"
                placeholderTextColor={colors.textMuted}
                value={query}
                onChangeText={setQuery}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                returnKeyType="search"
                onSubmitEditing={() => handleExecuteSearch()}
              />

              {/* Bottom Tools Toolbar: Microphone RIGHT BESIDE Send Icon */}
              <View style={[styles.promptToolbar, { borderTopColor: colors.borderSubtle }]}>
                {/* Left Side: Context & CV Badges */}
                <View style={styles.toolsLeft}>
                  <View style={[styles.cvMiniPill, { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA' }]}>
                    <DocumentText size={12} color={colors.accent} variant="Bold" />
                    <Text style={[styles.cvMiniPillText, { color: colors.textSecondary }]} numberOfLines={1}>
                      Alex Rivers CV (Active)
                    </Text>
                  </View>
                </View>

                {/* Right Side: Microphone beside Send Icon */}
                <View style={styles.toolsRight}>
                  {/* Microphone Icon */}
                  <TouchableOpacity
                    style={[
                      styles.actionIconBtn,
                      {
                        backgroundColor: isListening
                          ? '#EF4444'
                          : isDark
                          ? colors.surfaceSecondary
                          : '#F0F4FA',
                      },
                    ]}
                    onPress={handleVoiceToggle}
                    activeOpacity={0.75}
                  >
                    <Microphone2
                      size={18}
                      color={isListening ? '#FFFFFF' : colors.accent}
                      variant={isListening ? 'Bold' : 'Linear'}
                    />
                  </TouchableOpacity>

                  {/* Send / Scout Icon */}
                  <TouchableOpacity
                    style={[
                      styles.sendIconBtn,
                      {
                        backgroundColor: query.trim().length > 0 ? colors.accent : colors.border,
                      },
                    ]}
                    onPress={() => handleExecuteSearch()}
                    disabled={!query.trim()}
                    activeOpacity={0.85}
                  >
                    <DirectSend size={18} color="#FFFFFF" variant="Bold" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Quick Calibration Filter Chips */}
            <View style={styles.filterOptionsSection}>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                Quick Lead Calibration
              </Text>

              {/* Category Pills */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
                {[
                  { id: 'all', label: 'All Opportunities' },
                  { id: 'contract', label: 'Contracts Only' },
                  { id: 'job', label: 'Full-Time' },
                  { id: 'freelance', label: 'Freelance' },
                  { id: 'lead', label: 'B2B Client Leads' },
                ].map((item) => {
                  const isSelected = selectedType === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.chipBtn,
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
                        setSelectedType(item.id as any);
                      }}
                    >
                      <Text
                        style={[
                          styles.chipBtnText,
                          {
                            color: isSelected ? '#FFFFFF' : colors.textSecondary,
                            fontFamily: isSelected ? FONTS.bold : FONTS.medium,
                          },
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Toggles Row */}
              <View style={styles.togglesRow}>
                <TouchableOpacity
                  style={[
                    styles.togglePill,
                    {
                      backgroundColor: remoteOnly
                        ? isDark
                          ? 'rgba(255, 102, 0, 0.12)'
                          : '#FFF6F0'
                        : isDark
                        ? colors.card
                        : '#FFFFFF',
                      borderColor: remoteOnly ? colors.accent : colors.border,
                    },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setRemoteOnly(!remoteOnly);
                  }}
                >
                  <TickCircle
                    size={15}
                    color={remoteOnly ? colors.accent : colors.textMuted}
                    variant={remoteOnly ? 'Bold' : 'Linear'}
                  />
                  <Text
                    style={[
                      styles.togglePillText,
                      { color: remoteOnly ? colors.accent : colors.textSecondary },
                    ]}
                  >
                    100% Remote Only
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.togglePill,
                    {
                      backgroundColor: minCompRate >= 120
                        ? isDark
                          ? 'rgba(255, 102, 0, 0.12)'
                          : '#FFF6F0'
                        : isDark
                        ? colors.card
                        : '#FFFFFF',
                      borderColor: minCompRate >= 120 ? colors.accent : colors.border,
                    },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setMinCompRate((prev) => (prev === 120 ? 80 : 120));
                  }}
                >
                  <DollarCircle
                    size={15}
                    color={minCompRate >= 120 ? colors.accent : colors.textMuted}
                    variant="Bold"
                  />
                  <Text
                    style={[
                      styles.togglePillText,
                      { color: minCompRate >= 120 ? colors.accent : colors.textSecondary },
                    ]}
                  >
                    Rate ≥ ${minCompRate}/hr
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Prompt Starters */}
            <View style={styles.promptStartersSection}>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                Suggested Searches
              </Text>
              {PROMPT_STARTERS.map((starter, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.starterCard,
                    {
                      backgroundColor: isDark ? colors.card : '#FFFFFF',
                      borderColor: colors.borderSubtle,
                    },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setQuery(starter);
                    handleExecuteSearch(starter);
                  }}
                  activeOpacity={0.75}
                >
                  <Flash size={14} color={colors.accent} variant="Bold" />
                  <Text style={[styles.starterText, { color: colors.text }]} numberOfLines={1}>
                    {starter}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          /* TAB 2: MANUAL LEAD ENTRY */
          <View style={styles.manualSection}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Role / Opportunity Title *
              </Text>
              <TextInput
                style={[
                  styles.formInput,
                  {
                    backgroundColor: isDark ? colors.card : '#FFFFFF',
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="e.g. Senior Mobile Architecture Lead"
                placeholderTextColor={colors.textMuted}
                value={leadTitle}
                onChangeText={setLeadTitle}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Organization / Client Name *
              </Text>
              <TextInput
                style={[
                  styles.formInput,
                  {
                    backgroundColor: isDark ? colors.card : '#FFFFFF',
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="e.g. Stripe, Linear, or Stealth Startup"
                placeholderTextColor={colors.textMuted}
                value={organization}
                onChangeText={setOrganization}
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  Compensation / Rate
                </Text>
                <TextInput
                  style={[
                    styles.formInput,
                    {
                      backgroundColor: isDark ? colors.card : '#FFFFFF',
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  placeholder="$130 - $160 / hr"
                  placeholderTextColor={colors.textMuted}
                  value={compensation}
                  onChangeText={setCompensation}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  Location / Workstyle
                </Text>
                <TextInput
                  style={[
                    styles.formInput,
                    {
                      backgroundColor: isDark ? colors.card : '#FFFFFF',
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  placeholder="Remote · US/EU"
                  placeholderTextColor={colors.textMuted}
                  value={location}
                  onChangeText={setLocation}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Opportunity Link / Posting URL
              </Text>
              <TextInput
                style={[
                  styles.formInput,
                  {
                    backgroundColor: isDark ? colors.card : '#FFFFFF',
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="https://company.com/job or client portal link"
                placeholderTextColor={colors.textMuted}
                value={sourceUrl}
                onChangeText={setSourceUrl}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Private Context & Strategy Notes
              </Text>
              <TextInput
                style={[
                  styles.formInput,
                  {
                    backgroundColor: isDark ? colors.card : '#FFFFFF',
                    borderColor: colors.border,
                    color: colors.text,
                    minHeight: 65,
                  },
                ]}
                placeholder="Direct intro via referral, key deliverables, target tech stack…"
                placeholderTextColor={colors.textMuted}
                value={leadNotes}
                onChangeText={setLeadNotes}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Submit Manual Lead Button */}
            <TouchableOpacity
              style={[
                styles.submitLeadBtn,
                {
                  backgroundColor:
                    leadTitle.trim() && organization.trim()
                      ? colors.accent
                      : colors.border,
                },
              ]}
              onPress={handleCreateManualLead}
              disabled={!leadTitle.trim() || !organization.trim() || isSavingManual}
              activeOpacity={0.85}
            >
              <Briefcase size={18} color="#FFFFFF" variant="Bold" />
              <Text style={styles.submitLeadBtnText}>Save Lead to Active Pipeline</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  sheetContainer: {
    paddingVertical: SPACING.xs,
    gap: 16,
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: BORDER_RADIUS.lg,
    padding: 3,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: BORDER_RADIUS.md,
    gap: 6,
  },
  tabBtnText: {
    fontSize: 13,
  },
  scoutSection: {
    gap: 14,
  },
  promptBox: {
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    padding: 12,
    gap: 8,
  },
  promptInput: {
    fontSize: 14.5,
    minHeight: 70,
    lineHeight: 20,
    padding: 0,
  },
  promptToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
  },
  toolsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cvMiniPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    maxWidth: 180,
  },
  cvMiniPillText: {
    fontSize: 11,
    fontFamily: FONTS.medium,
  },
  toolsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterOptionsSection: {
    gap: 8,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontFamily: FONTS.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipsScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  chipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
  },
  chipBtnText: {
    fontSize: 12,
  },
  togglesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  togglePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.2,
  },
  togglePillText: {
    fontSize: 12,
    fontFamily: FONTS.semibold,
  },
  promptStartersSection: {
    gap: 8,
  },
  starterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  starterText: {
    fontSize: 12.5,
    fontFamily: FONTS.medium,
    flex: 1,
  },
  manualSection: {
    gap: 12,
  },
  inputGroup: {
    gap: 6,
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: FONTS.medium,
  },
  formInput: {
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13.5,
  },
  submitLeadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: BORDER_RADIUS.md,
    gap: 8,
    marginTop: 6,
  },
  submitLeadBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FONTS.bold,
  },
});
