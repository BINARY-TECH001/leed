export const LIGHT_COLORS = {
  primary: "#14213D",       // Deep Executive Navy
  secondary: "#0077B6",     // Ocean Blue
  accent: "#FF6600",        // Vibrant Brand Orange
  background: "#F7F8FA",    // Clean Off-White Canvas
  card: "#FFFFFF",          // Pure White Surface
  surface: "#FFFFFF",
  surfaceSecondary: "#F1F3F7",
  text: "#14213D",          // High-contrast Navy Text
  textMuted: "#6B7280",     // Neutral Slate Muted
  textSecondary: "#4B5563",
  border: "#E5E7EB",        // Neutral Divider Line
  borderSubtle: "#F0F2F5",
  success: "#10B981",       // Escrow Verified Green
  warning: "#F59E0B",       // Action Amber
  error: "#EF4444",         // Crimson Danger
  white: "#FFFFFF",
  black: "#000000",
  transparent: "transparent",
  overlay: "rgba(20, 33, 61, 0.5)",
  shadow: "rgba(0, 0, 0, 0.05)",
};

export const DARK_COLORS = {
  primary: "#FFFFFF",
  secondary: "#00B4D8",     // Bright Blue Accent
  accent: "#FF6600",        // Vibrant Brand Orange
  background: "#0F172A",    // Deep Navy Slate Canvas
  card: "#1E293B",          // Surface Card Slate
  surface: "#1E293B",
  surfaceSecondary: "#334155",
  text: "#F1F5F9",          // Light Foreground Text
  textMuted: "#94A3B8",     // Slate Secondary Muted
  textSecondary: "#CBD5E1",
  border: "#334155",        // Dark Divider Border
  borderSubtle: "#1E293B",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  white: "#FFFFFF",
  black: "#000000",
  transparent: "transparent",
  overlay: "rgba(0, 0, 0, 0.7)",
  shadow: "rgba(0, 0, 0, 0.3)",
};

export type ThemeColors = typeof LIGHT_COLORS;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const BORDER_RADIUS = {
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,       // Standard Card and Container Radius
  xl: 16,
  xxl: 24,
  full: 9999,   // Pill Radius
};

export const FONTS = {
  regular: "Outfit_400Regular",
  medium: "Outfit_500Medium",
  semibold: "Outfit_600SemiBold",
  bold: "Outfit_700Bold",
  extrabold: "Outfit_800ExtraBold",
  black: "Outfit_900Black",
};

export const SHADOWS = {
  small: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  medium: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
};
