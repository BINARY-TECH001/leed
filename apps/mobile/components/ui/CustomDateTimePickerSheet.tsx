import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { useTheme } from "@/context/ThemeContext";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { BORDER_RADIUS, FONTS, SPACING } from "@/constants/theme";
import {
  Calendar,
  Clock,
  ArrowLeft2,
  ArrowRight2,
  TickCircle,
  Flag,
} from "iconsax-react-native";
import * as Haptics from "expo-haptics";

export interface CustomDateTimePickerSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  initialObjective?: string;
  showObjective?: boolean;
  confirmText?: string;
  onConfirm: (scheduledDate: string, objective: string) => void;
}

const PRESET_OPTIONS = [
  {
    id: "tomorrow",
    label: "Tomorrow",
    subtext: "9:00 AM",
    daysAhead: 1,
    hour: 9,
    min: 0,
    ampm: "AM",
  },
  {
    id: "2days",
    label: "In 2 Days",
    subtext: "10:00 AM",
    daysAhead: 2,
    hour: 10,
    min: 0,
    ampm: "AM",
  },
  {
    id: "3days",
    label: "In 3 Days",
    subtext: "2:00 PM",
    daysAhead: 3,
    hour: 2,
    min: 0,
    ampm: "PM",
  },
  {
    id: "next_week",
    label: "In 1 Week",
    subtext: "11:00 AM",
    daysAhead: 7,
    hour: 11,
    min: 0,
    ampm: "AM",
  },
];

const OBJECTIVES = [
  "Follow-up on Application Status",
  "Send Custom Pitch / Portfolio",
  "Prepare for Technical Interview",
  "Introductory Call / Meeting",
];

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEK_DAYS = ["M", "T", "W", "T", "F", "S", "S"];

export const CustomDateTimePickerSheet: React.FC<
  CustomDateTimePickerSheetProps
