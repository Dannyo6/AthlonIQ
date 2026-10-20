import React, { useState, useEffect } from "react";
import { BRAND_CONFIG, NavigationItemId } from "@/config/brand";
import { AthloniqProvider, useAthloniqState } from "@/hooks/useAthloniqState";
import { DashboardView } from "@/features/dashboard/DashboardView";
import { WorkoutsView } from "@/features/workouts/WorkoutsView";
import { NutritionView } from "@/features/nutrition/NutritionView";
import { RecoveryView } from "@/features/recovery/RecoveryView";
import { ProgressView } from "@/features/progress/ProgressView";
import { CoachView } from "@/features/coach/CoachView";
import { ProfileView } from "@/features/profile/ProfileView";
import { ActivitiesView } from "@/features/activities/ActivitiesView";
import { Badge } from "@/components/ui/Badge";
import { checkBackendHealth } from "@/services/api";
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
} from "lucide-react";

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavigationItemId | "activities">("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  const {
    profile,
    readiness,
    toast,
    hideToast,
    isDemoFixtureActive,
    loadDemoFixture,
    resetDemoFixture,
  } = useAthloniqState();

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

  const navItems = [
    { id: "dashboard", label: "Today Dashboard", short: "Today", icon: LayoutDashboard },
    { id: "nutrition", label: "Nutrition & Energy", short: "Nutrition", icon: Utensils },
    { id: "workouts", label: "Training & Equipment", short: "Training", icon: Dumbbell },
    { id: "recovery", label: "Recovery & Readiness", short: "Recovery", icon: Moon },
    { id: "progress", label: "Physique Analytics", short: "Physique", icon: TrendingUp },
    { id: "coach", label: "AI Performance Coach", short: "Coach", icon: Bot },
    { id: "activities", label: "Activities & Cardio", short: "Cardio", icon: Activity },
    { id: "profile", label: "Profile & Setup", short: "Profile", icon: User },
  ] as const;

  return (
    <div className="min-h-screen bg-[#090A0F] text-slate-100 flex flex-col md:flex-row font-sans relative antialiased selection:bg-athloniq-lime/30 selection:text-white">
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
              <span className="text-[9px] text-athloniq-lime font-mono uppercase tracking-wider mt-0.5">
                {profile.fullName || "Athlete"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
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

            {/* Readiness pill */}
            <div className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold tabular-nums">
              {readiness.readinessScore}% Ready
            </div>

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
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all border shrink-0 ${
                  isActive
                    ? "bg-athloniq-lime text-slate-950 font-bold border-athloniq-lime shadow-glow-lime"
                    : "bg-[#141824]/80 text-slate-300 border-white/[0.06] hover:text-white"
                }`}
              >
                {item.short}
              </button>
            );
          })}
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

        {/* Athlete Live Readiness Card (Desktop) */}
        <div className="hidden md:block mb-6 p-3 rounded-xl bg-[#12151E] border border-white/[0.07] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
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
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as any);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all select-none ${
                  isActive
                    ? "bg-athloniq-lime/15 text-athloniq-lime border border-athloniq-lime/30 shadow-glow-lime shadow-[inset_0_1px_0_0_rgba(190,242,100,0.15)] font-bold"
                    : "text-slate-400 hover:text-white hover:bg-[#141824]/60 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${isActive ? "text-athloniq-lime" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </div>

                {item.id === "profile" && !profile.onboardingCompleted && (
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>

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

        {/* System Status Card */}
        <div className="pt-3 border-t border-white/[0.06] space-y-2.5">
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

          <div className="rounded-xl bg-[#12151E] p-3 border border-white/[0.07] text-[11px] text-slate-400 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
            <div className="text-slate-200 font-bold mb-0.5 flex items-center gap-1.5">
              <span>Deterministic OS Core</span>
              <Sparkles className="h-3 w-3 text-athloniq-lime" />
            </div>
            <div>Phase 1–5 QA Validated • Dark Graphite & Electric Lime</div>
          </div>
        </div>
      </aside>

      {/* Main Content Area — With full bottom clearance for mobile dock */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full overflow-y-auto pb-28 md:pb-10">
        {activeTab === "dashboard" && <DashboardView onNavigate={(t) => setActiveTab(t as any)} />}
        {activeTab === "workouts" && <WorkoutsView />}
        {activeTab === "nutrition" && <NutritionView />}
        {activeTab === "recovery" && <RecoveryView />}
        {activeTab === "progress" && <ProgressView />}
        {activeTab === "coach" && <CoachView />}
        {activeTab === "activities" && <ActivitiesView />}
        {activeTab === "profile" && <ProfileView />}
      </main>

      {/* Mobile Bottom Navigation Bar for thumb ergonomics */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0C0E15]/95 border-t border-white/[0.08] px-2 py-1.5 flex items-center justify-around z-50 backdrop-blur-lg">
        {[
          { id: "dashboard", label: "Today", icon: LayoutDashboard },
          { id: "nutrition", label: "Nutrition", icon: Utensils },
          { id: "workouts", label: "Training", icon: Dumbbell },
          { id: "coach", label: "Coach", icon: Bot },
          { id: "progress", label: "Physique", icon: TrendingUp },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`flex flex-col items-center justify-center gap-1 py-1.5 px-3 rounded-xl min-h-[44px] transition-all relative select-none ${
                isActive ? "text-athloniq-lime font-bold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-athloniq-lime scale-110" : ""}`} />
              <span className="text-[10px] tracking-tight">{item.label}</span>
              {isActive && (
                <span className="absolute bottom-0 w-6 h-0.5 bg-athloniq-lime rounded-full shadow-glow-lime" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AthloniqProvider>
      <AppContent />
    </AthloniqProvider>
  );
};
export default App;
