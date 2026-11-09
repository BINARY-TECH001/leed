import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  type TextInputInstance,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { usePipeline } from '@/context/PipelineContext';
import { Badge, BottomSheet } from '@/components/ui';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/theme';
import {
  ArrowLeft2,
  CloseCircle,
  DirectSend,
  Microphone2,
  Radar2,
  DocumentText,
  MagicStar,
  Add,
  TickCircle,
  Briefcase,
  Link2,
  DollarCircle,
  Location,
  Flash,
  FolderAdd,
  Trash,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import type { OpportunityType } from '@prospect/types';

export interface UserResource {
  id: string;
  name: string;
  type: 'cv' | 'portfolio' | 'bio';
  sizeOrLink: string;
  isPrimary: boolean;
  skills: string[];
}

const DEFAULT_RESOURCES: UserResource[] = [
  {
    id: 'res-1',
    name: 'Principal Mobile Architect (2026).pdf',
    type: 'cv',
    sizeOrLink: '1.4 MB',
    isPrimary: true,
    skills: ['Expo 57', 'React Native 0.86', 'TypeScript', 'Offline Sync'],
  },
  {
    id: 'res-2',
    name: 'Fintech & Security Consultant.pdf',
    type: 'cv',
    sizeOrLink: '920 KB',
    isPrimary: false,
    skills: ['Double-Entry Ledger', 'ACID State', 'WebSocket Infrastructure'],
  },
  {
    id: 'res-3',
    name: 'Production Engineering Portfolio',
    type: 'portfolio',
    sizeOrLink: 'github.com/alexrivers-arch',
    isPrimary: false,
    skills: ['High-Concurrency SDKs', 'Zero-Regression Testing'],
  },
];

const SUGGESTED_PROMPTS = [
  'Remote React Native contracts paying >$120/hr in US/Europe',
  'Fintech AI automation leads for venture-backed startups',
  'Staff Expo Router mobile roles with equity advisory',
  'Lead Mobile Architect advisory contracts with flexible hours',
];

export default function ActionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { toggleSave } = usePipeline();
  const params = useLocalSearchParams<{ initialQuery?: string }>();

  // Mode: 'ai_scout' | 'manual_entry'
  const [activeTab, setActiveTab] = useState<'ai_scout' | 'manual_entry'>('ai_scout');

  // Search input state
  const [query, setQuery] = useState(params.initialQuery || '');
  const [isFocused, setIsFocused] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Calibration state
  const [selectedType, setSelectedType] = useState<OpportunityType | 'all'>('all');
  const [remoteOnly, setRemoteOnly] = useState(true);
  const [minCompRate, setMinCompRate] = useState<number>(120);

  // Resources (CV, Portfolios, Bios)
  const [resources, setResources] = useState<UserResource[]>(DEFAULT_RESOURCES);
  const [isAddResourceOpen, setIsAddResourceOpen] = useState(false);
  const [newResName, setNewResName] = useState('');
  const [newResType, setNewResType] = useState<'cv' | 'portfolio' | 'bio'>('cv');
  const [newResSkills, setNewResSkills] = useState('');
  const [newResLink, setNewResLink] = useState('');

  // Manual Lead Entry Form state
  const [manualTitle, setManualTitle] = useState('');
  const [manualOrg, setManualOrg] = useState('');
  const [manualComp, setManualComp] = useState('');
  const [manualLocation, setManualLocation] = useState('Remote');
  const [manualType, setManualType] = useState<OpportunityType>('contract');
  const [manualUrl, setManualUrl] = useState('');
  const [manualNotes, setManualNotes] = useState('');

  const inputRef = useRef<TextInputInstance>(null);

  const activeResource = resources.find((r) => r.isPrimary) || resources[0];

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // Voice toggle simulation
  const handleVoiceToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!isListening) {
      setIsListening(true);
      setTimeout(() => {
        const sample = 'Senior React Native lead roles paying above $120/hr in US/EMEA';
        setQuery(sample);
        setIsListening(false);
      }, 1400);
    } else {
      setIsListening(false);
    }
  };

  // Submit AI Scout -> Navigates to dedicated Search Results screen
  const handleExecuteSearch = (overrideQuery?: string) => {
    const textToSearch = overrideQuery !== undefined ? overrideQuery : query;
    if (!textToSearch.trim()) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.push({
      pathname: '/search-results',
      params: {
        query: textToSearch.trim(),
        type: selectedType,
        remoteOnly: remoteOnly ? 'true' : 'false',
        minComp: minCompRate.toString(),
      },
    } as any);
  };

  // Switch active resource
  const handleSelectActiveResource = (id: string) => {
    Haptics.selectionAsync();
    setResources((prev) =>
      prev.map((r) => ({
        ...r,
        isPrimary: r.id === id,
      }))
    );
  };

  // Add new CV or Resource
  const handleSaveNewResource = () => {
    if (!newResName.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const skillsArray = newResSkills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const newRes: UserResource = {
      id: `res-${Date.now()}`,
      name: newResName.trim(),
      type: newResType,
      sizeOrLink: newResLink.trim() || 'Custom Added',
      isPrimary: true,
      skills: skillsArray.length > 0 ? skillsArray : ['Mobile Architecture', 'TypeScript'],
    };

    setResources((prev) => [newRes, ...prev.map((r) => ({ ...r, isPrimary: false }))]);
    setNewResName('');
    setNewResSkills('');
    setNewResLink('');
    setIsAddResourceOpen(false);
  };

  // Submit Manual Lead into Pipeline
  const handleSaveManualLead = () => {
    if (!manualTitle.trim() || !manualOrg.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const newLead = {
      id: `lead-manual-${Date.now()}`,
      title: manualTitle.trim(),
      organization: manualOrg.trim(),
      location: manualLocation.trim() || 'Remote',
      isRemote: manualLocation.toLowerCase().includes('remote'),
      remoteType: 'fully_remote' as const,
      compensation: manualComp.trim() || '$120 - $150 / hr',
      compensationAmount: 130,
      deadline: new Date(Date.now() + 14 * 86400000).toISOString(),
      type: manualType,
      source: 'Direct Manual Log',
      sourceType: 'manual_lead',
      originalUrl: manualUrl.trim() || 'https://internal.pipeline',
      description: manualNotes.trim() || `Direct opportunity at ${manualOrg.trim()}`,
      summary: manualNotes.trim() || `Direct opportunity at ${manualOrg.trim()}`,
      requirements: [{ text: 'Direct client discussion', isMatched: true }],
      matchScore: 96,
      matchExplanation: 'Direct logged opportunity inside active pipeline.',
      status: 'discovered' as const,
      freshness: 'new_today' as const,
      tags: ['Direct Lead', manualType.toUpperCase()],
      discoveredAt: new Date().toISOString(),
      timeline: [],
    };

    toggleSave(newLead as any);
    router.replace('/pipeline' as any);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Top Header Bar */}
      <View style={[styles.topHeader, { borderBottomColor: colors.borderSubtle }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.closeBtn, { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA' }]}
          activeOpacity={0.7}
        >
          <ArrowLeft2 size={20} color={colors.text} />
        </TouchableOpacity>

        {/* Mode Switcher Capsule */}
        <View style={[styles.modeTabsWrap, { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA' }]}>
          <TouchableOpacity
            style={[
              styles.modeTabBtn,
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
          >
            <MagicStar
              size={13}
              color={activeTab === 'ai_scout' ? colors.accent : colors.textMuted}
              variant={activeTab === 'ai_scout' ? 'Bold' : 'Linear'}
            />
            <Text
              style={[
                styles.modeTabBtnText,
                {
                  color: activeTab === 'ai_scout' ? colors.text : colors.textMuted,
                  fontFamily: activeTab === 'ai_scout' ? FONTS.bold : FONTS.medium,
                },
              ]}
            >
              AI Scout
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeTabBtn,
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
          >
            <Briefcase
              size={13}
              color={activeTab === 'manual_entry' ? colors.accent : colors.textMuted}
              variant={activeTab === 'manual_entry' ? 'Bold' : 'Linear'}
            />
            <Text
              style={[
                styles.modeTabBtnText,
                {
                  color: activeTab === 'manual_entry' ? colors.text : colors.textMuted,
                  fontFamily: activeTab === 'manual_entry' ? FONTS.bold : FONTS.medium,
                },
              ]}
            >
              Manual Log
            </Text>
          </TouchableOpacity>
        </View>

        {query.length > 0 ? (
          <TouchableOpacity
            onPress={() => setQuery('')}
            style={styles.clearBtn}
          >
            <Text style={[styles.clearBtnText, { color: colors.textMuted }]}>Clear</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 38 }} />
        )}
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
            { paddingBottom: Math.max(insets.bottom, 24) + 40 },
          ]}
        >
          {activeTab === 'ai_scout' ? (
            /* TAB 1: AI SCOUT */
            <View style={styles.tabContent}>
              {/* Hero AI Input Card */}
              <View
                style={[
                  styles.heroInputBox,
                  {
                    backgroundColor: isDark ? colors.card : '#FFFFFF',
                    borderColor: isFocused ? colors.accent : colors.border,
                    shadowColor: isFocused ? colors.accent : '#000',
                    shadowOpacity: isFocused ? 0.12 : 0.03,
                  },
                ]}
              >
                <TextInput
                  ref={inputRef}
                  style={[
                    styles.heroInput,
                    { color: colors.text, fontFamily: FONTS.regular },
                  ]}
                  placeholder="Ask LeedAI, search 120+ live portals, or describe your target role in plain English…"
                  placeholderTextColor={colors.textMuted}
                  value={query}
                  onChangeText={setQuery}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  returnKeyType="search"
                  onSubmitEditing={() => handleExecuteSearch()}
                />

                {/* Bottom Action Controls Toolbar: Microphone on right directly beside Send icon */}
                <View style={[styles.heroControlsBar, { borderTopColor: colors.borderSubtle }]}>
                  {/* Left Side: Active CV Badge indicator */}
                  <View style={styles.controlsLeft}>
                    <View style={[styles.activeCvMiniPill, { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA' }]}>
                      <DocumentText size={13} color={colors.accent} variant="Bold" />
                      <Text style={[styles.activeCvMiniText, { color: colors.textSecondary }]} numberOfLines={1}>
                        {activeResource?.name.split('.')[0].slice(0, 20)}
                      </Text>
                    </View>
                  </View>

                  {/* Right Side: Microphone beside Send Icon */}
                  <View style={styles.controlsRight}>
                    <TouchableOpacity
                      style={[
                        styles.iconBtn,
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

                    <TouchableOpacity
                      style={[
                        styles.sendBtn,
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

              {/* CV & Resources Section (Add CV / Other Resources) */}
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeaderRow}>
                  <View>
                    <Text style={[styles.sectionHeading, { color: colors.text }]}>
                      Active CV & Calibration Resources
                    </Text>
                    <Text style={[styles.sectionSub, { color: colors.textMuted }]}>
                      Select primary context or upload new resumes & portfolios
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.addResourceBtn, { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA' }]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setIsAddResourceOpen(true);
                    }}
                    activeOpacity={0.75}
                  >
                    <Add size={14} color={colors.accent} />
                    <Text style={[styles.addResourceBtnText, { color: colors.accent }]}>Add Resource</Text>
                  </TouchableOpacity>
                </View>

                {/* Resource Cards */}
                <View style={styles.resourcesList}>
                  {resources.map((res) => {
                    const isPrimary = res.isPrimary;
                    return (
                      <TouchableOpacity
                        key={res.id}
                        style={[
                          styles.resourceCard,
                          {
                            backgroundColor: isPrimary
                              ? isDark
                                ? 'rgba(255, 102, 0, 0.12)'
                                : '#FFF6F0'
                              : isDark
                              ? colors.card
                              : '#FFFFFF',
                            borderColor: isPrimary ? colors.accent : colors.border,
                          },
                        ]}
                        onPress={() => handleSelectActiveResource(res.id)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.resourceCardLeft}>
                          <View
                            style={[
                              styles.resourceIconCircle,
                              { backgroundColor: isPrimary ? colors.accent : isDark ? colors.surfaceSecondary : '#F0F4FA' },
                            ]}
                          >
                            <DocumentText
                              size={16}
                              color={isPrimary ? '#FFFFFF' : colors.textMuted}
                              variant={isPrimary ? 'Bold' : 'Linear'}
                            />
                          </View>

                          <View style={{ flex: 1 }}>
                            <View style={styles.resourceTitleRow}>
                              <Text
                                style={[
                                  styles.resourceName,
                                  {
                                    color: isPrimary ? colors.accent : colors.text,
                                    fontFamily: isPrimary ? FONTS.bold : FONTS.semibold,
                                  },
                                ]}
                                numberOfLines={1}
                              >
                                {res.name}
                              </Text>
                              {isPrimary && (
                                <Badge label="PRIMARY" variant="accent" size="sm" />
                              )}
                            </View>
                            <Text style={[styles.resourceSkills, { color: colors.textMuted }]} numberOfLines={1}>
                              {res.skills.join(' · ')}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.radioCircle}>
                          {isPrimary && <View style={[styles.radioDot, { backgroundColor: colors.accent }]} />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Calibration Criteria Row */}
              <View style={styles.sectionBlock}>
                <Text style={[styles.sectionHeading, { color: colors.text }]}>
                  Quick Criteria
                </Text>

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
                      setMinCompRate((r) => (r === 120 ? 0 : 120));
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
                      {minCompRate > 0 ? `Rate ≥ $${minCompRate}/hr` : 'Any Rate'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Suggested Scout Prompts */}
              <View style={styles.sectionBlock}>
                <Text style={[styles.sectionHeading, { color: colors.text }]}>
                  High-Yield Search Prompts
                </Text>

                <View style={styles.promptsList}>
                  {SUGGESTED_PROMPTS.map((prompt, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.promptCard,
                        {
                          backgroundColor: isDark ? colors.card : '#FFFFFF',
                          borderColor: colors.borderSubtle,
                        },
                      ]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setQuery(prompt);
                        handleExecuteSearch(prompt);
                      }}
                      activeOpacity={0.75}
                    >
                      <Flash size={15} color={colors.accent} variant="Bold" />
                      <Text style={[styles.promptCardText, { color: colors.text }]} numberOfLines={1}>
                        {prompt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          ) : (
            /* TAB 2: MANUAL LEAD ENTRY */
            <View style={styles.manualFormSection}>
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>
                  Role / Opportunity Title *
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: isDark ? colors.card : '#FFFFFF',
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  placeholder="e.g. Senior Mobile Architecture Lead"
                  placeholderTextColor={colors.textMuted}
                  value={manualTitle}
                  onChangeText={setManualTitle}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>
                  Organization / Client Name *
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: isDark ? colors.card : '#FFFFFF',
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  placeholder="e.g. Stripe, Linear, or Venture Startup"
                  placeholderTextColor={colors.textMuted}
                  value={manualOrg}
                  onChangeText={setManualOrg}
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>
                    Compensation / Rate
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: isDark ? colors.card : '#FFFFFF',
                        borderColor: colors.border,
                        color: colors.text,
                      },
                    ]}
                    placeholder="$130 - $160 / hr"
                    placeholderTextColor={colors.textMuted}
                    value={manualComp}
                    onChangeText={setManualComp}
                  />
                </View>

                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>
                    Location / Workstyle
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: isDark ? colors.card : '#FFFFFF',
                        borderColor: colors.border,
                        color: colors.text,
                      },
                    ]}
                    placeholder="Remote · Global"
                    placeholderTextColor={colors.textMuted}
                    value={manualLocation}
                    onChangeText={setManualLocation}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>
                  Opportunity Link / Source URL
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: isDark ? colors.card : '#FFFFFF',
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  placeholder="https://client.com/role or application link"
                  placeholderTextColor={colors.textMuted}
                  value={manualUrl}
                  onChangeText={setManualUrl}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>
                  Private Context & Strategy Notes
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: isDark ? colors.card : '#FFFFFF',
                      borderColor: colors.border,
                      color: colors.text,
                      minHeight: 70,
                    },
                  ]}
                  placeholder="Direct intro via referral, key tech stack requirements…"
                  placeholderTextColor={colors.textMuted}
                  value={manualNotes}
                  onChangeText={setManualNotes}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.saveLeadBtn,
                  {
                    backgroundColor:
                      manualTitle.trim() && manualOrg.trim()
                        ? colors.accent
                        : colors.border,
                  },
                ]}
                onPress={handleSaveManualLead}
                disabled={!manualTitle.trim() || !manualOrg.trim()}
                activeOpacity={0.85}
              >
                <Briefcase size={18} color="#FFFFFF" variant="Bold" />
                <Text style={styles.saveLeadBtnText}>Save Lead to Active Pipeline</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Add CV / Resource BottomSheet */}
      <BottomSheet
        visible={isAddResourceOpen}
        onClose={() => setIsAddResourceOpen(false)}
        title="Add CV or Resource"
        subtitle="Upload or link resumes, GitHub portfolios, and case studies"
        icon={<FolderAdd size={22} color={colors.accent} variant="Bold" />}
      >
        <View style={styles.modalContent}>
          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>
              Resource Title / Document Name *
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: isDark ? colors.card : '#FFFFFF',
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="e.g. Mobile Tech Lead CV (2026).pdf"
              placeholderTextColor={colors.textMuted}
              value={newResName}
              onChangeText={setNewResName}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>
              Resource Type
            </Text>
            <View style={styles.typeChipsRow}>
              {[
                { id: 'cv', label: 'CV / Resume' },
                { id: 'portfolio', label: 'Portfolio Link' },
                { id: 'bio', label: 'Technical Bio' },
              ].map((t) => {
                const isSelected = newResType === t.id;
                return (
                  <TouchableOpacity
                    key={t.id}
                    style={[
                      styles.typeChip,
                      {
                        backgroundColor: isSelected ? colors.accent : isDark ? colors.card : '#FFFFFF',
                        borderColor: isSelected ? colors.accent : colors.border,
                      },
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setNewResType(t.id as any);
                    }}
                  >
                    <Text
                      style={[
                        styles.typeChipText,
                        { color: isSelected ? '#FFFFFF' : colors.text },
                      ]}
                    >
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>
              Focus Skills (comma-separated)
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: isDark ? colors.card : '#FFFFFF',
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="e.g. Expo 57, React Native 0.86, TypeScript, Architecture"
              placeholderTextColor={colors.textMuted}
              value={newResSkills}
              onChangeText={setNewResSkills}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>
              URL / File Reference
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: isDark ? colors.card : '#FFFFFF',
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="github.com/profile or link"
              placeholderTextColor={colors.textMuted}
              value={newResLink}
              onChangeText={setNewResLink}
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={[
              styles.saveLeadBtn,
              { backgroundColor: newResName.trim() ? colors.accent : colors.border },
            ]}
            onPress={handleSaveNewResource}
            disabled={!newResName.trim()}
          >
            <Text style={styles.saveLeadBtnText}>Save & Activate Context</Text>
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
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeTabsWrap: {
    flexDirection: 'row',
    borderRadius: BORDER_RADIUS.full,
    padding: 3,
  },
  modeTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BORDER_RADIUS.full,
  },
  modeTabBtnText: {
    fontSize: 12.5,
  },
  clearBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  clearBtnText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  tabContent: {
    gap: 20,
  },
  heroInputBox: {
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1.5,
    padding: 14,
    gap: 12,
  },
  heroInput: {
    fontSize: 15,
    minHeight: 80,
    lineHeight: 22,
    padding: 0,
  },
  heroControlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  controlsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  activeCvMiniPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: BORDER_RADIUS.full,
    maxWidth: 200,
  },
  activeCvMiniText: {
    fontSize: 11.5,
    fontFamily: FONTS.medium,
  },
  controlsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionBlock: {
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeading: {
    fontSize: 14.5,
    fontFamily: FONTS.bold,
  },
  sectionSub: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    marginTop: 1,
  },
  addResourceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.full,
  },
  addResourceBtnText: {
    fontSize: 12,
    fontFamily: FONTS.semibold,
  },
  resourcesList: {
    gap: 8,
  },
  resourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.2,
  },
  resourceCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 10,
  },
  resourceIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resourceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resourceName: {
    fontSize: 13,
  },
  resourceSkills: {
    fontSize: 11.5,
    marginTop: 2,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  togglesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  togglePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.2,
  },
  togglePillText: {
    fontSize: 12,
    fontFamily: FONTS.semibold,
  },
  promptsList: {
    gap: 8,
  },
  promptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  promptCardText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    flex: 1,
  },
  manualFormSection: {
    gap: 14,
  },
  formGroup: {
    gap: 6,
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
  },
  formLabel: {
    fontSize: 12.5,
    fontFamily: FONTS.medium,
  },
  textInput: {
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  saveLeadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.md,
    gap: 8,
    marginTop: 6,
  },
  saveLeadBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FONTS.bold,
  },
  modalContent: {
    gap: 14,
    paddingVertical: SPACING.xs,
  },
  typeChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
  },
  typeChipText: {
    fontSize: 12,
  },
});
