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
import { Button, CustomDateTimePickerSheet } from '@/components/ui';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/theme';
import {
  ArrowLeft2,
  Radar2,
  DirectSend,
  Flash,
  TickCircle,
  Briefcase,
  Buildings,
  Award,
  DollarCircle,
  Global,
  Clock,
  MagicStar,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';

const CATEGORIES = [
  {
    id: 'contract' as const,
    label: 'Contracts',
    icon: Flash,
    color: '#FF6600',
    desc: 'Hourly & milestone contracts',
  },
  {
    id: 'full-time' as const,
    label: 'Full-Time',
    icon: Buildings,
    color: '#0052FF',
    desc: 'Principal & Staff roles with equity',
  },
  {
    id: 'lead' as const,
    label: 'B2B Leads',
    icon: Briefcase,
    color: '#10B981',
    desc: 'Advisory & enterprise clients',
  },
  {
    id: 'grant' as const,
    label: 'Grants',
    icon: Award,
    color: '#8B5CF6',
    desc: 'Non-dilutive innovation funds',
  },
];

const SUGGESTIONS = [
  'React Native / Expo 57 contract > $120/hr in US/EMEA',
  'Fintech AI automation leads for seed to Series B',
  'Staff mobile architect equity advisory contracts',
  'Offline-first mobile engineering advisory roles',
];

const QUICK_TAGS = ['> $120/hr', '100% Remote', 'US / EMEA', 'Matches Primary CV'];

export default function CreateRadarScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const params = useLocalSearchParams<{ initialPrompt?: string }>();

  const [prompt, setPrompt] = useState(params.initialPrompt || '');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<typeof CATEGORIES[number]['id']>('contract');
  const [frequency, setFrequency] = useState<'weekdays' | 'daily' | 'weekly' | 'custom'>('weekdays');
  const [customCadenceDate, setCustomCadenceDate] = useState<string>('');
  const [isCustomPickerOpen, setIsCustomPickerOpen] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);

  const inputRef = useRef<TextInputInstance>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const handleAppendTag = (tag: string) => {
    Haptics.selectionAsync();
    setPrompt((prev) => (prev ? `${prev} · ${tag}` : tag));
  };

  const handleLaunch = () => {
    if (!prompt.trim()) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsDeploying(true);

    setTimeout(() => {
      setIsDeploying(false);
      router.back();
    }, 450);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Top Header */}
      <View style={[styles.topBar, { borderBottomColor: colors.borderSubtle }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA' }]}
          activeOpacity={0.7}
        >
          <ArrowLeft2 size={20} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Deploy Autonomous Radar</Text>
          <Text style={[styles.headerSub, { color: colors.textMuted }]}>
            Scouts 120+ live endpoints continuously
          </Text>
        </View>

        <TouchableOpacity onPress={() => router.back()} style={styles.cancelBtn}>
          <Text style={[styles.cancelBtnText, { color: colors.textMuted }]}>Cancel</Text>
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
          {/* Section 1: Category Selection (Rich Interactive Cards) */}
          <View style={styles.sectionWrap}>
            <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
              1. Opportunity Category
            </Text>

            <View style={styles.categoriesGrid}>
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat.id;
                const IconComp = cat.icon;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryCard,
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
                      setCategory(cat.id);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.catTopRow}>
                      <View
                        style={[
                          styles.catIconBox,
                          {
                            backgroundColor: isSelected ? colors.accent : isDark ? colors.surfaceSecondary : '#F0F4FA',
                          },
                        ]}
                      >
                        <IconComp
                          size={16}
                          color={isSelected ? '#FFFFFF' : cat.color}
                          variant="Bold"
                        />
                      </View>

                      {isSelected && (
                        <TickCircle size={16} color={colors.accent} variant="Bold" />
                      )}
                    </View>

                    <Text
                      style={[
                        styles.catLabel,
                        {
                          color: isSelected ? colors.accent : colors.text,
                          fontFamily: isSelected ? FONTS.bold : FONTS.semibold,
                        },
                      ]}
                    >
                      {cat.label}
                    </Text>

                    <Text style={[styles.catDesc, { color: colors.textMuted }]} numberOfLines={2}>
                      {cat.desc}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Section 2: Natural Language Search Query */}
          <View style={styles.sectionWrap}>
            <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
              2. Natural Language Scout Prompt
            </Text>

            <View
              style={[
                styles.promptBox,
                {
                  backgroundColor: isDark ? colors.card : '#FFFFFF',
                  borderColor: prompt ? colors.accent : colors.border,
                },
              ]}
            >
              <TextInput
                ref={inputRef}
                style={[styles.promptInput, { color: colors.text, fontFamily: FONTS.regular }]}
                placeholder="e.g. Senior Mobile Lead contract paying >$120/hr in US/EMEA matching my primary CV…"
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
                value={prompt}
                onChangeText={setPrompt}
                textAlignVertical="top"
              />

              {/* Quick Tag Modifiers */}
              <View style={[styles.quickTagsBar, { borderTopColor: colors.borderSubtle }]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagsScroll}>
                  {QUICK_TAGS.map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.quickTagBtn, { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA' }]}
                      onPress={() => handleAppendTag(t)}
                    >
                      <Text style={[styles.quickTagText, { color: colors.textSecondary }]}>+ {t}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            {/* Prompt Suggestions */}
            <View style={styles.suggestionsBlock}>
              <Text style={[styles.subLabel, { color: colors.textMuted }]}>
                Suggested Query Ideas:
              </Text>
              <View style={styles.suggestionsList}>
                {SUGGESTIONS.map((sug, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.sugCard,
                      {
                        backgroundColor: isDark ? colors.card : '#FFFFFF',
                        borderColor: colors.borderSubtle,
                      },
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setPrompt(sug);
                    }}
                  >
                    <Flash size={13} color={colors.accent} variant="Bold" />
                    <Text style={[styles.sugCardText, { color: colors.text }]} numberOfLines={1}>
                      {sug}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Section 3: Radar Name (Optional) */}
          <View style={styles.sectionWrap}>
            <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
              3. Radar Name (Optional)
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
              placeholder="e.g. Fintech Mobile Architect Scout"
              placeholderTextColor={colors.textMuted}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Section 4: Cadence & Timing */}
          <View style={styles.sectionWrap}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
                4. Scan Cadence
              </Text>
              {frequency === 'custom' && customCadenceDate ? (
                <TouchableOpacity onPress={() => setIsCustomPickerOpen(true)}>
                  <Text style={{ fontFamily: FONTS.semiBold, fontSize: 12, color: colors.accent }}>
                    Edit Date & Time ✎
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.freqGrid}>
              {[
                { id: 'weekdays' as const, label: 'Weekdays', desc: 'Mon - Fri at 8:30 AM' },
                { id: 'daily' as const, label: 'Daily', desc: '7 days a week at 8:30 AM' },
                { id: 'weekly' as const, label: 'Weekly', desc: 'Monday briefings' },
                {
                  id: 'custom' as const,
                  label: 'Custom Timing',
                  desc: customCadenceDate ? customCadenceDate : 'Pick date & hour',
                },
              ].map((f) => {
                const isSelected = frequency === f.id;
                return (
                  <TouchableOpacity
                    key={f.id}
                    style={[
                      styles.freqCard,
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
                      if (f.id === 'custom') {
                        setIsCustomPickerOpen(true);
                      } else {
                        setFrequency(f.id);
                      }
                    }}
                    activeOpacity={0.75}
                  >
                    <View style={styles.freqCardTop}>
                      <Clock
                        size={16}
                        color={isSelected ? colors.accent : colors.textMuted}
                        variant={isSelected ? 'Bold' : 'Linear'}
                      />
                      {isSelected && <TickCircle size={15} color={colors.accent} variant="Bold" />}
                    </View>
                    <Text
                      style={[
                        styles.freqBtnText,
                        {
                          color: isSelected ? colors.accent : colors.text,
                          fontFamily: isSelected ? FONTS.bold : FONTS.medium,
                        },
                      ]}
                    >
                      {f.label}
                    </Text>
                    <Text
                      style={[
                        styles.freqBtnDesc,
                        { color: isSelected ? colors.textSecondary : colors.textMuted },
                      ]}
                      numberOfLines={2}
                    >
                      {f.desc}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>

        {/* Sticky Bottom Launch Button */}
        <View
          style={[
            styles.bottomBar,
            {
              backgroundColor: isDark ? colors.surface : '#FFFFFF',
              borderTopColor: colors.borderSubtle,
              bottom: insets.bottom,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.launchBtn,
              {
                backgroundColor: prompt.trim() && !isDeploying ? colors.accent : colors.border,
              },
            ]}
            onPress={handleLaunch}
            disabled={!prompt.trim() || isDeploying}
            activeOpacity={0.88}
          >
            <DirectSend size={18} color="#FFFFFF" variant="Bold" />
            <Text style={styles.launchBtnText}>
              {isDeploying ? 'Deploying Radar…' : 'Deploy Autonomous Radar'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Custom Date Time Picker Sheet for Scan Cadence */}
      <CustomDateTimePickerSheet
        visible={isCustomPickerOpen}
        onClose={() => setIsCustomPickerOpen(false)}
        title="Configure Scan Cadence"
        subtitle="Pick custom date & time for next autonomous scan"
        showObjective={false}
        confirmText="Set Scan Cadence"
        onConfirm={(date) => {
          setFrequency('custom');
          setCustomCadenceDate(date);
          setIsCustomPickerOpen(false);
        }}
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
  backBtn: {
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
  headerTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
  headerSub: {
    fontSize: 11.5,
    fontFamily: FONTS.regular,
  },
  cancelBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  cancelBtnText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    gap: 20,
  },
  sectionWrap: {
    gap: 10,
  },
  sectionHeading: {
    fontSize: 12,
    fontFamily: FONTS.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryCard: {
    width: '48.5%',
    padding: 12,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.2,
    gap: 4,
  },
  catTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  catIconBox: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catLabel: {
    fontSize: 13.5,
  },
  catDesc: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    lineHeight: 15,
  },
  promptBox: {
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1.5,
    padding: 12,
    gap: 8,
  },
  promptInput: {
    fontSize: 14.5,
    lineHeight: 22,
    minHeight: 85,
    padding: 0,
  },
  quickTagsBar: {
    paddingTop: 8,
    borderTopWidth: 1,
  },
  tagsScroll: {
    gap: 6,
  },
  quickTagBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: BORDER_RADIUS.full,
  },
  quickTagText: {
    fontSize: 11,
    fontFamily: FONTS.medium,
  },
  suggestionsBlock: {
    gap: 6,
    marginTop: 2,
  },
  subLabel: {
    fontSize: 11.5,
    fontFamily: FONTS.medium,
  },
  suggestionsList: {
    gap: 6,
  },
  sugCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  sugCardText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    flex: 1,
  },
  textInput: {
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  freqGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  freqCard: {
    width: '48.5%',
    padding: 12,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.2,
    gap: 4,
  },
  freqCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  freqBtnText: {
    fontSize: 12.5,
  },
  freqBtnDesc: {
    fontSize: 10.5,
    lineHeight: 14,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  launchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.lg,
    gap: 8,
  },
  launchBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontFamily: FONTS.bold,
  },
});
