import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  TouchableWithoutFeedback,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/theme';
import { CloseCircle } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  snapPoints?: number[];
  scrollable?: boolean;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  icon,
  children,
  scrollable = true,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 24,
          stiffness: 260,
          mass: 0.8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Backdrop */}
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View
            style={[
              styles.backdrop,
              {
                opacity: fadeAnim,
                backgroundColor: 'rgba(10, 15, 30, 0.65)',
              },
            ]}
          />
        </TouchableWithoutFeedback>

        {/* KeyboardAvoiding wrapper so inputs are never covered by keyboard */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
          style={styles.keyboardAvoid}
        >
          {/* Sheet Content Container */}
          <Animated.View
            style={[
              styles.sheetContainer,
              {
                backgroundColor: isDark ? colors.surface : '#FFFFFF',
                borderColor: colors.borderSubtle,
                paddingBottom: Math.max(insets.bottom, 16),
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Top Grabber Handle */}
            <View style={styles.handleContainer}>
              <View
                style={[
                  styles.handle,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.25)'
                      : 'rgba(0, 0, 0, 0.15)',
                  },
                ]}
              />
            </View>

            {/* Header Row (Optional) */}
            {(title || icon) && (
              <View style={styles.headerRow}>
                <View style={styles.headerLeft}>
                  {icon && <View style={styles.iconWrap}>{icon}</View>}
                  <View style={{ flex: 1 }}>
                    {title && (
                      <Text style={[styles.title, { color: colors.text }]}>
                        {title}
                      </Text>
                    )}
                    {subtitle && (
                      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                        {subtitle}
                      </Text>
                    )}
                  </View>
                </View>

                <TouchableOpacity
                  onPress={onClose}
                  activeOpacity={0.7}
                  style={styles.closeBtn}
                >
                  <CloseCircle size={22} color={colors.textMuted} variant="Linear" />
                </TouchableOpacity>
              </View>
            )}

            {/* Body */}
            {scrollable ? (
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                contentContainerStyle={styles.scrollBody}
              >
                {children}
              </ScrollView>
            ) : (
              <View style={styles.body}>{children}</View>
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill as any,
  },
  keyboardAvoid: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    width: '100%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    paddingHorizontal: SPACING.lg,
    maxHeight: SCREEN_HEIGHT * 0.9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 20,
  },
  handleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 10,
  },
  handle: {
    width: 40,
    height: 4.5,
    borderRadius: BORDER_RADIUS.full,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
    marginBottom: SPACING.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12.5,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    width: '100%',
  },
  scrollBody: {
    paddingBottom: 24,
  },
});
