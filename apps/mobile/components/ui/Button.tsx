import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/theme';

export type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  leftIcon,
  rightIcon,
  style,
  ...props
}) => {
  const { colors, isDark } = useTheme();

  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'accent':
        return { backgroundColor: colors.accent };
      case 'secondary':
        return { backgroundColor: colors.secondary };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: isDark ? colors.accent : colors.primary,
        };
      case 'ghost':
        return { backgroundColor: 'transparent' };
      case 'danger':
        return {
          backgroundColor: colors.error + '18',
          borderWidth: 1,
          borderColor: colors.error,
        };
      case 'primary':
      default:
        return { backgroundColor: isDark ? colors.accent : colors.primary };
    }
  };

  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case 'sm':
        return { height: 38, paddingHorizontal: SPACING.md };
      case 'lg':
        return { height: 56, paddingHorizontal: SPACING.xl };
      case 'md':
      default:
        return { height: 48, paddingHorizontal: SPACING.lg };
    }
  };

  const getTextColor = (): string => {
    switch (variant) {
      case 'outline':
        return isDark ? colors.accent : colors.primary;
      case 'ghost':
        return colors.text;
      case 'danger':
        return colors.error;
      case 'accent':
      case 'secondary':
        return colors.white;
      case 'primary':
      default:
        return colors.white;
    }
  };

  const getTextSize = (): TextStyle => {
    switch (size) {
      case 'sm':
        return { fontSize: 13 };
      case 'lg':
        return { fontSize: 16 };
      case 'md':
      default:
        return { fontSize: 14.5 };
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.base,
        getSizeStyle(),
        getVariantStyle(),
        (disabled || isLoading) && styles.disabled,
        style,
      ]}
      disabled={disabled || isLoading}
      activeOpacity={0.82}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? colors.accent : colors.white}
        />
      ) : (
        <>
          {leftIcon && <>{leftIcon}</>}
          <Text
            style={[
              styles.text,
              getTextSize(),
              {
                color: getTextColor(),
                marginHorizontal: leftIcon || rightIcon ? SPACING.xs : 0,
              },
            ]}
          >
            {title}
          </Text>
          {rightIcon && <>{rightIcon}</>}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  text: {
    fontFamily: FONTS.semibold,
    letterSpacing: 0.2,
  },
  disabled: {
    opacity: 0.45,
  },
});
