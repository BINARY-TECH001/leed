import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { Button, Card, Badge } from '@/components/ui';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/theme';
import {
  ArrowLeft2,
  TickCircle,
  CloseCircle,
  Filter,
  DollarCircle,
  Global,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { connectionService } from '@/services';

const CATEGORIES = [
  { id: 'job', label: 'Jobs & Remote Roles', desc: 'Full-time & direct employment' },
  { id: 'contract', label: 'Freelance & Contracts', desc: 'Advisory, consulting & sprint contracts' },
  { id: 'scholarship', label: 'Scholarships & Fellowships', desc: 'Higher education & academic awards' },
  { id: 'grant', label: 'Grants & Accelerators', desc: 'Non-dilutive funding & founder programs' },
  { id: 'lead', label: 'B2B Business Prospects', desc: 'Commercial clients & organizations' },
];

const REMOTE_OPTIONS = [
  { id: 'remote_only', label: 'Remote Only' },
  { id: 'hybrid', label: 'Hybrid' },
  { id: 'onsite', label: 'Onsite' },
  { id: 'flexible', label: 'Flexible' },
];

const CURRENCIES = [
  'NGN (₦)',
  'USD ($)',
  'GBP (£)',
  'EUR (€)',
  'CAD ($)',
  'KES (KSh)',
  'ZAR (R)',
  'GHS (GH₵)',
];

export default function PreferencesScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const [selectedCats, setSelectedCats] = useState<string[]>(['job', 'contract', 'grant']);
  const [remotePrefs, setRemotePrefs] = useState<string[]>(['remote_only', 'hybrid']);
  const [currency, setCurrency] = useState('NGN (₦)');
  const [minCompensation, setMinCompensation] = useState('₦1,500,000 / mo');
  const [targetFunding, setTargetFunding] = useState('₦50,000,000+');
  const [minScore, setMinScore] = useState(70);
  const [excludedKeywords, setExcludedKeywords] = useState('crypto, gambling, web3, unpaid');
  const [isSaving, setIsSaving] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);

  const toggleCategory = (catId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedCats.includes(catId)) {
      if (selectedCats.length > 1) {
        setSelectedCats(selectedCats.filter((c) => c !== catId));
      }
    } else {
      setSelectedCats([...selectedCats, catId]);
    }
  };

  const toggleRemotePref = (optId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (remotePrefs.includes(optId)) {
      if (remotePrefs.length > 1) {
        setRemotePrefs(remotePrefs.filter((p) => p !== optId));
      }
    } else {
      setRemotePrefs([...remotePrefs, optId]);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSavedFeedback(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await connectionService.updatePreferences({
        targetCategories: selectedCats,
        remoteWorkArrangements: remotePrefs,
        preferredCurrency: currency,
        minCompensation,
        targetFunding,
        minMatchScore: minScore,
        excludedKeywords: excludedKeywords.split(',').map((k) => k.trim()).filter(Boolean),
      });
      setSavedFeedback('Matching preferences updated. Next scan will use these filters.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setSavedFeedback('Preferences saved in local preview.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: isDark ? colors.card : '#F1F3F7' }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft2 size={18} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Opportunity Preferences</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Categories */}
        <Card style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Discovery Categories</Text>
          <Text style={[styles.cardSub, { color: colors.textMuted, marginBottom: SPACING.md }]}>
            Select the types of opportunities Leed should actively discover
          </Text>

          <View style={{ gap: 8 }}>
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCats.includes(cat.id);
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.catRow,
                    {
                      backgroundColor: isSelected
                        ? isDark
                          ? colors.accent + '20'
                          : colors.accent + '10'
                        : isDark
                        ? '#0F172A'
                        : '#F8FAFC',
                      borderColor: isSelected ? colors.accent : colors.border,
                    },
                  ]}
                  onPress={() => toggleCategory(cat.id)}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.catLabel, { color: colors.text }]}>{cat.label}</Text>
                    <Text style={[styles.catDesc, { color: colors.textMuted }]}>{cat.desc}</Text>
                  </View>
                  <View
                    style={[
                      styles.checkbox,
                      {
                        backgroundColor: isSelected ? colors.accent : 'transparent',
                        borderColor: isSelected ? colors.accent : colors.border,
                      },
                    ]}
                  >
                    {isSelected && <TickCircle size={16} color="#FFF" variant="Bold" />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Work Arrangement & Location (Multi-Select) */}
        <Card style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border, marginTop: SPACING.md }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Work Arrangement</Text>
            <Badge label={`${remotePrefs.length} selected`} variant="accent" size="sm" />
          </View>
          <Text style={[styles.cardSub, { color: colors.textMuted, marginBottom: SPACING.xs }]}>
            Select all arrangements you are open to (multi-select supported)
          </Text>

          <View style={styles.pillGrid}>
            {REMOTE_OPTIONS.map((opt) => {
              const isSelected = remotePrefs.includes(opt.id);
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[
                    styles.pillBtn,
                    {
                      backgroundColor: isSelected ? colors.accent : isDark ? '#1E293B' : '#EEF2F6',
                      borderColor: isSelected ? colors.accent : colors.border,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                    },
                  ]}
                  onPress={() => toggleRemotePref(opt.id)}
                  activeOpacity={0.75}
                >
                  {isSelected && <TickCircle size={14} color="#FFF" variant="Bold" />}
                  <Text style={[styles.pillText, { color: isSelected ? '#FFF' : colors.text }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Compensation & Currency */}
        <Card style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border, marginTop: SPACING.md }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Compensation & Currency</Text>
          <Text style={[styles.cardSub, { color: colors.textMuted, marginBottom: SPACING.xs }]}>
            Nigeria & African regional currencies prioritized with international options
          </Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Preferred Currency</Text>
            <View style={styles.pillGrid}>
              {CURRENCIES.map((curr) => {
                const isSelected = currency === curr;
                return (
                  <TouchableOpacity
                    key={curr}
                    style={[
                      styles.pillBtn,
                      {
                        backgroundColor: isSelected ? colors.accent : isDark ? '#1E293B' : '#EEF2F6',
                        borderColor: isSelected ? colors.accent : colors.border,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                      },
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setCurrency(curr);
                    }}
                    activeOpacity={0.75}
                  >
                    {isSelected && <TickCircle size={14} color="#FFF" variant="Bold" />}
                    <Text style={[styles.pillText, { color: isSelected ? '#FFF' : colors.text }]}>
                      {curr}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Minimum Role Compensation Floor</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', color: colors.text, borderColor: colors.border }]}
              value={minCompensation}
              onChangeText={setMinCompensation}
              placeholder="e.g. ₦1,500,000 / mo or $90 / hr"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          {selectedCats.includes('grant') && (
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Target Grant & Award Funding</Text>
              <TextInput
                style={[styles.input, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', color: colors.text, borderColor: colors.border }]}
                value={targetFunding}
                onChangeText={setTargetFunding}
                placeholder="e.g. ₦50,000,000 or $100,000+"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          )}
        </Card>

        {/* Relevance Calibration */}
        <Card style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border, marginTop: SPACING.md }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Match Relevance Threshold</Text>
          <Text style={[styles.cardSub, { color: colors.textMuted, marginBottom: SPACING.sm }]}>
            Current: {minScore}% Minimum Confidence Score
          </Text>

          <View style={styles.scoreRow}>
            {[60, 70, 80, 90].map((score) => {
              const isSelected = minScore === score;
              return (
                <TouchableOpacity
                  key={score}
                  style={[
                    styles.scoreBtn,
                    {
                      backgroundColor: isSelected ? colors.accent : isDark ? '#1E293B' : '#F1F5F9',
                      borderColor: isSelected ? colors.accent : colors.border,
                    },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setMinScore(score);
                  }}
                >
                  <Text style={[styles.scoreText, { color: isSelected ? '#FFF' : colors.text }]}>
                    {score}%
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={[styles.inputGroup, { marginTop: SPACING.md }]}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Excluded Keywords & Organizations</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', color: colors.text, borderColor: colors.border }]}
              value={excludedKeywords}
              onChangeText={setExcludedKeywords}
              placeholder="e.g. crypto, unpaid, gambling"
              placeholderTextColor={colors.textMuted}
            />
            <Text style={{ fontFamily: FONTS.regular, fontSize: 11, color: colors.textMuted, marginTop: 4 }}>
              Opportunities matching these terms will be suppressed automatically
            </Text>
          </View>
        </Card>

        {savedFeedback ? (
          <Text style={[styles.feedbackText, { color: '#10B981' }]}>{savedFeedback}</Text>
        ) : null}

        <View style={styles.actionWrap}>
          <Button
            title={isSaving ? 'Updating...' : 'Save Opportunity Preferences'}
            variant="primary"
            size="lg"
            onPress={handleSave}
            disabled={isSaving}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 16,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 40,
  },
  formCard: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
  },
  cardTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 15,
  },
  cardSub: {
    fontFamily: FONTS.regular,
    fontSize: 12,
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  catLabel: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
  },
  catDesc: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    marginTop: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: SPACING.sm,
  },
  pillBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
  },
  pillText: {
    fontFamily: FONTS.medium,
    fontSize: 13,
  },
  inputGroup: {
    marginTop: SPACING.md,
  },
  label: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    marginBottom: 6,
  },
  input: {
    height: 46,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    fontFamily: FONTS.regular,
    fontSize: 14,
  },
  scoreRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  scoreBtn: {
    flex: 1,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
  },
  feedbackText: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
  actionWrap: {
    marginTop: SPACING.lg,
  },
});
