import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
  Linking,
  Share as RNShare,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { usePipeline } from '@/context/PipelineContext';
import { Badge, Button, Card } from '@/components/ui';
import { SAMPLE_OPPORTUNITIES } from '@/constants/mockData';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/theme';
import {
  ArrowLeft2,
  SearchNormal1,
  Radar2,
  DirectSend,
  Microphone2,
  Flash,
  DocumentText,
  Filter,
  ArrowRight2,
  TickCircle,
  MagicStar,
  DollarCircle,
  Trash,
  Add,
  CloseCircle,
  Buildings,
  ArchiveAdd,
  Send2,
  Calendar,
  ExportCurve,
  Global,
  Clock,
  Eye,
  Sms,
  Copy,
  Edit2,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import type { Opportunity, OpportunityType } from '@prospect/types';

export interface UserCV {
  id: string;
  name: string;
  size: string;
  uploadedAt: string;
  isPrimary: boolean;
  skills: string[];
}

const DEFAULT_CVS: UserCV[] = [
  {
    id: 'cv-1',
    name: 'Principal Mobile Architect (2026).pdf',
    size: '1.4 MB',
    uploadedAt: 'Active Today',
    isPrimary: true,
    skills: ['Expo 57', 'React Native 0.86', 'TypeScript', 'Offline Sync', 'Ledger Architecture'],
  },
  {
    id: 'cv-2',
    name: 'Fintech & Security Consultant.pdf',
    size: '920 KB',
    uploadedAt: 'Oct 8, 2026',
    isPrimary: false,
    skills: ['Double-Entry Ledger', 'ACID Compliance', 'WebSocket Infrastructure', 'Zero-Trust'],
  },
];

const SUGGESTED_PROMPTS = [
  'Remote React Native contracts paying >$110/hr in US/Europe',
  'Fintech AI automation leads for seed to Series B startups',
  'Staff Expo Router mobile roles with equity compensation',
  'Draft high-conversion proposal for Stripe mobile architect',
];

const FILTER_CATEGORY_TABS = [
  { id: 'all', label: 'All' },
  { id: 'contract', label: 'Contracts' },
  { id: 'job', label: 'Full-time' },
  { id: 'freelance', label: 'Freelance' },
  { id: 'lead', label: 'B2B Leads' },
  { id: 'grant', label: 'Grants' },
  { id: 'scholarship', label: 'Scholarships' },
  { id: 'high_fit', label: '⭐ 90%+ Fit' },
] as const;

const generatePitch = (
  tone: 'Executive' | 'Direct' | 'Technical' | 'Warm',
  opp: Opportunity,
  skills: string[],
  userName: string
) => {
  const contact = opp.contactPerson ? opp.contactPerson.split(' ')[0] : `${opp.organization} Team`;
  const skillsStr = skills.slice(0, 3).join(', ');

  switch (tone) {
    case 'Direct':
      return (
        `Hi ${contact},\n\n` +
        `Reaching out directly regarding the ${opp.title} position at ${opp.organization}.\n\n` +
        `My track record focuses directly on your requirements: ${skillsStr}. I deliver immediate, production-grade output with zero onboarding friction.\n\n` +
        `Let's connect for 10 minutes this week.\n\n` +
        `Best,\n${userName}`
      );
    case 'Technical':
      return (
        `Hello ${contact},\n\n` +
        `I analyzed the technical specifications for ${opp.title} at ${opp.organization}. My stack directly intersects with your core requirements:\n` +
        `• Production architecture using ${skillsStr}\n` +
        `• Zero-regression state management, ACID data invariants, and offline sync\n` +
        `• Sub-50ms performance profiling and memory leak mitigation\n\n` +
        `I would welcome an architectural discussion with your engineering leads.\n\n` +
        `Best regards,\n${userName}`
      );
    case 'Warm':
      return (
        `Hi ${contact},\n\n` +
        `I've been following ${opp.organization}'s trajectory with immense admiration. When I saw the ${opp.title} opening, it immediately resonated with my passions in ${skillsStr}.\n\n` +
        `I would love to learn more about the team and share how my experience can support your mission!\n\n` +
        `Warm regards,\n${userName}`
      );
    case 'Executive':
    default:
      return (
        `Dear ${contact},\n\n` +
        `I noticed ${opp.organization}'s focus on high-reliability execution for the ${opp.title} initiative.\n\n` +
        `Having led production deployments with ${skillsStr}, I offer proven technical leadership that accelerates roadmaps while minimizing risk.\n\n` +
        `I would be delighted to explore how my background aligns with your strategic objectives.\n\n` +
        `Best regards,\n${userName}`
      );
  }
};

export default function ActionSearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const {
    isSaved: isSavedInPipeline,
    isApplied: isAppliedInPipeline,
    toggleSave: toggleSavePipeline,
    applyToOpportunity: applyToOpportunityPipeline,
    scheduleFollowUp: scheduleFollowUpPipeline,
    updateNotes: updateNotesPipeline,
  } = usePipeline();
  const params = useLocalSearchParams<{ initialQuery?: string }>();

  // Search input state
  const [query, setQuery] = useState(params.initialQuery || '');
  const [isFocused, setIsFocused] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // CV state
  const [cvList, setCvList] = useState<UserCV[]>(DEFAULT_CVS);
  const [isCvManagerOpen, setIsCvManagerOpen] = useState(false);
  const [isAddCvModalOpen, setIsAddCvModalOpen] = useState(false);
  const [newCvName, setNewCvName] = useState('');
  const [newCvSkills, setNewCvSkills] = useState('');

  // Search Results & View Mode
  const [activeTool, setActiveTool] = useState<'search' | 'radar' | 'proposal' | 'match'>('search');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<Opportunity[]>([]);
  const [showAllDirectory, setShowAllDirectory] = useState(false);
  const [activeFilterTab, setActiveFilterTab] = useState<typeof FILTER_CATEGORY_TABS[number]['id']>('all');
  const [sortBy, setSortBy] = useState<'match' | 'comp' | 'newest' | 'org'>('match');
  const [refineKeyword, setRefineKeyword] = useState('');

  // Understood dynamic criteria tags
  const [criteriaTags, setCriteriaTags] = useState<string[]>([
    '⚡ Remote Work',
    '💰 Rate Floor Verified',
    '🎯 Matches Primary CV',
  ]);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagText, setNewTagText] = useState('');

  // Actions tracking state per opportunity
  const [savedIds, setSavedIds] = useState<string[]>(['opp-3']);
  const [appliedIds, setAppliedIds] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [privateNotes, setPrivateNotes] = useState<Record<string, string>>({});

  // 1. Auto-Apply Modal state
  const [autoApplyOpp, setAutoApplyOpp] = useState<Opportunity | null>(null);
  const [isAutoApplying, setIsAutoApplying] = useState(false);
  const [autoApplySuccess, setAutoApplySuccess] = useState(false);

  // 2. Mail Pitch Modal state
  const [mailModalOpp, setMailModalOpp] = useState<Opportunity | null>(null);
  const [mailRecipient, setMailRecipient] = useState('');
  const [mailSubject, setMailSubject] = useState('');
  const [mailBody, setMailBody] = useState('');
  const [mailTone, setMailTone] = useState<'Executive' | 'Direct' | 'Technical' | 'Warm'>('Executive');
  const [copiedMail, setCopiedMail] = useState(false);

  // 3. Schedule Modal state
  const [scheduleModalOpp, setScheduleModalOpp] = useState<Opportunity | null>(null);
  const [scheduleCadence, setScheduleCadence] = useState<'tomorrow' | '3days' | '1week' | '2weeks'>('3days');
  const [scheduleObjective, setScheduleObjective] = useState<
    'Review Application' | 'Send Portfolio' | 'Follow-up Pitch' | 'Interview Prep'
  >('Review Application');
  const [schedulePriority, setSchedulePriority] = useState<'Normal' | 'Urgent'>('Normal');
  const [scheduleNotes, setScheduleNotes] = useState('');

  // 4. Private Notes Modal state
  const [noteModalOpp, setNoteModalOpp] = useState<Opportunity | null>(null);
  const [currentNoteDraft, setCurrentNoteDraft] = useState('');

  // 5. Export Dialog state
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'CSV' | 'JSON' | 'TEXT'>('CSV');

  const inputRef = useRef<TextInput>(null);
  const activeCv = cvList.find((c) => c.isPrimary) || cvList[0];

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // Execute Search
  const handleExecute = (overrideQuery?: string) => {
    const textToSearch = overrideQuery !== undefined ? overrideQuery : query;
    if (!textToSearch.trim()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSearching(true);
    setHasSearched(true);
    setShowAllDirectory(false);

    setTimeout(() => {
      const lower = textToSearch.toLowerCase();
      const filtered = SAMPLE_OPPORTUNITIES.filter((opp) => {
        const matchesText =
          opp.title.toLowerCase().includes(lower) ||
          opp.organization.toLowerCase().includes(lower) ||
          opp.description.toLowerCase().includes(lower) ||
          opp.tags.some((t) => t.toLowerCase().includes(lower));
        return matchesText;
      });

      setResults(filtered.length > 0 ? filtered : SAMPLE_OPPORTUNITIES);
      setIsSearching(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 450);
  };

  const handleVoiceToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!isListening) {
      setIsListening(true);
      setTimeout(() => {
        const voiceSample = 'Senior React Native lead roles paying above $120/hr in US/EMEA';
        setQuery(voiceSample);
        setIsListening(false);
        handleExecute(voiceSample);
      }, 1500);
    } else {
      setIsListening(false);
    }
  };

  // Toggle Save
  const handleToggleSave = (id: string) => {
    Haptics.selectionAsync();
    const opp = SAMPLE_OPPORTUNITIES.find((o) => o.id === id);
    if (opp) toggleSavePipeline(opp);
    setSavedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // ⚡ Open Auto-Apply Modal
  const handleOpenAutoApply = (opp: Opportunity) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAutoApplyOpp(opp);
    setAutoApplySuccess(appliedIds.includes(opp.id) || isAppliedInPipeline(opp.id));
  };

  // Confirm Dispatch Auto-Apply
  const handleConfirmAutoApply = () => {
    if (!autoApplyOpp) return;
    setIsAutoApplying(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setTimeout(() => {
      setIsAutoApplying(false);
      setAutoApplySuccess(true);
      setAppliedIds((prev) => [...new Set([...prev, autoApplyOpp.id])]);
      applyToOpportunityPipeline(
        autoApplyOpp,
        `Proposal dispatched via Action workspace with ${activeCv.name}`
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 1100);
  };

  // ✉️ Open Mail Pitch Modal
  const handleOpenMail = (opp: Opportunity) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMailModalOpp(opp);
    setMailRecipient(
      opp.contactEmail || `recruiting@${opp.organization.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`
    );
    setMailSubject(`Re: ${opp.title} — Mobile Architecture Alignment`);
    setMailBody(generatePitch(mailTone, opp, activeCv.skills, user?.name || 'Alex Rivers'));
  };

  const handleSelectMailTone = (tone: 'Executive' | 'Direct' | 'Technical' | 'Warm') => {
    Haptics.selectionAsync();
    setMailTone(tone);
    if (mailModalOpp) {
      setMailBody(generatePitch(tone, mailModalOpp, activeCv.skills, user?.name || 'Alex Rivers'));
    }
  };

  const handleLaunchNativeEmail = () => {
    if (!mailModalOpp) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const emailUrl = `mailto:${mailRecipient}?subject=${encodeURIComponent(
      mailSubject
    )}&body=${encodeURIComponent(mailBody)}`;
    Linking.openURL(emailUrl).catch(() => {
      Alert.alert('Cannot Open Mail', 'Mail application could not be launched. Text copied instead.');
    });
    setAppliedIds((prev) => [...new Set([...prev, mailModalOpp.id])]);
    applyToOpportunityPipeline(
      mailModalOpp,
      `Outreach pitch sent (${mailTone} tone) to ${mailRecipient}`
    );
  };

  // 📅 Open Schedule Modal
  const handleOpenSchedule = (opp: Opportunity) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setScheduleModalOpp(opp);
    setScheduleNotes(`Follow up on ${opp.title} submission with ${opp.organization}.`);
  };

  const handleSaveSchedule = () => {
    if (!scheduleModalOpp) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const cadenceLabel =
      scheduleCadence === 'tomorrow'
        ? 'Tomorrow'
        : scheduleCadence === '3days'
        ? 'In 3 Days'
        : scheduleCadence === '1week'
        ? 'In 1 Week'
        : 'In 2 Weeks';
    scheduleFollowUpPipeline(scheduleModalOpp.id, cadenceLabel, scheduleObjective);
    Alert.alert(
      'Follow-Up Scheduled & Synced',
      `Reminder cadence set for ${cadenceLabel} (${scheduleObjective}) for ${scheduleModalOpp.organization}. Added to Pipeline.`
    );
    setScheduleModalOpp(null);
  };

  // 📝 Open Private Notes Modal
  const handleOpenNotes = (opp: Opportunity) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNoteModalOpp(opp);
    setCurrentNoteDraft(privateNotes[opp.id] || '');
  };

  const handleSavePrivateNote = () => {
    if (!noteModalOpp) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateNotesPipeline(noteModalOpp.id, currentNoteDraft.trim());
    setPrivateNotes((prev) => ({
      ...prev,
      [noteModalOpp.id]: currentNoteDraft.trim(),
    }));
    setNoteModalOpp(null);
  };

  // 📤 Share Opportunity Card
  const handleShareOpportunity = async (opp: Opportunity) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await RNShare.share({
        message: `${opp.title} at ${opp.organization} (${opp.compensation}, ${opp.location}). Discovered via ProspectAI: ${opp.originalUrl || 'https://prospectai.internal'}`,
        title: opp.title,
      });
    } catch {}
  };

  // Multi-Select Toggle
  const handleToggleSelect = (id: string) => {
    Haptics.selectionAsync();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (totalList: Opportunity[]) => {
    Haptics.selectionAsync();
    if (selectedIds.length === totalList.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(totalList.map((r) => r.id));
    }
  };

  // Batch Auto-Apply
  const handleBatchAutoApply = () => {
    if (selectedIds.length === 0) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setAppliedIds((prev) => [...new Set([...prev, ...selectedIds])]);
    Alert.alert(
      'Batch Application Dispatched',
      `Dispatched ${selectedIds.length} autonomous applications calibrated with "${activeCv.name}".`
    );
    setSelectedIds([]);
  };

  // Batch Save
  const handleBatchSave = () => {
    if (selectedIds.length === 0) return;
    Haptics.selectionAsync();
    setSavedIds((prev) => [...new Set([...prev, ...selectedIds])]);
    Alert.alert('Saved to Pipeline', `Bookmarked ${selectedIds.length} opportunities into your active stream.`);
    setSelectedIds([]);
  };

  // Export Results
  const handleExportData = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const targetList =
      selectedIds.length > 0
        ? displayedOpportunities.filter((r) => selectedIds.includes(r.id))
        : displayedOpportunities;

    let content = '';
    if (exportFormat === 'JSON') {
      content = JSON.stringify(targetList, null, 2);
    } else if (exportFormat === 'TEXT') {
      content = targetList
        .map(
          (r, i) =>
            `${i + 1}. ${r.title} at ${r.organization}\n   Comp: ${r.compensation} | Location: ${r.location}\n   Fit: ${r.matchScore}% | Source: ${r.originalUrl || 'Partner Index'}`
        )
        .join('\n\n');
    } else {
      content =
        'Title,Organization,Type,Compensation,Location,Match,URL\n' +
        targetList
          .map(
            (r) =>
              `"${r.title}","${r.organization}","${r.type}","${r.compensation}","${r.location}",${r.matchScore}%,"${r.originalUrl || ''}"`
          )
          .join('\n');
    }

    try {
      await RNShare.share({
        message: content,
        title: `ProspectAI Export (${targetList.length} items)`,
      });
    } catch {}
    setIsExportModalOpen(false);
  };

  const handleDeployRadar = () => {
    if (!query.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push({
      pathname: '/radar/create',
      params: { initialPrompt: query },
    } as any);
  };

  // Compute displayed items based on "See All", filter tabs, refine query, and sort
  const displayedOpportunities = useMemo(() => {
    const baseList = showAllDirectory
      ? SAMPLE_OPPORTUNITIES
      : results.length > 0
      ? results
      : SAMPLE_OPPORTUNITIES;

    return baseList
      .filter((opp) => {
        // Tab category
        if (activeFilterTab === 'high_fit' && opp.matchScore < 90) return false;
        if (activeFilterTab !== 'all' && activeFilterTab !== 'high_fit' && opp.type !== activeFilterTab) {
          return false;
        }

        // Refine keyword search
        if (refineKeyword.trim()) {
          const k = refineKeyword.toLowerCase();
          const matchesTitle = opp.title.toLowerCase().includes(k);
          const matchesOrg = opp.organization.toLowerCase().includes(k);
          const matchesTags = opp.tags.some((t) => t.toLowerCase().includes(k));
          const matchesDesc = opp.description.toLowerCase().includes(k);
          return matchesTitle || matchesOrg || matchesTags || matchesDesc;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'match') return b.matchScore - a.matchScore;
        if (sortBy === 'comp') return (b.compensationAmount || 0) - (a.compensationAmount || 0);
        if (sortBy === 'newest')
          return new Date(b.discoveredAt).getTime() - new Date(a.discoveredAt).getTime();
        if (sortBy === 'org') return a.organization.localeCompare(b.organization);
        return 0;
      });
  }, [showAllDirectory, results, activeFilterTab, refineKeyword, sortBy]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Top Header Bar */}
      <View style={[styles.headerBar, { borderBottomColor: colors.borderSubtle }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA' }]}
          activeOpacity={0.7}
        >
          <ArrowLeft2 size={20} color={colors.text} variant="Linear" />
        </TouchableOpacity>

        {/* CV Indicator Pill */}
        <TouchableOpacity
          style={[
            styles.cvHeaderPill,
            {
              backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA',
              borderColor: colors.accent,
            },
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setIsCvManagerOpen(true);
          }}
          activeOpacity={0.8}
        >
          <DocumentText size={14} color={colors.accent} variant="Bold" />
          <Text style={[styles.cvHeaderPillText, { color: colors.text }]} numberOfLines={1}>
            {activeCv?.name ? activeCv.name.split('.')[0].slice(0, 18) : 'CV Context'}
          </Text>
          <View style={[styles.cvCountDot, { backgroundColor: colors.accent }]}>
            <Text style={styles.cvCountDotText}>{cvList.length}</Text>
          </View>
        </TouchableOpacity>

        {query.length > 0 ? (
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setQuery('');
              setHasSearched(false);
              setResults([]);
              setSelectedIds([]);
              setRefineKeyword('');
            }}
            style={styles.clearBtn}
          >
            <Text style={[styles.clearBtnText, { color: colors.textMuted }]}>Clear</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
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
            { paddingBottom: Math.max(insets.bottom, 24) + (selectedIds.length > 0 ? 140 : 85) },
          ]}
        >
          {/* 🌟 The Main Big Input (Hero) */}
          <View
            style={[
              styles.heroInputCard,
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
                styles.heroInputText,
                { color: colors.text, fontFamily: FONTS.regular },
              ]}
              placeholder="Ask ProspectAI, search 120+ live portals, or describe your target role in plain English…"
              placeholderTextColor={colors.textMuted}
              value={query}
              onChangeText={setQuery}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              returnKeyType="search"
              onSubmitEditing={() => handleExecute()}
            />

            {/* Input Action Controls Toolbar */}
            <View style={[styles.inputControlsBar, { borderTopColor: colors.borderSubtle }]}>
              <View style={styles.controlsLeft}>
                <TouchableOpacity
                  style={[
                    styles.iconButton,
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
                    size={17}
                    color={isListening ? '#FFFFFF' : colors.accent}
                    variant={isListening ? 'Bold' : 'Linear'}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.quickPillBtn,
                    {
                      backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA',
                      borderColor: colors.borderSubtle,
                    },
                  ]}
                  onPress={handleDeployRadar}
                  disabled={!query.trim()}
                  activeOpacity={0.75}
                >
                  <Radar2 size={13} color={colors.accent} variant="Bold" />
                  <Text style={[styles.quickPillText, { color: colors.text }]}>Radar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.quickPillBtn,
                    {
                      backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA',
                      borderColor: colors.borderSubtle,
                    },
                  ]}
                  onPress={() => setIsCvManagerOpen(true)}
                  activeOpacity={0.75}
                >
                  <MagicStar size={13} color={colors.accent} variant="Bold" />
                  <Text style={[styles.quickPillText, { color: colors.text }]}>CV Skills</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[
                  styles.sendBtn,
                  {
                    backgroundColor: query.trim().length > 0 ? colors.accent : colors.border,
                  },
                ]}
                onPress={() => handleExecute()}
                disabled={!query.trim()}
                activeOpacity={0.85}
              >
                <DirectSend size={18} color="#FFFFFF" variant="Bold" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Clean Interactive CV Alignment Banner */}
          {activeCv && (
            <TouchableOpacity
              style={[
                styles.cvBanner,
                {
                  backgroundColor: isDark ? colors.card : '#FFFFFF',
                  borderColor: colors.borderSubtle,
                },
              ]}
              onPress={() => setIsCvManagerOpen(true)}
              activeOpacity={0.85}
            >
              <View style={styles.cvBannerLeft}>
                <View style={[styles.cvIconWrap, { backgroundColor: 'rgba(255, 102, 0, 0.1)' }]}>
                  <DocumentText size={17} color={colors.accent} variant="Bold" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.cvTitleRow}>
                    <Text style={[styles.cvBannerTitle, { color: colors.text }]} numberOfLines={1}>
                      {activeCv.name}
                    </Text>
                    <Badge label="ACTIVE" variant="success" size="sm" />
                  </View>
                  <Text style={[styles.cvSkillsSummary, { color: colors.textMuted }]} numberOfLines={1}>
                    {activeCv.skills.slice(0, 4).join(' · ')}
                  </Text>
                </View>
              </View>

              <ArrowRight2 size={14} color={colors.textMuted} style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          )}

          {/* Clean Action Tools */}
          <View style={styles.toolsRow}>
            {[
              { id: 'search', label: 'Deep Scout', icon: SearchNormal1 },
              { id: 'radar', label: 'Deploy Radar', icon: Radar2 },
              { id: 'proposal', label: 'Draft Pitch', icon: DocumentText },
              { id: 'match', label: 'CV Score', icon: MagicStar },
            ].map((tool) => {
              const isSelected = activeTool === tool.id;
              const IconComp = tool.icon;
              return (
                <TouchableOpacity
                  key={tool.id}
                  style={[
                    styles.toolPill,
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
                    setActiveTool(tool.id as any);
                    if (tool.id === 'radar') handleDeployRadar();
                    else handleExecute();
                  }}
                  activeOpacity={0.8}
                >
                  <IconComp
                    size={14}
                    color={isSelected ? '#FFFFFF' : colors.accent}
                    variant={isSelected ? 'Bold' : 'Linear'}
                  />
                  <Text
                    style={[
                      styles.toolPillText,
                      {
                        color: isSelected ? '#FFFFFF' : colors.text,
                        fontFamily: isSelected ? FONTS.bold : FONTS.medium,
                      },
                    ]}
                  >
                    {tool.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Suggested Prompts (when no search yet) */}
          {!hasSearched && (
            <View style={styles.suggestionsSection}>
              <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
                Suggested Searches
              </Text>
              {SUGGESTED_PROMPTS.map((p, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.suggestionRow,
                    {
                      backgroundColor: isDark ? colors.card : '#FFFFFF',
                      borderColor: colors.borderSubtle,
                    },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setQuery(p);
                    handleExecute(p);
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.suggestionText, { color: colors.textSecondary }]}>
                    "{p}"
                  </Text>
                  <ArrowRight2 size={13} color={colors.accent} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* 🔍 Results Stream & Comprehensive Abilities */}
          {isSearching ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Scanning 120+ live streams & partner boards…
              </Text>
            </View>
          ) : hasSearched ? (
            <View style={styles.resultsWrap}>
              {/* 🧠 AI Understood & Refined Intent Card (like Web) */}
              <View
                style={[
                  styles.understoodCard,
                  {
                    backgroundColor: isDark ? colors.card : '#FFFFFF',
                    borderColor: colors.borderSubtle,
                  },
                ]}
              >
                <View style={styles.understoodHeader}>
                  <View style={styles.understoodIconWrap}>
                    <Flash size={16} color={colors.accent} variant="Bold" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.understoodEyebrow, { color: colors.accent }]}>
                      SEARCH UNDERSTOOD
                    </Text>
                    <Text style={[styles.understoodQuery, { color: colors.text }]} numberOfLines={2}>
                      "{query || 'Matching all live opportunities'}"
                    </Text>
                  </View>
                </View>

                {/* Criteria Tags Pills */}
                <View style={styles.criteriaTagsRow}>
                  {criteriaTags.map((tag, tIdx) => (
                    <TouchableOpacity
                      key={tIdx}
                      style={[
                        styles.criteriaTagPill,
                        { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA' },
                      ]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setCriteriaTags((prev) => prev.filter((_, i) => i !== tIdx));
                      }}
                    >
                      <Text style={[styles.criteriaTagText, { color: colors.text }]}>{tag}</Text>
                      <CloseCircle size={13} color={colors.textMuted} />
                    </TouchableOpacity>
                  ))}

                  {/* Add detail pill */}
                  {isAddingTag ? (
                    <View style={styles.addTagInputWrap}>
                      <TextInput
                        style={[
                          styles.addTagInput,
                          {
                            backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA',
                            color: colors.text,
                          },
                        ]}
                        placeholder="e.g. $130+/hr"
                        placeholderTextColor={colors.textMuted}
                        value={newTagText}
                        onChangeText={setNewTagText}
                        onSubmitEditing={() => {
                          if (newTagText.trim()) {
                            setCriteriaTags((prev) => [...prev, newTagText.trim()]);
                            setNewTagText('');
                            setIsAddingTag(false);
                          }
                        }}
                        autoFocus
                      />
                      <TouchableOpacity
                        onPress={() => {
                          if (newTagText.trim()) {
                            setCriteriaTags((prev) => [...prev, newTagText.trim()]);
                            setNewTagText('');
                          }
                          setIsAddingTag(false);
                        }}
                      >
                        <TickCircle size={18} color={colors.accent} variant="Bold" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[
                        styles.addCriteriaBtn,
                        { borderColor: colors.borderSubtle },
                      ]}
                      onPress={() => setIsAddingTag(true)}
                    >
                      <Add size={12} color={colors.accent} />
                      <Text style={[styles.addCriteriaText, { color: colors.accent }]}>
                        Add Detail
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* 🎛️ Comprehensive Results Control Bar with "See All" Toggle */}
              <View style={styles.resultsControlBar}>
                <View style={styles.resultsCountBox}>
                  <Text style={[styles.resultsTitle, { color: colors.text }]}>
                    {displayedOpportunities.length} Matches Found
                  </Text>
                  <Text style={[styles.resultsSub, { color: colors.textMuted }]}>
                    {showAllDirectory ? 'Displaying full ecosystem directory' : 'Filtered to your active search'}
                  </Text>
                </View>

                <View style={styles.topControlActionBtns}>
                  {/* 🌟 "SEE ALL" / "TOP MATCHES" TOGGLE */}
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.selectionAsync();
                      setShowAllDirectory(!showAllDirectory);
                    }}
                    style={[
                      styles.seeAllToggleBtn,
                      {
                        backgroundColor: showAllDirectory ? colors.accent : isDark ? colors.surfaceSecondary : '#F0F4FA',
                        borderColor: showAllDirectory ? colors.accent : colors.borderSubtle,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.seeAllToggleText,
                        { color: showAllDirectory ? '#FFFFFF' : colors.accent },
                      ]}
                    >
                      {showAllDirectory ? 'Top Matches' : `See All (${SAMPLE_OPPORTUNITIES.length})`}
                    </Text>
                  </TouchableOpacity>

                  {/* Select All */}
                  <TouchableOpacity
                    onPress={() => handleSelectAll(displayedOpportunities)}
                    style={[
                      styles.controlSmallBtn,
                      { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA' },
                    ]}
                  >
                    <Text style={[styles.controlSmallBtnText, { color: colors.accent }]}>
                      {selectedIds.length === displayedOpportunities.length && displayedOpportunities.length > 0
                        ? 'Deselect'
                        : 'Select All'}
                    </Text>
                  </TouchableOpacity>

                  {/* Export */}
                  <TouchableOpacity
                    onPress={() => setIsExportModalOpen(true)}
                    style={[
                      styles.controlSmallBtn,
                      { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA' },
                    ]}
                  >
                    <ExportCurve size={14} color={colors.text} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* 🏷️ Horizontal Category Filter Pills */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryFilterScroll}
              >
                {FILTER_CATEGORY_TABS.map((tab) => {
                  const isSelected = activeFilterTab === tab.id;
                  return (
                    <TouchableOpacity
                      key={tab.id}
                      style={[
                        styles.categoryFilterChip,
                        {
                          backgroundColor: isSelected
                            ? colors.accent
                            : isDark
                            ? colors.card
                            : '#FFFFFF',
                          borderColor: isSelected ? colors.accent : colors.borderSubtle,
                        },
                      ]}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setActiveFilterTab(tab.id);
                      }}
                    >
                      <Text
                        style={[
                          styles.categoryFilterText,
                          {
                            color: isSelected ? '#FFFFFF' : colors.textSecondary,
                            fontFamily: isSelected ? FONTS.bold : FONTS.medium,
                          },
                        ]}
                      >
                        {tab.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* 🔎 Refine & Sort Toolbar */}
              <View style={styles.refineSortRow}>
                <View
                  style={[
                    styles.refineInputBox,
                    {
                      backgroundColor: isDark ? colors.card : '#FFFFFF',
                      borderColor: colors.borderSubtle,
                    },
                  ]}
                >
                  <SearchNormal1 size={14} color={colors.textMuted} />
                  <TextInput
                    style={[styles.refineInput, { color: colors.text }]}
                    placeholder="Refine in results (e.g. Remote, Linear, Stripe)…"
                    placeholderTextColor={colors.textMuted}
                    value={refineKeyword}
                    onChangeText={setRefineKeyword}
                  />
                  {refineKeyword.length > 0 && (
                    <TouchableOpacity onPress={() => setRefineKeyword('')}>
                      <CloseCircle size={14} color={colors.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Sort selector pills */}
                <TouchableOpacity
                  style={[
                    styles.sortPillBtn,
                    {
                      backgroundColor: isDark ? colors.card : '#FFFFFF',
                      borderColor: colors.borderSubtle,
                    },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    const nextSort =
                      sortBy === 'match'
                        ? 'comp'
                        : sortBy === 'comp'
                        ? 'newest'
                        : sortBy === 'newest'
                        ? 'org'
                        : 'match';
                    setSortBy(nextSort);
                  }}
                >
                  <Text style={[styles.sortPillText, { color: colors.textSecondary }]}>
                    Sort: {sortBy === 'match' ? 'Fit %' : sortBy === 'comp' ? 'Comp' : sortBy === 'newest' ? 'Newest' : 'Org'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* 🌟 Comprehensive Action Cards for Each Discovered Opportunity */}
              {displayedOpportunities.map((opp) => {
                const isSelected = selectedIds.includes(opp.id);
                const isSaved = savedIds.includes(opp.id) || isSavedInPipeline(opp.id);
                const isApplied = appliedIds.includes(opp.id) || isAppliedInPipeline(opp.id);
                const hasNote = Boolean(privateNotes[opp.id]);

                return (
                  <View
                    key={opp.id}
                    style={[
                      styles.comprehensiveCard,
                      {
                        backgroundColor: isDark ? colors.card : '#FFFFFF',
                        borderColor: isSelected ? colors.accent : colors.borderSubtle,
                      },
                    ]}
                  >
                    {/* Top Row: Select Checkbox, Company Avatar, Org & Role, Match Badge */}
                    <View style={styles.cardHeaderRow}>
                      <TouchableOpacity
                        onPress={() => handleToggleSelect(opp.id)}
                        style={[
                          styles.checkboxBtn,
                          {
                            backgroundColor: isSelected ? colors.accent : 'transparent',
                            borderColor: isSelected ? colors.accent : colors.border,
                          },
                        ]}
                      >
                        {isSelected && <TickCircle size={14} color="#FFFFFF" variant="Bold" />}
                      </TouchableOpacity>

                      <View style={[styles.orgLogoBox, { backgroundColor: 'rgba(255, 102, 0, 0.12)' }]}>
                        <Buildings size={20} color={colors.accent} variant="Bold" />
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={[styles.cardRoleTitle, { color: colors.text }]} numberOfLines={1}>
                          {opp.title}
                        </Text>
                        <Text style={[styles.cardOrgMeta, { color: colors.textSecondary }]}>
                          {opp.organization} · {opp.location}
                        </Text>
                      </View>

                      <Badge
                        label={`${opp.matchScore}%`}
                        variant={opp.matchScore >= 90 ? 'success' : 'accent'}
                        size="sm"
                      />
                    </View>

                    {/* Metadata Tags: Compensation, Remote, Type */}
                    <View style={styles.cardTagsRow}>
                      <View style={[styles.cardTag, { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA' }]}>
                        <DollarCircle size={12} color={colors.accent} variant="Bold" />
                        <Text style={[styles.cardTagText, { color: colors.text, fontWeight: '700' }]}>
                          {opp.compensation}
                        </Text>
                      </View>

                      {opp.isRemote && (
                        <View style={[styles.cardTag, { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA' }]}>
                          <Global size={12} color={colors.textSecondary} />
                          <Text style={[styles.cardTagText, { color: colors.textSecondary }]}>Remote</Text>
                        </View>
                      )}

                      <View style={[styles.cardTag, { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA' }]}>
                        <Text style={[styles.cardTagText, { color: colors.textSecondary }]}>
                          {opp.type.toUpperCase()}
                        </Text>
                      </View>

                      {hasNote && (
                        <View style={[styles.cardTag, { backgroundColor: 'rgba(255,102,0,0.1)' }]}>
                          <Edit2 size={11} color={colors.accent} />
                          <Text style={[styles.cardTagText, { color: colors.accent, fontWeight: '600' }]}>
                            Note Saved
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* AI Alignment Explanation */}
                    {opp.matchExplanation && (
                      <Text style={[styles.matchReasonText, { color: colors.textSecondary }]} numberOfLines={2}>
                        "{opp.matchExplanation}"
                      </Text>
                    )}

                    {/* 🛠️ Comprehensive Function Actions Toolbar */}
                    <View style={[styles.cardActionGrid, { borderTopColor: colors.borderSubtle }]}>
                      {/* 1. ⚡ Auto-Apply Button (Opens Auto-Apply Modal) */}
                      <TouchableOpacity
                        style={[
                          styles.actionPillBtn,
                          {
                            backgroundColor: isApplied
                              ? '#ECFDF5'
                              : isDark
                              ? colors.surfaceSecondary
                              : '#F0F4FA',
                          },
                        ]}
                        onPress={() => handleOpenAutoApply(opp)}
                        activeOpacity={0.75}
                      >
                        <Flash
                          size={14}
                          color={isApplied ? colors.success : '#FF6600'}
                          variant="Bold"
                        />
                        <Text
                          style={[
                            styles.actionPillText,
                            { color: isApplied ? colors.success : colors.text, fontWeight: '700' },
                          ]}
                        >
                          {isApplied ? 'Applied ✓' : 'Auto-Apply'}
                        </Text>
                      </TouchableOpacity>

                      {/* 2. ✉️ Mail / Pitch Outreach (Opens AI Outreach Modal) */}
                      <TouchableOpacity
                        style={[styles.actionPillBtn, { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA' }]}
                        onPress={() => handleOpenMail(opp)}
                        activeOpacity={0.75}
                      >
                        <Sms size={14} color={colors.accent} variant="Bold" />
                        <Text style={[styles.actionPillText, { color: colors.text }]}>Mail Pitch</Text>
                      </TouchableOpacity>

                      {/* 3. 📅 Schedule Follow-Up (Opens Schedule Modal) */}
                      <TouchableOpacity
                        style={[styles.actionPillBtn, { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA' }]}
                        onPress={() => handleOpenSchedule(opp)}
                        activeOpacity={0.75}
                      >
                        <Calendar size={14} color={colors.accent} variant="Bold" />
                        <Text style={[styles.actionPillText, { color: colors.text }]}>Schedule</Text>
                      </TouchableOpacity>

                      {/* 4. 💾 Save / Bookmark */}
                      <TouchableOpacity
                        style={[styles.actionPillBtn, { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA' }]}
                        onPress={() => handleToggleSave(opp.id)}
                        activeOpacity={0.75}
                      >
                        <ArchiveAdd
                          size={14}
                          color={isSaved ? colors.accent : colors.textSecondary}
                          variant={isSaved ? 'Bold' : 'Linear'}
                        />
                        <Text style={[styles.actionPillText, { color: isSaved ? colors.accent : colors.text }]}>
                          {isSaved ? 'Saved' : 'Save'}
                        </Text>
                      </TouchableOpacity>

                      {/* 5. 📝 Private Notes */}
                      <TouchableOpacity
                        style={[styles.actionIconOnly, { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA' }]}
                        onPress={() => handleOpenNotes(opp)}
                        activeOpacity={0.75}
                      >
                        <Edit2 size={14} color={hasNote ? colors.accent : colors.textSecondary} />
                      </TouchableOpacity>

                      {/* 6. 🌐 Visit Source Link */}
                      {opp.originalUrl ? (
                        <TouchableOpacity
                          style={[styles.actionIconOnly, { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA' }]}
                          onPress={() => Linking.openURL(opp.originalUrl)}
                          activeOpacity={0.75}
                        >
                          <Global size={14} color={colors.textSecondary} />
                        </TouchableOpacity>
                      ) : null}

                      {/* 7. 📤 Share */}
                      <TouchableOpacity
                        style={[styles.actionIconOnly, { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA' }]}
                        onPress={() => handleShareOpportunity(opp)}
                        activeOpacity={0.75}
                      >
                        <ExportCurve size={14} color={colors.textSecondary} />
                      </TouchableOpacity>

                      {/* 8. 👁️ View Full Details */}
                      <TouchableOpacity
                        style={[styles.actionIconOnly, { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA' }]}
                        onPress={() => router.push(`/opportunity/${opp.id}` as any)}
                        activeOpacity={0.75}
                      >
                        <Eye size={15} color={colors.accent} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}

              {displayedOpportunities.length === 0 && (
                <View style={styles.noResultsBox}>
                  <Text style={[styles.noResultsTitle, { color: colors.text }]}>
                    No Opportunities Match Current Filter
                  </Text>
                  <Text style={[styles.noResultsSub, { color: colors.textMuted }]}>
                    Try clearing refine keyword or select "All" category.
                  </Text>
                  <Button
                    title="Reset Filters"
                    variant="outline"
                    size="sm"
                    onPress={() => {
                      setActiveFilterTab('all');
                      setRefineKeyword('');
                    }}
                    style={{ marginTop: 12 }}
                  />
                </View>
              )}
            </View>
          ) : null}
        </ScrollView>

        {/* 🎛️ Floating Batch Actions Dock (When items selected) */}
        {selectedIds.length > 0 ? (
          <View
            style={[
              styles.floatingBatchDock,
              {
                backgroundColor: isDark ? colors.surface : '#14213D',
                shadowColor: colors.accent,
              },
            ]}
          >
            <View style={styles.dockInfo}>
              <Text style={styles.dockSelectedCount}>{selectedIds.length} Selected</Text>
              <TouchableOpacity onPress={() => setSelectedIds([])}>
                <Text style={styles.dockClearText}>Clear</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dockBtnRow}>
              <TouchableOpacity
                style={[styles.dockActionBtn, { backgroundColor: colors.accent }]}
                onPress={handleBatchAutoApply}
              >
                <Flash size={14} color="#FFF" variant="Bold" />
                <Text style={styles.dockActionText}>Auto-Apply</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.dockActionBtn, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
                onPress={handleBatchSave}
              >
                <ArchiveAdd size={14} color="#FFF" />
                <Text style={styles.dockActionText}>Save All</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.dockActionBtn, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
                onPress={() => setIsExportModalOpen(true)}
              >
                <ExportCurve size={14} color="#FFF" />
                <Text style={styles.dockActionText}>Export</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* Normal Sticky Bottom CTA */
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
              title={
                query.trim().length > 0
                  ? 'Search Across 124 Sources'
                  : 'Enter Query or Select Starting Point'
              }
              variant="accent"
              size="lg"
              rightIcon={<DirectSend size={18} color="#FFFFFF" variant="Bold" />}
              onPress={() => handleExecute()}
              disabled={!query.trim() || isSearching}
              isLoading={isSearching}
              style={{ width: '100%' }}
            />
          </View>
        )}
      </KeyboardAvoidingView>

      {/* ⚡ 1. AUTONOMOUS AUTO-APPLY MODAL */}
      <Modal
        visible={!!autoApplyOpp}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setAutoApplyOpp(null)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]} edges={['top']}>
          <View style={[styles.modalTopBar, { borderBottomColor: colors.borderSubtle }]}>
            <TouchableOpacity onPress={() => setAutoApplyOpp(null)} style={styles.backBtn}>
              <CloseCircle size={20} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Autonomous Application</Text>
            <View style={{ width: 36 }} />
          </View>

          <ScrollView contentContainerStyle={styles.cvModalScroll} showsVerticalScrollIndicator={false}>
            {autoApplySuccess ? (
              <View style={styles.autoSuccessWrap}>
                <View style={[styles.successIconCircle, { backgroundColor: '#ECFDF5' }]}>
                  <TickCircle size={36} color={colors.success} variant="Bold" />
                </View>
                <Text style={[styles.autoSuccessTitle, { color: colors.text }]}>Application Dispatched!</Text>
                <Text style={[styles.autoSuccessSub, { color: colors.textSecondary }]}>
                  Your proposal calibrated with "{activeCv.name}" has been prepared and queued for{' '}
                  {autoApplyOpp?.organization}.
                </Text>
                <View style={[styles.auditInfoCard, { backgroundColor: isDark ? colors.card : '#F8FAFC' }]}>
                  <Text style={[styles.auditInfoLabel, { color: colors.textMuted }]}>AUDIT TRAIL</Text>
                  <Text style={[styles.auditInfoText, { color: colors.text }]}>
                    • Matched {autoApplyOpp?.matchScore}% to role specifications
                  </Text>
                  <Text style={[styles.auditInfoText, { color: colors.text }]}>
                    • Target Contact: {autoApplyOpp?.contactPerson || 'Engineering Recruiting'}
                  </Text>
                  <Text style={[styles.auditInfoText, { color: colors.text }]}>
                    • Status: Queued in your Pipeline
                  </Text>
                </View>

                <Button
                  title="Done & View in Pipeline"
                  variant="accent"
                  size="md"
                  onPress={() => setAutoApplyOpp(null)}
                  style={{ width: '100%', marginTop: 20 }}
                />
              </View>
            ) : (
              <>
                <View style={styles.mailOppSummary}>
                  <Text style={[styles.mailOppTitle, { color: colors.text }]}>{autoApplyOpp?.title}</Text>
                  <Text style={[styles.mailOppOrg, { color: colors.textSecondary }]}>
                    {autoApplyOpp?.organization} · {autoApplyOpp?.location}
                  </Text>
                  <Text style={[styles.mailOppComp, { color: colors.accent }]}>
                    {autoApplyOpp?.compensation}
                  </Text>
                </View>

                {/* Candidate CV profile */}
                <Text style={[styles.formLabel, { color: colors.textSecondary, marginTop: 14 }]}>
                  Active Candidate CV
                </Text>
                <View style={[styles.cvMiniCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
                  <DocumentText size={18} color={colors.accent} variant="Bold" />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cvMiniTitle, { color: colors.text }]} numberOfLines={1}>
                      {activeCv.name}
                    </Text>
                    <Text style={[styles.cvMiniSub, { color: colors.textMuted }]}>
                      {activeCv.skills.slice(0, 3).join(' · ')}
                    </Text>
                  </View>
                  <Badge label={`${autoApplyOpp?.matchScore}% Fit`} variant="success" size="sm" />
                </View>

                {/* AI Calibration reasoning */}
                <Text style={[styles.formLabel, { color: colors.textSecondary, marginTop: 14 }]}>
                  AI Tailored Cover Letter Summary
                </Text>
                <View style={[styles.coverLetterPreview, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
                  <Text style={[styles.coverLetterText, { color: colors.textSecondary }]}>
                    "Dear {autoApplyOpp?.contactPerson || 'Hiring Team'}, having architected production mobile systems with{' '}
                    {activeCv.skills.slice(0, 3).join(', ')}, I submit my background for the {autoApplyOpp?.title} position.
                    My track record directly resolves your core requirements with zero onboarding lag..."
                  </Text>
                </View>

                <View style={styles.dialogActionRow}>
                  <Button
                    title="Cancel"
                    variant="outline"
                    size="md"
                    onPress={() => setAutoApplyOpp(null)}
                    style={{ flex: 1 }}
                  />
                  <Button
                    title={isAutoApplying ? 'Calibrating & Queuing...' : '⚡ Confirm & Dispatch'}
                    variant="accent"
                    size="md"
                    isLoading={isAutoApplying}
                    onPress={handleConfirmAutoApply}
                    style={{ flex: 1.8 }}
                  />
                </View>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ✉️ 2. MAIL / OUTREACH PITCH MODAL WITH TONE CONTROLS */}
      <Modal
        visible={!!mailModalOpp}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setMailModalOpp(null)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]} edges={['top']}>
          <View style={[styles.modalTopBar, { borderBottomColor: colors.borderSubtle }]}>
            <TouchableOpacity onPress={() => setMailModalOpp(null)} style={styles.backBtn}>
              <CloseCircle size={20} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Prepare Outreach Pitch</Text>
            <View style={{ width: 36 }} />
          </View>

          <ScrollView contentContainerStyle={styles.cvModalScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.mailOppSummary}>
              <Text style={[styles.mailOppTitle, { color: colors.text }]}>{mailModalOpp?.title}</Text>
              <Text style={[styles.mailOppOrg, { color: colors.textSecondary }]}>
                {mailModalOpp?.organization} · {mailRecipient}
              </Text>
            </View>

            {/* Tone Selector Pills */}
            <Text style={[styles.formLabel, { color: colors.textSecondary, marginTop: 10 }]}>
              Pitch Tone & Voice
            </Text>
            <View style={styles.tonePillRow}>
              {(['Executive', 'Direct', 'Technical', 'Warm'] as const).map((t) => {
                const isSelected = mailTone === t;
                return (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.tonePill,
                      {
                        backgroundColor: isSelected
                          ? colors.accent
                          : isDark
                          ? colors.surfaceSecondary
                          : '#F0F4FA',
                        borderColor: isSelected ? colors.accent : colors.borderSubtle,
                      },
                    ]}
                    onPress={() => handleSelectMailTone(t)}
                  >
                    <Text
                      style={[
                        styles.tonePillText,
                        { color: isSelected ? '#FFFFFF' : colors.text, fontWeight: isSelected ? '700' : '500' },
                      ]}
                    >
                      {t}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.formLabel, { color: colors.textSecondary, marginTop: 14 }]}>
              Recipient Address
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
              value={mailRecipient}
              onChangeText={setMailRecipient}
            />

            <Text style={[styles.formLabel, { color: colors.textSecondary, marginTop: 14 }]}>
              Subject Line
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
              value={mailSubject}
              onChangeText={setMailSubject}
            />

            <Text style={[styles.formLabel, { color: colors.textSecondary, marginTop: 14 }]}>
              Tailored Message Body
            </Text>
            <TextInput
              style={[
                styles.formInput,
                {
                  backgroundColor: isDark ? colors.card : '#FFFFFF',
                  borderColor: colors.border,
                  color: colors.text,
                  minHeight: 160,
                  textAlignVertical: 'top',
                  paddingTop: 10,
                },
              ]}
              multiline
              numberOfLines={8}
              value={mailBody}
              onChangeText={setMailBody}
            />

            <View style={styles.mailActionsRow}>
              <Button
                title={copiedMail ? 'Copied ✓' : 'Copy Pitch'}
                variant="outline"
                size="md"
                leftIcon={<Copy size={16} color={colors.accent} />}
                onPress={async () => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  setCopiedMail(true);
                  setTimeout(() => setCopiedMail(false), 2000);
                }}
                style={{ flex: 1 }}
              />

              <Button
                title="Send via Mail App"
                variant="accent"
                size="md"
                rightIcon={<Send2 size={16} color="#FFF" />}
                onPress={handleLaunchNativeEmail}
                style={{ flex: 1.5 }}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* 📅 3. SCHEDULE CADENCE MODAL */}
      <Modal
        visible={!!scheduleModalOpp}
        animationType="fade"
        transparent
        onRequestClose={() => setScheduleModalOpp(null)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.dialogBox,
              { backgroundColor: isDark ? colors.surface : '#FFFFFF', borderColor: colors.border },
            ]}
          >
            <View style={styles.dialogHeader}>
              <Text style={[styles.dialogTitle, { color: colors.text }]}>Schedule Follow-Up</Text>
              <TouchableOpacity onPress={() => setScheduleModalOpp(null)}>
                <CloseCircle size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Cadence Interval</Text>
            <View style={styles.cadenceRow}>
              {[
                { id: 'tomorrow', label: 'Tomorrow' },
                { id: '3days', label: 'In 3 Days' },
                { id: '1week', label: 'In 1 Week' },
                { id: '2weeks', label: 'In 2 Weeks' },
              ].map((c) => {
                const isSelected = scheduleCadence === c.id;
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={[
                      styles.cadenceBtn,
                      {
                        backgroundColor: isSelected ? colors.accent : isDark ? colors.card : '#F0F4FA',
                        borderColor: isSelected ? colors.accent : colors.border,
                      },
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setScheduleCadence(c.id as any);
                    }}
                  >
                    <Text
                      style={[
                        styles.cadenceBtnText,
                        { color: isSelected ? '#FFFFFF' : colors.text, fontWeight: isSelected ? '700' : '500' },
                      ]}
                    >
                      {c.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.formLabel, { color: colors.textSecondary, marginTop: 12 }]}>
              Milestone Objective
            </Text>
            <View style={styles.objectivePillRow}>
              {(['Review Application', 'Send Portfolio', 'Follow-up Pitch', 'Interview Prep'] as const).map(
                (obj) => {
                  const isSelected = scheduleObjective === obj;
                  return (
                    <TouchableOpacity
                      key={obj}
                      style={[
                        styles.objectivePill,
                        {
                          backgroundColor: isSelected
                            ? colors.accent
                            : isDark
                            ? colors.card
                            : '#F0F4FA',
                        },
                      ]}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setScheduleObjective(obj);
                      }}
                    >
                      <Text
                        style={[
                          styles.objectivePillText,
                          { color: isSelected ? '#FFF' : colors.textSecondary },
                        ]}
                      >
                        {obj}
                      </Text>
                    </TouchableOpacity>
                  );
                }
              )}
            </View>

            <Text style={[styles.formLabel, { color: colors.textSecondary, marginTop: 12 }]}>Action Note</Text>
            <TextInput
              style={[
                styles.formInput,
                { backgroundColor: isDark ? colors.card : '#F8FAFC', borderColor: colors.border, color: colors.text },
              ]}
              value={scheduleNotes}
              onChangeText={setScheduleNotes}
              placeholder="e.g. Inquire on initial screening date..."
              placeholderTextColor={colors.textMuted}
            />

            <View style={styles.dialogActionRow}>
              <Button
                title="Cancel"
                variant="outline"
                size="md"
                onPress={() => setScheduleModalOpp(null)}
                style={{ flex: 1 }}
              />
              <Button
                title="Save & Set Cadence"
                variant="accent"
                size="md"
                onPress={handleSaveSchedule}
                style={{ flex: 1.5 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* 📝 4. PRIVATE NOTES MODAL */}
      <Modal
        visible={!!noteModalOpp}
        animationType="fade"
        transparent
        onRequestClose={() => setNoteModalOpp(null)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.dialogBox,
              { backgroundColor: isDark ? colors.surface : '#FFFFFF', borderColor: colors.border },
            ]}
          >
            <View style={styles.dialogHeader}>
              <Text style={[styles.dialogTitle, { color: colors.text }]}>Private Dossier Note</Text>
              <TouchableOpacity onPress={() => setNoteModalOpp(null)}>
                <CloseCircle size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 12 }}>
              {noteModalOpp?.title} · {noteModalOpp?.organization}
            </Text>

            <TextInput
              style={[
                styles.formInput,
                {
                  backgroundColor: isDark ? colors.card : '#F8FAFC',
                  borderColor: colors.border,
                  color: colors.text,
                  minHeight: 110,
                  textAlignVertical: 'top',
                  paddingTop: 10,
                },
              ]}
              multiline
              numberOfLines={4}
              placeholder="Add personal thoughts, meeting notes, or specific requirements to verify…"
              placeholderTextColor={colors.textMuted}
              value={currentNoteDraft}
              onChangeText={setCurrentNoteDraft}
            />

            <View style={styles.dialogActionRow}>
              <Button
                title="Cancel"
                variant="outline"
                size="md"
                onPress={() => setNoteModalOpp(null)}
                style={{ flex: 1 }}
              />
              <Button
                title="Save Note"
                variant="accent"
                size="md"
                onPress={handleSavePrivateNote}
                style={{ flex: 1.3 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* 📤 5. EXPORT DIALOG MODAL */}
      <Modal
        visible={isExportModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsExportModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.dialogBox,
              { backgroundColor: isDark ? colors.surface : '#FFFFFF', borderColor: colors.border },
            ]}
          >
            <View style={styles.dialogHeader}>
              <Text style={[styles.dialogTitle, { color: colors.text }]}>Export Opportunities</Text>
              <TouchableOpacity onPress={() => setIsExportModalOpen(false)}>
                <CloseCircle size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 14 }}>
              Export {selectedIds.length > 0 ? selectedIds.length : displayedOpportunities.length} opportunities
              formatted for your external pipeline tools.
            </Text>

            {/* Format Picker */}
            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Export Format</Text>
            <View style={styles.cadenceRow}>
              {(['CSV', 'JSON', 'TEXT'] as const).map((fmt) => {
                const isSelected = exportFormat === fmt;
                return (
                  <TouchableOpacity
                    key={fmt}
                    style={[
                      styles.cadenceBtn,
                      {
                        backgroundColor: isSelected ? colors.accent : isDark ? colors.card : '#F0F4FA',
                        borderColor: isSelected ? colors.accent : colors.border,
                      },
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setExportFormat(fmt);
                    }}
                  >
                    <Text
                      style={[
                        styles.cadenceBtnText,
                        { color: isSelected ? '#FFFFFF' : colors.text, fontWeight: isSelected ? '700' : '500' },
                      ]}
                    >
                      {fmt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.dialogActionRow}>
              <Button
                title="Cancel"
                variant="outline"
                size="md"
                onPress={() => setIsExportModalOpen(false)}
                style={{ flex: 1 }}
              />
              <Button
                title={`Export & Share ${exportFormat}`}
                variant="accent"
                size="md"
                leftIcon={<ExportCurve size={16} color="#FFF" />}
                onPress={handleExportData}
                style={{ flex: 1.8 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* 📄 6. FULL SCREEN MODAL: Manage CVs */}
      <Modal
        visible={isCvManagerOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsCvManagerOpen(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]} edges={['top']}>
          <View style={[styles.modalTopBar, { borderBottomColor: colors.borderSubtle }]}>
            <TouchableOpacity
              onPress={() => setIsCvManagerOpen(false)}
              style={[styles.backBtn, { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA' }]}
              activeOpacity={0.7}
            >
              <CloseCircle size={20} color={colors.text} variant="Linear" />
            </TouchableOpacity>

            <Text style={[styles.modalTitle, { color: colors.text }]}>CV & Resume Profiles</Text>

            <TouchableOpacity
              onPress={() => setIsAddCvModalOpen(true)}
              style={[styles.addCvBtn, { backgroundColor: colors.accent }]}
              activeOpacity={0.8}
            >
              <Add size={16} color="#FFF" />
              <Text style={styles.addCvBtnText}>Add CV</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.cvModalScroll} showsVerticalScrollIndicator={false}>
            <Text style={[styles.cvModalSub, { color: colors.textMuted }]}>
              ProspectAI calibrates match precision and drafts tailored pitches against your active CV skills.
            </Text>

            {cvList.map((cv) => {
              const isPrimary = cv.isPrimary;
              return (
                <View
                  key={cv.id}
                  style={[
                    styles.cvCard,
                    {
                      backgroundColor: isDark ? colors.card : '#FFFFFF',
                      borderColor: isPrimary ? colors.accent : colors.borderSubtle,
                    },
                  ]}
                >
                  <View style={styles.cvCardHeader}>
                    <View style={styles.cvCardTitleWrap}>
                      <Text style={[styles.cvCardName, { color: colors.text }]} numberOfLines={1}>
                        {cv.name}
                      </Text>
                      <Text style={[styles.cvCardMeta, { color: colors.textMuted }]}>
                        {cv.size} · {cv.uploadedAt}
                      </Text>
                    </View>

                    {isPrimary ? (
                      <Badge label="ACTIVE" variant="success" size="sm" />
                    ) : (
                      <TouchableOpacity
                        onPress={() => {
                          Haptics.selectionAsync();
                          setCvList((prev) =>
                            prev.map((c) => ({
                              ...c,
                              isPrimary: c.id === cv.id,
                            }))
                          );
                        }}
                        style={[styles.setPrimaryBtn, { borderColor: colors.accent }]}
                      >
                        <Text style={[styles.setPrimaryText, { color: colors.accent }]}>
                          Make Active
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Skills Chips */}
                  <View style={styles.skillsGrid}>
                    {cv.skills.map((skill, sIdx) => (
                      <View
                        key={sIdx}
                        style={[
                          styles.skillPill,
                          { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA' },
                        ]}
                      >
                        <Text style={[styles.skillPillText, { color: colors.textSecondary }]}>
                          {skill}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Delete Button */}
                  <View style={[styles.cvCardFooter, { borderTopColor: colors.borderSubtle }]}>
                    <TouchableOpacity
                      onPress={() => {
                        if (cvList.length <= 1) {
                          Alert.alert('Cannot Remove', 'You must maintain at least one CV profile.');
                          return;
                        }
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setCvList((prev) => prev.filter((c) => c.id !== cv.id));
                      }}
                      style={styles.deleteCvBtn}
                      activeOpacity={0.7}
                    >
                      <Trash size={14} color="#EF4444" variant="Linear" />
                      <Text style={styles.deleteCvText}>Remove CV</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* 📄 7. ADD NEW CV MODAL */}
      <Modal
        visible={isAddCvModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsAddCvModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.dialogBox,
              { backgroundColor: isDark ? colors.surface : '#FFFFFF', borderColor: colors.border },
            ]}
          >
            <View style={styles.dialogHeader}>
              <Text style={[styles.dialogTitle, { color: colors.text }]}>Add New CV Profile</Text>
              <TouchableOpacity onPress={() => setIsAddCvModalOpen(false)}>
                <CloseCircle size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Document Name</Text>
            <TextInput
              style={[
                styles.formInput,
                {
                  backgroundColor: isDark ? colors.card : '#F8FAFC',
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="e.g. Senior Mobile Architect.pdf"
              placeholderTextColor={colors.textMuted}
              value={newCvName}
              onChangeText={setNewCvName}
            />

            <Text style={[styles.formLabel, { color: colors.textSecondary, marginTop: 12 }]}>
              Extracted Skills (comma-separated)
            </Text>
            <TextInput
              style={[
                styles.formInput,
                {
                  backgroundColor: isDark ? colors.card : '#F8FAFC',
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="e.g. React Native, Expo, TypeScript, Ledgers"
              placeholderTextColor={colors.textMuted}
              value={newCvSkills}
              onChangeText={setNewCvSkills}
            />

            <View style={styles.dialogActionRow}>
              <Button
                title="Cancel"
                variant="outline"
                size="md"
                onPress={() => setIsAddCvModalOpen(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="Save & Activate"
                variant="accent"
                size="md"
                onPress={() => {
                  if (!newCvName.trim()) return;
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  const added: UserCV = {
                    id: `cv-${Date.now()}`,
                    name: newCvName.endsWith('.pdf') ? newCvName.trim() : `${newCvName.trim()}.pdf`,
                    size: '1.1 MB',
                    uploadedAt: 'Added Just Now',
                    isPrimary: true,
                    skills: newCvSkills.split(',').map((s) => s.trim()).filter(Boolean),
                  };
                  setCvList((prev) => [added, ...prev.map((c) => ({ ...c, isPrimary: false }))]);
                  setNewCvName('');
                  setNewCvSkills('');
                  setIsAddCvModalOpen(false);
                }}
                disabled={!newCvName.trim()}
                style={{ flex: 1.5 }}
              />
            </View>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xs + 2,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cvHeaderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    maxWidth: 200,
  },
  cvHeaderPillText: {
    fontSize: 12,
    fontFamily: FONTS.bold,
  },
  cvCountDot: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: BORDER_RADIUS.full,
  },
  cvCountDotText: {
    color: '#FFF',
    fontSize: 9.5,
    fontFamily: FONTS.bold,
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
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  heroInputCard: {
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1.5,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  heroInputText: {
    fontSize: 15.5,
    lineHeight: 23,
    minHeight: 80,
    marginBottom: SPACING.sm,
  },
  inputControlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  controlsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
  },
  quickPillText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cvBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  cvBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  cvIconWrap: {
    width: 34,
    height: 34,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cvTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cvBannerTitle: {
    fontSize: 13,
    fontFamily: FONTS.bold,
  },
  cvSkillsSummary: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  toolsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.lg,
  },
  toolPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
  },
  toolPillText: {
    fontSize: 11.5,
  },
  suggestionsSection: {
    marginBottom: SPACING.xl,
  },
  sectionHeading: {
    fontSize: 13,
    fontFamily: FONTS.bold,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    marginBottom: 6,
  },
  suggestionText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    flex: 1,
    marginRight: 8,
  },
  loadingWrap: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13.5,
    fontFamily: FONTS.medium,
  },
  resultsWrap: {
    marginTop: SPACING.xs,
  },
  understoodCard: {
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    padding: 12,
    marginBottom: SPACING.md,
  },
  understoodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  understoodIconWrap: {
    width: 28,
    height: 28,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(255,102,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  understoodEyebrow: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    letterSpacing: 0.5,
  },
  understoodQuery: {
    fontSize: 13,
    fontFamily: FONTS.bold,
  },
  criteriaTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  criteriaTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  criteriaTagText: {
    fontSize: 11,
    fontFamily: FONTS.medium,
  },
  addCriteriaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  addCriteriaText: {
    fontSize: 11,
    fontFamily: FONTS.semibold,
  },
  addTagInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addTagInput: {
    height: 26,
    paddingHorizontal: 8,
    borderRadius: BORDER_RADIUS.full,
    fontSize: 11,
  },
  resultsControlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  resultsCountBox: {
    flex: 1,
  },
  resultsTitle: {
    fontSize: 15,
    fontFamily: FONTS.bold,
  },
  resultsSub: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    marginTop: 1,
  },
  topControlActionBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  seeAllToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
  },
  seeAllToggleText: {
    fontSize: 11,
    fontFamily: FONTS.bold,
  },
  controlSmallBtn: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.full,
  },
  controlSmallBtnText: {
    fontSize: 11,
    fontFamily: FONTS.bold,
  },
  categoryFilterScroll: {
    gap: 6,
    paddingBottom: 10,
  },
  categoryFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
  },
  categoryFilterText: {
    fontSize: 11.5,
  },
  refineSortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  refineInputBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 10,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  refineInput: {
    flex: 1,
    fontSize: 12,
  },
  sortPillBtn: {
    height: 36,
    paddingHorizontal: 10,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortPillText: {
    fontSize: 11.5,
    fontFamily: FONTS.semibold,
  },
  comprehensiveCard: {
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    padding: 13,
    marginBottom: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  checkboxBtn: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orgLogoBox: {
    width: 34,
    height: 34,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardRoleTitle: {
    fontSize: 14.5,
    fontFamily: FONTS.bold,
  },
  cardOrgMeta: {
    fontSize: 11.5,
    fontFamily: FONTS.regular,
    marginTop: 1,
  },
  cardTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  cardTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.sm,
  },
  cardTagText: {
    fontSize: 10.5,
  },
  matchReasonText: {
    fontSize: 11.5,
    fontFamily: FONTS.regular,
    lineHeight: 16,
    fontStyle: 'italic',
    marginBottom: 10,
  },
  cardActionGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  actionPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.md,
  },
  actionPillText: {
    fontSize: 11,
    fontFamily: FONTS.medium,
  },
  actionIconOnly: {
    width: 30,
    height: 30,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noResultsBox: {
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noResultsTitle: {
    fontSize: 14,
    fontFamily: FONTS.bold,
  },
  noResultsSub: {
    fontSize: 12,
    marginTop: 4,
  },
  floatingBatchDock: {
    position: 'absolute',
    bottom: 24,
    left: SPACING.lg,
    right: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  dockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dockSelectedCount: {
    color: '#FFF',
    fontSize: 13,
    fontFamily: FONTS.bold,
  },
  dockClearText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11.5,
  },
  dockBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dockActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
  },
  dockActionText: {
    color: '#FFF',
    fontSize: 11.5,
    fontFamily: FONTS.bold,
  },
  bottomStickyBar: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  modalContainer: {
    flex: 1,
  },
  modalTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
  addCvBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
  },
  addCvBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: FONTS.bold,
  },
  cvModalScroll: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  cvModalSub: {
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 14,
  },
  cvCard: {
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  cvCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cvCardTitleWrap: {
    flex: 1,
    marginRight: 8,
  },
  cvCardName: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    marginBottom: 2,
  },
  cvCardMeta: {
    fontSize: 11,
    fontFamily: FONTS.regular,
  },
  setPrimaryBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
  },
  setPrimaryText: {
    fontSize: 11,
    fontFamily: FONTS.semibold,
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  skillPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  skillPillText: {
    fontSize: 11,
  },
  cvCardFooter: {
    paddingTop: 8,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  deleteCvBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
  },
  deleteCvText: {
    color: '#EF4444',
    fontSize: 11.5,
    fontFamily: FONTS.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  dialogBox: {
    width: '100%',
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    padding: SPACING.lg,
  },
  dialogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  dialogTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
  formLabel: {
    fontSize: 12,
    fontFamily: FONTS.semibold,
    marginBottom: 6,
  },
  formInput: {
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  dialogActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: SPACING.lg,
  },
  mailOppSummary: {
    padding: 12,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: 'rgba(255,102,0,0.08)',
    marginBottom: 10,
  },
  mailOppTitle: {
    fontSize: 14.5,
    fontFamily: FONTS.bold,
  },
  mailOppOrg: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  mailOppComp: {
    fontSize: 12.5,
    fontFamily: FONTS.bold,
    marginTop: 3,
  },
  tonePillRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  tonePill: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tonePillText: {
    fontSize: 11,
  },
  mailActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: SPACING.lg,
  },
  cadenceRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  cadenceBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cadenceBtnText: {
    fontSize: 11.5,
  },
  objectivePillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  objectivePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.full,
  },
  objectivePillText: {
    fontSize: 11,
  },
  autoSuccessWrap: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  autoSuccessTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    marginBottom: 6,
  },
  autoSuccessSub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  auditInfoCard: {
    width: '100%',
    padding: 12,
    borderRadius: BORDER_RADIUS.md,
    gap: 4,
  },
  auditInfoLabel: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  auditInfoText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
  },
  cvMiniCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  cvMiniTitle: {
    fontSize: 12.5,
    fontFamily: FONTS.bold,
  },
  cvMiniSub: {
    fontSize: 10.5,
  },
  coverLetterPreview: {
    padding: 10,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  coverLetterText: {
    fontSize: 12,
    lineHeight: 17,
    fontStyle: 'italic',
  },
});
