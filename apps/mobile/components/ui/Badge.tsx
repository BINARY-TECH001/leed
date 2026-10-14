import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/theme';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'accent' | 'neutral';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  size = 'md',
  dot = false,
  style,
}) => {
  const { colors, isDark } = useTheme();

  const getColors = () => {
    switch (variant) {
      case 'success':
        return {
          bg: isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.12)',
          text: colors.success,
          dot: colors.success,
        };
      case 'warning':
        return {
          bg: isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.12)',
          text: colors.warning,
          dot: colors.warning,
        };
      case 'error':
        return {
          bg: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.12)',
          text: colors.error,
          dot: colors.error,
        };
      case 'info':
        return {
          bg: isDark ? 'rgba(0, 180, 216, 0.2)' : 'rgba(0, 119, 182, 0.12)',
          text: colors.secondary,
          dot: colors.secondary,
        };
      case 'accent':
        return {
          bg: isDark ? 'rgba(255, 102, 0, 0.2)' : 'rgba(255, 102, 0, 0.12)',
          text: colors.accent,
          dot: colors.accent,
        };
      case 'neutral':
      default:
        return {
          bg: isDark ? colors.surfaceSecondary : '#EEF2F6',
          text: colors.textSecondary,
          dot: colors.textMuted,
        };
    }
  };

  const badgeColors = getColors();
  const isSm = size === 'sm';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: badgeColors.bg,
          paddingVertical: isSm ? 2 : 4,
          paddingHorizontal: isSm ? SPACING.sm : SPACING.md - 4,
        },
        style,
      ]}
    >
      {dot && (
        <View
          style={[
            styles.dot,
            {
              backgroundColor: badgeColors.dot,
              marginRight: isSm ? 4 : 6,
            },
          ]}
        />
      )}
      <Text
        style={[
          styles.text,
          {
            color: badgeColors.text,
            fontSize: isSm ? 11 : 12.5,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: BORDER_RADIUS.full,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: BORDER_RADIUS.full,
  },
  text: {
    fontFamily: FONTS.semibold,
    letterSpacing: 0.2,
  },
});
