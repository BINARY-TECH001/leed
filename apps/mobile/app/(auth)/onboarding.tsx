import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
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
  DocumentUpload,
  SecuritySafe,
  Setting4,
  Flash,
  ArrowRight2,
  DocumentText,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import type { OpportunityType, AutonomyLevel } from '@prospect/types';

const CATEGORIES: { label: string; value: OpportunityType }[] = [
  { label: 'Full-time Jobs', value: 'job' },
  { label: 'Freelance & Gigs', value: 'freelance' },
  { label: 'B2B Sales Leads', value: 'lead' },
  { label: 'Consulting Projects', value: 'consulting' },
  { label: 'Contracts', value: 'contract' },
  { label: 'Grants & Funding', value: 'grant' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { setOnboardingDone, updateUser } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedCategories, setSelectedCategories] = useState<OpportunityType[]>([
    'job',
    'contract',
  ]);
  const [uploadedCV, setUploadedCV] = useState<string | null>(null);
  const [autonomyLevel, setAutonomyLevel] = useState<AutonomyLevel>('approve');

  const toggleCategory = (cat: OpportunityType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedCategories.includes(cat)) {
      if (selectedCategories.length > 1) {
        setSelectedCategories(selectedCategories.filter((c) => c !== cat));
      }
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const handleFinishOnboarding = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateUser({
      targetCategories: selectedCategories,
      autonomyLevel,
      onboardingCompleted: true,
    });
    await setOnboardingDone();
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Step Progress Indicators */}
        <View style={styles.progressContainer}>
          <View style={styles.stepIndicators}>
            {[1, 2, 3].map((s) => (
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
          <Text style={[styles.stepText, { color: colors.textMuted }]}>
            Step {step} of 3
          </Text>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollInner}
          showsVerticalScrollIndicator={false}
        >
          {/* STEP 1: Categories */}
          {step === 1 && (
            <View>
              <Text style={[styles.headline, { color: colors.text }]}>
                What opportunities are you targeting?
              </Text>
              <Text style={[styles.subheadline, { color: colors.textMuted }]}>
                Select the streams you want your automated radar to track and qualify.
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
                              ? colors.accent + '25'
                              : colors.accent + '15'
                            : isDark
                            ? colors.card
                            : '#FFFFFF',
                          borderColor: isSelected ? colors.accent : colors.border,
                        },
                      ]}
                    >
                      <Briefcase
                        size={18}
                        color={isSelected ? colors.accent : colors.textMuted}
                        variant={isSelected ? 'Bold' : 'Linear'}
                      />
                      <Text
                        style={[
                          styles.chipText,
                          {
                            color: isSelected ? colors.accent : colors.text,
                            fontFamily: isSelected ? FONTS.bold : FONTS.medium,
                          },
                        ]}
                      >
                        {cat.label}
                      </Text>
                      {isSelected && (
                        <TickCircle size={18} color={colors.accent} variant="Bold" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* STEP 2: CV & Career Context */}
          {step === 2 && (
            <View>
              <Text style={[styles.headline, { color: colors.text }]}>
                Import your career context
              </Text>
              <Text style={[styles.subheadline, { color: colors.textMuted }]}>
                Our AI extracts your skills, seniority, and preferences to calculate deep match scores.
              </Text>

              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.uploadZone,
                  {
                    backgroundColor: isDark ? colors.card : '#FFFFFF',
                    borderColor: uploadedCV ? colors.success : colors.accent,
                    borderStyle: uploadedCV ? 'solid' : 'dashed',
                  },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setUploadedCV('Alex_Rivers_Resume_2026.pdf');
                }}
              >
                <View
                  style={[
                    styles.uploadIconCircle,
                    {
                      backgroundColor: uploadedCV
                        ? colors.success + '15'
                        : colors.accent + '15',
                    },
                  ]}
                >
                  {uploadedCV ? (
                    <TickCircle size={32} color={colors.success} variant="Bold" />
                  ) : (
                    <DocumentUpload size={32} color={colors.accent} variant="Bold" />
                  )}
                </View>

                {uploadedCV ? (
                  <>
                    <Text style={[styles.uploadTitle, { color: colors.text }]}>
                      {uploadedCV}
                    </Text>
                    <Badge label="Parsed & Ready" variant="success" size="sm" dot />
                  </>
                ) : (
                  <>
                    <Text style={[styles.uploadTitle, { color: colors.text }]}>
                      Tap to Upload CV / Resume
                    </Text>
                    <Text style={[styles.uploadSubtitle, { color: colors.textMuted }]}>
                      Supports PDF, DOCX or TXT (Max 10MB)
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.cvFeatures}>
                <View style={styles.cvFeatureItem}>
                  <DocumentText size={16} color={colors.accent} variant="Bold" />
                  <Text style={[styles.cvFeatureText, { color: colors.textMuted }]}>
                    Automatic skills extraction & compensation floor detection
                  </Text>
                </View>
                <View style={styles.cvFeatureItem}>
                  <SecuritySafe size={16} color={colors.accent} variant="Bold" />
                  <Text style={[styles.cvFeatureText, { color: colors.textMuted }]}>
                    Private to your account · Never shared with third parties
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* STEP 3: Autonomy Level */}
          {step === 3 && (
            <View>
              <Text style={[styles.headline, { color: colors.text }]}>
                Choose agent autonomy
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
                    <Text style={[styles.autonomyTitle, { color: colors.text }]}>
                      Assist Mode
                    </Text>
                    {autonomyLevel === 'assist' && (
                      <Badge label="Active" variant="info" size="sm" />
                    )}
                  </View>
                  <Text style={[styles.autonomyDesc, { color: colors.textMuted }]}>
                    AI discovers opportunities and flags them for you. No actions or drafts prepared without explicit request.
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
                    <Text style={[styles.autonomyTitle, { color: colors.text }]}>
                      Approve Mode
                    </Text>
                    <Badge label="Recommended" variant="accent" size="sm" />
                  </View>
                  <Text style={[styles.autonomyDesc, { color: colors.textMuted }]}>
                    AI prepares customized proposals and cover letters in advance. Nothing is submitted without your 1-tap confirmation.
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
                    <Text style={[styles.autonomyTitle, { color: colors.text }]}>
                      Automate Mode
                    </Text>
                    {autonomyLevel === 'automate' && (
                      <Badge label="Active" variant="success" size="sm" />
                    )}
                  </View>
                  <Text style={[styles.autonomyDesc, { color: colors.textMuted }]}>
                    Full autonomous pipeline. Matches above 95% fit are applied and tracked automatically according to your strict filters.
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Bottom Pinned Button Area */}
        <View style={styles.bottomBar}>
          {step > 1 && (
            <Button
              title="Back"
              variant="ghost"
              size="md"
              onPress={() => setStep((s) => (s - 1) as any)}
              style={{ flex: 1 }}
            />
          )}

          <Button
            title={step === 3 ? 'Launch Radar OS' : 'Continue'}
            variant="accent"
            size="lg"
            rightIcon={<ArrowRight2 size={18} color="#FFF" />}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (step < 3) {
                setStep((s) => (s + 1) as any);
              } else {
                handleFinishOnboarding();
              }
            }}
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
    marginBottom: SPACING.lg,
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
  stepText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    marginTop: 6,
  },
  scrollInner: {
    paddingBottom: SPACING.xxl,
  },
  headline: {
    fontSize: 26,
    fontFamily: FONTS.black,
    letterSpacing: -0.6,
    marginBottom: 6,
  },
  subheadline: {
    fontSize: 14.5,
    fontFamily: FONTS.regular,
    lineHeight: 21,
    marginBottom: SPACING.xl,
  },
  chipsGrid: {
    gap: SPACING.sm + 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    gap: 12,
  },
  chipText: {
    fontSize: 15,
    flex: 1,
  },
  uploadZone: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 2,
    marginBottom: SPACING.xl,
  },
  uploadIconCircle: {
    width: 64,
    height: 64,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  uploadTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    marginBottom: 4,
  },
  uploadSubtitle: {
    fontSize: 12.5,
    fontFamily: FONTS.regular,
  },
  cvFeatures: {
    gap: 10,
  },
  cvFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cvFeatureText: {
    fontSize: 12.5,
    fontFamily: FONTS.regular,
    flex: 1,
  },
  autonomyList: {
    gap: SPACING.md,
  },
  autonomyCard: {
    padding: SPACING.md + 2,
    borderRadius: BORDER_RADIUS.lg,
  },
  autonomyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  autonomyTitle: {
    fontSize: 15.5,
    fontFamily: FONTS.bold,
    flex: 1,
  },
  autonomyDesc: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    lineHeight: 18,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
  },
});
