import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { BottomSheet } from './BottomSheet';
import { useTheme } from '@/context/ThemeContext';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/theme';
import {
  TickCircle,
  GalleryAdd,
  Camera,
  Image as ImageIcon,
  User,
} from 'iconsax-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const PRESET_AVATARS = [
  {
    id: 'av-1',
    label: 'Alex (3D Tech Lead)',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'av-2',
    label: 'Marcus (Architect)',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'av-3',
    label: 'Elena (AI Specialist)',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'av-4',
    label: 'David (DevOps & Cloud)',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'av-5',
    label: 'Sophia (Design Engineer)',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'av-6',
    label: 'Liam (Fintech Fellow)',
    url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'av-7',
    label: 'Zainab (Full-Stack)',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'av-8',
    label: 'Kenji (Security Lead)',
    url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'av-9',
    label: 'Chloe (Product Strategist)',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'av-10',
    label: 'Noah (Autonomous Systems)',
    url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80',
  },
];

export const PRESET_COVERS = [
  {
    id: 'cov-1',
    label: 'Silicon Aurora',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
  },
  {
    id: 'cov-2',
    label: 'Midnight Gradient',
    url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&auto=format&fit=crop&q=80',
  },
  {
    id: 'cov-3',
    label: 'Cyber Waves',
    url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1200&auto=format&fit=crop&q=80',
  },
  {
    id: 'cov-4',
    label: 'Geometric Deep Sea',
    url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1200&auto=format&fit=crop&q=80',
  },
  {
    id: 'cov-5',
    label: 'Sunset Minimalist',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80',
  },
  {
    id: 'cov-6',
    label: 'Tokyo Neon Grid',
    url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1200&auto=format&fit=crop&q=80',
  },
];

interface AvatarCoverPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  initialTab?: 'avatar' | 'cover';
  currentAvatarUrl?: string;
  currentCoverUrl?: string;
  onSelectAvatar: (url: string) => void;
  onSelectCover: (url: string) => void;
}

