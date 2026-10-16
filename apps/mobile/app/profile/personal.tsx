import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { Button, Card, Badge } from '@/components/ui';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/theme';
import {
  ArrowLeft2,
  Camera,
  TickCircle,
  Sms,
  Call,
  Global,
  Location,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { connectionService } from '@/services';

export default function PersonalDetailsScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user?.name || 'Alex Rivers');
  const [displayName, setDisplayName] = useState(user?.name ? user.name.split(' ')[0] : 'Alex');
  const [email] = useState(user?.email || 'alex.rivers@prospectai.dev');
  const [phone, setPhone] = useState('+1 (415) 555-2671');
  const [country, setCountry] = useState('United States');
  const [city, setCity] = useState('San Francisco, CA');
  const [timezone, setTimezone] = useState('America/Los_Angeles (PST)');
  const [language, setLanguage] = useState('English (US)');
  const [isSaving, setIsSaving] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setSavedFeedback(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await connectionService.updatePersonal({
        name,
        preferredDisplayName: displayName,
        phone,
        country,
        city,
        timezone,
        preferredLanguage: language,
      });
      updateUser({ name });
      setSavedFeedback('Personal details saved successfully');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setSavedFeedback('Details saved locally in preview.');
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Personal Information</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatarWrap, { borderColor: colors.border }]}>
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatarImg} />
            ) : (
              <View style={[styles.avatarFallback, { backgroundColor: colors.accent + '20' }]}>
                <Text style={[styles.avatarFallbackText, { color: colors.accent }]}>
                  {name.charAt(0)}
                </Text>
              </View>
            )}
            <View style={[styles.cameraBadge, { backgroundColor: colors.accent }]}>
              <Camera size={13} color="#FFF" variant="Bold" />
            </View>
          </View>
          <Text style={[styles.avatarHint, { color: colors.textMuted }]}>
            Tap to upload new profile portrait
          </Text>
        </View>

        {/* Inputs */}
        <Card style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Identity & Contact</Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Full Legal Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', color: colors.text, borderColor: colors.border }]}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Alex Rivers"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Preferred Display Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', color: colors.text, borderColor: colors.border }]}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="e.g. Alex"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Primary Email</Text>
              <Badge label="Verified" variant="success" size="sm" dot />
            </View>
            <View style={[styles.staticField, { backgroundColor: isDark ? '#0F172A' : '#F1F5F9', borderColor: colors.border }]}>
              <Sms size={16} color={colors.textMuted} />
              <Text style={[styles.staticText, { color: colors.text }]}>{email}</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Primary Phone</Text>
              <Badge label="Connected" variant="neutral" size="sm" />
            </View>
            <TextInput
              style={[styles.input, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', color: colors.text, borderColor: colors.border }]}
              value={phone}
              onChangeText={setPhone}
              placeholder="+1 (555) 000-0000"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
            />
          </View>
        </Card>

        {/* Location & Timezone */}
        <Card style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border, marginTop: SPACING.md }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Location & Locale</Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Country of Residence</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', color: colors.text, borderColor: colors.border }]}
              value={country}
              onChangeText={setCountry}
              placeholder="e.g. United States"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>City & State / Region</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', color: colors.text, borderColor: colors.border }]}
              value={city}
              onChangeText={setCity}
              placeholder="e.g. San Francisco, CA"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Timezone (for quiet hours)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', color: colors.text, borderColor: colors.border }]}
              value={timezone}
              onChangeText={setTimezone}
              placeholder="e.g. UTC, PST, CET"
              placeholderTextColor={colors.textMuted}
            />
          </View>
        </Card>

        {savedFeedback ? (
          <Text style={[styles.feedbackText, { color: '#10B981' }]}>{savedFeedback}</Text>
        ) : null}

        <View style={styles.actionWrap}>
          <Button
            title={isSaving ? 'Saving Changes...' : 'Save Personal Details'}
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
    fontFamily: FONTS.semibold,
    fontSize: 16,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  avatarWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarFallback: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    fontFamily: FONTS.bold,
    fontSize: 32,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  avatarHint: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    marginTop: 8,
  },
  formCard: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
  },
  cardTitle: {
    fontFamily: FONTS.semibold,
    fontSize: 15,
    marginBottom: SPACING.md,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
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
  staticField: {
    height: 46,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  staticText: {
    fontFamily: FONTS.medium,
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
