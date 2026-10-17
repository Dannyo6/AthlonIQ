/**
 * AthlonIQ Brand & Theme Design System Configuration
 * Strict Dark Graphite & Electric Lime Palette
 */

export const BRAND_CONFIG = {
  name: "AthlonIQ",
  tagline: "Personal AI Performance & Physique OS",
  shortDesc: "Autonomous cybernetic loop synthesizing training, nutrition, biometrics, and recovery.",
  version: "0.1.0",
  releasePhase: "Phase 1 (Core Identity, Onboarding & Deterministic OS)",
  theme: {
    darkBg: "#090A0F",
    cardBg: "#12151E",
    surfaceBg: "#181D2A",
    borderColor: "#1E2330",
    colors: {
      lime: "#BEF264",
      emerald: "#10B981",
      violet: "#8B5CF6",
      amber: "#F59E0B",
      rose: "#F43F5E",
    },
  },
  navItems: [
    { id: "dashboard", label: "Today Dashboard", icon: "LayoutDashboard" },
    { id: "nutrition", label: "Nutrition & Energy", icon: "Utensils" },
    { id: "workouts", label: "Training & Equipment", icon: "Dumbbell" },
    { id: "recovery", label: "Recovery & Readiness", icon: "Moon" },
    { id: "progress", label: "Physique Analytics", icon: "TrendingUp" },
    { id: "coach", label: "AI Performance Coach", icon: "Bot" },
    { id: "profile", label: "Profile & Setup", icon: "User" },
  ],
  links: {
    docs: "/docs/ARCHITECTURE.md",
    github: "https://github.com/athloniq/athloniq",
  },
} as const;

export type NavigationItemId = (typeof BRAND_CONFIG.navItems)[number]["id"];
