import React, { useState, useEffect, Suspense } from "react";
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useInRouterContext,
  BrowserRouter,
  Link,
} from "react-router-dom";
import { BRAND_CONFIG } from "@/config/brand";
import { AthloniqProvider, useAthloniqState } from "@/hooks/useAthloniqState";
import { useAuth } from "@/features/auth/AuthContext";
import { SignInView } from "@/features/auth/SignInView";
import { RouteLoadingSkeleton } from "@/components/ui/RouteLoadingSkeleton";
import { NotFoundView } from "@/features/navigation/NotFoundView";
import {
  UnsavedWorkProvider,
  useUnsavedWork,
} from "@/features/navigation/UnsavedWorkContext";
import { GuardedNavLink } from "@/features/navigation/GuardedNavLink";
import { Badge } from "@/components/ui/Badge";
import { BrandMark } from "@/components/ui/BrandMark";
import { DitherBackdrop } from "@/components/ui/DitherBackdrop";
import { checkBackendHealth } from "@/services/api";
import { usePwa } from "@/features/pwa/usePwa";
import { PwaUpdateBanner, PwaOfflineBanner } from "@/features/pwa/PwaComponents";
import {
  LayoutDashboard,
  Dumbbell,
  Utensils,
  Moon,
  TrendingUp,
  Bot,
  User,
  Activity,
  Menu,
  X,
  CheckCircle2,
  AlertTriangle,
  Info,
  Database,
  RotateCcw,
  LogOut,
  RefreshCw,
  CloudOff,
  UploadCloud,
  ShieldAlert,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// Lazy-loaded feature views (Code Splitting)
const LazyDashboardView = React.lazy(() =>
  import("@/features/dashboard/DashboardView").then((m) => ({ default: m.DashboardView }))
);
const LazyNutritionView = React.lazy(() =>
  import("@/features/nutrition/NutritionView").then((m) => ({ default: m.NutritionView }))
);
const LazyWorkoutsView = React.lazy(() =>
  import("@/features/workouts/WorkoutsView").then((m) => ({ default: m.WorkoutsView }))
);
const LazyActivitiesView = React.lazy(() =>
  import("@/features/activities/ActivitiesView").then((m) => ({ default: m.ActivitiesView }))
);
const LazyRecoveryView = React.lazy(() =>
  import("@/features/recovery/RecoveryView").then((m) => ({ default: m.RecoveryView }))
);
const LazyProgressView = React.lazy(() =>
  import("@/features/progress/ProgressView").then((m) => ({ default: m.ProgressView }))
);
const LazyCoachView = React.lazy(() =>
  import("@/features/coach/CoachView").then((m) => ({ default: m.CoachView }))
);
const LazyProfileView = React.lazy(() =>
  import("@/features/profile/ProfileView").then((m) => ({ default: m.ProfileView }))
);

const ROUTE_TITLES: Record<string, string> = {
  "/today": "Today Dashboard — AthlonIQ",
  "/nutrition": "Nutrition & Energy — AthlonIQ",
  "/workouts": "Training & Equipment — AthlonIQ",
  "/activities": "Activities & Cardio — AthlonIQ",
  "/recovery": "Recovery & Readiness — AthlonIQ",
  "/progress": "Physique Analytics — AthlonIQ",
  "/coach": "AI Performance Coach — AthlonIQ",
  "/profile": "Profile & Setup — AthlonIQ",
};

export const NAV_ITEMS = [
  { id: "today", path: "/today", label: "Today Dashboard", short: "Today", icon: LayoutDashboard },
  { id: "nutrition", path: "/nutrition", label: "Nutrition & Energy", short: "Nutrition", icon: Utensils },
  { id: "workouts", path: "/workouts", label: "Training & Equipment", short: "Training", icon: Dumbbell },
  { id: "recovery", path: "/recovery", label: "Recovery & Readiness", short: "Recovery", icon: Moon },
  { id: "progress", path: "/progress", label: "Physique Analytics", short: "Physique", icon: TrendingUp },
  { id: "coach", path: "/coach", label: "AI Performance Coach", short: "Coach", icon: Bot },
  { id: "activities", path: "/activities", label: "Activities & Cardio", short: "Cardio", icon: Activity },
  { id: "profile", path: "/profile", label: "Profile & Setup", short: "Profile", icon: User },
] as const;

export const MOBILE_DOCK_ITEMS = [
  { id: "today", path: "/today", label: "Today", icon: LayoutDashboard },
  { id: "nutrition", path: "/nutrition", label: "Nutrition", icon: Utensils },
  { id: "workouts", path: "/workouts", label: "Training", icon: Dumbbell },
  { id: "coach", path: "/coach", label: "Coach", icon: Bot },
  { id: "progress", path: "/progress", label: "Physique", icon: TrendingUp },
] as const;

const NAV_GROUPS = [
  { label: "Overview", itemIds: ["today"] },
  { label: "Training & Fuel", itemIds: ["nutrition", "workouts", "activities"] },
  { label: "Recovery & Insights", itemIds: ["recovery", "progress", "coach"] },
  { label: "Account", itemIds: ["profile"] },
] as const;

const NAV_ITEM_MAP = Object.fromEntries(
  NAV_ITEMS.map((item) => [item.id, item])
) as Record<(typeof NAV_ITEMS)[number]["id"], (typeof NAV_ITEMS)[number]>;

const AppShell: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const demoEnabled = import.meta.env.VITE_ENABLE_DEMO === "true";

  const location = useLocation();
  const { guardedNavigate } = useUnsavedWork();

  const { user, signOut, reAuthRequired, dismissReAuthPrompt, authToast, clearAuthToast } = useAuth();
  const { needRefresh, applyUpdate, dismissUpdate, isOnline, canInstall, installApp } = usePwa();

  const {
    profile,
    readiness,
    hasTodayCheckIn,
    toast,
    hideToast,
    isDemoFixtureActive,
    loadDemoFixture,
    resetDemoFixture,
    syncStatus,
    syncError,
    retrySync,
    legacyImportAvailable,
    legacyImportCounts,
    runLegacyImport,
    dismissLegacyImport,
  } = useAthloniqState();

  // Document title and heading focus management per route
  useEffect(() => {
    const currentPath = location.pathname;
    document.title = ROUTE_TITLES[currentPath] || "AthlonIQ — Personal AI Performance & Physique OS";

    // Shift focus to main page heading for screen-reader & keyboard accessibility
    requestAnimationFrame(() => {
      const heading =
        document.getElementById("page-heading") ||
        document.querySelector("main h1");
      if (heading instanceof HTMLElement) {
        if (!heading.hasAttribute("tabindex")) {
          heading.setAttribute("tabindex", "-1");
        }
        heading.focus({ preventScroll: false });
      }
    });
  }, [location.pathname]);

  // Check backend health status (graceful fallback)
  useEffect(() => {
    const verifyApi = async () => {
      const res = await checkBackendHealth();
      setApiOnline(!!res);
    };
    verifyApi();
    const interval = setInterval(verifyApi, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen text-slate-100 flex flex-col md:flex-row font-sans relative z-10 antialiased selection:bg-athloniq-lime/30 selection:text-white">
      {/* PWA Offline Persistent Banner */}
      <PwaOfflineBanner isOnline={isOnline} />

      {/* PWA Service Worker Update Prompt Banner */}
      <PwaUpdateBanner
        needRefresh={needRefresh}
        onUpdate={applyUpdate}
        onDismiss={dismissUpdate}
      />

      {/* Re-auth Expired Session Modal */}
      {reAuthRequired && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="max-w-md w-full bg-athloniq-card border border-amber-500/40 rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-amber-400 mx-auto flex items-center justify-center border border-amber-500/20">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Session Refresh Required</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Your authenticated session has expired. To maintain cryptographic security and sync with the database, please sign in again.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={dismissReAuthPrompt}
                className="flex-1 px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-white/[0.04] border border-white/[0.08]"
              >
                Dismiss
              </button>
              <button
                onClick={() => signOut()}
                className="flex-1 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-athloniq-lime hover:bg-athloniq-lime-hover transition-all shadow-glow-lime"
              >
                Sign In Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Legacy localStorage Migration Modal */}
      {legacyImportAvailable && legacyImportCounts && (
        <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="max-w-md w-full bg-athloniq-card border border-athloniq-lime/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-athloniq-lime/10 text-athloniq-lime flex items-center justify-center border border-athloniq-lime/20 shrink-0">
                <UploadCloud className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Import Offline Athlete Data</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  We detected previous local session data stored in this browser:
                </p>
                <div className="mt-2.5 grid grid-cols-3 gap-2 text-center">
                  <div className="bg-black/30 p-2 rounded-lg border border-white/[0.06]">
                    <div className="text-sm font-bold text-athloniq-emerald tabular-nums">{legacyImportCounts.food}</div>
                    <div className="text-[10px] text-slate-400">Foods</div>
                  </div>
                  <div className="bg-black/30 p-2 rounded-lg border border-white/[0.06]">
                    <div className="text-sm font-bold text-athloniq-emerald tabular-nums">{legacyImportCounts.workouts}</div>
                    <div className="text-[10px] text-slate-400">Workouts</div>
                  </div>
                  <div className="bg-black/30 p-2 rounded-lg border border-white/[0.06]">
                    <div className="text-sm font-bold text-athloniq-emerald tabular-nums">{legacyImportCounts.metrics}</div>
                    <div className="text-[10px] text-slate-400">Metrics</div>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  * Note: Pre-existing mock/demo records are automatically excluded.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/[0.06]">
              <button
                onClick={dismissLegacyImport}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-white/[0.04] border border-white/[0.08]"
              >
                Skip Import
              </button>
              <button
                onClick={() => runLegacyImport()}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-athloniq-lime hover:bg-athloniq-lime-hover transition-all flex items-center gap-1.5 shadow-glow-lime"
              >
                <UploadCloud className="h-3.5 w-3.5" />
                <span>Import to Cloud</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Toast Notification */}
      {authToast && (
        <div className="fixed top-4 right-4 left-4 md:left-auto md:max-w-md z-[9999] animate-in fade-in slide-in-from-top-3 duration-200">
          <div
            className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md ${
              authToast.type === "success"
                ? "bg-slate-900/95 border-athloniq-emerald/40 text-athloniq-emerald shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                : authToast.type === "warning"
                ? "bg-slate-900/95 border-amber-500/40 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.15)]"
                : "bg-slate-900/95 border-athloniq-lime/40 text-athloniq-lime shadow-[0_0_20px_rgba(190,242,100,0.15)]"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {authToast.type === "success" && <CheckCircle2 className="h-4 w-4 shrink-0 text-athloniq-emerald" />}
              {authToast.type === "warning" && <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />}
              {authToast.type === "info" && <Info className="h-4 w-4 shrink-0 text-athloniq-lime" />}
              <span className="text-xs font-semibold text-slate-100 truncate">{authToast.message}</span>
            </div>
            <button
              onClick={clearAuthToast}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white shrink-0"
              aria-label="Dismiss toast"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Floating System Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 left-4 md:left-auto md:max-w-md z-[9999] animate-in fade-in slide-in-from-top-3 duration-200">
          <div
            className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md ${
              toast.type === "success"
                ? "bg-slate-900/95 border-athloniq-emerald/40 text-athloniq-emerald shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                : toast.type === "warning"
                ? "bg-slate-900/95 border-amber-500/40 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.15)]"
                : "bg-slate-900/95 border-athloniq-lime/40 text-athloniq-lime shadow-[0_0_20px_rgba(190,242,100,0.15)]"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {toast.type === "success" && <CheckCircle2 className="h-4 w-4 shrink-0 text-athloniq-emerald" />}
              {toast.type === "warning" && <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />}
              {toast.type === "info" && <Info className="h-4 w-4 shrink-0 text-athloniq-lime" />}
              <span className="text-xs font-semibold text-slate-100 truncate">{toast.message}</span>
            </div>
            <button
              onClick={hideToast}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white shrink-0"
              aria-label="Dismiss notification"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Mobile Top Header */}
      <header className="md:hidden flex flex-col border-b border-white/[0.07] bg-athloniq-dark-nav/95 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <BrandMark size="sm" />
            <div className="flex flex-col">
              <span className="font-display font-bold text-white text-base tracking-[0.015em] leading-none">
                {BRAND_CONFIG.name}
              </span>
              <span className="text-[10px] text-athloniq-lime font-mono uppercase tracking-wider mt-0.5 truncate max-w-[120px]">
                {profile.fullName || user?.email || "Athlete"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Sync Status Badge */}
            {syncStatus === "syncing" && (
              <div className="px-2 py-0.5 rounded-full bg-athloniq-lime/15 border border-athloniq-lime/30 text-athloniq-lime text-[10px] font-bold flex items-center gap-1">
                <RefreshCw className="h-2.5 w-2.5 animate-spin" />
                <span>Syncing</span>
              </div>
            )}
            {syncStatus === "failed" && (
              <button
                onClick={() => retrySync()}
                className="px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-[10px] font-bold flex items-center gap-1"
              >
                <CloudOff className="h-2.5 w-2.5" />
                <span>Retry</span>
              </button>
            )}

            {/* Quick Demo Toggle (gated by VITE_ENABLE_DEMO=true) */}
            {demoEnabled && (
              <button
                onClick={() => {
                  if (isDemoFixtureActive) {
                    resetDemoFixture();
                  } else {
                    loadDemoFixture();
                  }
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1.5 ${
                  isDemoFixtureActive
                    ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
                    : "bg-athloniq-lime/10 border-athloniq-lime/30 text-athloniq-lime hover:bg-athloniq-lime/20"
                }`}
              >
                {isDemoFixtureActive ? (
                  <>
                    <RotateCcw className="h-3 w-3" />
                    <span>Reset</span>
                  </>
                ) : (
                  <>
                    <Database className="h-3 w-3" />
                    <span>14d Demo</span>
                  </>
                )}
              </button>
            )}

            {/* Install PWA Button if available */}
            {canInstall && (
              <button
                onClick={() => installApp()}
                className="px-2.5 py-1 rounded-lg text-[10px] font-bold border border-athloniq-lime/40 bg-athloniq-lime/15 text-athloniq-lime hover:bg-athloniq-lime/25 transition-all flex items-center gap-1 shadow-glow-lime"
                title="Install AthlonIQ App"
              >
                <Download className="h-3 w-3" />
                <span>Install</span>
              </button>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-athloniq-card border border-white/[0.08] text-slate-300"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* 1-Click Horizontal Quick Rail for Mobile */}
        <div className="flex items-center gap-1.5 px-3 py-2 overflow-x-auto no-scrollbar border-t border-white/[0.04] bg-athloniq-dark/60">
          {NAV_ITEMS.map((item) => (
            <GuardedNavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) =>
                `px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all border shrink-0 ${
                  isActive
                    ? "bg-athloniq-lime text-slate-950 font-bold border-athloniq-lime shadow-glow-lime"
                    : "bg-athloniq-card-alt/80 text-slate-300 border-white/[0.06] hover:text-white"
                }`
              }
            >
              {item.short}
            </GuardedNavLink>
          ))}
        </div>
      </header>

      {/* Sidebar Navigation (Desktop Sticky Rail & Mobile Drawer) */}
      <aside
        data-testid="desktop-sidebar"
        className={`${
          mobileMenuOpen ? "flex" : "hidden"
        } md:flex flex-col w-full ${
          sidebarCollapsed ? "md:w-[72px] p-3" : "md:w-60 p-4"
        } bg-athloniq-dark-nav/90 backdrop-blur-md border-r border-white/[0.07] shrink-0 z-40 fixed inset-y-0 left-0 md:sticky md:top-0 h-dvh md:h-dvh overflow-hidden transition-[width] duration-200`}
      >
        {/* Brand Header (Desktop) + Quiet Sync Status */}
        <div
          className={`flex items-center justify-between gap-2 pb-3 mb-3 border-b border-white/[0.06] shrink-0 ${
            sidebarCollapsed ? "md:flex-col md:gap-2 md:px-0" : "px-1"
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <BrandMark size="md" />
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <div className="font-display font-bold text-white text-lg tracking-[0.015em] leading-none truncate">
                  {BRAND_CONFIG.name}
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                  <span
                    className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                      syncStatus === "synced"
                        ? "bg-emerald-400"
                        : syncStatus === "syncing"
                        ? "bg-athloniq-lime animate-pulse"
                        : "bg-rose-400"
                    }`}
                    aria-hidden="true"
                  />
                  <span className="truncate">
                    {syncStatus === "synced"
                      ? "Cloud synced"
                      : syncStatus === "syncing"
                      ? "Syncing…"
                      : "Sync failed"}
                  </span>
                  {syncStatus === "failed" && (
                    <button
                      type="button"
                      onClick={() => retrySync()}
                      className="text-rose-400 hover:text-rose-300 underline underline-offset-2 font-bold shrink-0"
                      title={syncError || "Retry cloud sync"}
                    >
                      Retry
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            aria-label={sidebarCollapsed ? "Expand navigation rail" : "Collapse navigation rail"}
            aria-expanded={!sidebarCollapsed}
            className="hidden md:inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors shrink-0 tactile-press"
            title={sidebarCollapsed ? "Expand rail" : "Collapse rail"}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close navigation menu"
            className="md:hidden inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.05] shrink-0"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Compact Athlete Live Readiness Card (Desktop Expanded) */}
        {!sidebarCollapsed && (
          <div
            data-testid="sidebar-readiness-widget"
            className="hidden md:block surface-well mb-3 p-2.5 rounded-xl shrink-0"
          >
            {hasTodayCheckIn && readiness ? (
              <>
                <div className="flex items-center justify-between text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  <span>Readiness State</span>
                  <span className="text-athloniq-lime font-bold tabular-nums">
                    {readiness.readinessScore}/100
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-athloniq-lime rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(10, readiness.readinessScore))}%` }}
                    />
                  </div>
                  <Badge variant="lime" className="text-[9px] py-0 px-1.5">
                    {readiness.status.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-1">{readiness.guidance}</p>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  <span>Readiness State</span>
                  <span className="text-slate-500 font-mono text-[10px]">Not set</span>
                </div>
                <p className="text-[11px] text-slate-400">No check-in yet</p>
                <Link
                  to="/recovery"
                  className="inline-flex items-center min-h-[44px] text-xs font-semibold text-athloniq-lime hover:underline -my-2"
                >
                  Log check-in →
                </Link>
              </>
            )}
          </div>
        )}

        {/* Grouped Scrollable Navigation Links */}
        <nav aria-label="Primary navigation" className="flex-1 overflow-y-auto min-h-0 space-y-3 pr-0.5">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="space-y-1">
              {!sidebarCollapsed && (
                <div className="px-2.5 pt-1 text-[10px] font-mono font-semibold uppercase tracking-widest text-slate-500 select-none">
                  {group.label}
                </div>
              )}
              {group.itemIds.map((id) => {
                const item = NAV_ITEM_MAP[id];
                const Icon = item.icon;
                return (
                  <GuardedNavLink
                    key={item.id}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    title={sidebarCollapsed ? item.label : undefined}
                    aria-label={sidebarCollapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      `relative w-full flex items-center ${
                        sidebarCollapsed ? "justify-center px-2" : "justify-between px-3"
                      } min-h-[44px] py-2 rounded-xl text-xs transition-all select-none tactile-press ${
                        isActive
                          ? "surface-elevated text-white font-semibold"
                          : "text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent font-medium"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <span
                            className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-athloniq-lime"
                            aria-hidden="true"
                          />
                        )}
                        <div className={`flex items-center ${sidebarCollapsed ? "" : "gap-2.5 min-w-0"}`}>
                          <Icon
                            className={`h-4 w-4 shrink-0 ${
                              isActive ? "text-athloniq-lime" : "text-slate-400"
                            }`}
                            aria-hidden="true"
                          />
                          {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                        </div>

                        {item.id === "profile" && !profile.onboardingCompleted && (
                          <span
                            className={`h-2 w-2 rounded-full bg-amber-400 shrink-0 ${
                              sidebarCollapsed ? "absolute top-2.5 right-2.5" : ""
                            }`}
                            title="Onboarding incomplete"
                            aria-label="Onboarding incomplete"
                          />
                        )}
                      </>
                    )}
                  </GuardedNavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Pinned Footer: Optional PWA/Demo + Coach Status + Compact Athlete Row */}
        <div className="shrink-0 pt-2.5 mt-2 border-t border-white/[0.06] space-y-2">
          {canInstall && !sidebarCollapsed && (
            <button
              onClick={() => installApp()}
              className="w-full min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between border border-athloniq-lime/40 bg-athloniq-lime/10 text-athloniq-lime hover:bg-athloniq-lime/20 cursor-pointer tactile-press"
            >
              <span className="flex items-center gap-2">
                <Download className="h-3.5 w-3.5 text-athloniq-lime" aria-hidden="true" />
                <span>Install App</span>
              </span>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-athloniq-lime/20 text-athloniq-lime">
                PWA
              </span>
            </button>
          )}

          {demoEnabled && !sidebarCollapsed && (
            <button
              onClick={() => {
                if (isDemoFixtureActive) {
                  resetDemoFixture();
                } else {
                  loadDemoFixture();
                }
              }}
              className={`w-full min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between border tactile-press ${
                isDemoFixtureActive
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20"
                  : "bg-white/[0.03] border-white/[0.08] text-slate-300 hover:border-athloniq-lime/40 hover:text-athloniq-lime"
              }`}
            >
              <span className="flex items-center gap-2">
                {isDemoFixtureActive ? (
                  <RotateCcw className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
                ) : (
                  <Database className="h-3.5 w-3.5 text-athloniq-lime" aria-hidden="true" />
                )}
                <span>{isDemoFixtureActive ? "Reset Demo" : "Load 14d Demo"}</span>
              </span>
            </button>
          )}

          {!sidebarCollapsed && (
            <div className="flex items-center justify-between px-1.5 py-1 text-[11px] font-mono text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <span
                  className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                    apiOnline ? "bg-emerald-400" : "bg-amber-400"
                  }`}
                  aria-hidden="true"
                />
                <span>Coach {apiOnline ? "ONLINE" : "STANDBY"}</span>
              </span>
              <span className="text-[10px] text-slate-500">
                {syncStatus === "synced" ? "Synced" : syncStatus === "syncing" ? "Syncing" : "Offline"}
              </span>
            </div>
          )}

          <div
            className={`flex items-center ${
              sidebarCollapsed ? "flex-col gap-1.5" : "justify-between gap-2 px-1"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="h-8 w-8 rounded-lg surface-elevated flex items-center justify-center text-[11px] font-mono font-bold text-athloniq-lime shrink-0"
                aria-hidden="true"
              >
                {(profile.fullName || user?.email || "AQ").trim().slice(0, 2).toUpperCase()}
              </div>
              {!sidebarCollapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-white truncate">
                    {profile.fullName || "Athlete"}
                  </span>
                  <span className="text-[10px] text-slate-500 truncate font-mono">
                    {user?.email || "Authenticated"}
                  </span>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => signOut()}
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0 tactile-press"
              title="Sign out of AthlonIQ"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 max-w-[1280px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-5 lg:py-6 pb-28 md:pb-10">
        {/* Prominent Demo Mode Banner */}
        {demoEnabled && isDemoFixtureActive && (
          <div className="mb-6 px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-amber-300 animate-in fade-in">
            <div className="flex items-center gap-2.5 min-w-0">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
              <div className="text-xs">
                <span className="font-bold">DEMO FIXTURE ACTIVE:</span>{" "}
                <span className="text-amber-200/90">
                  In-memory 14-day sample preview. All cloud writes are safely blocked.
                </span>
              </div>
            </div>
            <button
              onClick={resetDemoFixture}
              className="px-3 py-1 rounded-lg text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 shrink-0 transition-colors"
            >
              Reset to My State
            </button>
          </div>
        )}

        {/* Route Definitions with Suspense Fallback */}
        <Suspense fallback={<RouteLoadingSkeleton />}>
          <Routes>
            <Route path="/" element={<Navigate to="/today" replace />} />
            <Route path="/signin" element={<Navigate to="/today" replace />} />
            <Route
              path="/today"
              element={
                <LazyDashboardView
                  onNavigate={(tab) =>
                    guardedNavigate(`/${tab === "dashboard" ? "today" : tab}`)
                  }
                />
              }
            />
            <Route path="/nutrition" element={<LazyNutritionView />} />
            <Route path="/workouts" element={<LazyWorkoutsView />} />
            <Route path="/activities" element={<LazyActivitiesView />} />
            <Route path="/recovery" element={<LazyRecoveryView />} />
            <Route path="/progress" element={<LazyProgressView />} />
            <Route path="/coach" element={<LazyCoachView />} />
            <Route path="/profile" element={<LazyProfileView />} />
            <Route path="*" element={<NotFoundView />} />
          </Routes>
        </Suspense>
      </main>

      {/* Mobile Bottom Navigation Bar for thumb ergonomics */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-athloniq-dark-nav/95 border-t border-white/[0.08] px-2 py-1.5 safe-area-bottom flex items-center justify-around z-50 backdrop-blur-lg">
        {MOBILE_DOCK_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <GuardedNavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 py-1.5 px-3 rounded-xl min-h-[44px] transition-all relative select-none ${
                  isActive ? "text-athloniq-lime font-bold" : "text-slate-400 hover:text-slate-200"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`h-4 w-4 ${isActive ? "text-athloniq-lime scale-110" : ""}`} />
                  <span className="text-[10px] tracking-tight">{item.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 w-6 h-0.5 bg-athloniq-lime rounded-full shadow-glow-lime" />
                  )}
                </>
              )}
            </GuardedNavLink>
          );
        })}
      </nav>
    </div>
  );
};

// Safe helper to check if AthloniqState is available from outer tree
const EnsureAthloniqProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  let hasProvider = false;
  try {
    if (useAthloniqState()) {
      hasProvider = true;
    }
  } catch {
    hasProvider = false;
  }

  if (hasProvider) {
    return <>{children}</>;
  }

  return <AthloniqProvider>{children}</AthloniqProvider>;
};

// Safe helper to check if Router context exists (e.g. tests using MemoryRouter)
const EnsureRouter: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const inRouter = useInRouterContext();
  if (inRouter) {
    return <>{children}</>;
  }
  return <BrowserRouter>{children}</BrowserRouter>;
};

export const App: React.FC = () => {
  const { session, loading } = useAuth();
  const backdropMode = session && !loading ? "ambient" : "hero";

  return (
    <>
      <DitherBackdrop mode={backdropMode} />
      {loading ? (
        <div className="min-h-screen text-slate-100 flex flex-col items-center justify-center p-6 relative z-10">
          <div className="flex flex-col items-center space-y-4 animate-in fade-in duration-300">
            <BrandMark size="lg" />
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400 tracking-wider">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-athloniq-lime" />
              <span>INITIALIZING ATHLONIQ OS...</span>
            </div>
          </div>
        </div>
      ) : !session ? (
        <SignInView />
      ) : (
        <EnsureAthloniqProvider>
          <EnsureRouter>
            <UnsavedWorkProvider>
              <AppShell />
            </UnsavedWorkProvider>
          </EnsureRouter>
        </EnsureAthloniqProvider>
      )}
    </>
  );
};

export default App;
