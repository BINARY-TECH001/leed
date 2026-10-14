import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { Card, Badge, EmptyState } from '@/components/ui';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/theme';
import {
  ArrowLeft2,
  NotificationBing,
  Radar2,
  TickCircle,
  Flash,
  Clock,
  Trash,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';

interface NotificationItem {
  id: string;
  type: 'radar' | 'approval' | 'system' | 'reminder';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  targetRoute?: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n-1',
    type: 'radar',
    title: '98% High Match Discovered',
    message: 'Senior Mobile Architect at Fintech Velocity matched your Expo Router skillset.',
    timestamp: '10m ago',
    isRead: false,
    targetRoute: '/opportunity/opp-1',
  },
  {
    id: 'n-2',
    type: 'approval',
    title: 'Application Ready for Approval',
    message: 'AI drafted an executive proposal for Apex Logistics Group. Review before dispatch.',
    timestamp: '45m ago',
    isRead: false,
    targetRoute: '/attention/att-1',
  },
  {
    id: 'n-3',
    type: 'radar',
    title: 'Radar Daily Scan Completed',
    message: 'Scanned 48 sources across US/EMEA. 3 new contracts qualified.',
    timestamp: '3h ago',
    isRead: true,
    targetRoute: '/(tabs)/radar',
  },
  {
    id: 'n-4',
    type: 'reminder',
    title: 'Follow-Up Due',
    message: 'Review pending reply from Sarah Jenkins (Fintech Velocity).',
    timestamp: 'Yesterday',
    isRead: true,
    targetRoute: '/opportunity/opp-1',
  },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [filter, setFilter] = useState<'all' | 'unread' | 'radar'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((res) => setTimeout(res, 600));
    setRefreshing(false);
  };

  const handleMarkAllRead = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
  };

  const handlePressItem = (item: NotificationItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNotifications(
      notifications.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
    );
    if (item.targetRoute) {
      router.push(item.targetRoute as any);
    }
  };

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'radar') return n.type === 'radar';
    return true;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'radar':
        return <Radar2 size={20} color={colors.accent} variant="Bold" />;
      case 'approval':
        return <Flash size={20} color="#F59E0B" variant="Bold" />;
      case 'reminder':
        return <Clock size={20} color={colors.secondary} variant="Bold" />;
      default:
        return <TickCircle size={20} color={colors.success} variant="Bold" />;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Bar */}
      <View style={[styles.topBar, { borderBottomColor: colors.borderSubtle }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft2 size={22} color={colors.text} />
        </TouchableOpacity>

        <Text style={[styles.topTitle, { color: colors.text }]}>Notifications</Text>

        <TouchableOpacity onPress={handleMarkAllRead} activeOpacity={0.7}>
          <Text style={[styles.markReadText, { color: colors.accent }]}>
            Mark All Read
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(['all', 'unread', 'radar'] as const).map((tab) => {
          const isSelected = filter === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[
                styles.filterPill,
                {
                  backgroundColor: isSelected
                    ? isDark
                      ? colors.accent + '25'
                      : colors.accent + '15'
                    : isDark
                    ? colors.surfaceSecondary
                    : '#EEF2F6',
                  borderColor: isSelected ? colors.accent : 'transparent',
                },
              ]}
              onPress={() => setFilter(tab)}
            >
              <Text
                style={[
                  styles.filterText,
                  {
                    color: isSelected ? colors.accent : colors.textSecondary,
                    fontFamily: isSelected ? FONTS.bold : FONTS.medium,
                  },
                ]}
              >
                {tab === 'all' ? 'All Activity' : tab === 'unread' ? 'Unread' : 'Radars'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Notifications List */}
      <ScrollView
        contentContainerStyle={styles.scrollList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
      >
        {filtered.length > 0 ? (
          filtered.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.8}
              onPress={() => handlePressItem(item)}
              style={[
                styles.notifCard,
                {
                  backgroundColor: !item.isRead
                    ? isDark
                      ? 'rgba(255, 102, 0, 0.08)'
                      : 'rgba(255, 102, 0, 0.04)'
                    : colors.card,
                  borderColor: !item.isRead ? colors.accent + '40' : colors.border,
                },
              ]}
            >
              <View style={styles.cardInner}>
                <View
                  style={[
                    styles.iconCircle,
                    {
                      backgroundColor: isDark
                        ? colors.surfaceSecondary
                        : '#F1F4F9',
                    },
                  ]}
                >
                  {getIcon(item.type)}
                </View>

                <View style={styles.contentCol}>
                  <View style={styles.titleRow}>
                    <Text
                      style={[
                        styles.notifTitle,
                        { color: colors.text, fontFamily: item.isRead ? FONTS.semibold : FONTS.bold },
                      ]}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    {!item.isRead && (
                      <View
                        style={[styles.unreadDot, { backgroundColor: colors.accent }]}
                      />
                    )}
                  </View>

                  <Text
                    style={[styles.notifMessage, { color: colors.textSecondary }]}
                    numberOfLines={2}
                  >
                    {item.message}
                  </Text>

                  <Text style={[styles.timeText, { color: colors.textMuted }]}>
                    {item.timestamp}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <EmptyState
            icon={<NotificationBing size={40} color={colors.textMuted} />}
            title="All caught up"
            description="You have no notifications in this stream right now."
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    height: 52,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 6,
  },
  topTitle: {
    fontSize: 17,
    fontFamily: FONTS.bold,
  },
  markReadText: {
    fontSize: 13,
    fontFamily: FONTS.semibold,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1.5,
  },
  filterText: {
    fontSize: 12.5,
  },
  scrollList: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xxl,
  },
  notifCard: {
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.sm + 2,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm + 4,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  notifTitle: {
    fontSize: 15,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: BORDER_RADIUS.full,
    marginLeft: 6,
  },
  notifMessage: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    lineHeight: 18,
    marginBottom: 4,
  },
  timeText: {
    fontSize: 11,
    fontFamily: FONTS.medium,
  },
});
