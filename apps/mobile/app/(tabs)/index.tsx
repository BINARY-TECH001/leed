import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { usePipeline } from "@/context/PipelineContext";
import { Badge, Card, ConfirmBottomSheet, CustomDateTimePickerSheet } from "@/components/ui";
import { OpportunityCard } from "@/components/opportunities/OpportunityCard";
import { AttentionCard } from "@/components/attention/AttentionCard";
import {
  SAMPLE_OPPORTUNITIES,
  SAMPLE_ATTENTION_ITEMS,
} from "@/constants/mockData";
import { BORDER_RADIUS, FONTS, SPACING } from "@/constants/theme";
import {
  SearchNormal1,
  NotificationBing,
  Flash,
  ArrowRight2,
  DirectSend,
  Radar,
  Briefcase,
  Bookmark,
  TickCircle,
  Calendar,
  Send,
} from "iconsax-react-native";
import * as Haptics from "expo-haptics";
import type { Opportunity } from "@prospect/types";

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
  const [quickPrompt, setQuickPrompt] = useState("");

  // Confirmation BottomSheet States (Zero Alerts!)
  const [activeApplyOpp, setActiveApplyOpp] = useState<Opportunity | null>(
    null,
  );
  const [activeScheduleOpp, setActiveScheduleOpp] =
    useState<Opportunity | null>(null);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((res) => setTimeout(res, 600));
    setRefreshing(false);
  };

  const handleToggleSave = (id: string) => {
    const opp = opportunities.find((o) => o.id === id);
    if (opp) toggleSave(opp);
  };

  const handlePromptSubmit = () => {
    if (!quickPrompt.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: "/action",
      params: { initialQuery: quickPrompt },
    } as any);
    setQuickPrompt("");
  };

  const handleConfirmApply = () => {
    if (activeApplyOpp) {
      applyToOpportunity(activeApplyOpp);
      setActiveApplyOpp(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const userName = user?.name ? user.name.split(" ")[0] : "Alex";
  const topMatches = opportunities.filter((o) => o.matchScore >= 90);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      {/* Modern Header Bar */}
      <View
        style={[styles.headerBar, { borderBottomColor: colors.borderSubtle }]}
      >
        <View style={styles.headerLeft}>
          <Text style={[styles.greeting, { color: colors.text }]}>
            Hi, {userName} 👋
          </Text>
          <View style={styles.statusLiveRow}>
            <View style={styles.greenLiveDot} />
            <Text style={[styles.statusLiveText, { color: colors.textMuted }]}>
              Radars active · 124 live streams
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {/* Notification Button */}
          <TouchableOpacity
            style={[
              styles.iconCircleBtn,
              { backgroundColor: isDark ? colors.surfaceSecondary : "#F0F4FA" },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/notifications" as any);
            }}
            activeOpacity={0.7}
          >
            <NotificationBing size={20} color={colors.text} variant="Linear" />
            <View style={[styles.badgeDot, { backgroundColor: colors.accent }]}>
              <Text style={styles.badgeDotText}>2</Text>
            </View>
          </TouchableOpacity>

          {/* User Avatar */}
          <TouchableOpacity
            style={[
              styles.avatarBtn,
              { backgroundColor: isDark ? colors.surfaceSecondary : "#F0F4FA" },
            ]}
            onPress={() => router.push("/(tabs)/profile")}
            activeOpacity={0.8}
          >
            {user?.avatarUrl ? (
              <Image
                source={{ uri: user.avatarUrl }}
                style={styles.avatarImg}
              />
            ) : (
              <Text style={[styles.avatarInitial, { color: colors.accent }]}>
                {userName.charAt(0)}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 130 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
      >
        {/* Modern Interactive Search Bar */}
        <TouchableOpacity
          style={[
            styles.searchBarContainer,
            {
              backgroundColor: isDark ? colors.card : "#FFFFFF",
              borderColor: colors.border,
            },
          ]}
          onPress={() => router.push("/action")}
          activeOpacity={0.9}
        >
          <SearchNormal1 size={18} color={colors.accent} variant="Linear" />
          <TextInput
            style={[
              styles.searchInput,
              { color: colors.text, fontFamily: FONTS.regular },
            ]}
            placeholder="Search with tailored context from your CV…"
            placeholderTextColor={colors.textMuted}
            value={quickPrompt}
            onChangeText={setQuickPrompt}
            onSubmitEditing={handlePromptSubmit}
            returnKeyType="search"
          />
          {quickPrompt.trim().length > 0 ? (
            <TouchableOpacity
              style={[
                styles.searchActionBtn,
                { backgroundColor: colors.accent },
              ]}
              onPress={handlePromptSubmit}
            >
              <DirectSend size={15} color="#FFF" variant="Bold" />
            </TouchableOpacity>
          ) : (
            <View
              style={[
                styles.contextPill,
                {
                  backgroundColor: isDark ? colors.surfaceSecondary : "#EEF2F6",
                },
              ]}
            >
              <Text
                style={[styles.contextPillText, { color: colors.textMuted }]}
              >
                AI Tailored
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Metric Quick Stats Chips Strip */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.metricsStrip}
        >
          <TouchableOpacity
            style={[
              styles.metricChip,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={() => router.push("/(tabs)/radar")}
            activeOpacity={0.7}
          >
            <Radar size={15} color={colors.accent} variant="Bold" />
            <Text
              style={[styles.metricChipLabel, { color: colors.textSecondary }]}
            >
              Radars
            </Text>
            <Text style={[styles.metricChipValue, { color: colors.text }]}>
              {stats.activeRadars}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.metricChip,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={() => router.push("/(tabs)/opportunities")}
            activeOpacity={0.7}
          >
            <Briefcase size={15} color="#3B82F6" variant="Bold" />
            <Text
              style={[styles.metricChipLabel, { color: colors.textSecondary }]}
            >
              Matches
            </Text>
            <Text style={[styles.metricChipValue, { color: colors.text }]}>
              {stats.totalMatches}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.metricChip,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={() => router.push('/saved' as any)}
            activeOpacity={0.7}
          >
            <Bookmark size={15} color="#10B981" variant="Bold" />
            <Text
              style={[styles.metricChipLabel, { color: colors.textSecondary }]}
            >
              Saved
            </Text>
            <Text style={[styles.metricChipValue, { color: colors.text }]}>
              {stats.savedCount}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.metricChip,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={() => router.push('/applied' as any)}
            activeOpacity={0.7}
          >
            <Send size={15} color="#8B5CF6" variant="Bold" />
            <Text
              style={[styles.metricChipLabel, { color: colors.textSecondary }]}
            >
              Applied
            </Text>
            <Text style={[styles.metricChipValue, { color: colors.text }]}>
              {stats.appliedCount}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Feature Hero Card */}
        <View
          style={[
            styles.heroCtaCard,
            { backgroundColor: isDark ? colors.card : "#14213D" },
          ]}
        >
          <View style={styles.heroCtaContent}>
            <View style={styles.ctaBadgeRow}>
              <Flash size={13} color="#FF6600" variant="Bold" />
              <Text style={styles.ctaBadgeText}>AUTONOMOUS RADARS ACTIVE</Text>
            </View>

            <Text style={styles.heroCtaTitle}>
              Continuous Opportunity Discovery
            </Text>
            <Text style={styles.heroCtaSub}>
              Greenhouse, Arbeitnow & OSM streams scanning every 6 hours with
              100% Free Zero-Cost Tier.
            </Text>

            <TouchableOpacity
              style={[styles.heroCtaBtn, { backgroundColor: colors.accent }]}
              onPress={() => router.push("/(tabs)/radar")}
              activeOpacity={0.85}
            >
              <Text style={styles.heroCtaBtnText}>Manage Live Radars</Text>
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
              onPress={() => router.push("/(tabs)/opportunities")}
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
              onAutoApply={(target) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveApplyOpp(target);
              }}
              onMailPitch={(target) =>
                router.push(`/composer/${target.id}` as any)
              }
              onSchedule={(target) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveScheduleOpp(target);
              }}
            />
          ))}
        </View>
      </ScrollView>

      {/* Auto-Apply Confirmation BottomSheet (Zero Alerts) */}
      <ConfirmBottomSheet
        visible={!!activeApplyOpp}
        title="Dispatch Autonomous Application?"
        description={
          activeApplyOpp
            ? `Calibrated proposal with your primary CV will be dispatched for "${activeApplyOpp.title}" at ${activeApplyOpp.organization}. Added to Pipeline.`
            : ""
        }
        confirmText="Dispatch Application"
        cancelText="Cancel"
        variant="accent"
        icon={<Flash size={36} color={colors.accent} variant="Bold" />}
        onConfirm={handleConfirmApply}
        onCancel={() => setActiveApplyOpp(null)}
      />

      {/* Schedule Follow-Up Custom Date Time Picker Sheet */}
      {activeScheduleOpp && (
        <CustomDateTimePickerSheet
          visible={!!activeScheduleOpp}
          onClose={() => setActiveScheduleOpp(null)}
          title={`Schedule for ${activeScheduleOpp.organization}`}
          subtitle={activeScheduleOpp.title}
          initialObjective="General follow-up check"
          onConfirm={(scheduledDate, objective) => {
            scheduleFollowUp(
              activeScheduleOpp.id,
              scheduledDate,
              objective
            );
            setActiveScheduleOpp(null);
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  greenLiveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#10B981",
  },
  statusLiveText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  badgeDot: {
    position: "absolute",
    top: 4,
    right: 4,
    minWidth: 15,
    height: 15,
    borderRadius: 7.5,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeDotText: {
    color: "#FFF",
    fontSize: 9,
    fontFamily: FONTS.bold,
  },
  avatarBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
  },
  avatarInitial: {
    fontSize: 15,
    fontFamily: FONTS.bold,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 130,
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    height: 48,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    marginBottom: SPACING.md,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: 13.5,
  },
  searchActionBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  contextPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.full,
  },
  contextPillText: {
    fontSize: 10.5,
    fontFamily: FONTS.medium,
  },
  metricsStrip: {
    flexDirection: "row",
    gap: 8,
    marginBottom: SPACING.md,
    paddingRight: SPACING.md,
  },
  metricChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    gap: 6,
  },
  metricChipLabel: {
    fontFamily: FONTS.medium,
    fontSize: 12,
  },
  metricChipValue: {
    fontFamily: FONTS.bold,
    fontSize: 13,
  },
  heroCtaCard: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    overflow: "hidden",
  },
  heroCtaContent: {
    width: "100%",
  },
  ctaBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  ctaBadgeText: {
    color: "#FF6600",
    fontFamily: FONTS.bold,
    fontSize: 11,
    letterSpacing: 0.6,
  },
  heroCtaTitle: {
    color: "#FFFFFF",
    fontFamily: FONTS.bold,
    fontSize: 17,
    letterSpacing: -0.3,
  },
  heroCtaSub: {
    color: "rgba(255, 255, 255, 0.75)",
    fontFamily: FONTS.regular,
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 12,
  },
  heroCtaBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.full,
  },
  heroCtaBtnText: {
    color: "#FFFFFF",
    fontFamily: FONTS.semiBold,
    fontSize: 13,
  },
  sectionBlock: {
    marginBottom: SPACING.lg,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.sm,
  },
  titleWithBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionHeading: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    letterSpacing: -0.3,
  },
  seeAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  seeAllText: {
    fontSize: 12.5,
    fontFamily: FONTS.semiBold,
  },
});
