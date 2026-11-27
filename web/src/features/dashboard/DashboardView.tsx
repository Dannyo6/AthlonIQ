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
    preferences,
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
    return calculateWeightTrend(bodyMetrics);
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
  const { fatigueAdvisory, hasWeeklyActivity } = useMemo(() => {
    const now = new Date();
    const cutoff7d = new Date(now);
    cutoff7d.setDate(cutoff7d.getDate() - 7);

    const gymSessions7d = workoutSessions.filter((s) => new Date(s.loggedDate) >= cutoff7d).length;
    const recentActivities7d = activitySessions.filter((s) => new Date(s.loggedDate) >= cutoff7d);
    const badmintonMinutes7d = recentActivities7d
      .filter((s) => s.activityType === "badminton")
      .reduce((sum, s) => sum + s.durationMinutes, 0);
    const runningKm7d = recentActivities7d
      .filter((s) => s.activityType === "running" && s.distanceKm)
      .reduce((sum, s) => sum + (s.distanceKm || 0), 0);

    return {
      fatigueAdvisory: evaluateMultisportFatigue(
        gymSessions7d,
        badmintonMinutes7d,
        runningKm7d,
        hasTodayCheckIn && todayCheckIn ? todayCheckIn.sleepHours : null,
        hasTodayCheckIn && todayCheckIn ? todayCheckIn.soreness : null,
        hasTodayCheckIn && todayCheckIn ? todayCheckIn.fatigue : null
      ),
      hasWeeklyActivity: gymSessions7d > 0 || recentActivities7d.length > 0,
    };
  }, [workoutSessions, activitySessions, todayCheckIn, hasTodayCheckIn]);

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
    <div className="space-y-3.5 sm:space-y-4 max-w-[1280px] w-full mx-auto">
      {/* Onboarding & Equipment Action Notice (single-row bar on md+) */}
      {(!profile.onboardingCompleted || !profile.equipmentConfirmed) && (
        <div className="surface-elevated relative overflow-hidden rounded-2xl border-athloniq-lime/45 px-4 py-3 shadow-glow-lime animate-in fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-xl bg-athloniq-lime text-slate-950 shrink-0">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 min-w-0">
                {!profile.onboardingCompleted ? (
                  <Badge variant="amber">
                    ONBOARDING INCOMPLETE ({profile.onboardingStep || 1}/5)
                  </Badge>
                ) : (
                  <Badge variant="amber">
                    EQUIPMENT UNCONFIRMED ({unconfirmedEquipmentCount} ITEMS)
                  </Badge>
                )}
                <h2 className="font-display text-base font-bold text-white tracking-[0.015em] truncate">
                  {!profile.onboardingCompleted
                    ? "Finish setup to personalize calorie and training targets"
                    : "Confirm your gym equipment to unlock weight suggestions"}
                </h2>
              </div>
            </div>

            <Button
              variant="primary"
              size="sm"
              className="shrink-0 min-h-[44px] text-xs tactile-press self-start md:self-auto"
              onClick={() =>
                onNavigate(
                  !profile.onboardingCompleted
                    ? "profile?step=biometrics"
                    : "profile?step=equipment"
                )
              }
            >
              <span>
                {!profile.onboardingCompleted ? "Resume Onboarding" : "Confirm Equipment"}
              </span>
              <ChevronRight className="h-3.5 w-3.5 ml-1" aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}

      {/* Applied Target Alert */}
      {appliedTargetNotice && (
        <div
          role="status"
          aria-live="polite"
          className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in"
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" aria-hidden="true" />
          <span>{appliedTargetNotice}</span>
        </div>
      )}

      {/* 1. Compact Header + Quick Actions */}
      <div className="space-y-3">
        <DashboardHeader
          fullName={profile.fullName}
          isDemoFixtureActive={isDemoFixtureActive}
          onLoadDemoFixture={loadDemoFixture}
          onResetDemoFixture={resetDemoFixture}
        />
        <QuickActionsRow />
      </div>

      {/* 2. Row 1 Bento (5/7 Desktop Split): Readiness Hero + Horizontal Energy & Nutrition */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        <div className="lg:col-span-5 flex flex-col">
          <ReadinessStrip
            hasTodayCheckIn={hasTodayCheckIn}
            readiness={readiness}
            todayCheckIn={todayCheckIn}
            onSubmitCheckIn={submitCheckIn}
          />
        </div>

        <div className="lg:col-span-7 flex flex-col">
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
        </div>
      </div>

      {/* 3. Row 2 Bento (3 Balanced Peer Cards on xl+, 2+1 on md) */}
      <div className="stagger-enter grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-stretch">
        <div className="flex flex-col">
          <TodayTrainingCard
            equipmentConfirmed={profile.equipmentConfirmed}
            unconfirmedEquipmentCount={unconfirmedEquipmentCount}
            todayWorkouts={todayWorkouts}
            trainingDaysPerWeek={profile.trainingDaysPerWeek}
            trainingScope={profile.trainingScope}
            onNavigate={onNavigate}
          />
        </div>

        <div className="flex flex-col">
          <WeeklyConsistencyCard
            trainingDaysPerWeek={profile.trainingDaysPerWeek}
            workoutSessions={workoutSessions}
            timezone={preferences?.timezone}
            onNavigate={onNavigate}
          />
        </div>

        <div className="flex flex-col md:col-span-2 xl:col-span-1">
          <WeightTrendCard
            bodyMetrics={bodyMetrics}
            weightTrend={weightTrend}
            latestWeight={latestWeight}
            onNavigate={onNavigate}
          />
        </div>
      </div>

      {/* 4. Row 3: Training & Body Insights */}
      <MoreAccordion
        leanBulkCalibration={leanBulkCalibration}
        fatigueAdvisory={fatigueAdvisory}
        hasWeeklyActivity={hasWeeklyActivity}
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
