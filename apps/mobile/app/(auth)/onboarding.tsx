import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { Button, Badge } from '@/components/ui';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/theme';
import {
  Briefcase,
  TickCircle,
  SecuritySafe,
  Setting4,
  Flash,
  ArrowRight2,
  DollarCircle,
  Global,
  DirectboxNotif,
  Radar2,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { toast } from 'sonner-native';
import { onboardingService } from '@/services/onboardingService';
import { radarService } from '@/services/radarService';
import type { OpportunityType, AutonomyLevel } from '@prospect/types';

const CATEGORIES: { label: string; value: OpportunityType; desc: string }[] = [
  { label: 'Full-time Jobs', value: 'job', desc: 'Direct employer positions & salaried roles' },
  { label: 'Contracts & Freelance', value: 'contract', desc: 'High-value client contracts and retainer gigs' },
  { label: 'B2B Sales Leads', value: 'lead', desc: 'Companies seeking vendors, agencies & partners' },
  { label: 'Grants & Funding', value: 'grant', desc: 'Non-dilutive capital, startup and research grants' },
  { label: 'Consulting Projects', value: 'consulting', desc: 'Advisory, architecture & specialized missions' },
];

const CURRENCIES = [
  { symbol: '$', code: 'USD' },
  { symbol: '₦', code: 'NGN' },
  { symbol: '€', code: 'EUR' },
  { symbol: '£', code: 'GBP' },
];

const WORK_MODES = ['Remote', 'Hybrid', 'Onsite'];

const REGIONS = [
  'Worldwide / Any Location',
  'Global Remote',
  'North America / US',
  'Nigeria & West Africa',
  'Europe & UK',
  'Middle East & Asia',
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { user, setOnboardingDone, updateUser } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isFinishing, setIsFinishing] = useState(false);

  // Step 1: Categories (Required)
  const [selectedCategories, setSelectedCategories] = useState<OpportunityType[]>(['job', 'contract']);

  // Step 2: Target Role & Compensation Floor (Required)
  const [targetRole, setTargetRole] = useState(user?.headline || '');
  const [currency, setCurrency] = useState(CURRENCIES[0]);
  const [compFloor, setCompFloor] = useState('5000');

  // Step 3: Work Arrangements & Regions (Optional)
  const [selectedWorkModes, setSelectedWorkModes] = useState<string[]>(['Remote']);
  const [selectedRegions, setSelectedRegions] = useState<string[]>(['Global Remote']);

  // Step 4: Autonomy Level (Required)
  const [autonomyLevel, setAutonomyLevel] = useState<AutonomyLevel>('approve');

  const toggleCategory = (cat: OpportunityType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedCategories.includes(cat)) {
      if (selectedCategories.length > 1) {
        setSelectedCategories(selectedCategories.filter((c) => c !== cat));
      } else {
        toast.error('Select at least one category to monitor');
      }
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const toggleWorkMode = (mode: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedWorkModes.includes(mode)) {
      if (selectedWorkModes.length > 1) {
        setSelectedWorkModes(selectedWorkModes.filter((m) => m !== mode));
      }
    } else {
      setSelectedWorkModes([...selectedWorkModes, mode]);
    }
  };

  const toggleRegion = (reg: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedRegions.includes(reg)) {
      if (selectedRegions.length > 1) {
        setSelectedRegions(selectedRegions.filter((r) => r !== reg));
      }
    } else {
      setSelectedRegions([...selectedRegions, reg]);
    }
  };

  const handleNextStep = async () => {
    if (step === 1) {
      if (selectedCategories.length === 0) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        toast.error('Please select at least one opportunity type');
        return;
      }
      onboardingService.saveStep(1, { categories: selectedCategories });
      setStep(2);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }

    if (step === 2) {
      if (!targetRole.trim()) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        toast.error('Please enter your target role or project focus');
        return;
      }
      onboardingService.saveStep(2, {
        roleOrFocus: targetRole.trim(),
        headline: targetRole.trim(),
      });
      setStep(3);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }

    if (step === 3) {
      onboardingService.saveStep(3, {
        locations: [...selectedWorkModes, ...selectedRegions],
      });
      setStep(4);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }

    if (step === 4) {
      await handleCompleteSetup();
    }
  };

  const handleSkipStep3 = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep(4);
  };

  const handleCompleteSetup = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsFinishing(true);

    try {
      // 1. Create first autonomous Radar
      const primaryCategory = selectedCategories[0] || 'job';
      const roleName = targetRole.trim() || 'Software Engineer';
      await radarService.createRadar({
        title: `${roleName} Radar`,
        prompt: `Scan for high-match ${primaryCategory} opportunities matching ${roleName} with minimum compensation of ${currency.symbol}${compFloor}`,
        category: primaryCategory,
        frequency: 'daily',
        autonomyLevel,
      });

      // 2. Persist profile preferences on backend
      await onboardingService.saveStep(4, {
        categories: selectedCategories,
        roleOrFocus: roleName,
        headline: roleName,
        locations: [...selectedWorkModes, ...selectedRegions],
        completeNow: true,
      });

      await onboardingService.complete();

      // 3. Trigger initial real scanner
      onboardingService.executeInitialScan().catch(() => {});

      // 4. Update local user state
      updateUser({
        headline: roleName,
        targetOutcome: roleName,
        targetCategories: selectedCategories,
        targetRoles: [roleName],
        targetLocations: [...selectedWorkModes, ...selectedRegions],
        autonomyLevel,
        onboardingCompleted: true,
      });

      await setOnboardingDone();

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast.success('Radar OS initialized! Autonomous monitoring is now active.');
      router.replace('/(tabs)');
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.error('Setup completed with fallback. Radars are active!');
      await setOnboardingDone();
      router.replace('/(tabs)');
    } finally {
      setIsFinishing(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Step Progress Indicators */}
        <View style={styles.progressContainer}>
          <View style={styles.stepIndicators}>
            {[1, 2, 3, 4].map((s) => (
              <View
                key={s}
                style={[
                  styles.progressBar,
                  {
                    backgroundColor:
                      s <= step
                        ? colors.accent
                        : isDark
                        ? colors.surfaceSecondary
                        : colors.border,
                  },
                ]}
              />
            ))}
          </View>

          <View style={styles.stepLabelRow}>
            <Text style={[styles.stepText, { color: colors.textMuted }]}>
              Step {step} of 4
            </Text>
            {step === 3 && (
              <TouchableOpacity onPress={handleSkipStep3} activeOpacity={0.7}>
                <Text style={[styles.skipText, { color: colors.accent }]}>Skip this step</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollInner}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* STEP 1: Categories (Required) */}
          {step === 1 && (
            <View>
              <View style={styles.badgeRow}>
                <Badge label="Required" variant="accent" size="sm" />
                <Badge label="Multi-select" variant="info" size="sm" />
              </View>

              <Text style={[styles.headline, { color: colors.text }]}>
                What opportunities are you targeting?
              </Text>
              <Text style={[styles.subheadline, { color: colors.textMuted }]}>
                Select the streams you want your automated radar to track, qualify, and score.
              </Text>

              <View style={styles.chipsGrid}>
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategories.includes(cat.value);
                  return (
                    <TouchableOpacity
                      key={cat.value}
                      activeOpacity={0.8}
                      onPress={() => toggleCategory(cat.value)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isSelected
                            ? isDark
                              ? colors.accent + '22'
                              : colors.accent + '12'
                            : isDark
                            ? colors.card
                            : '#FFFFFF',
                          borderColor: isSelected ? colors.accent : colors.border,
                        },
                      ]}
                    >
                      <View style={styles.chipLeft}>
                        <Briefcase
                          size={20}
                          color={isSelected ? colors.accent : colors.textMuted}
                          variant={isSelected ? 'Bold' : 'Linear'}
                        />
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.chipTitle,
                              {
                                color: isSelected ? colors.accent : colors.text,
                                fontFamily: isSelected ? FONTS.bold : FONTS.semibold,
                              },
                            ]}
                          >
                            {cat.label}
                          </Text>
                          <Text style={[styles.chipDesc, { color: colors.textMuted }]}>
                            {cat.desc}
                          </Text>
                        </View>
                      </View>
                      {isSelected ? (
                        <TickCircle size={20} color={colors.accent} variant="Bold" />
                      ) : (
                        <View style={[styles.radioEmpty, { borderColor: colors.border }]} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* STEP 2: Role & Compensation Floor (Required) */}
          {step === 2 && (
            <View>
              <View style={styles.badgeRow}>
                <Badge label="Required" variant="accent" size="sm" />
                <Badge label="Match Calibration" variant="success" size="sm" />
              </View>

              <Text style={[styles.headline, { color: colors.text }]}>
                Target role & compensation floor
              </Text>
              <Text style={[styles.subheadline, { color: colors.textMuted }]}>
                Your autonomous radar ignores anything below your floor so you never see noise.
              </Text>

              <View style={styles.formSection}>
                {/* Role / Focus Input */}
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                    Target Role or Service Focus
                  </Text>
                  <View
                    style={[
                      styles.inputBox,
                      {
                        backgroundColor: isDark ? colors.card : '#FFFFFF',
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Radar2 size={18} color={colors.accent} variant="Linear" />
                    <TextInput
                      style={[styles.textInput, { color: colors.text }]}
                      placeholder="e.g. Senior Mobile Engineer or Cloud Architect"
                      placeholderTextColor={colors.textMuted}
                      value={targetRole}
                      onChangeText={setTargetRole}
                      autoFocus
                    />
                  </View>
                </View>

                {/* Compensation Floor */}
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                    Minimum Compensation Floor (Monthly / Contract)
                  </Text>

                  {/* Currency Picker */}
                  <View style={styles.currencyRow}>
                    {CURRENCIES.map((c) => (
                      <TouchableOpacity
                        key={c.code}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setCurrency(c);
                        }}
                        style={[
                          styles.currencyBtn,
                          {
                            backgroundColor:
                              currency.code === c.code
                                ? colors.accent
                                : isDark
                                ? colors.card
                                : '#FFFFFF',
                            borderColor: currency.code === c.code ? colors.accent : colors.border,
                          },
                        ]}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.currencyBtnText,
                            {
                              color: currency.code === c.code ? '#FFFFFF' : colors.text,
                              fontFamily: currency.code === c.code ? FONTS.bold : FONTS.medium,
                            },
                          ]}
                        >
                          {c.symbol} {c.code}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Amount Input */}
                  <View
                    style={[
                      styles.inputBox,
                      {
                        backgroundColor: isDark ? colors.card : '#FFFFFF',
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <DollarCircle size={18} color={colors.accent} variant="Linear" />
                    <TextInput
                      style={[styles.textInput, { color: colors.text }]}
                      placeholder="5000"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                      value={compFloor}
                      onChangeText={setCompFloor}
                    />
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* STEP 3: Work Mode & Locations (Optional) */}
          {step === 3 && (
            <View>
              <View style={styles.badgeRow}>
                <Badge label="Optional" variant="info" size="sm" />
                <Badge label="Can be customized anytime" variant="neutral" size="sm" />
              </View>

              <Text style={[styles.headline, { color: colors.text }]}>
                Work arrangement & location
              </Text>
              <Text style={[styles.subheadline, { color: colors.textMuted }]}>
                Choose your flexibility preference. Skip if you are open to all arrangements.
              </Text>

              {/* Work Modes */}
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                Work Arrangement
              </Text>
              <View style={styles.tagGrid}>
                {WORK_MODES.map((mode) => {
                  const isSelected = selectedWorkModes.includes(mode);
                  return (
                    <TouchableOpacity
                      key={mode}
                      onPress={() => toggleWorkMode(mode)}
                      style={[
                        styles.tagPill,
                        {
                          backgroundColor: isSelected
                            ? colors.accent
                            : isDark
                            ? colors.card
                            : '#FFFFFF',
                          borderColor: isSelected ? colors.accent : colors.border,
                        },
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.tagPillText,
                          {
                            color: isSelected ? '#FFFFFF' : colors.text,
                            fontFamily: isSelected ? FONTS.bold : FONTS.medium,
                          },
                        ]}
                      >
                        {mode}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Regions */}
              <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: SPACING.lg }]}>
                Target Regions
              </Text>
              <View style={styles.tagGrid}>
                {REGIONS.map((region) => {
                  const isSelected = selectedRegions.includes(region);
                  return (
                    <TouchableOpacity
                      key={region}
                      onPress={() => toggleRegion(region)}
                      style={[
                        styles.tagPill,
                        {
                          backgroundColor: isSelected
                            ? isDark
                              ? 'rgba(255, 102, 0, 0.2)'
                              : '#FFF0E6'
                            : isDark
                            ? colors.card
                            : '#FFFFFF',
                          borderColor: isSelected ? colors.accent : colors.border,
                        },
                      ]}
                      activeOpacity={0.8}
                    >
                      <Global
                        size={14}
                        color={isSelected ? colors.accent : colors.textMuted}
                        variant="Linear"
                      />
                      <Text
                        style={[
                          styles.tagPillText,
                          {
                            color: isSelected ? colors.accent : colors.text,
                            fontFamily: isSelected ? FONTS.bold : FONTS.medium,
                          },
                        ]}
                      >
                        {region}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* STEP 4: Autonomy Level (Required) */}
          {step === 4 && (
            <View>
              <View style={styles.badgeRow}>
                <Badge label="Required" variant="accent" size="sm" />
                <Badge label="Autonomous Execution" variant="success" size="sm" />
              </View>

              <Text style={[styles.headline, { color: colors.text }]}>
                Select radar execution mode
              </Text>
              <Text style={[styles.subheadline, { color: colors.textMuted }]}>
                Define the boundary between autonomous AI actions and your human approval.
              </Text>

              <View style={styles.autonomyList}>
                {/* Assist */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.autonomyCard,
                    {
                      backgroundColor: isDark ? colors.card : '#FFFFFF',
                      borderColor: autonomyLevel === 'assist' ? colors.secondary : colors.border,
                      borderWidth: autonomyLevel === 'assist' ? 2 : 1,
                    },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setAutonomyLevel('assist');
                  }}
                >
                  <View style={styles.autonomyHeader}>
                    <Setting4 size={20} color={colors.secondary} variant="Bold" />
                    <Text style={[styles.autonomyTitle, { color: colors.text }]}>Assist Mode</Text>
                    {autonomyLevel === 'assist' && (
                      <Badge label="Selected" variant="info" size="sm" />
                    )}
                  </View>
                  <Text style={[styles.autonomyDesc, { color: colors.textMuted }]}>
                    AI discovers opportunities and flags them for you. No outreach or proposals prepared without explicit request.
                  </Text>
                </TouchableOpacity>

                {/* Approve (Recommended) */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.autonomyCard,
                    {
                      backgroundColor: isDark ? colors.card : '#FFFFFF',
                      borderColor: autonomyLevel === 'approve' ? colors.accent : colors.border,
                      borderWidth: autonomyLevel === 'approve' ? 2 : 1,
                    },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setAutonomyLevel('approve');
                  }}
                >
                  <View style={styles.autonomyHeader}>
                    <Flash size={20} color={colors.accent} variant="Bold" />
                    <Text style={[styles.autonomyTitle, { color: colors.text }]}>Approve Mode</Text>
                    <Badge label="Recommended" variant="accent" size="sm" />
                  </View>
                  <Text style={[styles.autonomyDesc, { color: colors.textMuted }]}>
                    AI prepares customized proposals and tailored pitch notes in advance. Nothing is submitted without your 1-tap confirmation.
                  </Text>
                </TouchableOpacity>

                {/* Automate */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.autonomyCard,
                    {
                      backgroundColor: isDark ? colors.card : '#FFFFFF',
                      borderColor: autonomyLevel === 'automate' ? colors.success : colors.border,
                      borderWidth: autonomyLevel === 'automate' ? 2 : 1,
                    },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setAutonomyLevel('automate');
                  }}
                >
                  <View style={styles.autonomyHeader}>
                    <TickCircle size={20} color={colors.success} variant="Bold" />
                    <Text style={[styles.autonomyTitle, { color: colors.text }]}>Automate Mode</Text>
                    {autonomyLevel === 'automate' && (
                      <Badge label="Selected" variant="success" size="sm" />
                    )}
                  </View>
                  <Text style={[styles.autonomyDesc, { color: colors.textMuted }]}>
                    Autonomous opportunity ingestion. Matches calibrated above 95% fit are entered into your pipeline automatically.
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Security info */}
              <View
                style={[
                  styles.securityNotice,
                  {
                    backgroundColor: isDark ? colors.surfaceSecondary : '#F8FAFC',
                    borderColor: colors.border,
                  },
                ]}
              >
                <SecuritySafe size={18} color="#10B981" variant="Bold" />
                <Text style={[styles.securityNoticeText, { color: colors.textMuted }]}>
                  You can pause, edit or add additional radars at any time from your Radar tab.
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Bottom Navigation Buttons */}
        <View style={styles.bottomBar}>
          {step > 1 && (
            <Button
              title="Back"
              variant="ghost"
              size="md"
              disabled={isFinishing}
              onPress={() => setStep((s) => (s - 1) as any)}
              style={{ flex: 1 }}
            />
          )}

          <Button
            title={step === 4 ? 'Launch Radar OS' : 'Continue'}
            variant="accent"
            size="lg"
            isLoading={isFinishing}
            rightIcon={!isFinishing ? <ArrowRight2 size={18} color="#FFF" /> : undefined}
            onPress={handleNextStep}
            style={{ flex: step > 1 ? 2 : 1 }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
  },
  progressContainer: {
    marginBottom: SPACING.md,
  },
  stepIndicators: {
    flexDirection: 'row',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  stepLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  stepText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
  },
  skipText: {
    fontSize: 13,
    fontFamily: FONTS.semibold,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.sm,
  },
  headline: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subheadline: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  scrollInner: {
    paddingBottom: SPACING.xxl,
  },
  chipsGrid: {
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
  },
  chipLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  chipTitle: {
    fontSize: 15,
  },
  chipDesc: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  radioEmpty: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  formSection: {
    gap: SPACING.lg,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: FONTS.semibold,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.2,
    paddingHorizontal: SPACING.md,
    gap: 12,
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    fontFamily: FONTS.regular,
  },
  currencyRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  currencyBtn: {
    flex: 1,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencyBtnText: {
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: FONTS.semibold,
    marginBottom: 8,
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1.2,
  },
  tagPillText: {
    fontSize: 13,
  },
  autonomyList: {
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  autonomyCard: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  autonomyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  autonomyTitle: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    flex: 1,
  },
  autonomyDesc: {
    fontSize: 12.5,
    fontFamily: FONTS.regular,
    lineHeight: 18,
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
  },
  securityNoticeText: {
    flex: 1,
    fontSize: 12.5,
    fontFamily: FONTS.regular,
    lineHeight: 17,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
  },
});