export const AvatarCoverPickerSheet: React.FC<AvatarCoverPickerSheetProps> = ({
  visible,
  onClose,
  initialTab = 'avatar',
  currentAvatarUrl,
  currentCoverUrl,
  onSelectAvatar,
  onSelectCover,
}) => {
  const { colors, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'avatar' | 'cover'>(initialTab);

  const handlePickCustomImage = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: activeTab === 'avatar' ? [1, 1] : [16, 6],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        const uri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
        if (activeTab === 'avatar') {
          onSelectAvatar(uri);
        } else {
          onSelectCover(uri);
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onClose();
      }
    } catch {
      // Graceful fallback
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={activeTab === 'avatar' ? 'Choose User Avatar' : 'Choose Cover Banner'}
      subtitle={
        activeTab === 'avatar'
          ? 'Pick from curated styles or upload your own photo'
          : 'Personalize your profile header with modern banners'
      }
    >
      <View style={styles.container}>
        {/* Tab Switcher */}
        <View
          style={[
            styles.tabBar,
            { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#EEF2F6' },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === 'avatar' && {
                backgroundColor: colors.accent,
                shadowColor: colors.accent,
                shadowOpacity: 0.25,
                shadowRadius: 6,
                elevation: 3,
              },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab('avatar');
            }}
            activeOpacity={0.8}
          >
            <User
              size={16}
              color={activeTab === 'avatar' ? '#FFF' : colors.textMuted}
              variant="Bold"
            />
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'avatar' ? '#FFF' : colors.textMuted },
              ]}
            >
              Avatar Library
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === 'cover' && {
                backgroundColor: colors.accent,
                shadowColor: colors.accent,
                shadowOpacity: 0.25,
                shadowRadius: 6,
                elevation: 3,
              },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab('cover');
            }}
            activeOpacity={0.8}
          >
            <ImageIcon
              size={16}
              color={activeTab === 'cover' ? '#FFF' : colors.textMuted}
              variant="Bold"
            />
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'cover' ? '#FFF' : colors.textMuted },
              ]}
            >
              Cover Banner
            </Text>
          </TouchableOpacity>
        </View>

        {/* Upload Custom CTA Button */}
        <TouchableOpacity
          style={[
            styles.uploadBtn,
            {
              borderColor: colors.accent,
              backgroundColor: isDark ? 'rgba(255, 102, 0, 0.08)' : '#FFF7ED',
            },
          ]}
          onPress={handlePickCustomImage}
          activeOpacity={0.8}
        >
          <GalleryAdd size={20} color={colors.accent} variant="Bold" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[styles.uploadTitle, { color: colors.accent }]}>
              {activeTab === 'avatar' ? 'Upload Custom Photo' : 'Upload Custom Banner'}
            </Text>
            <Text style={[styles.uploadSub, { color: colors.textSecondary }]}>
              Select from device photos or documents
            </Text>
          </View>
        </TouchableOpacity>

        {/* Preset Gallery Section */}
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
          {activeTab === 'avatar' ? 'CURATED PROFILES' : 'CURATED BANNERS'}
        </Text>

        {activeTab === 'avatar' ? (
          <View style={styles.avatarGrid}>
            {PRESET_AVATARS.map((av) => {
              const isSelected = currentAvatarUrl === av.url;
              return (
                <TouchableOpacity
                  key={av.id}
                  style={[
                    styles.avatarItem,
                    isSelected && {
                      borderColor: colors.accent,
                      borderWidth: 2.5,
                      transform: [{ scale: 1.05 }],
                    },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    onSelectAvatar(av.url);
                    onClose();
                  }}
                  activeOpacity={0.8}
                >
                  <Image source={{ uri: av.url }} style={styles.avatarThumb} />
                  {isSelected && (
                    <View style={styles.selectedBadge}>
                      <TickCircle size={16} color="#10B981" variant="Bold" />
                    </View>
                  )}
                  <Text
                    style={[styles.avatarLabel, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {av.label.split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.coverGrid}>
            {PRESET_COVERS.map((cov) => {
              const isSelected = currentCoverUrl === cov.url;
              return (
                <TouchableOpacity
                  key={cov.id}
                  style={[
                    styles.coverItem,
                    isSelected && {
                      borderColor: colors.accent,
                      borderWidth: 2.5,
                    },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    onSelectCover(cov.url);
                    onClose();
                  }}
                  activeOpacity={0.8}
                >
                  <Image source={{ uri: cov.url }} style={styles.coverThumb} />
                  <View style={styles.coverOverlay}>
                    <Text style={styles.coverTitle}>{cov.label}</Text>
                    {isSelected && (
                      <TickCircle size={18} color="#10B981" variant="Bold" />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: BORDER_RADIUS.lg,
    padding: 4,
    marginBottom: SPACING.md,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.md,
    gap: 8,
  },
  tabText: {
    fontFamily: FONTS.semibold,
    fontSize: 13.5,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    
    marginBottom: SPACING.lg,
  },
  uploadTitle: {
    fontFamily: FONTS.bold,
    fontSize: 14,
  },
  uploadSub: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    marginTop: 2,
  },
  sectionTitle: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: SPACING.sm,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'space-between',
  },
  avatarItem: {
    width: (SCREEN_WIDTH - 64) / 4 - 4,
    alignItems: 'center',
    borderRadius: 36,
    padding: 3,
    position: 'relative',
  },
  avatarThumb: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  selectedBadge: {
    position: 'absolute',
    top: 0,
    right: 2,
    backgroundColor: '#FFF',
    borderRadius: 10,
  },
  avatarLabel: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    marginTop: 4,
  },
  coverGrid: {
    gap: 12,
  },
  coverItem: {
    height: 74,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  coverThumb: {
    width: '100%',
    height: '100%',
  },
  coverOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
  },
  coverTitle: {
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
    fontSize: 14,
  },
});
