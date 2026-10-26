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
  Radio,
  Sparkles,
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

const AppShell: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

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
    <div className="min-h-screen bg-[#090A0F] text-slate-100 flex flex-col md:flex-row font-sans relative antialiased selection:bg-athloniq-lime/30 selection:text-white">
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
          <div className="max-w-md w-full bg-[#12151E] border border-amber-500/40 rounded-2xl p-6 shadow-2xl text-center space-y-4">
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
                className="flex-1 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-athloniq-lime hover:bg-[#a3e635] transition-all shadow-glow-lime"
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
          <div className="max-w-md w-full bg-[#12151E] border border-cyan-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20 shrink-0">
                <UploadCloud className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Import Offline Athlete Data</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  We detected previous local session data stored in this browser:
                </p>
                <div className="mt-2.5 grid grid-cols-3 gap-2 text-center">
                  <div className="bg-black/30 p-2 rounded-lg border border-white/[0.06]">
                    <div className="text-sm font-bold text-cyan-400 tabular-nums">{legacyImportCounts.food}</div>
                    <div className="text-[10px] text-slate-400">Foods</div>
                  </div>
                  <div className="bg-black/30 p-2 rounded-lg border border-white/[0.06]">
                    <div className="text-sm font-bold text-cyan-400 tabular-nums">{legacyImportCounts.workouts}</div>
                    <div className="text-[10px] text-slate-400">Workouts</div>
                  </div>
                  <div className="bg-black/30 p-2 rounded-lg border border-white/[0.06]">
                    <div className="text-sm font-bold text-cyan-400 tabular-nums">{legacyImportCounts.metrics}</div>
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
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
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
                ? "bg-slate-900/95 border-athloniq-lime/40 text-athloniq-lime shadow-[0_0_20px_rgba(190,242,100,0.15)]"
                : authToast.type === "warning"
                ? "bg-slate-900/95 border-amber-500/40 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.15)]"
                : "bg-slate-900/95 border-cyan-500/40 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.15)]"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {authToast.type === "success" && <CheckCircle2 className="h-4 w-4 shrink-0 text-athloniq-lime" />}
              {authToast.type === "warning" && <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />}
              {authToast.type === "info" && <Info className="h-4 w-4 shrink-0 text-cyan-400" />}
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
                ? "bg-slate-900/95 border-athloniq-lime/40 text-athloniq-lime shadow-[0_0_20px_rgba(190,242,100,0.15)]"
                : toast.type === "warning"
                ? "bg-slate-900/95 border-amber-500/40 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.15)]"
                : "bg-slate-900/95 border-cyan-500/40 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.15)]"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {toast.type === "success" && <CheckCircle2 className="h-4 w-4 shrink-0 text-athloniq-lime" />}
              {toast.type === "warning" && <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />}
              {toast.type === "info" && <Info className="h-4 w-4 shrink-0 text-cyan-400" />}
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
      <header className="md:hidden flex flex-col border-b border-white/[0.07] bg-[#0C0E15]/95 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-athloniq-lime flex items-center justify-center text-slate-950 font-black text-xs shadow-glow-lime">
              AQ
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-white text-sm tracking-tight leading-none">
                {BRAND_CONFIG.name}
              </span>
              <span className="text-[9px] text-athloniq-lime font-mono uppercase tracking-wider mt-0.5 truncate max-w-[120px]">
                {profile.fullName || user?.email || "Athlete"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Sync Status Badge */}
            {syncStatus === "syncing" && (
              <div className="px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-[10px] font-bold flex items-center gap-1">
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

            {/* Quick Demo Toggle */}
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
              className="p-2 rounded-xl bg-[#12151E] border border-white/[0.08] text-slate-300"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* 1-Click Horizontal Quick Rail for Mobile */}
        <div className="flex items-center gap-1.5 px-3 py-2 overflow-x-auto no-scrollbar border-t border-white/[0.04] bg-[#090A0F]/60">
          {NAV_ITEMS.map((item) => (
            <GuardedNavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) =>
                `px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all border shrink-0 ${
                  isActive
                    ? "bg-athloniq-lime text-slate-950 font-bold border-athloniq-lime shadow-glow-lime"
                    : "bg-[#141824]/80 text-slate-300 border-white/[0.06] hover:text-white"
                }`
              }
            >
              {item.short}
            </GuardedNavLink>
          ))}
        </div>
      </header>

      {/* Sidebar Navigation (Desktop & Mobile Drawer) */}
      <aside
        className={`${
          mobileMenuOpen ? "block" : "hidden"
        } md:flex flex-col w-full md:w-64 bg-[#0C0E15] border-r border-white/[0.07] p-5 shrink-0 z-40 fixed md:sticky top-0 md:h-screen overflow-y-auto`}
      >
        {/* Brand Header */}
        <div className="hidden md:flex items-center gap-3 mb-6 px-1">
          <div className="h-9 w-9 rounded-xl bg-athloniq-lime flex items-center justify-center text-slate-950 font-black text-sm shadow-glow-lime shadow-[inset_0_1px_0_0_rgba(255,255,255,0.30)]">
            AQ
          </div>
          <div>
            <div className="font-black text-white text-lg tracking-tight leading-none">
              {BRAND_CONFIG.name}
            </div>
            <div className="text-[10px] text-athloniq-lime font-mono uppercase tracking-wider mt-1">
              {BRAND_CONFIG.releasePhase}
            </div>
          </div>
        </div>

        {/* Sync Status Banner */}
        <div className="mb-4 px-3 py-2 rounded-xl bg-[#12151E] border border-white/[0.07] flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center gap-2">
            {syncStatus === "synced" && <CheckCircle2 className="h-3.5 w-3.5 text-athloniq-lime" />}
            {syncStatus === "syncing" && <RefreshCw className="h-3.5 w-3.5 text-cyan-400 animate-spin" />}
            {syncStatus === "failed" && <CloudOff className="h-3.5 w-3.5 text-rose-400" />}
            <span className="text-[11px] font-medium">
              {syncStatus === "synced" ? "Cloud Synced (RLS)" : syncStatus === "syncing" ? "Syncing..." : "Sync Failed"}
            </span>
          </span>
          {syncStatus === "failed" && (
            <div className="flex items-center gap-1.5">
              {syncError && (
                <span className="text-[10px] text-rose-400/80 truncate max-w-[80px]" title={syncError}>
                  {syncError}
                </span>
              )}
              <button
                onClick={() => retrySync()}
                className="text-[10px] font-bold text-rose-400 hover:text-rose-300 underline underline-offset-2 shrink-0"
              >
                Retry
              </button>
            </div>
          )}
        </div>

        {/* Athlete Live Readiness Card (Desktop) */}
        <div
          data-testid="sidebar-readiness-widget"
          className="hidden md:block mb-6 p-3 rounded-xl bg-[#12151E] border border-white/[0.07] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
        >
          {hasTodayCheckIn && readiness ? (
            <>
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                <span>Readiness State</span>
                <span className="text-athloniq-lime font-bold tabular-nums">{readiness.readinessScore}/100</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
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
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                <span>Readiness State</span>
                <span className="text-slate-500 font-mono text-[11px]">Not set</span>
              </div>
              <p className="text-[11px] text-slate-400 mb-2">No check-in yet</p>
              <Link
                to="/recovery"
                className="inline-flex items-center text-xs font-semibold text-athloniq-lime hover:underline"
              >
                Log check-in →
              </Link>
            </>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <GuardedNavLink
                key={item.id}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all select-none ${
                    isActive
                      ? "bg-athloniq-lime/15 text-athloniq-lime border border-athloniq-lime/30 shadow-glow-lime shadow-[inset_0_1px_0_0_rgba(190,242,100,0.15)] font-bold"
                      : "text-slate-400 hover:text-white hover:bg-[#141824]/60 border border-transparent"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon className={`h-4 w-4 ${isActive ? "text-athloniq-lime" : "text-slate-400"}`} />
                      <span>{item.label}</span>
                    </div>

                    {item.id === "profile" && !profile.onboardingCompleted && (
                      <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                    )}
                  </>
                )}
              </GuardedNavLink>
            );
          })}
        </nav>

        {/* PWA Install Button (Desktop) */}
        {canInstall && (
          <div className="pt-3 pb-1 border-t border-white/[0.06]">
            <button
              onClick={() => installApp()}
              className="w-full px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between border border-athloniq-lime/40 bg-athloniq-lime/10 text-athloniq-lime hover:bg-athloniq-lime/20 shadow-glow-lime cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Download className="h-3.5 w-3.5 text-athloniq-lime" />
                <span>Install AthlonIQ</span>
              </div>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-athloniq-lime/20 text-athloniq-lime">
                PWA
              </span>
            </button>
          </div>
        )}

        {/* 14-Day Demo Fixture Fast Switcher (Desktop) */}
        <div className="pt-3 pb-1 border-t border-white/[0.06]">
          <button
            onClick={() => {
              if (isDemoFixtureActive) {
                resetDemoFixture();
              } else {
                loadDemoFixture();
              }
            }}
            className={`w-full px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between border ${
              isDemoFixtureActive
                ? "bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20"
                : "bg-white/[0.03] border-white/[0.08] text-slate-300 hover:border-athloniq-lime/40 hover:text-athloniq-lime"
            }`}
          >
            <div className="flex items-center gap-2">
              {isDemoFixtureActive ? (
                <RotateCcw className="h-3.5 w-3.5 text-amber-400" />
              ) : (
                <Database className="h-3.5 w-3.5 text-athloniq-lime" />
              )}
              <span>{isDemoFixtureActive ? "Reset to My State" : "Load 14d Demo Fixture"}</span>
            </div>
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isDemoFixtureActive ? "bg-amber-400 animate-pulse" : "bg-slate-600"
              }`}
            />
          </button>
        </div>

        {/* Intelligence Engine Status */}
        <div className="pt-3 border-t border-white/[0.06] space-y-1.5">
          <div className="flex items-center justify-between text-xs px-1">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium">
              <Radio
                className={`h-3 w-3 ${
                  apiOnline ? "text-emerald-400 animate-pulse" : "text-amber-400"
                }`}
              />
              Intelligence Engine
            </span>
            <Badge variant={apiOnline ? "emerald" : "amber"}>
              {apiOnline ? "ONLINE" : "STANDBY"}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 px-1 font-mono">
            <Sparkles className="h-3 w-3 text-athloniq-lime" />
            <span>Deterministic OS Core Active</span>
          </div>
        </div>

        {/* Authenticated User & Sign Out */}
        <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between px-1">
          <div className="flex flex-col min-w-0 pr-2">
            <span className="text-[11px] font-bold text-white truncate">
              {profile.fullName || "Athlete"}
            </span>
            <span className="text-[10px] text-slate-500 truncate font-mono">
              {user?.email || "Authenticated"}
            </span>
          </div>
          <button
            onClick={() => signOut()}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Sign out of AthlonIQ"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full overflow-y-auto pb-28 md:pb-10">
        {/* Prominent Demo Mode Banner */}
        {isDemoFixtureActive && (
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0C0E15]/95 border-t border-white/[0.08] px-2 py-1.5 flex items-center justify-around z-50 backdrop-blur-lg">
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

  // Loading state while verifying Supabase session
  if (loading) {
    return (
      <div className="min-h-screen bg-[#090A0F] text-slate-100 flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center space-y-4 animate-in fade-in duration-300">
          <div className="h-14 w-14 rounded-2xl bg-[#12151E] border border-athloniq-lime/30 flex items-center justify-center text-athloniq-lime font-black text-xl shadow-glow-lime">
            AQ
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 tracking-wider">
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-athloniq-lime" />
            <span>INITIALIZING ATHLONIQ OS...</span>
          </div>
        </div>
      </div>
    );
  }

  // Gate the entire application behind an active authenticated session
  if (!session) {
    return <SignInView />;
  }

  return (
    <EnsureAthloniqProvider>
      <EnsureRouter>
        <UnsavedWorkProvider>
          <AppShell />
        </UnsavedWorkProvider>
      </EnsureRouter>
    </EnsureAthloniqProvider>
  );
};

export default App;
