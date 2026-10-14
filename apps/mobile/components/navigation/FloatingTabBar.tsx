import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { BORDER_RADIUS, FONTS } from '@/constants/theme';
import { useRouter } from 'expo-router';
import {
  Home2,
  Radar2,
  Add,
  Briefcase,
  User,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';

export interface FloatingTabBarProps {
  state: {
    index: number;
    routes: Array<{ key: string; name: string; params?: any }>;
  };
  navigation: {
    emit: (event: any) => any;
    navigate: (name: string, params?: any) => void;
  };
  descriptors?: any;
  insets?: any;
}

export const FloatingTabBar: React.FC<FloatingTabBarProps> = ({
  state,
  navigation,
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();

  // Bottom clearance for iOS Home Indicator or Android gestures
  const bottomMargin = Math.max(insets.bottom, Platform.OS === 'ios' ? 20 : 16);

  return (
    <View
      style={[
        styles.floatingWrapper,
        {
          bottom: bottomMargin,
        },
      ]}
      pointerEvents="box-none"
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: isDark
              ? 'rgba(20, 33, 61, 0.72)'
              : 'rgba(255, 255, 255, 0.82)',
            borderColor: isDark
              ? 'rgba(255, 255, 255, 0.16)'
              : 'rgba(255, 255, 255, 0.85)',
            shadowColor: isDark ? '#000000' : '#14213D',
          },
        ]}
      >
        {/* iOS Frosted Glass Layer */}
        <BlurView
          intensity={Platform.OS === 'ios' ? 88 : 50}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />

        {/* Tab 1: Home */}
        {renderTabItem('index', 'Home', Home2)}

        {/* Tab 2: Radars */}
        {renderTabItem('radar', 'Radars', Radar2)}

        {/* Center Tab: Floating Plus FAB Action - Opens dedicated Action & Search screen */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/action');
          }}
          style={styles.fabCenter}
        >
          <View
            style={[
              styles.fabInner,
              {
                backgroundColor: colors.accent,
                shadowColor: colors.accent,
              },
            ]}
          >
            <Add size={24} color="#FFFFFF" variant="Linear" />
          </View>
        </TouchableOpacity>

        {/* Tab 4: Pipeline */}
        {renderTabItem('opportunities', 'Pipeline', Briefcase)}

        {/* Tab 5: Profile */}
        {renderTabItem('profile', 'Profile', User)}
      </View>
    </View>
  );

  function renderTabItem(
    routeName: string,
    label: string,
    IconComponent: any
  ) {
    const route = state.routes.find((r: any) => r.name === routeName);
    if (!route) return null;

    const isFocused =
      state.index === state.routes.findIndex((r: any) => r.name === routeName);

    const onPress = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });

      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    };

    return (
      <TouchableOpacity
        key={routeName}
        onPress={onPress}
        activeOpacity={0.8}
        style={styles.tabButton}
      >
        {/* WhatsApp-style Active Capsule Highlight */}
        <View
          style={[
            styles.iconCapsule,
            isFocused && {
              backgroundColor: isDark
                ? 'rgba(255, 255, 255, 0.16)'
                : 'rgba(20, 33, 61, 0.08)',
            },
          ]}
        >
          {routeName === 'profile' ? (
            user?.avatarUrl ? (
              <Image
                source={{ uri: user.avatarUrl }}
                style={[
                  styles.avatarTabImg,
                  isFocused && { borderColor: colors.accent, borderWidth: 1.5 },
                ]}
              />
            ) : (
              <View
                style={[
                  styles.avatarTabCircle,
                  {
                    backgroundColor: isFocused ? colors.accent : isDark ? '#334155' : '#CBD5E1',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.avatarTabText,
                    { color: isFocused ? '#FFFFFF' : colors.text },
                  ]}
                >
                  {(user?.name || 'A').charAt(0).toUpperCase()}
                </Text>
              </View>
            )
          ) : (
            <IconComponent
              size={22}
              color={isFocused ? colors.accent : colors.textMuted}
              variant={isFocused ? 'Bold' : 'Linear'}
            />
          )}
        </View>

        <Text
          style={[
            styles.tabLabel,
            {
              color: isFocused ? colors.accent : colors.textMuted,
              fontFamily: isFocused ? FONTS.bold : FONTS.medium,
            },
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  }
};

const styles = StyleSheet.create({
  floatingWrapper: {
    position: 'absolute',
    left: 18,
    right: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    height: 68,
    borderRadius: 38,
    borderWidth: 1.2,
    paddingHorizontal: 10,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 22,
    elevation: 12,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    paddingVertical: 4,
  },
  iconCapsule: {
    width: 46,
    height: 30,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 10.5,
    letterSpacing: 0.2,
  },
  fabCenter: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
  },
  fabInner: {
    width: 46,
    height: 46,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.38,
    shadowRadius: 10,
    elevation: 8,
  },
  avatarTabImg: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  avatarTabCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTabText: {
    fontSize: 10,
    fontFamily: FONTS.bold,
  },
});
