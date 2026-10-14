import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/theme';
import {
  ArrowLeft2,
  Radar2,
  DirectSend,
  Flash,
  TickCircle,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';

const SUGGESTIONS = [
  'React Native contract > $110/hr in US/EMEA',
  'Fintech AI automation leads for seed startups',
  'Staff Expo Router mobile engineering roles',
  'Climate tech ML grant applications',
];

const CATEGORIES = ['contract', 'full-time', 'lead', 'grant'] as const;

export default function CreateRadarScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const params = useLocalSearchParams<{ initialPrompt?: string }>();

  const [prompt, setPrompt] = useState(params.initialPrompt || '');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<typeof CATEGORIES[number]>('contract');
  const [frequency, setFrequency] = useState<'weekdays' | 'daily' | 'weekly'>('weekdays');
  const [isDeploying, setIsDeploying] = useState(false);

  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const handleLaunch = () => {
    if (!prompt.trim()) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsDeploying(true);

    setTimeout(() => {
      setIsDeploying(false);
      router.back();
    }, 400);
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
          <ArrowLeft2 size={20} color={colors.text} variant="Linear" />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.text }]}>Deploy Radar</Text>

        <TouchableOpacity onPress={() => router.back()} style={styles.cancelBtn}>
          <Text style={[styles.cancelBtnText, { color: colors.textMuted }]}>Cancel</Text>
        </TouchableOpacity>
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
          {/* Main Query Prompt Input */}
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
            Search Query
          </Text>
          <View
            style={[
              styles.promptBox,
              {
                backgroundColor: isDark ? colors.card : '#FFFFFF',
                borderColor: colors.border,
              },
            ]}
          >
            <TextInput
              ref={inputRef}
              style={[styles.promptInput, { color: colors.text, fontFamily: FONTS.regular }]}
              placeholder="e.g. Senior Mobile Lead contract paying >$120/hr in US/Europe…"
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              value={prompt}
              onChangeText={setPrompt}
              textAlignVertical="top"
            />
          </View>

          {/* Prompt Suggestions */}
          <View style={styles.suggestionsWrap}>
            <Text style={[styles.subLabel, { color: colors.textMuted }]}>
              Ideas:
            </Text>
            <View style={styles.chipsRow}>
              {SUGGESTIONS.map((sug, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.chip,
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
                  <Text style={[styles.chipText, { color: colors.textSecondary }]}>
                    {sug}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Radar Name (Optional) */}
          <View style={styles.sectionSpacing}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              Radar Name (Optional)
            </Text>
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
              placeholder="e.g. Fintech Mobile Architect Scout"
              placeholderTextColor={colors.textMuted}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Category Chips */}
          <View style={styles.sectionSpacing}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              Category
            </Text>
            <View style={styles.categoryRow}>
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryBtn,
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
                      setCategory(cat);
                    }}
                  >
                    <Text
                      style={[
                        styles.categoryBtnText,
                        {
                          color: isSelected ? '#FFFFFF' : colors.textSecondary,
                          fontFamily: isSelected ? FONTS.bold : FONTS.medium,
                        },
                      ]}
                    >
                      {cat.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Frequency Selector */}
          <View style={styles.sectionSpacing}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              Cadence
            </Text>
            <View style={styles.freqRow}>
              {(['weekdays', 'daily', 'weekly'] as const).map((freq) => {
                const isSelected = frequency === freq;
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
                      setFrequency(freq);
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
        </ScrollView>

        {/* Sticky Bottom Launch Button */}
        <View
          style={[
            styles.bottomBar,
            {
              backgroundColor: isDark ? colors.surface : '#FFFFFF',
              borderTopColor: colors.borderSubtle,
            },
          ]}
        >
          <Button
            title="Deploy Autonomous Radar"
            variant="accent"
            size="lg"
            rightIcon={<DirectSend size={18} color="#FFFFFF" variant="Bold" />}
            onPress={handleLaunch}
            disabled={!prompt.trim() || isDeploying}
            isLoading={isDeploying}
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
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: FONTS.semibold,
    marginBottom: 8,
  },
  promptBox: {
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1.5,
    padding: SPACING.md,
    minHeight: 110,
    marginBottom: SPACING.md,
  },
  promptInput: {
    fontSize: 15,
    lineHeight: 22,
  },
  suggestionsWrap: {
    marginBottom: SPACING.lg,
  },
  subLabel: {
    fontSize: 11.5,
    fontFamily: FONTS.medium,
    marginBottom: 6,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 11.5,
    fontFamily: FONTS.regular,
  },
  sectionSpacing: {
    marginBottom: SPACING.lg,
  },
  textInput: {
    height: 48,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBtnText: {
    fontSize: 11.5,
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
  bottomBar: {
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
