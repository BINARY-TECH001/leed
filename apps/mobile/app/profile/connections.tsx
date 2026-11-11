import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { Button, Card, Badge, BottomSheet, ConfirmBottomSheet } from '@/components/ui';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/theme';
import {
  ArrowLeft2,
  ArrowRight2,
  TickCircle,
  CloseCircle,
  Flash,
  ShieldSecurity,
  Setting2,
  Trash,
  Play,
  VolumeHigh,
  SearchNormal1,
  DirectSend,
} from 'iconsax-react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { connectionService, whatsappService, type WhatsAppStatus } from '@/services';

// -------------------------------------------------------------
// Official Branded Channel Logos (Pixel-Perfect Vectors)
// -------------------------------------------------------------
const TelegramLogo = ({ size = 32 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="12" fill="#24A1DE" />
    <Path
      d="M17.8 7.3L5.4 12.1C4.55 12.45 4.56 12.92 5.25 13.13L8.43 14.12L15.8 9.47C16.15 9.25 16.47 9.38 16.21 9.61L10.23 15.01H10.22L10.23 15.02L9.98 18.57C10.34 18.57 10.5 18.4 10.7 18.2L12.43 16.52L16.02 19.17C16.68 19.54 17.16 19.34 17.33 18.54L19.68 7.48C19.92 6.51 19.31 6.07 17.8 7.3Z"
      fill="#FFFFFF"
    />
  </Svg>
);

const WhatsAppLogo = ({ size = 32 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="12" fill="#25D366" />
    <Path
      d="M17.5 14.7C17.2 14.55 15.75 13.84 15.48 13.74C15.21 13.64 15.02 13.59 14.82 13.89C14.62 14.19 14.07 14.84 13.9 15.03C13.73 15.23 13.56 15.25 13.26 15.1C12.96 14.95 12.01 14.64 10.88 13.63C10.01 12.85 9.41 11.89 9.24 11.6C9.07 11.3 9.22 11.14 9.37 10.99C9.51 10.85 9.68 10.63 9.83 10.45C9.98 10.27 10.03 10.15 10.13 9.95C10.23 9.75 10.18 9.58 10.1 9.43C10.02 9.28 9.45 7.89 9.21 7.33C8.98 6.78 8.74 6.85 8.57 6.85C8.4 6.85 8.21 6.83 8.02 6.83C7.83 6.83 7.51 6.9 7.24 7.2C6.97 7.5 6.2 8.22 6.2 9.68C6.2 11.14 7.26 12.55 7.41 12.75C7.56 12.95 9.51 15.95 12.5 17.24C13.21 17.55 13.77 17.73 14.2 17.87C14.92 18.1 15.57 18.06 16.08 17.98C16.65 17.89 17.84 17.26 18.08 16.57C18.33 15.89 18.33 15.31 18.25 15.18C18.18 15.05 17.98 14.98 17.5 14.7Z"
      fill="#FFFFFF"
    />
  </Svg>
);

const EmailLogo = ({ size = 32 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="12" fill="#3B82F6" />
    <Path
      d="M6 8C6 7.45 6.45 7 7 7H17C17.55 7 18 7.45 18 8V16C18 16.55 17.55 17 17 17H7C6.45 17 6 16.55 6 16V8Z"
      fill="#2563EB"
    />
    <Path
      d="M6.5 8.5L12 12.5L17.5 8.5"
      stroke="#FFFFFF"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M6 8C6 7.45 6.45 7 7 7H17C17.55 7 18 7.45 18 8V16C18 16.55 17.55 17 17 17H7C6.45 17 6 16.55 6 16V8Z"
      stroke="#FFFFFF"
      strokeWidth="1.2"
    />
  </Svg>
);

const PushLogo = ({ size = 32 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="12" fill="#FF6600" />
    <Path
      d="M12 6.5C9.5 6.5 7.5 8.5 7.5 11V14.5L6.5 15.5V16.5H17.5V15.5L16.5 14.5V11C16.5 8.5 14.5 6.5 12 6.5Z"
      fill="#FFFFFF"
    />
    <Path
      d="M10.5 17.5C10.5 18.33 11.17 19 12 19C12.83 19 13.5 18.33 13.5 17.5"
      stroke="#FFFFFF"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
  </Svg>
);

// -------------------------------------------------------------
// Country Code Selection (Nigeria & Africa prioritized)
// -------------------------------------------------------------
interface CountryOption {
  code: string;
  name: string;
  flag: string;
  iso: string;
}

const COUNTRIES: CountryOption[] = [
  { code: '+234', name: 'Nigeria', flag: '🇳🇬', iso: 'NG' },
  { code: '+1', name: 'United States', flag: '🇺🇸', iso: 'US' },
  { code: '+44', name: 'United Kingdom', flag: '🇬🇧', iso: 'GB' },
  { code: '+254', name: 'Kenya', flag: '🇰🇪', iso: 'KE' },
  { code: '+27', name: 'South Africa', flag: '🇿🇦', iso: 'ZA' },
  { code: '+233', name: 'Ghana', flag: '🇬🇭', iso: 'GH' },
  { code: '+1', name: 'Canada', flag: '🇨🇦', iso: 'CA' },
  { code: '+49', name: 'Germany', flag: '🇩🇪', iso: 'DE' },
  { code: '+33', name: 'France', flag: '🇫🇷', iso: 'FR' },
  { code: '+971', name: 'UAE', flag: '🇦🇪', iso: 'AE' },
  { code: '+250', name: 'Rwanda', flag: '🇷🇼', iso: 'RW' },
  { code: '+256', name: 'Uganda', flag: '🇺🇬', iso: 'UG' },
  { code: '+20', name: 'Egypt', flag: '🇪🇬', iso: 'EG' },
  { code: '+91', name: 'India', flag: '🇮🇳', iso: 'IN' },
];

export default function ConnectionsScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();

  // Active BottomSheet State: null | 'telegram' | 'whatsapp' | 'email' | 'push'
  const [activeSheet, setActiveSheet] = useState<
    'telegram' | 'whatsapp' | 'email' | 'push' | null
  >(null);

  // Disconnect Confirmation State
  const [confirmDisconnect, setConfirmDisconnect] = useState<{
    visible: boolean;
    channel: 'telegram' | 'whatsapp' | null;
  }>({
    visible: false,
    channel: null,
  });

  // 1. Telegram State
  const [tgConnected, setTgConnected] = useState(false);
  const [tgLoading, setTgLoading] = useState(false);

  // 2. WhatsApp State
  const [waStatus, setWaStatus] = useState<WhatsAppStatus>({
    isConnected: false,
    isVerified: false,
    status: 'disconnected',
  });
  const [selectedCountry, setSelectedCountry] = useState<CountryOption>(COUNTRIES[0]);
  const [isCountryPickerOpen, setIsCountryPickerOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [waLocalNumber, setWaLocalNumber] = useState(
    user?.phone ? user.phone.replace(/^\+\d{1,3}/, '') : ''
  );
  const [waCode, setWaCode] = useState('');
  const [waStep, setWaStep] = useState<'idle' | 'code_sent' | 'verified'>('idle');
  const [waLoading, setWaLoading] = useState(false);
  const [maxDailyAlerts, setMaxDailyAlerts] = useState(5);

  // 3. Email State
  const [emailConnected, setEmailConnected] = useState(true);
  const [targetEmail, setTargetEmail] = useState(user?.email || '');
  const [emailFrequency, setEmailFrequency] = useState<'realtime' | 'daily' | 'weekly'>('daily');
  const [emailMinScore, setEmailMinScore] = useState(85);

  // 4. Device Push State
  const [pushEnabled, setPushEnabled] = useState(true);
  const [pushSound, setPushSound] = useState(true);
  const [pushThreshold, setPushThreshold] = useState<'all' | 'high' | 'critical'>('high');

  // Unified Feedback Toast / Notice
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    whatsappService.getStatus().then((st) => {
      setWaStatus(st);
      if (st.isVerified && st.isConnected) {
        setWaStep('verified');
      }
    });
  }, []);

  // Filtered countries for country selector
  const filteredCountries = useMemo(() => {
    if (!countrySearch.trim()) return COUNTRIES;
    const q = countrySearch.toLowerCase().trim();
    return COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.includes(q)
    );
  }, [countrySearch]);

  // Combined WhatsApp phone number
  const fullWaPhone = useMemo(() => {
    const cleanLocal = waLocalNumber.replace(/^0+/, '').trim();
    return `${selectedCountry.code}${cleanLocal}`;
  }, [selectedCountry, waLocalNumber]);

  // Active Channels Count
  const activeCount = useMemo(() => {
    let count = 0;
    if (tgConnected) count++;
    if (waStatus.isConnected && waStatus.status === 'active') count++;
    if (emailConnected) count++;
    if (pushEnabled) count++;
    return count;
  }, [tgConnected, waStatus, emailConnected, pushEnabled]);

  // -------------------------------------------------------------
  // Channel Action Handlers
  // -------------------------------------------------------------
  const handleConnectTelegram = async () => {
    setTgLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const res = await connectionService.getTelegramLinkToken();
      setTgConnected(true);
      setFeedback('Telegram linking token generated. Launching Telegram...');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Linking.openURL(res.botDeepLink).catch(() => {
        setFeedback(`Open Telegram manually: ${res.botDeepLink}`);
      });
      setActiveSheet(null);
    } catch {
      setFeedback('Could not generate Telegram link.');
    } finally {
      setTgLoading(false);
    }
  };

  const handleDisconnectTelegram = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await connectionService.disconnectTelegram();
    setTgConnected(false);
    setConfirmDisconnect({ visible: false, channel: null });
    setActiveSheet(null);
    setFeedback('Telegram bot disconnected.');
  };

  const handleSendWaCode = async () => {
    if (!waLocalNumber.trim()) return;
    setWaLoading(true);
    setFeedback(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const res = await whatsappService.linkPhone(fullWaPhone);
      setWaStep('code_sent');
      if (res?.verificationCode) {
        setFeedback(`Verification code generated for ${fullWaPhone}. Enter code: ${res.verificationCode}`);
      } else {
        setFeedback(`Verification code dispatched to ${fullWaPhone} via WhatsApp.`);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      setFeedback(err.message || 'Failed to dispatch WhatsApp code.');
    } finally {
      setWaLoading(false);
    }
  };

  const handleVerifyWaCode = async () => {
    if (!waCode.trim()) return;
    setWaLoading(true);
    setFeedback(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const res = await whatsappService.verifyCode(waCode);
      if (res.isVerified) {
        setWaStatus({
          isConnected: true,
          isVerified: true,
          status: 'active',
          phoneNumber: fullWaPhone,
        });
        setWaStep('verified');
        setFeedback('WhatsApp Agent activated successfully!');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err: any) {
      setFeedback(err.message || 'Invalid verification code.');
    } finally {
      setWaLoading(false);
    }
  };

  const handleToggleWaPause = async () => {
    const nextStatus = waStatus.status === 'active' ? 'paused' : 'active';
    await whatsappService.updatePreferences({ maxDailyNotifications: maxDailyAlerts });
    setWaStatus({ ...waStatus, status: nextStatus });
    setFeedback(`WhatsApp alerts ${nextStatus}.`);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleDisconnectWa = async () => {
    await whatsappService.disconnect();
    setWaStatus({ isConnected: false, isVerified: false, status: 'disconnected' });
    setWaStep('idle');
    setConfirmDisconnect({ visible: false, channel: null });
    setActiveSheet(null);
    setFeedback('WhatsApp Agent disconnected.');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  };

  const handleTestChannel = async (channel: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await connectionService.sendTestNotification(channel);
      setFeedback(`Test alert dispatched to ${channel.toUpperCase()}! Check your device.`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setFeedback(`Test alert simulated for ${channel.toUpperCase()}.`);
    }
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Top Header Bar */}
      <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA' }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft2 size={18} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Connected Channels</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
            {activeCount} of 4 channels dispatching live alerts
          </Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Pulse Metric Summary Card */}
        <View
          style={[
            styles.pulseMetricCard,
            {
              backgroundColor: isDark ? colors.card : '#FFFFFF',
              borderColor: colors.borderSubtle,
            },
          ]}
        >
          <View style={styles.pulseMetricLeft}>
            <View style={styles.beaconWrap}>
              <View style={[styles.pulseBeacon, { backgroundColor: '#10B981' }]} />
              <View style={[styles.pulseBeaconRing, { borderColor: '#10B981' }]} />
            </View>
            <View>
              <Text style={[styles.pulseTitle, { color: colors.text }]}>
                Real-Time Dispatch Engine
              </Text>
              <Text style={[styles.pulseSubtitle, { color: colors.textMuted }]}>
                Autonomous radars deliver leads directly to your social endpoints
              </Text>
            </View>
          </View>
          <Badge label={`${activeCount} Active`} variant="success" size="sm" />
        </View>

        {/* Channels List */}
        <View style={styles.channelsList}>
          {/* 1. WhatsApp Card */}
          <Card
            style={[
              styles.channelCard,
              {
                backgroundColor: isDark ? colors.card : '#FFFFFF',
                borderColor: waStatus.isConnected ? '#25D36640' : colors.borderSubtle,
              },
            ]}
          >
            <View style={styles.cardTopRow}>
              <View style={styles.channelMetaLeft}>
                <View style={styles.logoBox}>
                  <WhatsAppLogo size={36} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.titleWithBadge}>
                    <Text style={[styles.channelTitle, { color: colors.text }]}>WhatsApp Agent</Text>
                    <Badge
                      label={
                        waStatus.isConnected && waStatus.status === 'active'
                          ? 'Active'
                          : waStatus.status === 'paused'
                          ? 'Paused'
                          : 'Not Connected'
                      }
                      variant={
                        waStatus.isConnected && waStatus.status === 'active'
                          ? 'success'
                          : waStatus.status === 'paused'
                          ? 'warning'
                          : 'neutral'
                      }
                      size="sm"
                    />
                  </View>
                  <Text style={[styles.channelTagline, { color: colors.textMuted }]}>
                    Interactive two-way opportunity assistant
                  </Text>
                </View>
              </View>
            </View>

            <Text style={[styles.channelDesc, { color: colors.textSecondary }]}>
              Receive qualified briefs directly in WhatsApp. Reply to ask questions, queue proposal drafts, or schedule follow-up reminders.
            </Text>

            <View style={[styles.cardBottomRow, { borderTopColor: colors.borderSubtle }]}>
              {waStatus.isConnected ? (
                <View style={styles.connectedPhoneWrap}>
                  <TickCircle size={14} color="#25D366" variant="Bold" />
                  <Text style={[styles.connectedPhoneText, { color: colors.text }]}>
                    {waStatus.phoneNumber || fullWaPhone}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.unconnectedHint, { color: colors.textMuted }]}>
                  Supports 🇳🇬 Nigeria, 🇺🇸 US, 🇬🇧 UK & 12+ regions
                </Text>
              )}

              <View style={styles.actionsCluster}>
                {waStatus.isConnected && (
                  <TouchableOpacity
                    style={[styles.smallActionBtn, { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA' }]}
                    onPress={() => handleTestChannel('whatsapp')}
                    activeOpacity={0.7}
                  >
                    <Play size={13} color={colors.accent} variant="Bold" />
                    <Text style={[styles.smallActionBtnText, { color: colors.text }]}>Test</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[
                    styles.primaryActionBtn,
                    {
                      backgroundColor: waStatus.isConnected
                        ? isDark
                          ? colors.surfaceSecondary
                          : '#F0F4FA'
                        : '#25D366',
                    },
                  ]}
                  onPress={() => setActiveSheet('whatsapp')}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.primaryActionBtnText,
                      { color: waStatus.isConnected ? colors.text : '#FFFFFF' },
                    ]}
                  >
                    {waStatus.isConnected ? 'Manage ⚙️' : 'Connect WhatsApp →'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Card>

          {/* 2. Telegram Bot Card */}
          <Card
            style={[
              styles.channelCard,
              {
                backgroundColor: isDark ? colors.card : '#FFFFFF',
                borderColor: tgConnected ? '#24A1DE40' : colors.borderSubtle,
              },
            ]}
          >
            <View style={styles.cardTopRow}>
              <View style={styles.channelMetaLeft}>
                <View style={styles.logoBox}>
                  <TelegramLogo size={36} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.titleWithBadge}>
                    <Text style={[styles.channelTitle, { color: colors.text }]}>Telegram Bot</Text>
                    <Badge
                      label={tgConnected ? 'Active' : 'Not Connected'}
                      variant={tgConnected ? 'success' : 'neutral'}
                      size="sm"
                    />
                  </View>
                  <Text style={[styles.channelTagline, { color: colors.textMuted }]}>
                    Instant alerts with 1-click interactive action buttons
                  </Text>
                </View>
              </View>
            </View>

            <Text style={[styles.channelDesc, { color: colors.textSecondary }]}>
              Scout briefings delivered as rich cards in Telegram. Tap "Apply", "Save", or "Schedule" directly from chat buttons without opening the app.
            </Text>

            <View style={[styles.cardBottomRow, { borderTopColor: colors.borderSubtle }]}>
              {tgConnected ? (
                <View style={styles.connectedPhoneWrap}>
                  <TickCircle size={14} color="#24A1DE" variant="Bold" />
                  <Text style={[styles.connectedPhoneText, { color: colors.text }]}>
                    @ProspectAI_Leed_Bot
                  </Text>
                </View>
              ) : (
                <Text style={[styles.unconnectedHint, { color: colors.textMuted }]}>
                  Zero setup · 1-tap deep link pairing
                </Text>
              )}

              <View style={styles.actionsCluster}>
                {tgConnected && (
                  <TouchableOpacity
                    style={[styles.smallActionBtn, { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA' }]}
                    onPress={() => handleTestChannel('telegram')}
                    activeOpacity={0.7}
                  >
                    <Play size={13} color={colors.accent} variant="Bold" />
                    <Text style={[styles.smallActionBtnText, { color: colors.text }]}>Test</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[
                    styles.primaryActionBtn,
                    {
                      backgroundColor: tgConnected
                        ? isDark
                          ? colors.surfaceSecondary
                          : '#F0F4FA'
                        : '#24A1DE',
                    },
                  ]}
                  onPress={() => setActiveSheet('telegram')}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.primaryActionBtnText,
                      { color: tgConnected ? colors.text : '#FFFFFF' },
                    ]}
                  >
                    {tgConnected ? 'Configure ⚙️' : 'Connect Telegram →'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Card>

          {/* 3. Email Notifications Card */}
          <Card
            style={[
              styles.channelCard,
              {
                backgroundColor: isDark ? colors.card : '#FFFFFF',
                borderColor: emailConnected ? '#3B82F640' : colors.borderSubtle,
              },
            ]}
          >
            <View style={styles.cardTopRow}>
              <View style={styles.channelMetaLeft}>
                <View style={styles.logoBox}>
                  <EmailLogo size={36} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.titleWithBadge}>
                    <Text style={[styles.channelTitle, { color: colors.text }]}>Email Digest</Text>
                    <Badge
                      label={emailConnected ? 'Active' : 'Disabled'}
                      variant={emailConnected ? 'success' : 'neutral'}
                      size="sm"
                    />
                  </View>
                  <Text style={[styles.channelTagline, { color: colors.textMuted }]}>
                    Curated executive digests & match dossier links
                  </Text>
                </View>
              </View>
            </View>

            <Text style={[styles.channelDesc, { color: colors.textSecondary }]}>
              Comprehensive morning briefings delivered to your inbox with direct links to hiring portals, RFP documents, and application tracker.
            </Text>

            <View style={[styles.cardBottomRow, { borderTopColor: colors.borderSubtle }]}>
              <View style={styles.connectedPhoneWrap}>
                <TickCircle size={14} color="#3B82F6" variant="Bold" />
                <Text style={[styles.connectedPhoneText, { color: colors.text }]} numberOfLines={1}>
                  {targetEmail}
                </Text>
              </View>

              <View style={styles.actionsCluster}>
                <TouchableOpacity
                  style={[styles.smallActionBtn, { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA' }]}
                  onPress={() => handleTestChannel('email')}
                  activeOpacity={0.7}
                >
                  <Play size={13} color={colors.accent} variant="Bold" />
                  <Text style={[styles.smallActionBtnText, { color: colors.text }]}>Test</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.primaryActionBtn,
                    { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA' },
                  ]}
                  onPress={() => setActiveSheet('email')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.primaryActionBtnText, { color: colors.text }]}>
                    Preferences ⚙️
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Card>

          {/* 4. Device Push Alerts Card */}
          <Card
            style={[
              styles.channelCard,
              {
                backgroundColor: isDark ? colors.card : '#FFFFFF',
                borderColor: pushEnabled ? '#FF660040' : colors.borderSubtle,
              },
            ]}
          >
            <View style={styles.cardTopRow}>
              <View style={styles.channelMetaLeft}>
                <View style={styles.logoBox}>
                  <PushLogo size={36} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.titleWithBadge}>
                    <Text style={[styles.channelTitle, { color: colors.text }]}>Device Push Alerts</Text>
                    <Badge
                      label={pushEnabled ? 'Enabled' : 'Disabled'}
                      variant={pushEnabled ? 'success' : 'neutral'}
                      size="sm"
                    />
                  </View>
                  <Text style={[styles.channelTagline, { color: colors.textMuted }]}>
                    Lock-screen alerts for urgent deadlines & top matches
                  </Text>
                </View>
              </View>
            </View>

            <Text style={[styles.channelDesc, { color: colors.textSecondary }]}>
              Instant native notifications the exact second autonomous radars identify verified contracts matching 85%+ of your profile.
            </Text>

            <View style={[styles.cardBottomRow, { borderTopColor: colors.borderSubtle }]}>
              <View style={styles.connectedPhoneWrap}>
                <TickCircle size={14} color="#FF6600" variant="Bold" />
                <Text style={[styles.connectedPhoneText, { color: colors.text }]}>
                  {pushThreshold === 'all' ? 'All (70%+)' : pushThreshold === 'high' ? 'High Fit (85%+)' : 'Critical Only'}
                </Text>
              </View>

              <View style={styles.actionsCluster}>
                <TouchableOpacity
                  style={[styles.smallActionBtn, { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA' }]}
                  onPress={() => handleTestChannel('push')}
                  activeOpacity={0.7}
                >
                  <Play size={13} color={colors.accent} variant="Bold" />
                  <Text style={[styles.smallActionBtnText, { color: colors.text }]}>Test</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.primaryActionBtn,
                    { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA' },
                  ]}
                  onPress={() => setActiveSheet('push')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.primaryActionBtnText, { color: colors.text }]}>
                    Settings ⚙️
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Card>
        </View>

        {feedback ? (
          <View style={[styles.feedbackBanner, { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA', borderColor: colors.borderSubtle }]}>
            <Flash size={16} color={colors.accent} variant="Bold" />
            <Text style={[styles.feedbackText, { color: colors.text }]}>{feedback}</Text>
          </View>
        ) : null}
      </ScrollView>

      {/* ========================================================= */}
      {/* 1. WHATSAPP FLOW BOTTOMSHEET                              */}
      {/* ========================================================= */}
      <BottomSheet
        visible={activeSheet === 'whatsapp'}
        onClose={() => {
          setActiveSheet(null);
          setIsCountryPickerOpen(false);
        }}
        title="WhatsApp Personal Agent"
        subtitle="Two-step verified AI notification channel"
        icon={<WhatsAppLogo size={24} />}
      >
        <View style={styles.sheetContent}>
          {waStep === 'verified' || waStatus.isConnected ? (
            /* WhatsApp Already Connected View */
            <View style={{ gap: 16 }}>
              <View style={[styles.statusBox, { backgroundColor: isDark ? '#0F172A' : '#F0FDF4', borderColor: '#25D36640' }]}>
                <View style={styles.statusBoxRow}>
                  <View style={[styles.statusBoxDot, { backgroundColor: waStatus.status === 'active' ? '#25D366' : '#F59E0B' }]} />
                  <Text style={[styles.statusBoxPhone, { color: colors.text }]}>
                    {waStatus.phoneNumber || fullWaPhone}
                  </Text>
                  <Badge
                    label={waStatus.status === 'active' ? 'Active' : 'Paused'}
                    variant={waStatus.status === 'active' ? 'success' : 'warning'}
                    size="sm"
                  />
                </View>
                <Text style={[styles.statusBoxSub, { color: colors.textMuted }]}>
                  Quiet Hours: 22:00 – 08:00 · Operator guardrails active
                </Text>
              </View>

              {/* Preferences */}
              <View style={styles.prefGroup}>
                <Text style={[styles.prefHeading, { color: colors.textSecondary }]}>
                  Max Daily Alerts
                </Text>
                <View style={styles.pillRow}>
                  {[3, 5, 10, 20].map((num) => (
                    <TouchableOpacity
                      key={num}
                      style={[
                        styles.pillOption,
                        maxDailyAlerts === num && {
                          backgroundColor: '#25D366',
                          borderColor: '#25D366',
                        },
                        { borderColor: colors.border, backgroundColor: isDark ? colors.card : '#FFFFFF' },
                      ]}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setMaxDailyAlerts(num);
                      }}
                    >
                      <Text
                        style={[
                          styles.pillOptionText,
                          { color: maxDailyAlerts === num ? '#FFFFFF' : colors.text },
                        ]}
                      >
                        {num} / day
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.sheetActionsRow}>
                <Button
                  title={waStatus.status === 'active' ? 'Pause Alerts' : 'Resume Alerts'}
                  variant="outline"
                  size="md"
                  onPress={handleToggleWaPause}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Test Alert"
                  variant="outline"
                  size="md"
                  onPress={() => handleTestChannel('whatsapp')}
                />
                <TouchableOpacity
                  style={[styles.disconnectIconBtn, { borderColor: colors.border }]}
                  onPress={() => setConfirmDisconnect({ visible: true, channel: 'whatsapp' })}
                >
                  <Trash size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          ) : waStep === 'code_sent' ? (
            /* WhatsApp Verification Step */
            <View style={{ gap: 16 }}>
              <View style={[styles.infoBanner, { backgroundColor: isDark ? colors.card : '#F0FDF4', borderColor: '#25D36640' }]}>
                <TickCircle size={18} color="#25D366" variant="Bold" />
                <Text style={[styles.infoBannerText, { color: colors.text }]}>
                  6-digit security code dispatched to{' '}
                  <Text style={{ fontFamily: FONTS.bold }}>{fullWaPhone}</Text>
                </Text>
              </View>

              <View style={{ gap: 6 }}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  Enter WhatsApp Verification Code
                </Text>
                <TextInput
                  style={[
                    styles.pinInput,
                    {
                      backgroundColor: isDark ? colors.surfaceSecondary : '#F8FAFC',
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  value={waCode}
                  onChangeText={setWaCode}
                  placeholder="123456"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                />
              </View>

              <Button
                title={waLoading ? 'Verifying...' : 'Verify & Activate WhatsApp'}
                variant="primary"
                size="lg"
                onPress={handleVerifyWaCode}
                disabled={waLoading || waCode.length < 4}
              />

              <View style={styles.stepBackRow}>
                <TouchableOpacity onPress={() => setWaStep('idle')}>
                  <Text style={[styles.stepBackText, { color: colors.accent }]}>
                    ← Change Phone Number
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSendWaCode}>
                  <Text style={[styles.stepBackText, { color: colors.textMuted }]}>
                    Resend Code
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* WhatsApp Initial Number Input with Country Code Selector */
            <View style={{ gap: 14 }}>
              <Text style={[styles.sheetInstructions, { color: colors.textSecondary }]}>
                Select your country and enter your WhatsApp mobile number to activate instant conversational lead alerts.
              </Text>

              {/* Country Selector + Phone Input */}
              <View style={{ gap: 6 }}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  Mobile Phone Number
                </Text>

                <View style={styles.phoneInputRow}>
                  {/* Country Selector Button */}
                  <TouchableOpacity
                    style={[
                      styles.countryPickerBtn,
                      {
                        backgroundColor: isDark ? colors.surfaceSecondary : '#F8FAFC',
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setIsCountryPickerOpen(!isCountryPickerOpen);
                    }}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
                    <Text style={[styles.countryCodeText, { color: colors.text }]}>
                      {selectedCountry.code}
                    </Text>
                    <Text style={{ fontSize: 10, color: colors.textMuted }}>▾</Text>
                  </TouchableOpacity>

                  {/* Local Number Input */}
                  <TextInput
                    style={[
                      styles.localNumberInput,
                      {
                        backgroundColor: isDark ? colors.surfaceSecondary : '#F8FAFC',
                        borderColor: colors.border,
                        color: colors.text,
                      },
                    ]}
                    value={waLocalNumber}
                    onChangeText={setWaLocalNumber}
                    placeholder="801 234 5678"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              {/* Expandable Country Selection Dropdown */}
              {isCountryPickerOpen && (
                <View
                  style={[
                    styles.countryDropdown,
                    {
                      backgroundColor: isDark ? colors.card : '#FFFFFF',
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={[styles.countrySearchBox, { borderBottomColor: colors.borderSubtle }]}>
                    <SearchNormal1 size={14} color={colors.textMuted} />
                    <TextInput
                      style={[styles.countrySearchInput, { color: colors.text }]}
                      placeholder="Search country or code..."
                      placeholderTextColor={colors.textMuted}
                      value={countrySearch}
                      onChangeText={setCountrySearch}
                    />
                  </View>

                  <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled>
                    {filteredCountries.map((c) => {
                      const isSelected = selectedCountry.iso === c.iso && selectedCountry.code === c.code;
                      return (
                        <TouchableOpacity
                          key={`${c.iso}-${c.code}`}
                          style={[
                            styles.countryItem,
                            isSelected && { backgroundColor: isDark ? 'rgba(37, 211, 102, 0.15)' : '#F0FDF4' },
                          ]}
                          onPress={() => {
                            Haptics.selectionAsync();
                            setSelectedCountry(c);
                            setIsCountryPickerOpen(false);
                            setCountrySearch('');
                          }}
                        >
                          <Text style={styles.countryFlag}>{c.flag}</Text>
                          <Text style={[styles.countryName, { color: colors.text }]}>{c.name}</Text>
                          <Text style={[styles.countryCodePill, { color: colors.textMuted }]}>{c.code}</Text>
                          {isSelected && <TickCircle size={14} color="#25D366" variant="Bold" />}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {/* Benefits checklist */}
              <View style={[styles.benefitsBox, { backgroundColor: isDark ? colors.card : '#F8FAFC', borderColor: colors.borderSubtle }]}>
                <View style={styles.benefitRow}>
                  <TickCircle size={15} color="#25D366" variant="Bold" />
                  <Text style={[styles.benefitText, { color: colors.text }]}>
                    Real-time match alerts with full compensation transparency
                  </Text>
                </View>
                <View style={styles.benefitRow}>
                  <TickCircle size={15} color="#25D366" variant="Bold" />
                  <Text style={[styles.benefitText, { color: colors.text }]}>
                    Reply directly via text to trigger AI pitch generation
                  </Text>
                </View>
                <View style={styles.benefitRow}>
                  <TickCircle size={15} color="#25D366" variant="Bold" />
                  <Text style={[styles.benefitText, { color: colors.text }]}>
                    Operator monthly cap guarantees zero unexpected messaging charges
                  </Text>
                </View>
              </View>

              <Button
                title={waLoading ? 'Dispatching Code...' : `Send Code to ${fullWaPhone}`}
                variant="primary"
                size="lg"
                onPress={handleSendWaCode}
                disabled={waLoading || !waLocalNumber.trim()}
              />
            </View>
          )}
        </View>
      </BottomSheet>

      {/* ========================================================= */}
      {/* 2. TELEGRAM FLOW BOTTOMSHEET                              */}
      {/* ========================================================= */}
      <BottomSheet
        visible={activeSheet === 'telegram'}
        onClose={() => setActiveSheet(null)}
        title="Telegram Scout Bot"
        subtitle="1-tap interactive briefings & actions"
        icon={<TelegramLogo size={24} />}
      >
        <View style={styles.sheetContent}>
          {tgConnected ? (
            <View style={{ gap: 16 }}>
              <View style={[styles.statusBox, { backgroundColor: isDark ? '#0F172A' : '#F0F9FF', borderColor: '#24A1DE40' }]}>
                <View style={styles.statusBoxRow}>
                  <View style={[styles.statusBoxDot, { backgroundColor: '#24A1DE' }]} />
                  <Text style={[styles.statusBoxPhone, { color: colors.text }]}>
                    @ProspectAI_Leed_Bot
                  </Text>
                  <Badge label="Connected" variant="success" size="sm" />
                </View>
                <Text style={[styles.statusBoxSub, { color: colors.textMuted }]}>
                  Active · End-to-end encrypted bot interaction
                </Text>
              </View>

              <View style={styles.sheetActionsRow}>
                <Button
                  title="Test Alert"
                  variant="outline"
                  size="md"
                  onPress={() => handleTestChannel('telegram')}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Reconnect"
                  variant="outline"
                  size="md"
                  onPress={handleConnectTelegram}
                  disabled={tgLoading}
                />
                <TouchableOpacity
                  style={[styles.disconnectIconBtn, { borderColor: colors.border }]}
                  onPress={() => setConfirmDisconnect({ visible: true, channel: 'telegram' })}
                >
                  <Trash size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={{ gap: 16 }}>
              <Text style={[styles.sheetInstructions, { color: colors.textSecondary }]}>
                Pair your account with the official ProspectAI Telegram bot to receive live match cards with interactive action buttons.
              </Text>

              <View style={[styles.benefitsBox, { backgroundColor: isDark ? colors.card : '#F8FAFC', borderColor: colors.borderSubtle }]}>
                <View style={styles.benefitRow}>
                  <TickCircle size={15} color="#24A1DE" variant="Bold" />
                  <Text style={[styles.benefitText, { color: colors.text }]}>
                    Instant alerts with zero carrier delay or SMS fees
                  </Text>
                </View>
                <View style={styles.benefitRow}>
                  <TickCircle size={15} color="#24A1DE" variant="Bold" />
                  <Text style={[styles.benefitText, { color: colors.text }]}>
                    Tap "Apply" or "Save" buttons right from Telegram messages
                  </Text>
                </View>
                <View style={styles.benefitRow}>
                  <TickCircle size={15} color="#24A1DE" variant="Bold" />
                  <Text style={[styles.benefitText, { color: colors.text }]}>
                    Synchronizes seamlessly across phone, tablet, and desktop
                  </Text>
                </View>
              </View>

              <Button
                title={tgLoading ? 'Launching Telegram...' : 'Launch Telegram Bot →'}
                variant="primary"
                size="lg"
                onPress={handleConnectTelegram}
                disabled={tgLoading}
              />
            </View>
          )}
        </View>
      </BottomSheet>

      {/* ========================================================= */}
      {/* 3. EMAIL FLOW BOTTOMSHEET                                 */}
      {/* ========================================================= */}
      <BottomSheet
        visible={activeSheet === 'email'}
        onClose={() => setActiveSheet(null)}
        title="Email Notifications"
        subtitle="Match briefings & weekly digests"
        icon={<EmailLogo size={24} />}
      >
        <View style={styles.sheetContent}>
          <View style={{ gap: 14 }}>
            <View style={{ gap: 6 }}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                Destination Email
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: isDark ? colors.surfaceSecondary : '#F8FAFC',
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                value={targetEmail}
                onChangeText={setTargetEmail}
                placeholder="you@domain.com"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Delivery Frequency */}
            <View style={styles.prefGroup}>
              <Text style={[styles.prefHeading, { color: colors.textSecondary }]}>
                Delivery Cadence
              </Text>
              <View style={styles.pillRow}>
                {[
                  { id: 'realtime' as const, label: 'Real-Time' },
                  { id: 'daily' as const, label: 'Daily (8:30 AM)' },
                  { id: 'weekly' as const, label: 'Weekly Digest' },
                ].map((f) => (
                  <TouchableOpacity
                    key={f.id}
                    style={[
                      styles.pillOption,
                      emailFrequency === f.id && {
                        backgroundColor: '#3B82F6',
                        borderColor: '#3B82F6',
                      },
                      { borderColor: colors.border, backgroundColor: isDark ? colors.card : '#FFFFFF' },
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setEmailFrequency(f.id);
                    }}
                  >
                    <Text
                      style={[
                        styles.pillOptionText,
                        { color: emailFrequency === f.id ? '#FFFFFF' : colors.text },
                      ]}
                    >
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Minimum Match Filter */}
            <View style={styles.prefGroup}>
              <Text style={[styles.prefHeading, { color: colors.textSecondary }]}>
                Minimum Match Score: {emailMinScore}%
              </Text>
              <View style={styles.pillRow}>
                {[70, 80, 85, 90].map((score) => (
                  <TouchableOpacity
                    key={score}
                    style={[
                      styles.pillOption,
                      emailMinScore === score && {
                        backgroundColor: colors.accent,
                        borderColor: colors.accent,
                      },
                      { borderColor: colors.border, backgroundColor: isDark ? colors.card : '#FFFFFF' },
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setEmailMinScore(score);
                    }}
                  >
                    <Text
                      style={[
                        styles.pillOptionText,
                        { color: emailMinScore === score ? '#FFFFFF' : colors.text },
                      ]}
                    >
                      {score}%+
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.sheetActionsRow}>
              <Button
                title="Test Email Alert"
                variant="outline"
                size="md"
                onPress={() => handleTestChannel('email')}
                style={{ flex: 1 }}
              />
              <Button
                title="Save Preferences"
                variant="primary"
                size="md"
                onPress={() => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  setFeedback('Email delivery preferences saved.');
                  setActiveSheet(null);
                }}
                style={{ flex: 1.2 }}
              />
            </View>
          </View>
        </View>
      </BottomSheet>

      {/* ========================================================= */}
      {/* 4. DEVICE PUSH FLOW BOTTOMSHEET                           */}
      {/* ========================================================= */}
      <BottomSheet
        visible={activeSheet === 'push'}
        onClose={() => setActiveSheet(null)}
        title="Device Push Alerts"
        subtitle="Native lock-screen notification settings"
        icon={<PushLogo size={24} />}
      >
        <View style={styles.sheetContent}>
          <View style={{ gap: 16 }}>
            {/* Main Toggle */}
            <View style={[styles.toggleRow, { borderBottomColor: colors.borderSubtle }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.toggleLabel, { color: colors.text }]}>
                  Enable Push Notifications
                </Text>
                <Text style={[styles.toggleSub, { color: colors.textMuted }]}>
                  Deliver instant alerts for radar discoveries
                </Text>
              </View>
              <Switch
                value={pushEnabled}
                onValueChange={(val) => {
                  Haptics.selectionAsync();
                  setPushEnabled(val);
                }}
                trackColor={{ false: '#334155', true: colors.accent }}
              />
            </View>

            {/* Sound Toggle */}
            <View style={[styles.toggleRow, { borderBottomColor: colors.borderSubtle }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.toggleLabel, { color: colors.text }]}>
                  Sound & Haptic Feedback
                </Text>
                <Text style={[styles.toggleSub, { color: colors.textMuted }]}>
                  Play alert chime when high-match opportunities arrive
                </Text>
              </View>
              <Switch
                value={pushSound}
                onValueChange={(val) => {
                  Haptics.selectionAsync();
                  setPushSound(val);
                }}
                trackColor={{ false: '#334155', true: colors.accent }}
              />
            </View>

            {/* Match Filter */}
            <View style={styles.prefGroup}>
              <Text style={[styles.prefHeading, { color: colors.textSecondary }]}>
                Push Priority Filter
              </Text>
              <View style={styles.pillRow}>
                {[
                  { id: 'all' as const, label: 'All Leads (70%+)' },
                  { id: 'high' as const, label: 'High Match (85%+)' },
                  { id: 'critical' as const, label: 'Deadlines Only' },
                ].map((th) => (
                  <TouchableOpacity
                    key={th.id}
                    style={[
                      styles.pillOption,
                      pushThreshold === th.id && {
                        backgroundColor: colors.accent,
                        borderColor: colors.accent,
                      },
                      { borderColor: colors.border, backgroundColor: isDark ? colors.card : '#FFFFFF' },
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setPushThreshold(th.id);
                    }}
                  >
                    <Text
                      style={[
                        styles.pillOptionText,
                        { color: pushThreshold === th.id ? '#FFFFFF' : colors.text },
                      ]}
                    >
                      {th.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.sheetActionsRow}>
              <Button
                title="Test Push Alert"
                variant="outline"
                size="md"
                onPress={() => handleTestChannel('push')}
                style={{ flex: 1 }}
              />
              <Button
                title="Save Settings"
                variant="primary"
                size="md"
                onPress={() => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  setFeedback('Push notification settings updated.');
                  setActiveSheet(null);
                }}
                style={{ flex: 1.2 }}
              />
            </View>
          </View>
        </View>
      </BottomSheet>

      {/* ========================================================= */}
      {/* DISCONNECT CONFIRMATION BOTTOMSHEET                       */}
      {/* ========================================================= */}
      <ConfirmBottomSheet
        visible={confirmDisconnect.visible}
        onCancel={() => setConfirmDisconnect({ visible: false, channel: null })}
        onConfirm={() => {
          if (confirmDisconnect.channel === 'telegram') {
            handleDisconnectTelegram();
          } else if (confirmDisconnect.channel === 'whatsapp') {
            handleDisconnectWa();
          }
        }}
        title={`Disconnect ${confirmDisconnect.channel === 'telegram' ? 'Telegram' : 'WhatsApp'}?`}
        description={`You will no longer receive automated lead briefings or 1-tap actions on ${
          confirmDisconnect.channel === 'telegram' ? 'Telegram' : 'WhatsApp'
        }.`}
        confirmText="Confirm Disconnect"
        variant="destructive"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitle: {
    fontFamily: FONTS.bold,
    fontSize: 16,
  },
  headerSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 11.5,
    marginTop: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 50,
    gap: 14,
  },
  pulseMetricCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
  },
  pulseMetricLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  beaconWrap: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseBeacon: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pulseBeaconRing: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    opacity: 0.4,
  },
  pulseTitle: {
    fontFamily: FONTS.bold,
    fontSize: 13.5,
  },
  pulseSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    marginTop: 1,
  },
  channelsList: {
    gap: 12,
  },
  channelCard: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    gap: 10,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  channelMetaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  logoBox: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  channelTitle: {
    fontFamily: FONTS.bold,
    fontSize: 15,
  },
  channelTagline: {
    fontFamily: FONTS.regular,
    fontSize: 11.5,
    marginTop: 2,
  },
  channelDesc: {
    fontFamily: FONTS.regular,
    fontSize: 12.5,
    lineHeight: 18,
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  connectedPhoneWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  connectedPhoneText: {
    fontFamily: FONTS.semiBold,
    fontSize: 12.5,
  },
  unconnectedHint: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    flex: 1,
  },
  actionsCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  smallActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: BORDER_RADIUS.md,
  },
  smallActionBtnText: {
    fontFamily: FONTS.medium,
    fontSize: 11.5,
  },
  primaryActionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionBtnText: {
    fontFamily: FONTS.bold,
    fontSize: 12,
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
  },
  feedbackText: {
    fontFamily: FONTS.medium,
    fontSize: 12.5,
    flex: 1,
  },

  // BottomSheet Styles
  sheetContent: {
    paddingVertical: SPACING.xs,
    paddingBottom: 20,
    gap: 16,
  },
  sheetInstructions: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  fieldLabel: {
    fontFamily: FONTS.medium,
    fontSize: 12.5,
    marginBottom: 4,
  },
  phoneInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  countryPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  countryFlag: {
    fontSize: 18,
  },
  countryCodeText: {
    fontFamily: FONTS.bold,
    fontSize: 13.5,
  },
  localNumberInput: {
    flex: 1,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontFamily: FONTS.medium,
    fontSize: 14.5,
  },
  countryDropdown: {
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: -4,
  },
  countrySearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  countrySearchInput: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: 12.5,
    padding: 0,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  countryName: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    flex: 1,
  },
  countryCodePill: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
  },
  benefitsBox: {
    padding: 12,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    gap: 8,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  benefitText: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
  },
  statusBox: {
    padding: 14,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    gap: 4,
  },
  statusBoxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBoxDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusBoxPhone: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    flex: 1,
  },
  statusBoxSub: {
    fontFamily: FONTS.regular,
    fontSize: 11.5,
    marginTop: 2,
  },
  prefGroup: {
    gap: 8,
  },
  prefHeading: {
    fontFamily: FONTS.medium,
    fontSize: 12.5,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pillOption: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
  },
  pillOptionText: {
    fontFamily: FONTS.medium,
    fontSize: 12,
  },
  sheetActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  disconnectIconBtn: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  infoBannerText: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    flex: 1,
  },
  pinInput: {
    height: 52,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    textAlign: 'center',
    fontFamily: FONTS.bold,
    fontSize: 22,
    letterSpacing: 8,
  },
  stepBackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  stepBackText: {
    fontFamily: FONTS.medium,
    fontSize: 12.5,
  },
  textInput: {
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontFamily: FONTS.regular,
    fontSize: 14,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  toggleLabel: {
    fontFamily: FONTS.semiBold,
    fontSize: 13.5,
  },
  toggleSub: {
    fontFamily: FONTS.regular,
    fontSize: 11.5,
    marginTop: 2,
  },
});
