import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { Button, Card, Badge, ConfirmBottomSheet } from '@/components/ui';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/theme';
import {
  ArrowLeft2,
  SecuritySafe,
  TickCircle,
  DocumentDownload,
  Trash,
  CpuSetting,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';

export default function SecurityPrivacyScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { logout } = useAuth();

  const [aiPersonalization, setAiPersonalization] = useState(true);
  const [retentionMonths, setRetentionMonths] = useState(12);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isDeleteSheetOpen, setIsDeleteSheetOpen] = useState(false);

  const handleExportData = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setFeedback('Personal data archive compiled. Download link sent to your verified email.');
  };

  const handleConfirmDeleteAccount = async () => {
    setIsDeleteSheetOpen(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await logout();
    router.replace('/(auth)/landing');
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Security & Privacy</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Verification Status Card */}
        <Card style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Account Verifications</Text>
          <Text style={[styles.cardSub, { color: colors.textMuted, marginBottom: SPACING.md }]}>
            Verified accounts receive priority matching and higher radar discovery rate limits
          </Text>

          <View style={{ gap: 10 }}>
            <View style={[styles.statusRow, { borderColor: colors.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <TickCircle size={20} color="#10B981" variant="Bold" />
                <View>
                  <Text style={[styles.statusLabel, { color: colors.text }]}>Primary Email Verified</Text>
                  <Text style={[styles.statusSub, { color: colors.textMuted }]}>Encrypted verification token confirmed</Text>
                </View>
              </View>
              <Badge label="Verified" variant="success" size="sm" />
            </View>

            <View style={[styles.statusRow, { borderColor: colors.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <TickCircle size={20} color="#10B981" variant="Bold" />
                <View>
                  <Text style={[styles.statusLabel, { color: colors.text }]}>Opportunity Ownership</Text>
                  <Text style={[styles.statusSub, { color: colors.textMuted }]}>Multi-tenant tenant isolation active</Text>
                </View>
              </View>
              <Badge label="Isolated" variant="accent" size="sm" />
            </View>
          </View>
        </Card>

        {/* AI Privacy Controls */}
        <Card style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border, marginTop: SPACING.md }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>AI Personalization & Model Safety</Text>
          <Text style={[styles.cardSub, { color: colors.textMuted, marginBottom: SPACING.md }]}>
            Control how AI evaluates your background for match scoring and pitch generation
          </Text>

          <View style={[styles.switchRow, { borderColor: colors.border }]}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={[styles.statusLabel, { color: colors.text }]}>Contextual CV Calibration</Text>
              <Text style={[styles.statusSub, { color: colors.textMuted }]}>
                Allow AI to cite relevant experience when drafting application materials
              </Text>
            </View>
            <Switch
              value={aiPersonalization}
              onValueChange={(val) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setAiPersonalization(val);
              }}
              trackColor={{ false: '#64748B', true: colors.accent }}
            />
          </View>

          <View style={{ marginTop: SPACING.md }}>
            <Text style={[styles.statusLabel, { color: colors.text, marginBottom: 4 }]}>
              Data Retention Period
            </Text>
            <Text style={[styles.statusSub, { color: colors.textMuted, marginBottom: 8 }]}>
              Automatically delete discarded match logs and obsolete drafts after:
            </Text>
            <View style={styles.retentionRow}>
              {[3, 6, 12].map((m) => {
                const isSelected = retentionMonths === m;
                return (
                  <TouchableOpacity
                    key={m}
                    style={[
                      styles.retentionBtn,
                      {
                        backgroundColor: isSelected ? colors.accent : isDark ? '#1E293B' : '#F1F5F9',
                        borderColor: isSelected ? colors.accent : colors.border,
                      },
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setRetentionMonths(m);
                    }}
                  >
                    <Text style={[styles.retentionText, { color: isSelected ? '#FFF' : colors.text }]}>
                      {m} Months
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Card>

        {/* Export Data */}
        <Card style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border, marginTop: SPACING.md }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Data Export & Transparency</Text>
          <Text style={[styles.cardSub, { color: colors.textMuted, marginBottom: SPACING.md }]}>
            Download a portable JSON archive of your profile, saved opportunities, and actions
          </Text>

          <Button
            title="Download My Data (JSON)"
            variant="outline"
            size="md"
            onPress={handleExportData}
          />
        </Card>

        {/* Danger Zone */}
        <Card style={[styles.formCard, { backgroundColor: isDark ? '#1E293B' : '#FEF2F2', borderColor: '#FCA5A5', marginTop: SPACING.md }]}>
          <Text style={[styles.cardTitle, { color: '#DC2626' }]}>Danger Zone</Text>
          <Text style={[styles.cardSub, { color: '#B91C1C', marginBottom: SPACING.md }]}>
            Permanently delete your Leed account and all associated discovery data
          </Text>

          <Button
            title="Delete Account"
            variant="ghost"
            size="md"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              setIsDeleteSheetOpen(true);
            }}
            style={{ backgroundColor: '#DC262620' }}
          />
        </Card>

        {feedback ? (
          <Text style={[styles.feedbackText, { color: colors.accent }]}>{feedback}</Text>
        ) : null}
      </ScrollView>

      {/* Delete Account Confirmation BottomSheet */}
      <ConfirmBottomSheet
        visible={isDeleteSheetOpen}
        title="Delete Leed Account?"
        description="This will permanently erase your profile, saved opportunities, radar configurations, and channel links. This action cannot be undone."
        confirmText="Permanently Delete"
        cancelText="Cancel"
        variant="destructive"
        icon={<Trash size={36} color="#EF4444" variant="Bold" />}
        onConfirm={handleConfirmDeleteAccount}
        onCancel={() => setIsDeleteSheetOpen(false)}
      />
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
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  statusLabel: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
  },
  statusSub: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    marginTop: 1,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  retentionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  retentionBtn: {
    flex: 1,
    height: 38,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retentionText: {
    fontFamily: FONTS.medium,
    fontSize: 13,
  },
  feedbackText: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
});
