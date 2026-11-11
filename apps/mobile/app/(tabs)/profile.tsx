import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme, ThemePreference } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { Card, Badge, ConfirmBottomSheet, AvatarCoverPickerSheet, ProfileScreenSkeleton } from '@/components/ui';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/theme';
import {
  User,
  TickCircle,
  ArrowRight2,
  Briefcase,
  Setting2,
  DirectInbox,
  SecuritySafe,
  Sun,
  Moon,
  LogoutCurve,
  Camera,
  Edit2,
  Flash,
  ShieldSecurity,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';
import { radarService } from '@/services/radarService';
import { authService } from '@/services/authService';
import { toast } from 'sonner-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COVER_HEIGHT = 160;

const DEFAULT_COVER =
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80';
const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, themePreference, setThemePreference, isDark } = useTheme();
  const { user, logout, isLoading, updateUser } = useAuth();

  const [coverUrl, setCoverUrl] = useState<string>(user?.coverUrl || DEFAULT_COVER);
  const [avatarUrl, setAvatarUrl] = useState<string>(user?.avatarUrl || DEFAULT_AVATAR);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerInitialTab, setPickerInitialTab] = useState<'avatar' | 'cover'>('avatar');
  const [isSignOutSheetOpen, setIsSignOutSheetOpen] = useState(false);

  React.useEffect(() => {
    if (user?.coverUrl) setCoverUrl(user.coverUrl);
    if (user?.avatarUrl) setAvatarUrl(user.avatarUrl);
  }, [user?.coverUrl, user?.avatarUrl]);

  const handleSelectAvatar = async (url: string) => {
    setAvatarUrl(url);
    updateUser({ avatarUrl: url });
    try {
      await authService.updatePersonalProfile({ avatarUrl: url });
      toast.success('Avatar updated successfully');
    } catch {
      toast.error('Failed to sync avatar with server');
    }
  };

  const handleSelectCover = async (url: string) => {
    setCoverUrl(url);
    updateUser({ coverUrl: url });
    try {
      await authService.updatePersonalProfile({ coverUrl: url });
      toast.success('Cover image updated successfully');
    } catch {
      toast.error('Failed to sync cover image with server');
    }
  };

  const { data: radars = [] } = useQuery({
    queryKey: ['radars'],
    queryFn: () => radarService.getRadars(),
  });

  const userName = user?.name || '';
  const userEmail = user?.email || '';

  const completenessPercent = React.useMemo(() => {
    let score = 0;
    if (user?.name) score += 20;
    if (user?.email) score += 15;
    if (user?.emailVerified) score += 25;
    if (user?.headline || user?.targetOutcome) score += 15;
    if (user?.targetCategories && user.targetCategories.length > 0) score += 15;
    if (user?.targetLocations && user.targetLocations.length > 0) score += 10;
    return Math.min(score, 100);
  }, [user]);

  const handleNavigate = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route as any);
  };

  const openAvatarPicker = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPickerInitialTab('avatar');
    setIsPickerOpen(true);
  };

  const openCoverPicker = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPickerInitialTab('cover');
    setIsPickerOpen(true);
  };

  const handleConfirmLogout = async () => {
    setIsSignOutSheetOpen(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await logout();
    toast.success('Signed out safely');
    router.replace('/(auth)/landing');
  };

  if (isLoading && !user) {
    return <ProfileScreenSkeleton />;
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Scrollable View without Sticky Header */}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 130 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner Cover Container */}
        <View style={[styles.coverContainer, { paddingTop: insets.top }]}>
          <Image source={{ uri: coverUrl }} style={styles.coverImage} resizeMode="cover" />
          <View style={styles.coverScrim} />

          {/* Change Cover Button */}
          <TouchableOpacity
            style={styles.editCoverBtn}
            onPress={openCoverPicker}
            activeOpacity={0.8}
          >
            <Camera size={14} color="#FFFFFF" variant="Bold" />
            <Text style={styles.editCoverText}>Edit Cover</Text>
          </TouchableOpacity>

          {/* Free Edition Tag floating on cover */}
          <View style={[styles.badgeFloat, { top: insets.top + 12 }]}>
            <Badge label="100% Free Edition" variant="accent" size="sm" />
          </View>
        </View>

        {/* User Identity Section Overlapping Cover */}
        <View style={styles.identitySection}>
          <View style={styles.avatarRow}>
            {/* User Avatar with Border & Camera Badge */}
            <TouchableOpacity
              style={[
                styles.avatarWrap,
                {
                  borderColor: isDark ? colors.background : '#FFFFFF',
                  backgroundColor: colors.surface,
                },
              ]}
              onPress={openAvatarPicker}
              activeOpacity={0.85}
            >
              <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
              <View style={[styles.cameraBadge, { backgroundColor: colors.accent }]}>
                <Camera size={13} color="#FFFFFF" variant="Bold" />
              </View>
            </TouchableOpacity>

            {/* Quick Action Button Next to Avatar */}
            <TouchableOpacity
              style={[
                styles.editProfileBtn,
                {
                  borderColor: colors.border,
                  backgroundColor: isDark ? colors.card : '#FFFFFF',
                },
              ]}
              onPress={() => handleNavigate('/profile/personal')}
              activeOpacity={0.8}
            >
              <Edit2 size={14} color={colors.text} variant="Linear" />
              <Text style={[styles.editProfileText, { color: colors.text }]}>
                Edit Profile
              </Text>
            </TouchableOpacity>
          </View>

          {/* User Details */}
          <View style={styles.detailsWrap}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <Text style={[styles.userName, { color: colors.text }]}>
                {userName || 'Anonymous User'}
              </Text>
              {user?.emailVerified ? (
                <View style={styles.verifiedRow}>
                  <TickCircle size={18} color="#10B981" variant="Bold" />
                  <Text style={styles.verifiedBadgeText}>Verified</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.unverifiedBadge}
                  onPress={() => router.push('/(auth)/verify-email')}
                  activeOpacity={0.8}
                >
                  <ShieldSecurity size={14} color="#D97706" variant="Bold" />
                  <Text style={styles.unverifiedBadgeText}>Unverified · Tap to Verify</Text>
                </TouchableOpacity>
              )}
            </View>

            {user?.headline || user?.targetOutcome ? (
              <Text style={[styles.userHeadline, { color: colors.textSecondary }]}>
                {user.headline || user.targetOutcome}
              </Text>
            ) : (
              <TouchableOpacity
                onPress={() => handleNavigate('/profile/personal')}
                activeOpacity={0.7}
                style={styles.emptyHeadlineWrap}
              >
                <Text style={[styles.emptyHeadline, { color: colors.accent }]}>
                  + Add headline & professional focus
                </Text>
              </TouchableOpacity>
            )}

            <Text style={[styles.userEmail, { color: colors.textMuted }]}>
              {userEmail}
            </Text>

            {/* Location & Status Pills */}
            <View style={styles.pillsRow}>
              {user?.targetLocations && user.targetLocations.length > 0 ? (
                <View
                  style={[
                    styles.pill,
                    { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
                  ]}
                >
                  <Text style={[styles.pillText, { color: colors.textSecondary }]}>
                    📍 {user.targetLocations.slice(0, 2).join(' · ')}
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.pill,
                    { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
                  ]}
                  onPress={() => handleNavigate('/profile/preferences')}
                >
                  <Text style={[styles.pillText, { color: colors.textMuted }]}>
                    📍 Add locations
                  </Text>
                </TouchableOpacity>
              )}

              {radars.length > 0 ? (
                <View
                  style={[
                    styles.pill,
                    { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5' },
                  ]}
                >
                  <Text style={[styles.pillText, { color: '#10B981', fontFamily: FONTS.semiBold }]}>
                    ⚡ Radar Active ({radars.length} {radars.length === 1 ? 'stream' : 'streams'})
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.pill,
                    { backgroundColor: isDark ? 'rgba(255, 102, 0, 0.15)' : '#FFF0E6' },
                  ]}
                  onPress={() => router.push('/(tabs)/radar')}
                >
                  <Text style={[styles.pillText, { color: colors.accent, fontFamily: FONTS.semiBold }]}>
                    ⚡ Create 1st Radar
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Profile Completeness & Free Launch Callout */}
        <View style={styles.sectionWrap}>
          <Card
            style={[
              styles.completenessCard,
              {
                backgroundColor: isDark ? '#1E293B' : '#F0FDF4',
                borderColor: isDark ? '#334155' : '#BBF7D0',
              },
            ]}
          >
            <View style={styles.completenessHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TickCircle size={18} color="#10B981" variant="Bold" />
                <Text
                  style={[
                    styles.completenessTitle,
                    { color: isDark ? '#F1F5F9' : '#14532D' },
                  ]}
                >
                  AI Match Profile Completeness
                </Text>
              </View>
              <Text style={[styles.completenessPercent, { color: '#10B981' }]}>
                {completenessPercent}%
              </Text>
            </View>

            {/* Progress Bar */}
            <View
              style={[
                styles.progressBarBg,
                { backgroundColor: isDark ? '#334155' : '#DCFCE7' },
              ]}
            >
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${completenessPercent}%`, backgroundColor: '#10B981' },
                ]}
              />
            </View>

            <Text
              style={[
                styles.completenessSub,
                { color: isDark ? '#94A3B8' : '#166534' },
              ]}
            >
              ✨ Zero-Cost Launch: Zero subscription fees. Automated discovery, continuous scrapers, and personal agent alerts are fully unlocked.
            </Text>
          </Card>
        </View>

        {/* Section 1: Identity & Career Materials */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>
            IDENTITY & CAREER MATERIALS
          </Text>

          <Card
            style={[
              styles.menuCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleNavigate('/profile/personal')}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconWrap, { backgroundColor: '#3B82F615' }]}>
                <User size={20} color="#3B82F6" variant="Bold" />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={[styles.menuTitle, { color: colors.text }]}>
                  Personal Information
                </Text>
                <Text style={[styles.menuSubtitle, { color: colors.textMuted }]}>
                  Display name, verified contacts, location & locale
                </Text>
              </View>
              <ArrowRight2 size={16} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={[styles.itemDivider, { backgroundColor: colors.borderSubtle }]} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleNavigate('/profile/career')}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconWrap, { backgroundColor: '#FF660015' }]}>
                <Briefcase size={20} color={colors.accent} variant="Bold" />
              </View>
              <View style={styles.menuTextWrap}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.menuTitle, { color: colors.text }]}>
                    Experience, CV & Materials
                  </Text>
                </View>
                <Text style={[styles.menuSubtitle, { color: colors.textMuted }]}>
                  CV upload & preview, experience history, portfolios & skills
                </Text>
              </View>
              <ArrowRight2 size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </Card>
        </View>

        {/* Section 2: Opportunity Matching & Channels */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>
            DISCOVERY & CHANNELS
          </Text>

          <Card
            style={[
              styles.menuCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleNavigate('/profile/preferences')}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconWrap, { backgroundColor: '#10B98115' }]}>
                <Setting2 size={20} color="#10B981" variant="Bold" />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={[styles.menuTitle, { color: colors.text }]}>
                  Opportunity Matching Preferences
                </Text>
                <Text style={[styles.menuSubtitle, { color: colors.textMuted }]}>
                  Categories, salary floor, remote filters & threshold
                </Text>
              </View>
              <ArrowRight2 size={16} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={[styles.itemDivider, { backgroundColor: colors.borderSubtle }]} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleNavigate('/profile/connections')}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconWrap, { backgroundColor: '#0088cc15' }]}>
                <DirectInbox size={20} color="#0088cc" variant="Bold" />
              </View>
              <View style={styles.menuTextWrap}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.menuTitle, { color: colors.text }]}>
                    Connected Channels
                  </Text>
                  <Badge label="Telegram · WhatsApp" variant="success" size="sm" />
                </View>
                <Text style={[styles.menuSubtitle, { color: colors.textMuted }]}>
                  Telegram Bot, WhatsApp Agent, Email & Push alerts
                </Text>
              </View>
              <ArrowRight2 size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </Card>
        </View>

        {/* Section 3: Privacy & Security */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>
            SECURITY & PRIVACY
          </Text>

          <Card
            style={[
              styles.menuCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleNavigate('/profile/security')}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconWrap, { backgroundColor: '#8B5CF615' }]}>
                <SecuritySafe size={20} color="#8B5CF6" variant="Bold" />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={[styles.menuTitle, { color: colors.text }]}>
                  Security & Data Privacy
                </Text>
                <Text style={[styles.menuSubtitle, { color: colors.textMuted }]}>
                  Tenant isolation, AI privacy toggle & data export
                </Text>
              </View>
              <ArrowRight2 size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </Card>
        </View>

        {/* Section 4: Appearance Selector */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>
            APPEARANCE
          </Text>

          <Card
            style={[
              styles.menuCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                padding: 10,
              },
            ]}
          >
            <View style={styles.themeSelectorRow}>
              {(['light', 'dark', 'system'] as ThemePreference[]).map((pref) => {
                const isSelected = themePreference === pref;
                return (
                  <TouchableOpacity
                    key={pref}
                    style={[
                      styles.themeBtn,
                      {
                        backgroundColor: isSelected
                          ? colors.accent
                          : isDark
                          ? '#0F172A'
                          : '#EEF2F6',
                        borderColor: isSelected ? colors.accent : colors.border,
                      },
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setThemePreference(pref);
                    }}
                    activeOpacity={0.8}
                  >
                    {pref === 'light' ? (
                      <Sun size={18} color={isSelected ? '#FFF' : colors.text} variant="Linear" />
                    ) : pref === 'dark' ? (
                      <Moon size={18} color={isSelected ? '#FFF' : colors.text} variant="Linear" />
                    ) : (
                      <Setting2 size={18} color={isSelected ? '#FFF' : colors.text} variant="Linear" />
                    )}
                    <Text
                      style={[
                        styles.themeBtnText,
                        {
                          color: isSelected ? '#FFF' : colors.text,
                          fontFamily: isSelected ? FONTS.semiBold : FONTS.medium,
                        },
                      ]}
                    >
                      {pref.charAt(0).toUpperCase() + pref.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>
        </View>

        {/* Sign Out Action Button */}
        <View style={styles.signOutWrap}>
          <TouchableOpacity
            style={[
              styles.signOutBtn,
              { borderColor: colors.border, backgroundColor: colors.card },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setIsSignOutSheetOpen(true);
            }}
            activeOpacity={0.8}
          >
            <LogoutCurve size={18} color="#EF4444" variant="Bold" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>

          <Text style={[styles.versionText, { color: colors.textMuted }]}>
            Leed Platform v2.2.0 · Zero-Cost Launch Edition
          </Text>
        </View>
      </ScrollView>

      {/* Avatar & Cover Banner Selector Sheet */}
      <AvatarCoverPickerSheet
        visible={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        initialTab={pickerInitialTab}
        currentAvatarUrl={avatarUrl}
        currentCoverUrl={coverUrl}
        onSelectAvatar={handleSelectAvatar}
        onSelectCover={handleSelectCover}
      />

      {/* Sign Out Confirmation BottomSheet (Zero Alerts, Responsive Sheet) */}
      <ConfirmBottomSheet
        visible={isSignOutSheetOpen}
        title="Sign Out of Leed?"
        description="Your scheduled background radars and connected channel alerts will continue monitoring real opportunities in the background."
        confirmText="Sign Out"
        cancelText="Stay Signed In"
        variant="destructive"
        icon={<LogoutCurve size={36} color="#EF4444" variant="Bold" />}
        onConfirm={handleConfirmLogout}
        onCancel={() => setIsSignOutSheetOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 130,
  },
  coverContainer: {
    height: COVER_HEIGHT + 40,
    width: '100%',
    position: 'relative',
    backgroundColor: '#0F172A',
  },
  coverImage: {
    ...StyleSheet.absoluteFill,
  },
  coverScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  editCoverBtn: {
    position: 'absolute',
    right: SPACING.md,
    bottom: SPACING.md,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BORDER_RADIUS.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backdropFilter: 'blur(8px)',
  },
  editCoverText: {
    color: '#FFFFFF',
    fontFamily: FONTS.semibold,
    fontSize: 12,
  },
  badgeFloat: {
    position: 'absolute',
    left: SPACING.md,
  },
  identitySection: {
    paddingHorizontal: SPACING.md,
    marginTop: -44,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  avatarWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3.5,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 44,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    marginBottom: 6,
  },
  editProfileText: {
    fontFamily: FONTS.semibold,
    fontSize: 13,
  },
  detailsWrap: {
    marginTop: 4,
  },
  userName: {
    fontFamily: FONTS.bold,
    fontSize: 22,
    letterSpacing: -0.4,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  verifiedBadgeText: {
    color: '#10B981',
    fontFamily: FONTS.semibold,
    fontSize: 12,
  },
  unverifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  unverifiedBadgeText: {
    color: '#D97706',
    fontFamily: FONTS.semibold,
    fontSize: 11.5,
  },
  userHeadline: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    marginTop: 2,
  },
  emptyHeadlineWrap: {
    paddingVertical: 3,
  },
  emptyHeadline: {
    fontFamily: FONTS.medium,
    fontSize: 13,
  },
  userEmail: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    marginTop: 2,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: SPACING.sm,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.full,
  },
  pillText: {
    fontFamily: FONTS.medium,
    fontSize: 12,
  },
  sectionWrap: {
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.lg,
  },
  completenessCard: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
  },
  completenessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  completenessTitle: {
    fontFamily: FONTS.bold,
    fontSize: 14.5,
  },
  completenessPercent: {
    fontFamily: FONTS.bold,
    fontSize: 15,
  },
  progressBarBg: {
    height: 7,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
  },
  completenessSub: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    marginTop: 8,
    lineHeight: 17,
  },
  sectionHeading: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  menuCard: {
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: 12,
  },
  menuIconWrap: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextWrap: {
    flex: 1,
  },
  menuTitle: {
    fontFamily: FONTS.semibold,
    fontSize: 15,
  },
  menuSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    marginTop: 2,
  },
  itemDivider: {
    height: 1,
    marginHorizontal: SPACING.md,
  },
  themeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  themeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    gap: 6,
  },
  themeBtnText: {
    fontSize: 13,
  },
  signOutWrap: {
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.xl,
    alignItems: 'center',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    height: 48,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
  },
  signOutText: {
    color: '#EF4444',
    fontFamily: FONTS.semibold,
    fontSize: 14.5,
  },
  versionText: {
    fontFamily: FONTS.regular,
    fontSize: 11.5,
    marginTop: 12,
  },
});
