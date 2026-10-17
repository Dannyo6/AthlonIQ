import React, { useState, useEffect } from "react";
import { BRAND_CONFIG, NavigationItemId } from "@/config/brand";
import { DashboardView } from "@/features/dashboard/DashboardView";
import { WorkoutsView } from "@/features/workouts/WorkoutsView";
import { NutritionView } from "@/features/nutrition/NutritionView";
import { RecoveryView } from "@/features/recovery/RecoveryView";
import { ProgressView } from "@/features/progress/ProgressView";
import { CoachView } from "@/features/coach/CoachView";
import { ProfileView } from "@/features/profile/ProfileView";
import { ActivitiesView } from "@/features/activities/ActivitiesView";
import { Badge } from "@/components/ui/Badge";
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
} from "lucide-react";

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavigationItemId | "activities">("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  // Check backend health status (graceful fallback)
  useEffect(() => {
    const checkApi = async () => {
      try {
        const res = await fetch("http://localhost:8000/health", { method: "GET" });
        if (res.ok) {
          setApiOnline(true);
        } else {
          setApiOnline(false);
        }
      } catch {
        setApiOnline(false);
      }
    };
    checkApi();
  }, []);

  const navItems = [
    { id: "dashboard", label: "Command Center", icon: LayoutDashboard },
    { id: "workouts", label: "Workouts & Strain", icon: Dumbbell },
    { id: "nutrition", label: "Nutrition & Macros", icon: Utensils },
    { id: "recovery", label: "Recovery & HRV", icon: Moon },
    { id: "progress", label: "Physique Analytics", icon: TrendingUp },
    { id: "coach", label: "AI Coach", icon: Bot },
    { id: "activities", label: "Activities & Cardio", icon: Activity },
    { id: "profile", label: "Athlete Profile", icon: User },
  ] as const;

  return (
    <div className="min-h-screen bg-athloniq-dark text-slate-100 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-athloniq-cyan to-athloniq-emerald flex items-center justify-center text-slate-950 font-black text-xs">
            AQ
          </div>
          <span className="font-bold text-white text-base tracking-tight">
            {BRAND_CONFIG.name}
          </span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Sidebar Navigation */}
      <aside
        className={`${
          mobileMenuOpen ? "block" : "hidden"
        } md:flex flex-col w-full md:w-64 bg-slate-950/70 border-r border-slate-800/80 p-5 shrink-0 z-40 fixed md:sticky top-0 md:h-screen backdrop-blur-xl`}
      >
        {/* Brand Header */}
        <div className="hidden md:flex items-center gap-3 mb-8 px-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-athloniq-cyan via-teal-400 to-athloniq-emerald flex items-center justify-center text-slate-950 font-extrabold text-sm shadow-glow">
            AQ
          </div>
          <div>
            <div className="font-extrabold text-white text-lg tracking-tight leading-none">
              {BRAND_CONFIG.name}
            </div>
            <div className="text-[10px] text-athloniq-cyan font-mono uppercase tracking-wider mt-1">
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
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? "bg-athloniq-cyan/15 text-athloniq-cyan font-semibold border border-athloniq-cyan/30 shadow-glow"
                    : "text-slate-400 hover:text-white hover:bg-slate-900/60"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-athloniq-cyan" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* System & Telemetry Status Card */}
        <div className="pt-4 border-t border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between text-xs px-2">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Radio
                className={`h-3 w-3 ${
                  apiOnline ? "text-athloniq-emerald animate-pulse" : "text-amber-500"
                }`}
              />
              Engine API
            </span>
            <Badge variant={apiOnline ? "emerald" : "amber"}>
              {apiOnline ? "ONLINE" : "STANDBY"}
            </Badge>
          </div>
          <div className="rounded-xl bg-slate-900/60 p-3 border border-slate-800/80 text-[11px] text-slate-400">
            <div className="text-slate-300 font-semibold mb-0.5">Project AthlonIQ</div>
            <div>Phase 0 Scaffolding Active</div>
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
    </div>
  );
};