> = ({
  visible,
  onClose,
  title = "Schedule Follow-Up",
  subtitle = "Set reminder cadence with AI timeline tracking",
  initialObjective,
  showObjective = true,
  confirmText = "Save Follow-Up",
  onConfirm,
}) => {
  const { colors, isDark } = useTheme();

  // Mode: 'presets' | 'custom'
  const [pickerMode, setPickerMode] = useState<"presets" | "custom">("presets");

  // Selected Preset
  const [selectedPresetId, setSelectedPresetId] = useState<string>("3days");

  // Custom Calendar state
  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState<number>(today.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d;
  });

  // Custom Time state
  const [selectedHour, setSelectedHour] = useState<number>(2);
  const [selectedMinute, setSelectedMinute] = useState<number>(0);
  const [selectedAmPm, setSelectedAmPm] = useState<"AM" | "PM">("PM");

  // Objective state
  const [objective, setObjective] = useState<string>(
    initialObjective || OBJECTIVES[0],
  );

  // Calendar matrix calculation
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
    const lastDayOfMonth = new Date(viewYear, viewMonth + 1, 0);

    let startDayOfWeek = firstDayOfMonth.getDay() - 1; // 0=Mon, 6=Sun
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const totalDays = lastDayOfMonth.getDate();
    const days: Array<{
      dayNumber: number | null;
      date: Date | null;
      isPast: boolean;
      isToday: boolean;
      isSelected: boolean;
    }> = [];

    // Leading empty slots
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({
        dayNumber: null,
        date: null,
        isPast: true,
        isToday: false,
        isSelected: false,
      });
    }

    // Days in current month
    for (let d = 1; d <= totalDays; d++) {
      const date = new Date(viewYear, viewMonth, d);
      const isPast =
        date.setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0);
      const isToday = date.toDateString() === today.toDateString();
      const isSelected = date.toDateString() === selectedDate.toDateString();

      days.push({
        dayNumber: d,
        date,
        isPast,
        isToday,
        isSelected,
      });
    }

    return days;
  }, [viewYear, viewMonth, selectedDate, today]);

  const handlePrevMonth = () => {
    Haptics.selectionAsync();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    Haptics.selectionAsync();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (day: { date: Date | null; isPast: boolean }) => {
    if (!day.date || day.isPast) return;
    Haptics.selectionAsync();
    setSelectedDate(day.date);
  };

  // Formatted date string for preview and submission
  const formattedSummary = useMemo(() => {
    if (pickerMode === "presets") {
      const p =
        PRESET_OPTIONS.find((item) => item.id === selectedPresetId) ||
        PRESET_OPTIONS[2];
      const target = new Date();
      target.setDate(target.getDate() + p.daysAhead);
      const dayName = target.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      return `${p.label} (${dayName}) at ${p.subtext}`;
    }

    const dayName = selectedDate.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    const minStr =
      selectedMinute === 0
        ? "00"
        : selectedMinute < 10
          ? `0${selectedMinute}`
          : `${selectedMinute}`;
    return `${dayName} at ${selectedHour}:${minStr} ${selectedAmPm}`;
  }, [
    pickerMode,
    selectedPresetId,
    selectedDate,
    selectedHour,
    selectedMinute,
    selectedAmPm,
  ]);

  const handleConfirm = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onConfirm(formattedSummary, objective);
    onClose();
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      icon={<Calendar size={22} color={colors.accent} variant="Bold" />}
    >
      <View style={styles.container}>
        {/* Switcher: Quick Presets vs Custom Picker */}
        <View
          style={[
            styles.modeSwitcher,
            { backgroundColor: isDark ? colors.surfaceSecondary : "#F0F4FA" },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.modeTab,
              pickerMode === "presets" && {
                backgroundColor: isDark ? colors.card : "#FFFFFF",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2,
              },
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              setPickerMode("presets");
            }}
            activeOpacity={0.8}
          >
            <Clock
              size={14}
              color={
                pickerMode === "presets" ? colors.accent : colors.textMuted
              }
              variant={pickerMode === "presets" ? "Bold" : "Linear"}
            />
            <Text
              style={[
                styles.modeTabText,
                {
                  color:
                    pickerMode === "presets" ? colors.text : colors.textMuted,
                  fontFamily:
                    pickerMode === "presets" ? FONTS.bold : FONTS.medium,
                },
              ]}
            >
              Quick Presets
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeTab,
              pickerMode === "custom" && {
                backgroundColor: isDark ? colors.card : "#FFFFFF",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2,
              },
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              setPickerMode("custom");
            }}
            activeOpacity={0.8}
          >
            <Calendar
              size={14}
              color={pickerMode === "custom" ? colors.accent : colors.textMuted}
              variant={pickerMode === "custom" ? "Bold" : "Linear"}
            />
            <Text
              style={[
                styles.modeTabText,
                {
                  color:
                    pickerMode === "custom" ? colors.text : colors.textMuted,
                  fontFamily:
                    pickerMode === "custom" ? FONTS.bold : FONTS.medium,
                },
              ]}
            >
              Custom Date & Time
            </Text>
          </TouchableOpacity>
        </View>

        {/* Mode 1: Presets Grid */}
        {pickerMode === "presets" ? (
          <View style={styles.presetsGrid}>
            {PRESET_OPTIONS.map((item) => {
              const isSelected = selectedPresetId === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.presetCard,
                    {
                      backgroundColor: isSelected
                        ? isDark
                          ? "rgba(255, 102, 0, 0.12)"
                          : "#FFF6F0"
                        : isDark
                          ? colors.card
                          : "#FFFFFF",
                      borderColor: isSelected ? colors.accent : colors.border,
                    },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedPresetId(item.id);
                  }}
                  activeOpacity={0.75}
                >
                  <View style={styles.presetTopRow}>
                    <Text
                      style={[
                        styles.presetLabel,
                        {
                          color: isSelected ? colors.accent : colors.text,
                          fontFamily: isSelected ? FONTS.bold : FONTS.semibold,
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                    {isSelected && (
                      <TickCircle
                        size={16}
                        color={colors.accent}
                        variant="Bold"
                      />
                    )}
                  </View>
                  <Text
                    style={[styles.presetSubtext, { color: colors.textMuted }]}
                  >
                    {item.subtext}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          /* Mode 2: Custom Interactive Calendar + Time */
          <View style={styles.customPickerWrap}>
            {/* Month Header Navigation */}
            <View style={styles.monthHeaderRow}>
              <TouchableOpacity
                onPress={handlePrevMonth}
                style={styles.monthArrowBtn}
              >
                <ArrowLeft2 size={16} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.monthTitleText, { color: colors.text }]}>
                {MONTH_NAMES[viewMonth]} {viewYear}
              </Text>
              <TouchableOpacity
                onPress={handleNextMonth}
                style={styles.monthArrowBtn}
              >
                <ArrowRight2 size={16} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Days of Week Row */}
            <View style={styles.weekDaysRow}>
              {WEEK_DAYS.map((w, idx) => (
                <Text
                  key={idx}
                  style={[styles.weekDayText, { color: colors.textMuted }]}
                >
                  {w}
                </Text>
              ))}
            </View>

            {/* Calendar Days Matrix */}
            <View style={styles.daysGrid}>
              {calendarDays.map((d, index) => {
                if (d.dayNumber === null) {
                  return <View key={index} style={styles.emptyDaySlot} />;
                }
                return (
                  <TouchableOpacity
                    key={index}
                    disabled={d.isPast}
                    onPress={() => handleSelectDay(d)}
                    style={[
                      styles.daySlot,
                      d.isSelected && { backgroundColor: colors.accent },
                      d.isToday &&
                        !d.isSelected && {
                          borderColor: colors.accent,
                          borderWidth: 1.5,
                        },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayNumberText,
                        {
                          color: d.isSelected
                            ? "#FFFFFF"
                            : d.isPast
                              ? colors.textMuted
                              : colors.text,
                          fontFamily:
                            d.isSelected || d.isToday
                              ? FONTS.bold
                              : FONTS.regular,
                          opacity: d.isPast ? 0.35 : 1,
                        },
                      ]}
                    >
                      {d.dayNumber}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Time Selector Controls */}
            <View
              style={[
                styles.timeSelectorBox,
                {
                  backgroundColor: isDark ? colors.card : "#FFFFFF",
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.timeLabelRow}>
                <Clock size={15} color={colors.accent} variant="Bold" />
                <Text style={[styles.timeSectionTitle, { color: colors.text }]}>
                  Select Time
                </Text>
              </View>

              <View style={styles.timeControlsRow}>
                {/* Hour Chips */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.timeChipsScroll}
                >
                  {[9, 10, 11, 12, 1, 2, 3, 4, 5, 6].map((h) => {
                    const isHourSelected = selectedHour === h;
                    return (
                      <TouchableOpacity
                        key={h}
                        style={[
                          styles.timeChip,
                          {
                            backgroundColor: isHourSelected
                              ? colors.accent
                              : isDark
                                ? colors.surfaceSecondary
                                : "#F0F4FA",
                            borderColor: isHourSelected
                              ? colors.accent
                              : colors.borderSubtle,
                          },
                        ]}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setSelectedHour(h);
                        }}
                      >
                        <Text
                          style={[
                            styles.timeChipText,
                            {
                              color: isHourSelected ? "#FFFFFF" : colors.text,
                              fontFamily: isHourSelected
                                ? FONTS.bold
                                : FONTS.medium,
                            },
                          ]}
                        >
                          {h}:00
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* AM / PM Toggle */}
                <View
                  style={[
                    styles.ampmToggle,
                    {
                      backgroundColor: isDark
                        ? colors.surfaceSecondary
                        : "#F0F4FA",
                    },
                  ]}
                >
                  {(["AM", "PM"] as const).map((period) => {
                    const isActive = selectedAmPm === period;
                    return (
                      <TouchableOpacity
                        key={period}
                        style={[
                          styles.ampmBtn,
                          isActive && { backgroundColor: colors.accent },
                        ]}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setSelectedAmPm(period);
                        }}
                      >
                        <Text
                          style={[
                            styles.ampmText,
                            {
                              color: isActive
                                ? "#FFFFFF"
                                : colors.textSecondary,
                              fontFamily: isActive ? FONTS.bold : FONTS.medium,
                            },
                          ]}
                        >
                          {period}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Objective Section */}
        {showObjective && (
          <View style={styles.objectiveSection}>
            <View style={styles.sectionTitleRow}>
              <Flag size={14} color={colors.accent} variant="Bold" />
              <Text
                style={[styles.sectionTitle, { color: colors.textSecondary }]}
              >
                Follow-Up Objective
              </Text>
            </View>

            <View style={styles.objectiveChipsWrap}>
              {OBJECTIVES.map((obj) => {
                const isSelected = objective === obj;
                return (
                  <TouchableOpacity
                    key={obj}
                    style={[
                      styles.objectiveChip,
                      {
                        backgroundColor: isSelected
                          ? isDark
                            ? "rgba(255, 102, 0, 0.12)"
                            : "#FFF6F0"
                          : isDark
                            ? colors.card
                            : "#FFFFFF",
                        borderColor: isSelected ? colors.accent : colors.border,
                      },
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setObjective(obj);
                    }}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.objectiveChipText,
                        {
                          color: isSelected ? colors.accent : colors.text,
                          fontFamily: isSelected ? FONTS.semibold : FONTS.regular,
                        },
                      ]}
                    >
                      {obj}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Live Preview Banner */}
        <View
          style={[
            styles.summaryBanner,
            {
              backgroundColor: isDark ? colors.card : "#F8FAFC",
              borderColor: colors.borderSubtle,
            },
          ]}
        >
          <Calendar size={18} color={colors.accent} variant="Bold" />
          <View style={{ flex: 1 }}>
            <Text
              style={[styles.summaryTitle, { color: colors.textSecondary }]}
            >
              Scheduled For
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {formattedSummary}
            </Text>
          </View>
        </View>

        {/* Actions Button */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.cancelBtn, { borderColor: colors.border }]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={[styles.cancelBtnText, { color: colors.textMuted }]}>
              Cancel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.confirmBtn, { backgroundColor: colors.accent }]}
            onPress={handleConfirm}
            activeOpacity={0.85}
          >
            <TickCircle size={18} color="#FFFFFF" variant="Bold" />
            <Text style={styles.confirmBtnText}>{confirmText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.xs,
    gap: 16,
  },
  modeSwitcher: {
    flexDirection: "row",
    borderRadius: BORDER_RADIUS.lg,
    padding: 3,
  },
  modeTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.md,
    gap: 6,
  },
  modeTabText: {
    fontSize: 13,
  },
  presetsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  presetCard: {
    width: "48%",
    padding: 12,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.2,
    gap: 4,
  },
  presetTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  presetLabel: {
    fontSize: 14,
  },
  presetSubtext: {
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  customPickerWrap: {
    gap: 12,
  },
  monthHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  monthArrowBtn: {
    padding: 6,
  },
  monthTitleText: {
    fontSize: 15,
    fontFamily: FONTS.bold,
  },
  weekDaysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 6,
  },
  weekDayText: {
    width: 38,
    textAlign: "center",
    fontSize: 11,
    fontFamily: FONTS.bold,
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 4,
  },
  emptyDaySlot: {
    width: 38,
    height: 38,
  },
  daySlot: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  dayNumberText: {
    fontSize: 13,
  },
  timeSelectorBox: {
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    padding: 10,
    gap: 8,
    marginTop: 4,
  },
  timeLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timeSectionTitle: {
    fontSize: 13,
    fontFamily: FONTS.semibold,
  },
  timeControlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  timeChipsScroll: {
    gap: 6,
    paddingRight: 6,
  },
  timeChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
  },
  timeChipText: {
    fontSize: 12,
  },
  ampmToggle: {
    flexDirection: "row",
    borderRadius: BORDER_RADIUS.full,
    padding: 2,
  },
  ampmBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  ampmText: {
    fontSize: 11,
  },
  objectiveSection: {
    gap: 8,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sectionTitle: {
    fontSize: 12.5,
    fontFamily: FONTS.medium,
  },
  objectiveChipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  objectiveChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  objectiveChipText: {
    fontSize: 12,
  },
  summaryBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  summaryTitle: {
    fontSize: 11,
    fontFamily: FONTS.medium,
  },
  summaryValue: {
    fontSize: 13.5,
    fontFamily: FONTS.bold,
    marginTop: 1,
  },
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
  },
  confirmBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: BORDER_RADIUS.md,
    gap: 8,
  },
  confirmBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: FONTS.bold,
  },
});
