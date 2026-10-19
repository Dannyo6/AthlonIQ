import React, { useState, useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Badge, ProvenanceBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAthloniqState } from "@/hooks/useAthloniqState";
import {
  calculateBmi,
  calculateDailyNutritionTotals,
  calculateWeightTrend,
  evaluateLeanBulkCalibration,
  evaluateMultisportFatigue,
} from "@/lib/calculations";
import {
  Flame,
  Dumbbell,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Moon,
  Scale,
  Sliders,
  ChevronRight,
  Zap,
  ShieldAlert,
} from "lucide-react";

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
    readiness,
    submitCheckIn,
    foodEntries,
    getFoodEntriesForDate,
    workoutSessions,
    activitySessions,
    bodyMetrics,
  } = useAthloniqState();

  const [checkInOpen, setCheckInOpen] = useState(false);
  const [sleepInput, setSleepInput] = useState(todayCheckIn.sleepHours);
  const [qualityInput, setQualityInput] = useState(todayCheckIn.sleepQuality);
  const [sorenessInput, setSorenessInput] = useState(todayCheckIn.soreness);
  const [fatigueInput, setFatigueInput] = useState(todayCheckIn.fatigue);
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

  const bmi = calculateBmi(
    latestWeight ? latestWeight.weightKg : profile.weightKg,
    profile.heightCm
  );
  const unconfirmedEquipmentCount = equipment.filter((i) => !i.isConfirmed).length;

  // Phase 5: 14-Day Lean-Bulk Energy Calibrator
  const leanBulkCalibration = useMemo(() => {
    const now = new Date();
    const cutoff14d = new Date(now);
    cutoff14d.setDate(cutoff14d.getDate() - 14);

    const daysMap: Record<string, number> = {};
    foodEntries.forEach((e) => {
      const isConf = e.is_confirmed !== undefined ? Boolean(e.is_confirmed) : Boolean(e.isConfirmed);
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
    const waistCurrent = waistEntries.length > 0 ? waistEntries[waistEntries.length - 1].waistCm : null;

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
      .filter((s) => s.activityType === "running" && new Date(s.loggedDate) >= cutoff7d && s.distanceKm)
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

  const handleSaveCheckIn = () => {
    submitCheckIn({
      sleepHours: Number(sleepInput),
      sleepQuality: Number(qualityInput),
      soreness: Number(sorenessInput),
      fatigue: Number(fatigueInput),
    });
    setCheckInOpen(false);
  };

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
    <div className="space-y-6">
      {/* 1. Onboarding & Equipment Action Banner */}
      {(!profile.onboardingCompleted || !profile.equipmentConfirmed) && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-athloniq-lime/20 via-[#181D2A] to-[#12151E] border-2 border-athloniq-lime/60 p-5 shadow-glow-lime">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-athloniq-lime text-slate-950 mt-0.5 shrink-0">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-athloniq-lime bg-slate-950/60 px-2 py-0.5 rounded">
                    Action Required • Phase 1
                  </span>
                  {!profile.onboardingCompleted ? (
                    <Badge variant="amber">ONBOARDING INCOMPLETE (STEP {profile.onboardingStep}/5)</Badge>
                  ) : (
                    <Badge variant="amber">EQUIPMENT UNCONFIRMED ({unconfirmedEquipmentCount} ITEMS)</Badge>
                  )}
                </div>
                <h3 className="text-lg font-black text-white tracking-tight">
                  {!profile.onboardingCompleted
                    ? "Complete Athlete Onboarding to Calibrate Energy & Training OS"
                    : "Verify Historical Home Gym Equipment to Unlock Full Overload Protocols"}
                </h3>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  {!profile.onboardingCompleted
                    ? "Caloric targets, energy balance, and custom training volume remain gated until biometrics, baseline sleep hours, and split preferences are confirmed."
                    : "Your 5 historical home gym items (Bench, Rack, Dips, Pulldown, Free Weights) are currently unconfirmed. Confirm availability to generate load targets."}
                </p>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="shrink-0"
              onClick={() => onNavigate("profile")}
            >
              <span>{!profile.onboardingCompleted ? "Resume Onboarding" : "Confirm Equipment"}</span>
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* 2. Top Hero: Deterministic Readiness Snapshot */}
      <div className="relative overflow-hidden rounded-3xl bg-[#12151E] border border-[#1E2330] p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="lime">DETERMINISTIC READINESS ENGINE</Badge>
              <ProvenanceBadge provenance={readiness.provenance} />
            </div>

            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              Daily Readiness:{" "}
              <span className="text-gradient-lime font-mono tabular-nums">
                {readiness.readinessScore}% ({readiness.status})
              </span>
            </h1>

            <p className="max-w-2xl text-slate-300 text-sm leading-relaxed">
              {readiness.guidance}
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] text-slate-400 font-medium">Active Triggers:</span>
              {readiness.triggers.slice(0, 3).map((trigger, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-[#181D2A] border border-[#1E2330] text-slate-300 tabular-nums"
                >
                  {trigger}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => setCheckInOpen(!checkInOpen)}
            >
              <Sliders className="h-4 w-4 text-athloniq-lime" />
              <span>{checkInOpen ? "Close Check-in" : "Log Check-in"}</span>
            </Button>

            <Button
              variant="primary"
              size="lg"
              onClick={() => onNavigate("workouts")}
            >
              <Dumbbell className="h-5 w-5" />
              Launch Workout
            </Button>
          </div>
        </div>

        {/* Inline Quick Check-in Drawer */}
        {checkInOpen && (
          <div className="mt-6 pt-6 border-t border-[#1E2330] bg-[#181D2A] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Moon className="h-4 w-4 text-athloniq-lime" />
                  Subjective Recovery Check-in
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Calculated strictly from your self-reported inputs. Zero fabricated wearable telemetry.
                </p>
              </div>
              <Badge variant="lime">AUDITABLE RULES</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Sleep Duration (Hours)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="16"
                  value={sleepInput}
                  onChange={(e) => setSleepInput(Number(e.target.value))}
                  className="w-full bg-[#12151E] border border-[#1E2330] rounded-xl px-3 py-2 text-sm text-white font-mono tabular-nums focus:border-athloniq-lime focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Sleep Quality (1-5)
                </label>
                <select
                  value={qualityInput}
                  onChange={(e) => setQualityInput(Number(e.target.value))}
                  className="w-full bg-[#12151E] border border-[#1E2330] rounded-xl px-3 py-2 text-sm text-white focus:border-athloniq-lime focus:outline-none"
                >
                  <option value={5}>5 - Excellent / Deep</option>
                  <option value={4}>4 - Good Rest</option>
                  <option value={3}>3 - Average</option>
                  <option value={2}>2 - Disturbed / Light</option>
                  <option value={1}>1 - Severe Insomnia</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Muscle Soreness (1-5)
                </label>
                <select
                  value={sorenessInput}
                  onChange={(e) => setSorenessInput(Number(e.target.value))}
                  className="w-full bg-[#12151E] border border-[#1E2330] rounded-xl px-3 py-2 text-sm text-white focus:border-athloniq-lime focus:outline-none"
                >
                  <option value={1}>1 - Fresh / Zero DOMS</option>
                  <option value={2}>2 - Mild Tightness</option>
                  <option value={3}>3 - Moderate Soreness</option>
                  <option value={4}>4 - High Soreness</option>
                  <option value={5}>5 - Severe / Crippling</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Systemic Fatigue (1-5)
                </label>
                <select
                  value={fatigueInput}
                  onChange={(e) => setFatigueInput(Number(e.target.value))}
                  className="w-full bg-[#12151E] border border-[#1E2330] rounded-xl px-3 py-2 text-sm text-white focus:border-athloniq-lime focus:outline-none"
                >
                  <option value={1}>1 - Fully Energized</option>
                  <option value={2}>2 - Normal Energy</option>
                  <option value={3}>3 - Mild Fatigue</option>
                  <option value={4}>4 - Elevated Fatigue</option>
                  <option value={5}>5 - Exhausted</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="primary" size="sm" onClick={handleSaveCheckIn}>
                <CheckCircle2 className="h-4 w-4" /> Save & Re-score Readiness
              </Button>
            </div>
          </div>
        )}
      </div>

      {appliedTargetNotice && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          {appliedTargetNotice}
        </div>
      )}

      {/* 3. Phase 5: Adaptive Calibration & Multi-Sport Fatigue Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: 14-Day Lean-Bulk Energy Calibrator */}
        <Card className="space-y-4 border-athloniq-lime/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E2330] pb-3">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-athloniq-lime" />
              <div>
                <h3 className="font-bold text-white text-base">14-Day Lean-Bulk Calibrator</h3>
                <p className="text-xs text-slate-400">
                  Observation: {leanBulkCalibration.observation_days_logged}/10 nutrition days •{" "}
                  {leanBulkCalibration.observation_weigh_ins}/4 weigh-ins
                </p>
              </div>
            </div>
            <Badge
              variant={
                leanBulkCalibration.status === "on_track"
                  ? "lime"
                  : leanBulkCalibration.status === "increase_surplus"
                  ? "cyan"
                  : leanBulkCalibration.status === "trim_surplus"
                  ? "amber"
                  : "neutral"
              }
            >
              {leanBulkCalibration.status.toUpperCase().replace("_", " ")}
            </Badge>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#181D2A] border border-[#1E2330]">
                <span className="text-slate-400">Lean-Bulk Corridor:</span>
                <div className="text-sm font-mono font-bold text-white mt-0.5">+0.10 to +0.25 kg/wk</div>
              </div>
              <div className="p-3 rounded-xl bg-[#181D2A] border border-[#1E2330]">
                <span className="text-slate-400">Rolling Weekly Delta:</span>
                <div className="text-sm font-mono font-bold text-athloniq-lime mt-0.5">
                  {leanBulkCalibration.weekly_delta_kg != null
                    ? `${leanBulkCalibration.weekly_delta_kg > 0 ? "+" : ""}${leanBulkCalibration.weekly_delta_kg.toFixed(2)} kg/wk`
                    : "Calibrating..."}
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">{leanBulkCalibration.explanation}</p>

            {(leanBulkCalibration.status === "increase_surplus" || leanBulkCalibration.status === "trim_surplus") && (
              <div className="pt-2">
                <Button variant="primary" size="sm" className="w-full" onClick={handleApplyCalibratedTarget}>
                  <CheckCircle2 className="h-4 w-4" /> Confirm & Apply Adjusted Target (
                  {leanBulkCalibration.new_calorie_target_kcal} kcal)
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Card 2: Multi-Sport Fatigue & Recovery Advisory */}
        <Card className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E2330] pb-3">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-400" />
              <div>
                <h3 className="font-bold text-white text-base">Multi-Sport Workload Advisory</h3>
                <p className="text-xs text-slate-400">Gym + Badminton + Running Cumulative Strain</p>
              </div>
            </div>
            <Badge
              variant={
                fatigueAdvisory.status === "optimal"
                  ? "lime"
                  : fatigueAdvisory.status === "moderate_strain"
                  ? "cyan"
                  : "rose"
              }
            >
              {fatigueAdvisory.status.toUpperCase().replace("_", " ")}
            </Badge>
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-[#181D2A] border border-[#1E2330]">
                <div className="text-[10px] text-slate-500 font-bold uppercase">Gym</div>
                <div className="text-base font-bold font-mono text-white mt-0.5">
                  {fatigueAdvisory.gym_sessions_7d} sets/wk
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#181D2A] border border-[#1E2330]">
                <div className="text-[10px] text-slate-500 font-bold uppercase">Badminton</div>
                <div className="text-base font-bold font-mono text-white mt-0.5">
                  {fatigueAdvisory.badminton_minutes_7d.toFixed(0)} min
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#181D2A] border border-[#1E2330]">
                <div className="text-[10px] text-slate-500 font-bold uppercase">Running</div>
                <div className="text-base font-bold font-mono text-white mt-0.5">
                  {fatigueAdvisory.running_km_7d.toFixed(1)} km
                </div>
              </div>
            </div>

            <p className="text-slate-300 leading-relaxed">{fatigueAdvisory.explanation}</p>

            <div className="p-2.5 rounded-lg bg-[#12151E] border border-[#1E2330] text-[10px] text-slate-500 flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span>Workload advisory only; not a clinical injury risk calculation.</span>
            </div>
          </div>
        </Card>
      </div>

      {/* 4. Core Status Tiles Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card A: Nutrition & Macro Target Card */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#1E2330] pb-3">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-athloniq-lime" />
              <h3 className="font-bold text-white text-base">Energy & Nutrition</h3>
            </div>
            <ProvenanceBadge provenance={goals.calorieProvenance} />
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-400 font-medium">Daily Caloric Intake</span>
                <span className="font-mono text-slate-400 text-[11px] tabular-nums">
                  {goals.calorieTargetKcal !== null
                    ? dailyNutrition.confirmedTotals.caloriesKcal >= goals.calorieTargetKcal
                      ? "Target met"
                      : `${goals.calorieTargetKcal - dailyNutrition.confirmedTotals.caloriesKcal} kcal remaining`
                    : "Calibrating..."}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                {goals.calorieTargetKcal !== null ? (
                  <>
                    <span className="text-3xl font-extrabold text-white font-mono tabular-nums">
                      {dailyNutrition.confirmedTotals.caloriesKcal}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">/ {goals.calorieTargetKcal} kcal</span>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-amber-400">
                      Complete Onboarding to Estimate
                    </span>
                  </div>
                )}
              </div>
              {goals.calorieTargetKcal !== null && (
                <div className="w-full bg-[#181D2A] rounded-full h-1.5 mt-2 overflow-hidden border border-[#1E2330]">
                  <div
                    className="bg-athloniq-lime h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        (dailyNutrition.confirmedTotals.caloriesKcal / goals.calorieTargetKcal) * 100
                      )}%`,
                    }}
                  />
                </div>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-[#181D2A] border border-[#1E2330] space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-medium">Daily Protein Intake</span>
                <ProvenanceBadge provenance={goals.proteinProvenance} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-white font-mono tabular-nums">
                  {dailyNutrition.confirmedTotals.proteinG} / {goals.proteinTargetG}
                </span>
                <span className="text-xs text-slate-400 font-mono">g</span>
              </div>
              <div className="w-full bg-[#12151E] rounded-full h-1.5 overflow-hidden border border-[#1E2330]">
                <div
                  className="bg-athloniq-lime h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      (dailyNutrition.confirmedTotals.proteinG / goals.proteinTargetG) * 100
                    )}%`,
                  }}
                />
              </div>
              <div className="text-[11px] text-slate-400">
                Range: {goals.proteinMinG}–{goals.proteinMaxG} g (1.6–2.2 g/kg of {profile.weightKg} kg)
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => onNavigate("nutrition")}
            >
              Open Nutrition Tracker <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </Card>

        {/* Card B: Biometrics & Anthropometric Screening Card */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#1E2330] pb-3">
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-athloniq-lime" />
              <h3 className="font-bold text-white text-base">Biometrics & Screening</h3>
            </div>
            <ProvenanceBadge provenance={latestWeight ? "user_confirmed" : "calculated_estimate"} />
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-[#181D2A] border border-[#1E2330]">
                <span className="text-[11px] text-slate-400">
                  {latestWeight ? `Weight (${latestWeight.loggedDate})` : "Body Weight"}
                </span>
                <div className="text-2xl font-black text-white font-mono mt-1 tabular-nums">
                  {(latestWeight ? latestWeight.weightKg : profile.weightKg).toFixed(1)}
                  <span className="text-xs text-slate-400 ml-1">kg</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#181D2A] border border-[#1E2330]">
                <span className="text-[11px] text-slate-400">Height</span>
                <div className="text-2xl font-black text-white font-mono mt-1 tabular-nums">
                  {profile.heightCm}
                  <span className="text-xs text-slate-400 ml-1">cm</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#181D2A] border border-[#1E2330] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">
                  BMI: {bmi.bmi} kg/m²
                </span>
                <Badge variant="amber">SCREENING METRIC ONLY</Badge>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {bmi.disclaimer}
              </p>
            </div>

            <div className="rounded-xl bg-[#181D2A]/60 border border-[#1E2330] p-3 text-xs text-slate-400 flex items-center justify-between">
              <span>Weight Trend:</span>
              <span className="font-mono text-slate-300 text-[11px]">
                {weightTrend.status === "ok" ? (
                  <span className="text-athloniq-lime font-bold">
                    7d Avg: {weightTrend.rolling7dKg?.toFixed(2)} kg ({weightTrend.weeklyDeltaKg && weightTrend.weeklyDeltaKg >= 0 ? "+" : ""}{weightTrend.weeklyDeltaKg?.toFixed(2)} kg)
                  </span>
                ) : (
                  `${bodyMetrics.length}/3 weigh-ins logged`
                )}
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => onNavigate("progress")}
            >
              Open Progress Analytics <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </Card>

        {/* Card C: Training & Equipment Status Card */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#1E2330] pb-3">
            <div className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-athloniq-lime" />
              <h3 className="font-bold text-white text-base">Training & Equipment</h3>
            </div>
            <ProvenanceBadge
              provenance={
                profile.equipmentConfirmed
                  ? "user_confirmed"
                  : "unconfirmed_equipment"
              }
            />
          </div>

          <div className="space-y-4">
            {todayWorkouts.length > 0 ? (
              <div className="p-3.5 rounded-xl bg-athloniq-lime/10 border border-athloniq-lime/30 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-athloniq-lime uppercase tracking-wider">
                    Today's Session Completed
                  </span>
                  <Badge variant="lime">LOGGED</Badge>
                </div>
                <div className="text-sm font-bold text-white">{todayWorkouts[0].title}</div>
                <div className="text-xs text-slate-400 font-mono tabular-nums">
                  {todayWorkouts[0].sets.filter((s) => s.isCompleted).length} sets completed •{" "}
                  {todayWorkouts[0].sets
                    .filter((s) => s.isCompleted && !s.isBodyweight)
                    .reduce((sum, s) => sum + s.reps * s.loadKg, 0)
                    .toLocaleString()}{" "}
                  kg volume
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-[#181D2A] border border-[#1E2330] space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Weekly Frequency</span>
                  <span className="font-mono font-bold text-athloniq-lime">
                    {profile.trainingDaysPerWeek} Days / Week
                  </span>
                </div>
                <div className="text-xs text-slate-300 font-semibold pt-1">
                  Training Scope:
                </div>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {profile.trainingScope.map((scope, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-[#12151E] border border-[#1E2330] text-[10px] font-mono text-slate-300 uppercase"
                    >
                      {scope}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-[#181D2A] border border-[#1E2330] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Home Equipment:</span>
                <span
                  className={`font-semibold font-mono ${
                    profile.equipmentConfirmed ? "text-emerald-400" : "text-amber-400"
                  }`}
                >
                  {profile.equipmentConfirmed
                    ? "Confirmed Home Gym"
                    : `${unconfirmedEquipmentCount} items unconfirmed`}
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                {profile.equipmentConfirmed
                  ? "Bench, Rack, Dips, Pulldown, and Free Weights (70kg) active."
                  : "Unconfirmed items limit exercise selection and load auto-regulation."}
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => onNavigate("workouts")}
            >
              View Training Sessions <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
