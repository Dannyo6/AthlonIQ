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
} from "lucide-react";

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavigationItemId | "activities">("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  const { profile } = useAthloniqState();

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
    { id: "dashboard", label: "Today Dashboard", icon: LayoutDashboard },
    { id: "nutrition", label: "Nutrition & Energy", icon: Utensils },
    { id: "workouts", label: "Training & Equipment", icon: Dumbbell },
    { id: "recovery", label: "Recovery & Readiness", icon: Moon },
    { id: "progress", label: "Physique Analytics", icon: TrendingUp },
    { id: "coach", label: "AI Performance Coach", icon: Bot },
    { id: "activities", label: "Activities & Cardio", icon: Activity },
    { id: "profile", label: "Profile & Setup", icon: User },
  ] as const;

  return (
    <div className="min-h-screen bg-[#090A0F] text-slate-100 flex flex-col md:flex-row font-sans">
      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between p-4 border-b border-[#1E2330] bg-[#0C0E15]/90 backdrop-blur sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-athloniq-lime flex items-center justify-center text-slate-950 font-black text-xs shadow-glow-lime">
            AQ
          </div>
          <span className="font-extrabold text-white text-base tracking-tight">
            {BRAND_CONFIG.name}
          </span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl bg-[#12151E] border border-[#1E2330] text-slate-300"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Sidebar Navigation (Desktop & Mobile Drawer) */}
      <aside
        className={`${
          mobileMenuOpen ? "block" : "hidden"
        } md:flex flex-col w-full md:w-64 bg-[#0C0E15] border-r border-[#1E2330] p-5 shrink-0 z-40 fixed md:sticky top-0 md:h-screen`}
      >
        {/* Brand Header */}
        <div className="hidden md:flex items-center gap-3 mb-8 px-1">
          <div className="h-9 w-9 rounded-xl bg-athloniq-lime flex items-center justify-center text-slate-950 font-black text-sm shadow-glow-lime">
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
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-athloniq-lime/15 text-athloniq-lime border border-athloniq-lime/30 shadow-glow-lime"
                    : "text-slate-400 hover:text-white hover:bg-[#12151E]"
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

        {/* System Status Card */}
        <div className="pt-4 border-t border-[#1E2330] space-y-3">
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

          <div className="rounded-xl bg-[#12151E] p-3 border border-[#1E2330] text-[11px] text-slate-400">
            <div className="text-slate-200 font-bold mb-0.5 flex items-center gap-1.5">
              <span>Deterministic OS Core</span>
              <Sparkles className="h-3 w-3 text-athloniq-lime" />
            </div>
            <div>Phase 1 Validated • Dark Graphite & Electric Lime</div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
        {activeTab === "dashboard" && <DashboardView onNavigate={(t) => setActiveTab(t as any)} />}
        {activeTab === "workouts" && <WorkoutsView />}
        {activeTab === "nutrition" && <NutritionView />}
        {activeTab === "recovery" && <RecoveryView />}
        {activeTab === "progress" && <ProgressView />}
        {activeTab === "coach" && <CoachView />}
        {activeTab === "activities" && <ActivitiesView />}
        {activeTab === "profile" && <ProfileView />}
      </main>

      {/* Mobile Bottom Navigation Bar for quick access */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0C0E15]/95 border-t border-[#1E2330] p-2 flex items-center justify-around z-50 backdrop-blur">
        {[
          { id: "dashboard", label: "Today", icon: LayoutDashboard },
          { id: "nutrition", label: "Nutrition", icon: Utensils },
          { id: "workouts", label: "Training", icon: Dumbbell },
          { id: "recovery", label: "Recovery", icon: Moon },
          { id: "profile", label: "Profile", icon: User },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg text-[10px] font-semibold transition-colors ${
                isActive ? "text-athloniq-lime" : "text-slate-400"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
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
