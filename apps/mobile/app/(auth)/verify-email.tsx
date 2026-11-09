import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  type TextInputInstance,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/services/authService';
import { Button } from '@/components/ui';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/theme';
import { SmsNotification, ArrowLeft2, Refresh2, ShieldSecurity, LogoutCurve } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { toast } from 'sonner-native';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { user, verifyEmail, logout } = useAuth();

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timer, setTimer] = useState(RESEND_COOLDOWN);
  const [activeBoxIndex, setActiveBoxIndex] = useState(0);

  const inputRefs = useRef<(TextInputInstance | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer]);

  // Handle single digit input
  const handleChangeText = (text: string, index: number) => {
    // Check if pasted full OTP code
    const cleanText = text.replace(/[^0-9]/g, '');
    if (cleanText.length > 1) {
      const pastedDigits = cleanText.slice(0, OTP_LENGTH).split('');
      const newOtp = [...otp];
      pastedDigits.forEach((digit, i) => {
        newOtp[i] = digit;
      });
      setOtp(newOtp);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const nextIndex = Math.min(pastedDigits.length, OTP_LENGTH - 1);
      inputRefs.current[nextIndex]?.focus();

      if (pastedDigits.length === OTP_LENGTH) {
        submitVerification(newOtp.join(''));
      }
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = cleanText;
    setOtp(newOtp);

    if (cleanText && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
      setActiveBoxIndex(index + 1);
    }

    // Auto submit when all digits filled
    if (cleanText && index === OTP_LENGTH - 1) {
      const fullCode = newOtp.join('');
      if (fullCode.length === OTP_LENGTH) {
        submitVerification(fullCode);
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (otp[index] === '' && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
        setActiveBoxIndex(index - 1);
      }
    }
  };

  const submitVerification = async (codeOverride?: string) => {
    const code = codeOverride || otp.join('');
    if (code.length < OTP_LENGTH) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      toast.error('Please enter the complete 6-digit code');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsVerifying(true);

    try {
      await verifyEmail(code);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast.success('Email verified successfully! Complete setup to activate radars.');
      router.replace('/(auth)/onboarding');
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'Invalid or expired verification code';
      toast.error(message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (timer > 0 || isResending) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsResending(true);

    try {
      const res = await authService.sendVerificationEmail();
      setTimer(RESEND_COOLDOWN);
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast.success(res.message || 'Verification code resent. Check your inbox.');
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'Unable to resend code right now';
      toast.error(msg);
    } finally {
      setIsResending(false);
    }
  };

  const handleSignOut = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await logout();
    router.replace('/(auth)/landing');
  };

  const userEmail = user?.email || 'your email';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.inner}>
            {/* Top Navigation Bar */}
            <View style={styles.topBar}>
              <TouchableOpacity
                style={[
                  styles.iconBtn,
                  { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA' },
                ]}
                onPress={() => router.back()}
                activeOpacity={0.7}
              >
                <ArrowLeft2 size={20} color={colors.text} variant="Linear" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.signOutBtn, { borderColor: colors.border }]}
                onPress={handleSignOut}
                activeOpacity={0.7}
              >
                <LogoutCurve size={16} color={colors.textMuted} variant="Linear" />
                <Text style={[styles.signOutText, { color: colors.textMuted }]}>Sign Out</Text>
              </TouchableOpacity>
            </View>

            {/* Header Content */}
            <View style={styles.header}>
              <View
                style={[
                  styles.iconWrap,
                  {
                    backgroundColor: isDark ? 'rgba(255, 102, 0, 0.15)' : '#FFF0E6',
                    borderColor: isDark ? 'rgba(255, 102, 0, 0.3)' : '#FED7AA',
                  },
                ]}
              >
                <SmsNotification size={36} color={colors.accent} variant="Bold" />
              </View>

              <Text style={[styles.title, { color: colors.text }]}>Check your inbox</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                We sent a 6-digit verification code to
              </Text>
              <Text style={[styles.emailHighlight, { color: colors.text }]}>{userEmail}</Text>
            </View>

            {/* 6-Digit OTP Inputs */}
            <View style={styles.otpRow}>
              {otp.map((digit, index) => {
                const isFocused = activeBoxIndex === index;
                const isFilled = digit.length > 0;
                return (
                  <TextInput
                    key={index}
                    ref={(ref) => {
                      inputRefs.current[index] = ref;
                    }}
                    style={[
                      styles.otpBox,
                      {
                        backgroundColor: isDark ? colors.card : '#FFFFFF',
                        borderColor: isFocused
                          ? colors.accent
                          : isFilled
                          ? colors.accent + '80'
                          : colors.border,
                        color: colors.text,
                      },
                    ]}
                    value={digit}
                    onChangeText={(text) => handleChangeText(text, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    onFocus={() => setActiveBoxIndex(index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                    autoFocus={index === 0}
                  />
                );
              })}
            </View>

            {/* Resend Action */}
            <View style={styles.resendContainer}>
              {timer > 0 ? (
                <Text style={[styles.resendWaitText, { color: colors.textMuted }]}>
                  Resend code in <Text style={{ color: colors.text, fontFamily: FONTS.bold }}>{timer}s</Text>
                </Text>
              ) : (
                <TouchableOpacity
                  onPress={handleResendCode}
                  disabled={isResending}
                  style={styles.resendBtn}
                  activeOpacity={0.7}
                >
                  <Refresh2 size={16} color={colors.accent} variant="Linear" />
                  <Text style={[styles.resendActiveText, { color: colors.accent }]}>
                    {isResending ? 'Sending...' : 'Resend verification code'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Security Guarantee Note */}
            <View
              style={[
                styles.securityNote,
                {
                  backgroundColor: isDark ? colors.surfaceSecondary : '#F8FAFC',
                  borderColor: colors.border,
                },
              ]}
            >
              <ShieldSecurity size={18} color="#10B981" variant="Bold" />
              <Text style={[styles.securityNoteText, { color: colors.textMuted }]}>
                Email verification ensures only authenticated alerts reach your device and unlocks verified badge privileges.
              </Text>
            </View>

            {/* Spacer */}
            <View style={{ flex: 1 }} />

            {/* Bottom Actions */}
            <View style={styles.bottomArea}>
              <Button
                title="Verify Email & Continue"
                variant="accent"
                size="lg"
                isLoading={isVerifying}
                onPress={() => submitVerification()}
                style={styles.verifyBtn}
              />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
  },
  signOutText: {
    fontSize: 12.5,
    fontFamily: FONTS.medium,
  },
  header: {
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 26,
    fontFamily: FONTS.bold,
    letterSpacing: -0.6,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14.5,
    fontFamily: FONTS.regular,
    textAlign: 'center',
  },
  emailHighlight: {
    fontSize: 15,
    fontFamily: FONTS.semibold,
    marginTop: 4,
    textAlign: 'center',
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: SPACING.xl,
  },
  otpBox: {
    flex: 1,
    height: 56,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    textAlign: 'center',
    fontSize: 22,
    fontFamily: FONTS.bold,
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  resendWaitText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  resendActiveText: {
    fontSize: 14,
    fontFamily: FONTS.semibold,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
  },
  securityNoteText: {
    flex: 1,
    fontSize: 12.5,
    fontFamily: FONTS.regular,
    lineHeight: 18,
  },
  bottomArea: {
    paddingTop: SPACING.md,
  },
  verifyBtn: {
    width: '100%',
  },
});
