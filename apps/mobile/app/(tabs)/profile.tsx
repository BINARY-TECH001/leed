import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme, ThemePreference } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { Button, Card, Badge, BottomSheet } from '@/components/ui';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/theme';
import {
  User,
  Camera,
  DocumentUpload,
  TickCircle,
  Flash,
  Edit2,
  Trash,
  Add,
  Global,
  Code,
  Link2,
  Moon,
  Sun,
  Setting2,
  LogoutCurve,
  SecuritySafe,
  DollarCircle,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import type { AutonomyLevel } from '@prospect/types';

interface StoredCV {
  id: string;
  name: string;
  size: string;
  uploadedAt: string;
  isPrimary: boolean;
  tags: string[];
}

const AVATAR_GALLERY = [
  { id: 'av-1', label: 'Executive', uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&fit=crop&q=80' },
  { id: 'av-2', label: 'Tech Lead', uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&fit=crop&q=80' },
  { id: 'av-3', label: 'AI Specialist', uri: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&fit=crop&q=80' },
  { id: 'av-4', label: 'Architect', uri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&fit=crop&q=80' },
  { id: 'av-5', label: 'Creative', uri: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&fit=crop&q=80' },
];

const COVER_PRESETS = [
  { id: 'cov-1', label: 'Executive Navy', colors: ['#14213D', '#0077B6'] },
  { id: 'cov-2', label: 'Solar Flare', colors: ['#FF6600', '#14213D'] },
  { id: 'cov-3', label: 'Ocean Depths', colors: ['#0077B6', '#0F172A'] },
  { id: 'cov-4', label: 'Deep Cyber', colors: ['#1E293B', '#3B82F6'] },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { colors, themePreference, setThemePreference, isDark } = useTheme();
  const { user, logout, updateUser } = useAuth();

  // Multi-CV state
  const [cvList, setCvList] = useState<StoredCV[]>([
    {
      id: 'cv-1',
      name: 'Principal Mobile Architect (2026).pdf',
      size: '1.4 MB',
      uploadedAt: 'Updated Today',
      isPrimary: true,
      tags: ['Expo 57', 'React Native 0.86', 'TypeScript'],
    },
    {
      id: 'cv-2',
      name: 'Fintech & Ledger Consultant Profile.pdf',
      size: '890 KB',
      uploadedAt: 'Oct 8, 2026',
      isPrimary: false,
      tags: ['Double-Entry Ledger', 'ACID', 'Security'],
    },
    {
      id: 'cv-3',
      name: 'Fullstack AI Lead Pitch Deck.pdf',
      size: '3.1 MB',
      uploadedAt: 'Sep 29, 2026',
      isPrimary: false,
      tags: ['Next.js 15', 'Node 20 ESM', 'Redis'],
    },
  ]);

  // Credit balance state
  const [credits, setCredits] = useState(485);
  const [autonomyLevel, setAutonomyLevel] = useState<AutonomyLevel>(user?.autonomyLevel || 'approve');

  // Active cover preset
  const [activeCover, setActiveCover] = useState(COVER_PRESETS[0]);

  // Modals & Sheets
  const [isAvatarSheetOpen, setIsAvatarSheetOpen] = useState(false);
  const [isAddCvSheetOpen, setIsAddCvSheetOpen] = useState(false);
  const [isTopUpSheetOpen, setIsTopUpSheetOpen] = useState(false);
  const [isSignOutSheetOpen, setIsSignOutSheetOpen] = useState(false);

  // New CV form
  const [newCvName, setNewCvName] = useState('');
  const [newCvTags, setNewCvTags] = useState('React Native, Staff Level');

  const userName = user?.name || 'Alex Rivers';
  const userEmail = user?.email || 'alex@example.com';
  const avatarUrl = user?.avatarUrl;

  const handleSetPrimaryCV = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCvList((prev) =>
      prev.map((cv) => ({
        ...cv,
        isPrimary: cv.id === id,
      }))
    );
  };

  const handleDeleteCV = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCvList((prev) => prev.filter((cv) => cv.id !== id));
  };

  const handleSelectAvatar = (uri: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateUser({ avatarUrl: uri });
    setIsAvatarSheetOpen(false);
  };

  const handleAddCV = () => {
    if (!newCvName.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const added: StoredCV = {
      id: `cv-${Date.now()}`,
      name: newCvName.endsWith('.pdf') ? newCvName : `${newCvName}.pdf`,
      size: '1.2 MB',
      uploadedAt: 'Just Now',
      isPrimary: cvList.length === 0,
      tags: newCvTags.split(',').map((t) => t.trim()).filter(Boolean),
    };
    setCvList([added, ...cvList]);
    setNewCvName('');
    setIsAddCvSheetOpen(false);
  };

  const handleTopUpConfirm = (amount: number) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCredits((c) => c + amount);
    setIsTopUpSheetOpen(false);
  };

  const handleConfirmLogout = async () => {
    setIsSignOutSheetOpen(false);
    await logout();
    router.replace('/(auth)/landing');
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Cover Banner */}
        <View
          style={[
            styles.coverBanner,
            { backgroundColor: activeCover.colors[0] },
          ]}
        >
          <View
            style={[
              styles.coverGradientOverlay,
              { backgroundColor: activeCover.colors[1] + '80' },
            ]}
          />

          <TouchableOpacity
            style={styles.changeCoverBtn}
            onPress={() => setIsAvatarSheetOpen(true)}
            activeOpacity={0.8}
          >
            <Camera size={14} color="#FFF" variant="Bold" />
            <Text style={styles.changeCoverText}>Edit Cover & Avatar</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Card Overlay Header */}
        <View style={styles.profileMetaContainer}>
          {/* Avatar with Camera Badge */}
          <TouchableOpacity
            style={[
              styles.avatarContainer,
              {
                borderColor: colors.background,
                backgroundColor: isDark ? colors.card : '#FFFFFF',
              },
            ]}
            onPress={() => setIsAvatarSheetOpen(true)}
            activeOpacity={0.85}
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
            ) : (
              <View
                style={[
                  styles.avatarFallback,
                  { backgroundColor: colors.accent + '25' },
                ]}
              >
                <Text style={[styles.avatarFallbackText, { color: colors.accent }]}>
                  {userName.charAt(0)}
                </Text>
              </View>
            )}

            <View style={[styles.cameraBadge, { backgroundColor: colors.accent }]}>
              <Camera size={12} color="#FFF" variant="Bold" />
            </View>
          </TouchableOpacity>

          {/* User Details */}
          <View style={styles.userTextBlock}>
            <View style={styles.nameRow}>
              <Text style={[styles.userName, { color: colors.text }]}>
                {userName}
              </Text>
              <TickCircle size={18} color={colors.accent} variant="Bold" />
            </View>

            <Text style={[styles.userHeadline, { color: colors.textSecondary }]}>
              Principal Mobile Architect · Expo & React Native
            </Text>

            <Text style={[styles.userEmail, { color: colors.textMuted }]}>
              {userEmail} · Remote Worldwide (US/EMEA Async)
            </Text>

            <View style={styles.badgeRow}>
              <Badge label="Verified Profile" variant="success" size="sm" dot />
              <Badge label="Autonomous Tier" variant="accent" size="sm" />
              <Badge label="$120/hr Rate Floor" variant="neutral" size="sm" />
            </View>
          </View>
        </View>

        {/* AI Credit Balance CTA Card */}
        <View
          style={[
            styles.creditCtaCard,
            { backgroundColor: isDark ? colors.card : '#14213D' },
          ]}
        >
          <View style={styles.creditTopRow}>
            <View style={styles.creditBadgeWrap}>
              <Flash size={14} color="#FF6600" variant="Bold" />
              <Text style={styles.creditBadgeText}>LEDGER BALANCE</Text>
            </View>
            <TouchableOpacity
              style={styles.refillPillBtn}
              onPress={() => setIsTopUpSheetOpen(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.refillBtnText}>+ Top Up Credits</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.creditValueRow}>
            <Text style={styles.creditValue}>{credits}</Text>
            <Text style={styles.creditLabel}>AI Credits Available</Text>
          </View>

          <Text style={styles.creditSub}>
            Autonomous radars and personalized proposal outreach draw from your double-entry audited wallet.
          </Text>
        </View>

        {/* Multi-CV Career Intelligence Section */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Career Intelligence & CVs
              </Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
                Our AI references the Primary CV for radar matching & pitch drafts.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.addCvBtn, { backgroundColor: colors.accent }]}
              onPress={() => setIsAddCvSheetOpen(true)}
              activeOpacity={0.85}
            >
              <Add size={16} color="#FFF" variant="Linear" />
              <Text style={styles.addCvBtnText}>Add CV</Text>
            </TouchableOpacity>
          </View>

          {/* CV Cards List */}
          <View style={styles.cvCardsList}>
            {cvList.map((cv) => (
              <Card
                key={cv.id}
                variant="elevated"
                style={[
                  styles.cvCard,
                  cv.isPrimary && {
                    borderColor: colors.accent,
                    borderWidth: 1.5,
                  },
                ]}
              >
                <View style={styles.cvHeaderRow}>
                  <View
                    style={[
                      styles.cvIconWrap,
                      {
                        backgroundColor: cv.isPrimary
                          ? colors.accent + '20'
                          : isDark
                          ? colors.surfaceSecondary
                          : '#F3F5F9',
                      },
                    ]}
                  >
                    <DocumentUpload
                      size={20}
                      color={cv.isPrimary ? colors.accent : colors.textMuted}
                      variant={cv.isPrimary ? 'Bold' : 'Linear'}
                    />
                  </View>

                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text
                      style={[
                        styles.cvName,
                        {
                          color: colors.text,
                          fontFamily: cv.isPrimary ? FONTS.bold : FONTS.semibold,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {cv.name}
                    </Text>
                    <Text style={[styles.cvMeta, { color: colors.textMuted }]}>
                      {cv.size} · {cv.uploadedAt}
                    </Text>
                  </View>

                  {cv.isPrimary ? (
                    <Badge label="Primary Active" variant="accent" size="sm" dot />
                  ) : (
                    <TouchableOpacity
                      style={[
                        styles.setPrimaryBtn,
                        {
                          backgroundColor: isDark
                            ? colors.surfaceSecondary
                            : '#EEF2F6',
                        },
                      ]}
                      onPress={() => handleSetPrimaryCV(cv.id)}
                    >
                      <Text
                        style={[styles.setPrimaryText, { color: colors.textSecondary }]}
                      >
                        Set Primary
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* CV Skill Tag Chips */}
                <View style={styles.cvTagsRow}>
                  {cv.tags.map((tag, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.cvTagChip,
                        {
                          backgroundColor: isDark
                            ? colors.surfaceSecondary
                            : '#F8FAFC',
                          borderColor: colors.borderSubtle,
                        },
                      ]}
                    >
                      <Text style={[styles.cvTagText, { color: colors.textSecondary }]}>
                        {tag}
                      </Text>
                    </View>
                  ))}

                  {cvList.length > 1 && !cv.isPrimary && (
                    <TouchableOpacity
                      onPress={() => handleDeleteCV(cv.id)}
                      style={styles.deleteCvBtn}
                    >
                      <Trash size={14} color={colors.error} variant="Linear" />
                    </TouchableOpacity>
                  )}
                </View>
              </Card>
            ))}
          </View>
        </View>

        {/* Portfolio & Verified Materials */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Portfolio & Verification Links
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
            Referenced during AI outreach to substantiate capability.
          </Text>

          <Card variant="elevated" style={styles.linksCard}>
            <View style={styles.linkRow}>
              <Code size={18} color={colors.accent} variant="Bold" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.linkTitle, { color: colors.text }]}>
                  GitHub Profile
                </Text>
                <Text style={[styles.linkValue, { color: colors.textMuted }]}>
                  github.com/alex-rivers-arch
                </Text>
              </View>
              <Badge label="Synced" variant="success" size="sm" />
            </View>

            <View style={[styles.linkDivider, { backgroundColor: colors.borderSubtle }]} />

            <View style={styles.linkRow}>
              <Global size={18} color={colors.accent} variant="Bold" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.linkTitle, { color: colors.text }]}>
                  Engineering Blog & Architecture Case Studies
                </Text>
                <Text style={[styles.linkValue, { color: colors.textMuted }]}>
                  alexrivers.io/work
                </Text>
              </View>
              <Badge label="Verified" variant="accent" size="sm" />
            </View>
          </Card>
        </View>

        {/* AI Autonomy Preferences */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Agent Autonomy Level
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
            Controls how autonomously your personal AI acts on matched contracts.
          </Text>

          <View style={styles.autonomyList}>
            {[
              {
                id: 'automate' as AutonomyLevel,
                title: 'Full Autonomous Mode',
                desc: 'Agents qualify matches, prepare tailored proposals, and queue delivery.',
              },
              {
                id: 'approve' as AutonomyLevel,
                title: 'Review & Approve (Recommended)',
                desc: 'AI drafts proposals in advance. You review and dispatch with 1 tap.',
              },
              {
                id: 'assist' as AutonomyLevel,
                title: 'Observer Only',
                desc: 'Radars only discover and alert you. Proposals require manual trigger.',
              },
            ].map((item) => {
              const isSelected = autonomyLevel === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.autonomyOption,
                    {
                      backgroundColor: isDark ? colors.card : '#FFFFFF',
                      borderColor: isSelected ? colors.accent : colors.border,
                    },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setAutonomyLevel(item.id);
                    updateUser({ autonomyLevel: item.id });
                  }}
                  activeOpacity={0.8}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.autonomyTitle,
                        {
                          color: colors.text,
                          fontFamily: isSelected ? FONTS.bold : FONTS.semibold,
                        },
                      ]}
                    >
                      {item.title}
                    </Text>
                    <Text style={[styles.autonomyDesc, { color: colors.textMuted }]}>
                      {item.desc}
                    </Text>
                  </View>
                  {isSelected ? (
                    <TickCircle size={22} color={colors.accent} variant="Bold" />
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Appearance Settings */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Appearance
          </Text>

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
                        ? colors.card
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
                        fontFamily: isSelected ? FONTS.bold : FONTS.medium,
                      },
                    ]}
                  >
                    {pref.charAt(0).toUpperCase() + pref.slice(1)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Sign Out Button */}
        <Button
          title="Sign Out of Session"
          variant="danger"
          size="lg"
          leftIcon={<LogoutCurve size={18} color="#FFFFFF" variant="Linear" />}
          onPress={() => setIsSignOutSheetOpen(true)}
          style={{ width: '100%', marginBottom: 20 }}
        />
      </ScrollView>

      {/* Responsive Avatar & Cover Gallery BottomSheet */}
      <BottomSheet
        visible={isAvatarSheetOpen}
        onClose={() => setIsAvatarSheetOpen(false)}
        title="Customize Identity"
        subtitle="Select a representative avatar and cover palette."
        icon={
          <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: colors.accent + '20', alignItems: 'center', justifyContent: 'center' }}>
            <Camera size={20} color={colors.accent} variant="Bold" />
          </View>
        }
      >
        <View style={{ paddingVertical: SPACING.xs }}>
          <Text style={[styles.sheetSectionHeading, { color: colors.text }]}>
            Avatar Gallery
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryRow}>
            {AVATAR_GALLERY.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.galleryItem,
                  avatarUrl === item.uri && { borderColor: colors.accent, borderWidth: 2.5 },
                ]}
                onPress={() => handleSelectAvatar(item.uri)}
              >
                <Image source={{ uri: item.uri }} style={styles.galleryImg} />
                <Text style={[styles.galleryLabel, { color: colors.textSecondary }]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={[styles.sheetSectionHeading, { color: colors.text, marginTop: SPACING.md }]}>
            Cover Theme
          </Text>
          <View style={styles.coverRow}>
            {COVER_PRESETS.map((cov) => (
              <TouchableOpacity
                key={cov.id}
                style={[
                  styles.coverOption,
                  { backgroundColor: cov.colors[0] },
                  activeCover.id === cov.id && { borderColor: colors.accent, borderWidth: 2.5 },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveCover(cov);
                }}
              >
                <Text style={styles.coverOptionText}>{cov.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </BottomSheet>

      {/* Responsive Add CV BottomSheet */}
      <BottomSheet
        visible={isAddCvSheetOpen}
        onClose={() => setIsAddCvSheetOpen(false)}
        title="Upload Career Document"
        subtitle="Add a specialized CV or case study to tailor matching."
        icon={
          <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: colors.accent + '20', alignItems: 'center', justifyContent: 'center' }}>
            <DocumentUpload size={20} color={colors.accent} variant="Bold" />
          </View>
        }
      >
        <View style={{ paddingVertical: SPACING.xs }}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            Document Title
          </Text>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: isDark ? colors.surfaceSecondary : '#F3F5F9',
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            placeholder="e.g. Senior Expo Architecture CV (2026)"
            placeholderTextColor={colors.textMuted}
            value={newCvName}
            onChangeText={setNewCvName}
          />

          <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 12 }]}>
            Key Competencies (comma separated)
          </Text>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: isDark ? colors.surfaceSecondary : '#F3F5F9',
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            placeholder="e.g. React Native, Expo 57, TypeScript"
            placeholderTextColor={colors.textMuted}
            value={newCvTags}
            onChangeText={setNewCvTags}
          />

          <View style={styles.sheetActionRow}>
            <Button
              title="Cancel"
              variant="outline"
              size="md"
              onPress={() => setIsAddCvSheetOpen(false)}
              style={{ flex: 1 }}
            />
            <Button
              title="Save Document"
              variant="accent"
              size="md"
              disabled={!newCvName.trim()}
              onPress={handleAddCV}
              style={{ flex: 1.5 }}
            />
          </View>
        </View>
      </BottomSheet>

      {/* Responsive Top-Up BottomSheet */}
      <BottomSheet
        visible={isTopUpSheetOpen}
        onClose={() => setIsTopUpSheetOpen(false)}
        title="Refill AI Credits"
        subtitle="Credits fund autonomous crawlers and personalized drafting."
        icon={
          <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: colors.accent + '20', alignItems: 'center', justifyContent: 'center' }}>
            <Flash size={20} color={colors.accent} variant="Bold" />
          </View>
        }
      >
        <View style={{ paddingVertical: SPACING.xs }}>
          <View style={styles.topUpPacksRow}>
            {[
              { amount: 150, price: '$15', bonus: '' },
              { amount: 350, price: '$30', bonus: '+50 Free' },
              { amount: 1000, price: '$75', bonus: '+250 Free' },
            ].map((pack) => (
              <TouchableOpacity
                key={pack.amount}
                style={[
                  styles.topUpPackCard,
                  {
                    backgroundColor: isDark ? colors.surfaceSecondary : '#F8FAFC',
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => handleTopUpConfirm(pack.amount)}
                activeOpacity={0.8}
              >
                {pack.bonus ? (
                  <View style={styles.bonusBadge}>
                    <Text style={styles.bonusBadgeText}>{pack.bonus}</Text>
                  </View>
                ) : null}
                <Text style={[styles.packAmount, { color: colors.text }]}>
                  +{pack.amount}
                </Text>
                <Text style={[styles.packLabel, { color: colors.textMuted }]}>
                  Credits
                </Text>
                <Text style={[styles.packPrice, { color: colors.accent }]}>
                  {pack.price}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </BottomSheet>

      {/* Responsive Sign Out Sheet */}
      <BottomSheet
        visible={isSignOutSheetOpen}
        onClose={() => setIsSignOutSheetOpen(false)}
        title="Sign Out Confirmation"
        subtitle="Are you sure you want to exit your active session?"
        icon={
          <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: colors.error + '20', alignItems: 'center', justifyContent: 'center' }}>
            <LogoutCurve size={20} color={colors.error} variant="Bold" />
          </View>
        }
      >
        <View style={{ paddingVertical: SPACING.xs }}>
          <Text style={{ color: colors.textSecondary, fontSize: 13.5, lineHeight: 20, marginBottom: SPACING.lg }}>
            Your background radars will continue scanning public & partner streams. You can log back in at any time.
          </Text>
          <View style={styles.sheetActionRow}>
            <Button
              title="Cancel"
              variant="outline"
              size="md"
              onPress={() => setIsSignOutSheetOpen(false)}
              style={{ flex: 1 }}
            />
            <Button
              title="Sign Out"
              variant="accent"
              size="md"
              onPress={handleConfirmLogout}
              style={{ flex: 1, backgroundColor: colors.error }}
            />
          </View>
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 140, // Generous clearance for floating glass tab bar
  },
  coverBanner: {
    height: 140,
    width: '100%',
    position: 'relative',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: SPACING.md,
  },
  coverGradientOverlay: {
    ...StyleSheet.absoluteFill as any,
  },
  changeCoverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
  },
  changeCoverText: {
    color: '#FFF',
    fontSize: 11.5,
    fontFamily: FONTS.semibold,
  },
  profileMetaContainer: {
    paddingHorizontal: SPACING.lg,
    marginTop: -38,
    marginBottom: SPACING.lg,
  },
  avatarContainer: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 3.5,
    position: 'relative',
    marginBottom: SPACING.sm,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 41,
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    borderRadius: 41,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    fontSize: 32,
    fontFamily: FONTS.bold,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  userTextBlock: {
    width: '100%',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  userName: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    letterSpacing: -0.4,
  },
  userHeadline: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 12.5,
    fontFamily: FONTS.regular,
    marginBottom: SPACING.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  creditCtaCard: {
    marginHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  creditTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  creditBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  creditBadgeText: {
    color: '#FF6600',
    fontSize: 10.5,
    fontFamily: FONTS.bold,
    letterSpacing: 0.6,
  },
  refillPillBtn: {
    backgroundColor: '#FF6600',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.full,
  },
  refillBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: FONTS.bold,
  },
  creditValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 6,
  },
  creditValue: {
    color: '#FFFFFF',
    fontSize: 32,
    fontFamily: FONTS.bold,
    letterSpacing: -1,
  },
  creditLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontFamily: FONTS.medium,
  },
  creditSub: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
    lineHeight: 17,
  },
  sectionBlock: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: FONTS.bold,
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  addCvBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BORDER_RADIUS.full,
  },
  addCvBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: FONTS.bold,
  },
  cvCardsList: {
    gap: 10,
  },
  cvCard: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  cvHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cvIconWrap: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cvName: {
    fontSize: 14,
    marginBottom: 2,
  },
  cvMeta: {
    fontSize: 11,
    fontFamily: FONTS.regular,
  },
  setPrimaryBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.full,
  },
  setPrimaryText: {
    fontSize: 11,
    fontFamily: FONTS.semibold,
  },
  cvTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.04)',
  },
  cvTagChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
  },
  cvTagText: {
    fontSize: 11,
    fontFamily: FONTS.regular,
  },
  deleteCvBtn: {
    marginLeft: 'auto',
    padding: 4,
  },
  linksCard: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  linkTitle: {
    fontSize: 13.5,
    fontFamily: FONTS.semibold,
  },
  linkValue: {
    fontSize: 11.5,
    fontFamily: FONTS.regular,
    marginTop: 1,
  },
  linkDivider: {
    height: 1,
    marginVertical: 8,
  },
  autonomyList: {
    gap: 8,
    marginTop: SPACING.sm,
  },
  autonomyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.2,
    gap: 12,
  },
  autonomyTitle: {
    fontSize: 14.5,
    marginBottom: 2,
  },
  autonomyDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  themeSelectorRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: SPACING.sm,
  },
  themeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
  },
  themeBtnText: {
    fontSize: 13,
  },
  sheetSectionHeading: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    marginBottom: 10,
  },
  galleryRow: {
    gap: 12,
    paddingBottom: 6,
  },
  galleryItem: {
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.lg,
    padding: 4,
  },
  galleryImg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 4,
  },
  galleryLabel: {
    fontSize: 11,
    fontFamily: FONTS.medium,
  },
  coverRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  coverOption: {
    flex: 1,
    minWidth: '45%',
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverOptionText: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: FONTS.bold,
  },
  inputLabel: {
    fontSize: 12.5,
    fontFamily: FONTS.semibold,
    marginBottom: 6,
  },
  textInput: {
    height: 46,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13.5,
  },
  sheetActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: SPACING.lg,
  },
  topUpPacksRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: SPACING.sm,
  },
  topUpPackCard: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.2,
    alignItems: 'center',
    position: 'relative',
  },
  bonusBadge: {
    position: 'absolute',
    top: -8,
    backgroundColor: '#FF6600',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  bonusBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontFamily: FONTS.bold,
  },
  packAmount: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    marginTop: 4,
  },
  packLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  packPrice: {
    fontSize: 14,
    fontFamily: FONTS.bold,
  },
});
