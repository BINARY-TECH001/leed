import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { usePipeline } from '@/context/PipelineContext';
import { Badge } from '@/components/ui';
import { OpportunityCard } from '@/components/opportunities/OpportunityCard';
import { AttentionCard } from '@/components/attention/AttentionCard';
import {
  SAMPLE_OPPORTUNITIES,
  SAMPLE_ATTENTION_ITEMS,
} from '@/constants/mockData';
import { BORDER_RADIUS, FONTS, SPACING } from '@/constants/theme';
import {
  SearchNormal1,
  NotificationBing,
  Flash,
  ArrowRight2,
  DirectSend,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import type { Opportunity } from '@prospect/types';

export default function HomeScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const {
    isSaved,
    isApplied,
    toggleSave,
    applyToOpportunity,
    scheduleFollowUp,
    stats,
  } = usePipeline();

  const [opportunities, setOpportunities] = useState(SAMPLE_OPPORTUNITIES);
  const [attentionItems] = useState(SAMPLE_ATTENTION_ITEMS);
  const [refreshing, setRefreshing] = useState(false);
  const [quickPrompt, setQuickPrompt] = useState('');

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((res) => setTimeout(res, 600));
    setRefreshing(false);
  };

  const handleToggleSave = (id: string) => {
    const opp = opportunities.find((o) => o.id === id);
    if (opp) toggleSave(opp);
  };

  const handleAutoApply = (opp: Opportunity) => {
    applyToOpportunity(opp);
    Alert.alert(
      'Autonomous Application Dispatched',
      `Proposal calibrated with your active CV has been dispatched for ${opp.organization}. Added to Pipeline.`
    );
  };

  const handleMailPitch = (opp: Opportunity) => {
    router.push(`/composer/${opp.id}` as any);
  };

  const handleSchedule = (opp: Opportunity) => {
    scheduleFollowUp(opp.id, 'In 3 Days', 'General follow-up check');
    Alert.alert(
      'Follow-Up Queued',
      `Follow-up cadence for ${opp.organization} set for 3 days from now in your pipeline.`
    );
  };

  const handlePromptSubmit = () => {
    if (!quickPrompt.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/action',
      params: { initialQuery: quickPrompt },
    } as any);
    setQuickPrompt('');
  };

  const userName = user?.name ? user.name.split(' ')[0] : 'Engineer';
  const topMatches = opportunities.filter((o) => o.matchScore >= 90);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Sleek Header Bar without redundant title */}
      <View style={[styles.headerBar, { borderBottomColor: colors.borderSubtle }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.greeting, { color: colors.text }]}>
            Hi, {userName} 👋
          </Text>
          <View style={styles.statusLiveRow}>
            <View style={styles.greenLiveDot} />
            <Text style={[styles.statusLiveText, { color: colors.textMuted }]}>
              Radars active · 124 streams monitored
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {/* Notification Button with Unread Counter */}
          <TouchableOpacity
            style={[
              styles.iconCircleBtn,
              { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA' },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/notifications' as any);
            }}
            activeOpacity={0.7}
          >
            <NotificationBing size={20} color={colors.text} variant="Linear" />
            <View style={[styles.badgeDot, { backgroundColor: colors.accent }]}>
              <Text style={styles.badgeDotText}>2</Text>
            </View>
          </TouchableOpacity>

          {/* Profile Quick Avatar */}
          <TouchableOpacity
            style={[
              styles.avatarBtn,
              { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F4FA' },
            ]}
            onPress={() => router.push('/(tabs)/profile')}
            activeOpacity={0.8}
          >
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatarImg} />
            ) : (
              <Text style={[styles.avatarInitial, { color: colors.accent }]}>
                {userName.charAt(0)}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
      >
        {/* Modern Interactive Search Trigger Bar */}
        <TouchableOpacity
          style={[
            styles.searchBarContainer,
            {
              backgroundColor: isDark ? colors.card : '#FFFFFF',
              borderColor: colors.border,
            },
          ]}
          onPress={() => router.push('/action')}
          activeOpacity={0.9}
        >
          <SearchNormal1 size={18} color={colors.accent} variant="Linear" />
          <TextInput
            style={[styles.searchInput, { color: colors.text, fontFamily: FONTS.regular }]}
            placeholder="Search with tailored context from your CV…"
            placeholderTextColor={colors.textMuted}
            value={quickPrompt}
            onChangeText={setQuickPrompt}
            onSubmitEditing={handlePromptSubmit}
            returnKeyType="search"
          />
          {quickPrompt.trim().length > 0 ? (
            <TouchableOpacity
              style={[styles.searchActionBtn, { backgroundColor: colors.accent }]}
              onPress={handlePromptSubmit}
            >
              <DirectSend size={15} color="#FFF" variant="Bold" />
            </TouchableOpacity>
          ) : (
            <View style={[styles.contextPill, { backgroundColor: isDark ? colors.surfaceSecondary : '#EEF2F6' }]}>
              <Text style={[styles.contextPillText, { color: colors.textMuted }]}>AI Tailored</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Feature Hero CTA Card with Graphic */}
        <View
          style={[
            styles.heroCtaCard,
            { backgroundColor: isDark ? colors.card : '#14213D' },
          ]}
        >
          <View style={styles.heroCtaContent}>
            <View style={styles.ctaBadgeRow}>
              <Flash size={13} color="#FF6600" variant="Bold" />
              <Text style={styles.ctaBadgeText}>AUTONOMOUS PIPELINE</Text>
            </View>

            <Text style={styles.heroCtaTitle}>
              Autonomous Pipeline Active
            </Text>
            <Text style={styles.heroCtaSub}>
              124 live streams monitored · Calibrated to your target rate
            </Text>

            <TouchableOpacity
              style={[styles.heroCtaBtn, { backgroundColor: colors.accent }]}
              onPress={() => router.push('/(tabs)/radar')}
              activeOpacity={0.85}
            >
              <Text style={styles.heroCtaBtnText}>Manage Radars</Text>
              <ArrowRight2 size={14} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Attention Priority Stream */}
        {attentionItems.length > 0 && (
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.titleWithBadge}>
                <Text style={[styles.sectionHeading, { color: colors.text }]}>
                  Attention Stream
                </Text>
                <Badge
                  label={`${attentionItems.length} Needs Action`}
                  variant="warning"
                  size="sm"
                  dot
                />
              </View>
            </View>

            {attentionItems.map((item) => (
              <AttentionCard key={item.id} item={item} />
            ))}
          </View>
        )}

        {/* Highest Fit Discoveries */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionHeading, { color: colors.text }]}>
              Highest Fit Discoveries
            </Text>

            <TouchableOpacity
              onPress={() => router.push('/(tabs)/opportunities')}
              style={styles.seeAllBtn}
            >
              <Text style={[styles.seeAllText, { color: colors.accent }]}>
                See All ({opportunities.length})
              </Text>
              <ArrowRight2 size={13} color={colors.accent} />
            </TouchableOpacity>
          </View>

          {topMatches.map((opp) => (
            <OpportunityCard
              key={opp.id}
              opportunity={opp}
              isSaved={isSaved(opp.id)}
              isApplied={isApplied(opp.id)}
              onToggleSave={handleToggleSave}
              onAutoApply={handleAutoApply}
              onMailPitch={handleMailPitch}
              onSchedule={handleSchedule}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    letterSpacing: -0.4,
  },
  statusLiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  greenLiveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
  },
  statusLiveText: {
    fontSize: 11.5,
    fontFamily: FONTS.regular,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeDotText: {
    color: '#FFF',
    fontSize: 9.5,
    fontFamily: FONTS.bold,
  },
  avatarBtn: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarInitial: {
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: 130, // Clearance so content scrolls seamlessly underneath floating tab bar
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.2,
    paddingHorizontal: SPACING.md,
    gap: 10,
    marginBottom: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 13.5,
  },
  contextPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  contextPillText: {
    fontSize: 10.5,
    fontFamily: FONTS.medium,
  },
  searchActionBtn: {
    width: 30,
    height: 30,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCtaCard: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    overflow: 'hidden',
  },
  heroCtaContent: {
    width: '100%',
  },
  ctaBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  ctaBadgeText: {
    color: '#FF6600',
    fontSize: 10.5,
    fontFamily: FONTS.bold,
    letterSpacing: 0.6,
  },
  heroCtaTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontFamily: FONTS.bold,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  heroCtaSub: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 13,
    fontFamily: FONTS.regular,
    lineHeight: 18,
    marginBottom: SPACING.md,
  },
  heroCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: BORDER_RADIUS.full,
  },
  heroCtaBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: FONTS.bold,
  },
  sectionBlock: {
    marginBottom: SPACING.xl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm + 4,
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionHeading: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    letterSpacing: -0.3,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  seeAllText: {
    fontSize: 13,
    fontFamily: FONTS.semibold,
  },
});
