/**
 * AthlonIQ Brand & Theme Design System Configuration
 */

export const BRAND_CONFIG = {
  name: "AthlonIQ",
  tagline: "Personal AI Performance & Physique OS",
  shortDesc: "Autonomous cybernetic loop synthesizing training, nutrition, biometrics, and recovery.",
  version: "0.1.0",
  releasePhase: "Phase 0 (Foundation)",
  theme: {
    darkBg: "#080C14",
    cardBg: "#0F172A",
    surfaceBg: "#1E293B",
    borderColor: "#334155",
    colors: {
      cyan: "#00F0FF",
      emerald: "#10B981",
      violet: "#8B5CF6",
      amber: "#F59E0B",
      rose: "#F43F5E",
    },
  },
  navItems: [
    { id: "dashboard", label: "Command Center", icon: "LayoutDashboard" },
    { id: "workouts", label: "Workouts & Strain", icon: "Dumbbell" },
    { id: "nutrition", label: "Nutrition & Macros", icon: "Utensils" },
    { id: "recovery", label: "Recovery & HRV", icon: "Moon" },
    { id: "progress", label: "Physique Analytics", icon: "TrendingUp" },
    { id: "coach", label: "AI Performance Coach", icon: "Bot" },
    { id: "profile", label: "Athlete Profile", icon: "User" },
  ],
  links: {
    docs: "/docs/ARCHITECTURE.md",
    github: "https://github.com/athloniq/athloniq",
  },
} as const;

export type NavigationItemId = (typeof BRAND_CONFIG.navItems)[number]["id"];
