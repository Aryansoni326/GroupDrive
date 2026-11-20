/**
 * GROUPDRIVE Automotive Design System Tokens
 * Reusable cross-platform design tokens for the Mobile Application
 */

export const colors = {
  // Automotive Luxury Palette
  obsidian: "#090D16",
  midnight: "#0F172A",
  charcoal: "#1E293B",
  slate: "#334155",
  steel: "#475569",
  titanium: "#64748B",
  silver: "#94A3B8",
  mist: "#E2E8F0",
  pearl: "#F1F5F9",
  background: "#F8FAFC",
  surface: "#FFFFFF",

  // Brand Kinetic Accents
  velocity: "#2563EB",
  velocityDark: "#1D4ED8",
  velocityLight: "#EFF6FF",

  // Performance & Trust Signals
  emerald: "#059669",
  emeraldDark: "#047857",
  emeraldLight: "#ECFDF5",
  amber: "#D97706",
  amberLight: "#FFFBEB",
  rose: "#E11D48",
  roseLight: "#FFF1F2",

  // UI Semantics
  border: "#E2E8F0",
  textPrimary: "#0F172A",
  textSecondary: "#475569",
  textMuted: "#64748B",
  textInverse: "#FFFFFF",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  section: 32,
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  xxl: 24,
  full: 9999,
};

export const typography = {
  xs: { fontSize: 11, lineHeight: 14 },
  sm: { fontSize: 13, lineHeight: 18 },
  base: { fontSize: 15, lineHeight: 22 },
  lg: { fontSize: 17, lineHeight: 24 },
  xl: { fontSize: 20, lineHeight: 26 },
  h2: { fontSize: 24, lineHeight: 30 },
  h1: { fontSize: 28, lineHeight: 34 },
  fontBold: "700" as const,
  fontSemiBold: "600" as const,
  fontMedium: "500" as const,
  fontRegular: "400" as const,
};

export const shadows = {
  subtle: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  card: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  elevated: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
};

