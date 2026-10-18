import React, { useEffect } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, DimensionValue } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@/context/ThemeContext';
import { BORDER_RADIUS, SPACING } from '@/constants/theme';

export interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Base Shimmering Skeleton Box
 */
export const SkeletonBox: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  borderRadius = BORDER_RADIUS.md,
  style,
}) => {
  const { isDark } = useTheme();
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.85, {
        duration: 900,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const baseColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';

  return (
    <Animated.View
      style={[
        styles.box,
        {
          width,
          height,
          borderRadius,
          backgroundColor: baseColor,
        },
        animatedStyle,
        style,
      ]}
    />
  );
};

/**
 * Circular Skeleton for Avatars and Icon Badges
 */
export const SkeletonCircle: React.FC<{ size?: number; style?: StyleProp<ViewStyle> }> = ({
  size = 44,
  style,
}) => {
  return <SkeletonBox width={size} height={size} borderRadius={size / 2} style={style} />;
};

/**
 * Multi-line Text Skeleton
 */
export const SkeletonText: React.FC<{
  lines?: number;
  lineHeight?: number;
  gap?: number;
  lastLineWidth?: DimensionValue;
  style?: StyleProp<ViewStyle>;
}> = ({ lines = 2, lineHeight = 14, gap = 8, lastLineWidth = '60%', style }) => {
  return (
    <View style={style}>
      {Array.from({ length: lines }).map((_, index) => {
        const isLast = index === lines - 1;
        return (
          <SkeletonBox
            key={index}
            height={lineHeight}
            width={isLast && lines > 1 ? lastLineWidth : '100%'}
            borderRadius={BORDER_RADIUS.sm}
            style={index > 0 ? { marginTop: gap } : undefined}
          />
        );
      })}
    </View>
  );
};

/**
 * Pre-composed Card Skeleton for Opportunities & Leads
 */
export const OpportunityCardSkeleton: React.FC<{ style?: StyleProp<ViewStyle> }> = ({ style }) => {
  const { colors, isDark } = useTheme();

  return (
    <View
      style={[
        styles.cardContainer,
        {
          backgroundColor: isDark ? colors.card : '#FFFFFF',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
        },
        style,
      ]}
    >
      {/* Top Header Row */}
      <View style={styles.cardHeader}>
        <SkeletonCircle size={42} />
        <View style={styles.cardHeaderText}>
          <SkeletonBox width="55%" height={16} />
          <SkeletonBox width="35%" height={12} style={{ marginTop: 6 }} />
        </View>
        <SkeletonBox width={50} height={24} borderRadius={BORDER_RADIUS.full} />
      </View>

      {/* Description Snippet */}
      <SkeletonText lines={2} lineHeight={13} gap={6} style={{ marginTop: 14 }} />

      {/* Tags Row */}
      <View style={styles.tagRow}>
        <SkeletonBox width={70} height={22} borderRadius={BORDER_RADIUS.sm} />
        <SkeletonBox width={90} height={22} borderRadius={BORDER_RADIUS.sm} style={{ marginLeft: 8 }} />
        <SkeletonBox width={60} height={22} borderRadius={BORDER_RADIUS.sm} style={{ marginLeft: 8 }} />
      </View>

      {/* Footer Bar */}
      <View style={styles.cardFooter}>
        <SkeletonBox width="40%" height={16} />
        <SkeletonBox width={85} height={32} borderRadius={BORDER_RADIUS.md} />
      </View>
    </View>
  );
};

/**
 * Pre-composed Skeleton for Profile & Settings Screens
 */
export const ProfileScreenSkeleton: React.FC = () => {
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.screenContainer, { backgroundColor: colors.background }]}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <SkeletonCircle size={76} />
        <SkeletonBox width="50%" height={20} style={{ marginTop: 14 }} />
        <SkeletonBox width="30%" height={14} style={{ marginTop: 6 }} />
      </View>

      {/* Stats Counter Bar */}
      <View
        style={[
          styles.statsCard,
          {
            backgroundColor: isDark ? colors.card : '#FFFFFF',
            borderColor: colors.border,
          },
        ]}
      >
        <SkeletonBox width="28%" height={36} />
        <SkeletonBox width="28%" height={36} />
        <SkeletonBox width="28%" height={36} />
      </View>

      {/* Settings Row Skeletons */}
      <View style={{ marginTop: 24, paddingHorizontal: SPACING.lg }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.settingsRow,
              {
                backgroundColor: isDark ? colors.card : '#FFFFFF',
                borderColor: colors.border,
                marginTop: i > 0 ? 10 : 0,
              },
            ]}
          >
            <SkeletonCircle size={36} />
            <SkeletonBox width="50%" height={14} style={{ marginLeft: 12 }} />
            <SkeletonBox width={20} height={14} style={{ marginLeft: 'auto' }} />
          </View>
        ))}
      </View>
    </View>
  );
};

/**
 * Pre-composed Skeleton for Full Screen Auth Session Restoration
 */
export const AuthSessionSkeleton: React.FC = () => {
  const { colors } = useTheme();

  return (
    <View style={[styles.screenContainer, styles.centered, { backgroundColor: colors.background }]}>
      <SkeletonCircle size={68} />
      <SkeletonBox width="45%" height={22} style={{ marginTop: 20 }} />
      <SkeletonBox width="65%" height={14} style={{ marginTop: 10 }} />
      <View style={{ width: '80%', marginTop: 36 }}>
        <SkeletonBox width="100%" height={48} borderRadius={BORDER_RADIUS.lg} />
        <SkeletonBox width="100%" height={48} borderRadius={BORDER_RADIUS.lg} style={{ marginTop: 14 }} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    overflow: 'hidden',
  },
  cardContainer: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeaderText: {
    flex: 1,
    marginLeft: 12,
  },
  tagRow: {
    flexDirection: 'row',
    marginTop: 14,
    alignItems: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  screenContainer: {
    flex: 1,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  statsCard: {
    marginHorizontal: SPACING.lg,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
});
