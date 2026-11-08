import React, { useState, useMemo } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAthloniqState } from "@/hooks/useAthloniqState";
import {
  calculateBmi,
  calculateDailyNutritionTotals,
  calculateWeightTrend,
  evaluateLeanBulkCalibration,
  evaluateMultisportFatigue,
} from "@/lib/calculations";
import { AlertCircle, CheckCircle2, ChevronRight } from "lucide-react";
import { DashboardHeader } from "./components/DashboardHeader";
import { ReadinessStrip } from "./components/ReadinessStrip";
import { QuickActionsRow } from "./components/QuickActionsRow";
import { NutritionCard } from "./components/NutritionCard";
import { TodayTrainingCard } from "./components/TodayTrainingCard";
import { WeightTrendCard } from "./components/WeightTrendCard";
import { WeeklyConsistencyCard } from "./components/WeeklyConsistencyCard";
import { MoreAccordion } from "./components/MoreAccordion";

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const {
    profile,
    equipment,
    goals,
    updateGoals,
    todayCheckIn,
    hasTodayCheckIn,
    readiness,
    submitCheckIn,
    foodEntries,
    getFoodEntriesForDate,
    workoutSessions,
    activitySessions,
    bodyMetrics,
    isDemoFixtureActive,
    loadDemoFixture,
    resetDemoFixture,
  } = useAthloniqState();

  const [appliedTargetNotice, setAppliedTargetNotice] = useState<string | null>(null);

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  const todayFood = useMemo(
    () => getFoodEntriesForDate(today),
    [getFoodEntriesForDate, today, foodEntries]
  );

  const dailyNutrition = useMemo(
    () => calculateDailyNutritionTotals(todayFood),
    [todayFood]
  );

  const todayWorkouts = useMemo(
    () => workoutSessions.filter((s) => s.loggedDate === today),
    [workoutSessions, today]
  );

  const weightTrend = useMemo(() => {
    const points = bodyMetrics.map((m) => ({
      loggedDate: m.loggedDate,
      weightKg: m.weightKg,
    }));
    return calculateWeightTrend(points);
  }, [bodyMetrics]);

  const latestWeight = useMemo(() => {
    if (bodyMetrics.length === 0) return null;
    return [...bodyMetrics].sort((a, b) => b.loggedDate.localeCompare(a.loggedDate))[0];
  }, [bodyMetrics]);

  const bmi = useMemo(() => {
    return calculateBmi(
      latestWeight ? latestWeight.weightKg : profile.weightKg,
      profile.heightCm
    );
  }, [latestWeight, profile.weightKg, profile.heightCm]);

  const unconfirmedEquipmentCount = useMemo(() => {
    return equipment.filter((i) => !i.isConfirmed).length;
  }, [equipment]);

  // Phase 5: 14-Day Lean-Bulk Energy Calibrator
  const leanBulkCalibration = useMemo(() => {
    const now = new Date();
    const cutoff14d = new Date(now);
    cutoff14d.setDate(cutoff14d.getDate() - 14);

    const daysMap: Record<string, number> = {};
    foodEntries.forEach((e) => {
      const isConf =
        e.is_confirmed !== undefined ? Boolean(e.is_confirmed) : Boolean(e.isConfirmed);
      if (isConf && new Date(e.loggedDate) >= cutoff14d) {
        daysMap[e.loggedDate] = (daysMap[e.loggedDate] || 0) + e.caloriesKcal * e.quantity;
      }
    });

    const loggedNutritionDays = Object.keys(daysMap).length;
    const dayCals = Object.values(daysMap);
    const avgConfirmedIntake =
      dayCals.length > 0 ? Math.round(dayCals.reduce((a, b) => a + b, 0) / dayCals.length) : null;

    const recentWeighIns = bodyMetrics
      .filter((m) => new Date(m.loggedDate) >= cutoff14d)
      .map((m) => ({ loggedDate: m.loggedDate, weightKg: m.weightKg }))
      .sort((a, b) => a.loggedDate.localeCompare(b.loggedDate));

    const waistEntries = bodyMetrics
      .filter((m) => m.waistCm != null && new Date(m.loggedDate) >= cutoff14d)
      .sort((a, b) => a.loggedDate.localeCompare(b.loggedDate));
    const waistStart = waistEntries.length > 0 ? waistEntries[0].waistCm : null;
    const waistCurrent =
      waistEntries.length > 0 ? waistEntries[waistEntries.length - 1].waistCm : null;

    return evaluateLeanBulkCalibration(
      goals.calorieTargetKcal,
      loggedNutritionDays,
      avgConfirmedIntake,
      recentWeighIns,
      waistStart,
      waistCurrent
    );
  }, [goals.calorieTargetKcal, foodEntries, bodyMetrics]);

  // Phase 5: Multi-Sport Fatigue Advisory
  const fatigueAdvisory = useMemo(() => {
    const now = new Date();
    const cutoff7d = new Date(now);
    cutoff7d.setDate(cutoff7d.getDate() - 7);

    const gymSessions7d = workoutSessions.filter((s) => new Date(s.loggedDate) >= cutoff7d).length;
    const badmintonMinutes7d = activitySessions
      .filter((s) => s.activityType === "badminton" && new Date(s.loggedDate) >= cutoff7d)
      .reduce((sum, s) => sum + s.durationMinutes, 0);
    const runningKm7d = activitySessions
      .filter(
        (s) => s.activityType === "running" && new Date(s.loggedDate) >= cutoff7d && s.distanceKm
      )
      .reduce((sum, s) => sum + (s.distanceKm || 0), 0);

    return evaluateMultisportFatigue(
      gymSessions7d,
      badmintonMinutes7d,
      runningKm7d,
      todayCheckIn.sleepHours,
      todayCheckIn.soreness,
      todayCheckIn.fatigue
    );
  }, [workoutSessions, activitySessions, todayCheckIn]);

  const handleApplyCalibratedTarget = () => {
    if (leanBulkCalibration.new_calorie_target_kcal) {
      updateGoals({
        calorieTargetKcal: leanBulkCalibration.new_calorie_target_kcal,
        calorieProvenance: "user_confirmed",
      });
      setAppliedTargetNotice(
        `Caloric target updated to ${leanBulkCalibration.new_calorie_target_kcal} kcal/day upon athlete confirmation.`
      );
      setTimeout(() => setAppliedTargetNotice(null), 5000);
    }
  };

  return (
    <div className="space-y-4 pb-24 sm:pb-16 max-w-xl lg:max-w-none mx-auto">
      {/* Onboarding & Equipment Action Notice (if incomplete) */}
      {(!profile.onboardingCompleted || !profile.equipmentConfirmed) && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-athloniq-lime/20 via-athloniq-surface to-athloniq-card border border-athloniq-lime/50 p-4 shadow-glow-lime animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-athloniq-lime text-slate-950 shrink-0 mt-0.5">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  {!profile.onboardingCompleted ? (
                    <Badge variant="amber">
                      ONBOARDING INCOMPLETE ({profile.onboardingStep || 1}/5)
                    </Badge>
                  ) : (
                    <Badge variant="amber">
                      EQUIPMENT UNCONFIRMED ({unconfirmedEquipmentCount} ITEMS)
                    </Badge>
                  )}
                </div>
                <h2 className="text-sm font-bold text-white tracking-tight">
                  {!profile.onboardingCompleted
                    ? "Complete Onboarding to Activate Caloric & Training Engines"
                    : "Confirm Home Gym Equipment to Unlock Full Overload Protocols"}
                </h2>
              </div>
            </div>

            <Button
              variant="primary"
              size="sm"
              className="shrink-0 min-h-[44px] text-xs"
              onClick={() => onNavigate("profile")}
            >
              <span>
                {!profile.onboardingCompleted ? "Resume Onboarding" : "Confirm Equipment"}
              </span>
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Applied Target Alert */}
      {appliedTargetNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{appliedTargetNotice}</span>
        </div>
      )}

      {/* 1. Header: Date and greeting (use profile name only if set) */}
      <DashboardHeader
        fullName={profile.fullName}
        isDemoFixtureActive={isDemoFixtureActive}
        onLoadDemoFixture={loadDemoFixture}
        onResetDemoFixture={resetDemoFixture}
      />

      {/* 2. Compact readiness strip: score if check-in exists, else "No check-in yet" with link */}
      <ReadinessStrip
        hasTodayCheckIn={hasTodayCheckIn}
        readiness={readiness}
        todayCheckIn={todayCheckIn}
        onSubmitCheckIn={submitCheckIn}
      />

      {/* 3. Quick actions row (min-h-[44px]): Log meal, Start workout, Log weight, Check-in */}
      <QuickActionsRow />

      {/* Cards Grid: 1 column on mobile (390px), responsive columns on tablet/desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 4. Nutrition card */}
        <NutritionCard
          calorieTargetKcal={goals.calorieTargetKcal}
          calorieProvenance={goals.calorieProvenance}
          proteinTargetG={goals.proteinTargetG}
          proteinMinG={goals.proteinMinG}
          proteinMaxG={goals.proteinMaxG}
          proteinProvenance={goals.proteinProvenance}
          confirmedCalories={dailyNutrition.confirmedTotals.caloriesKcal}
          confirmedProtein={dailyNutrition.confirmedTotals.proteinG}
          confirmedCarbs={dailyNutrition.confirmedTotals.carbsG}
          confirmedFat={dailyNutrition.confirmedTotals.fatG}
          unconfirmedCount={dailyNutrition.unconfirmedEstimates.entryCount}
          weightKg={latestWeight ? latestWeight.weightKg : profile.weightKg}
        />

        {/* 5. Today's training */}
        <TodayTrainingCard
          equipmentConfirmed={profile.equipmentConfirmed}
          unconfirmedEquipmentCount={unconfirmedEquipmentCount}
          todayWorkouts={todayWorkouts}
          trainingDaysPerWeek={profile.trainingDaysPerWeek}
          trainingScope={profile.trainingScope}
          onNavigate={onNavigate}
        />

        {/* 6. Weight trend sparkline */}
        <WeightTrendCard
          bodyMetrics={bodyMetrics}
          weightTrend={weightTrend}
          latestWeight={latestWeight}
          onNavigate={onNavigate}
        />

        {/* 7. Weekly consistency */}
        <WeeklyConsistencyCard
          trainingDaysPerWeek={profile.trainingDaysPerWeek}
          workoutSessions={workoutSessions}
          onNavigate={onNavigate}
        />
      </div>

      {/* 8. "More" accordion */}
      <MoreAccordion
        leanBulkCalibration={leanBulkCalibration}
        fatigueAdvisory={fatigueAdvisory}
        bmi={bmi}
        latestWeight={latestWeight}
        heightCm={profile.heightCm}
        equipmentConfirmed={profile.equipmentConfirmed}
        unconfirmedEquipmentCount={unconfirmedEquipmentCount}
        trainingScope={profile.trainingScope}
        onApplyCalibratedTarget={handleApplyCalibratedTarget}
        onNavigate={onNavigate}
      />
    </div>
  );
};
