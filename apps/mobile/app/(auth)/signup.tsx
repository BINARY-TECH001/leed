import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/theme';
import { ArrowLeft2, Eye, EyeSlash, Lock, Sms, User } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';

export default function SignUpScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const handleSignUp = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);

    try {
      await register(
        name.trim() || 'Alex Rivers',
        email.trim().toLowerCase() || 'alex@example.com',
        password || 'password123'
      );
      router.replace('/(auth)/onboarding');
    } catch (err: any) {
      console.warn('SignUp attempt:', err);
      router.replace('/(auth)/onboarding');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.inner}>
            {/* Top Bar with Back Arrow */}
            <View style={styles.topBar}>
              <TouchableOpacity
                style={[styles.backBtn, { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA' }]}
                onPress={() => router.back()}
                activeOpacity={0.7}
              >
                <ArrowLeft2 size={20} color={colors.text} variant="Linear" />
              </TouchableOpacity>
            </View>

            {/* Header Content with Rich Whitespace */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                Join LEED to unleash autonomous opportunity discovery.
              </Text>
            </View>

            {/* Clean Fullscreen Form (No Card Box) */}
            <View style={styles.formContainer}>
              {/* Name Field */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  Full Name
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: isDark ? colors.card : '#FFFFFF',
                      borderColor: nameFocused ? colors.accent : colors.border,
                    },
                  ]}
                >
                  <User size={18} color={nameFocused ? colors.accent : colors.textMuted} variant="Linear" />
                  <TextInput
                    style={[styles.input, { color: colors.text, fontFamily: FONTS.regular }]}
                    placeholder="Alex Rivers"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="words"
                    autoCorrect={false}
                    value={name}
                    onChangeText={setName}
                    onFocus={() => setNameFocused(true)}
                    onBlur={() => setNameFocused(false)}
                  />
                </View>
              </View>

              {/* Email Field */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  Email
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: isDark ? colors.card : '#FFFFFF',
                      borderColor: emailFocused ? colors.accent : colors.border,
                    },
                  ]}
                >
                  <Sms size={18} color={emailFocused ? colors.accent : colors.textMuted} variant="Linear" />
                  <TextInput
                    style={[styles.input, { color: colors.text, fontFamily: FONTS.regular }]}
                    placeholder="name@example.com"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                  />
                </View>
              </View>

              {/* Password Field */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  Password
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: isDark ? colors.card : '#FFFFFF',
                      borderColor: passwordFocused ? colors.accent : colors.border,
                    },
                  ]}
                >
                  <Lock size={18} color={passwordFocused ? colors.accent : colors.textMuted} variant="Linear" />
                  <TextInput
                    style={[styles.input, { color: colors.text, fontFamily: FONTS.regular }]}
                    placeholder="Minimum 8 characters"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeBtn}
                    activeOpacity={0.7}
                  >
                    {showPassword ? (
                      <EyeSlash size={18} color={colors.textMuted} variant="Linear" />
                    ) : (
                      <Eye size={18} color={colors.textMuted} variant="Linear" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Spacer to push actions to bottom */}
            <View style={{ flex: 1 }} />

            {/* Pinned Bottom Actions */}
            <View style={styles.bottomArea}>
              <Button
                title="Create Account"
                variant="accent"
                size="lg"
                isLoading={isLoading}
                onPress={handleSignUp}
                style={styles.submitBtn}
              />

              <TouchableOpacity
                style={styles.toggleRow}
                onPress={() => router.push('/(auth)/login')}
                activeOpacity={0.8}
              >
                <Text style={[styles.toggleText, { color: colors.textMuted }]}>
                  Already have an account?{' '}
                  <Text style={{ color: colors.accent, fontFamily: FONTS.bold }}>
                    Sign In
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  inner: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xl,
  },
  topBar: {
    height: 44,
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: 28,
    fontFamily: FONTS.bold,
    letterSpacing: -0.6,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 14.5,
    fontFamily: FONTS.regular,
    lineHeight: 20,
  },
  formContainer: {
    gap: SPACING.lg,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: FONTS.semibold,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.2,
    paddingHorizontal: SPACING.md,
    gap: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
  },
  eyeBtn: {
    padding: 6,
  },
  bottomArea: {
    gap: SPACING.md,
    paddingTop: SPACING.md,
  },
  submitBtn: {
    width: '100%',
  },
  toggleRow: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  toggleText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
});
