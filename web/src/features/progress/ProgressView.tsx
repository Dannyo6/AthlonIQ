import React, { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge, ProvenanceBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAthloniqState } from "@/hooks/useAthloniqState";
import {
  calculateBmi,
  calculateWeightTrend,
  evaluateLeanBulkCalibration,
  evaluateMultisportFatigue,
} from "@/lib/calculations";
import {
  TrendingUp,
  Scale,
  Award,
  Info,
  CheckCircle2,
  Trash2,
  Activity,
  BarChart2,
  Camera,
  Flame,
  Zap,
  ArrowLeftRight,
  ShieldAlert,
} from "lucide-react";

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

export const ProgressView: React.FC = () => {
  const {
    profile,
    goals,
    updateGoals,
    bodyMetrics,
    addBodyMetric,
    deleteBodyMetric,
    workoutSessions,
    activitySessions,
    foodEntries,
    todayCheckIn,
    progressPhotos,
    addProgressPhoto,
    deleteProgressPhoto,
  } = useAthloniqState();

  // Weigh-in form state
  const [showWeightForm, setShowWeightForm] = useState(false);
  const [weightInput, setWeightInput] = useState("");
  const [waistInput, setWaistInput] = useState("");
  const [chestInput, setChestInput] = useState("");
  const [armInput, setArmInput] = useState("");
  const [weightNotes, setWeightNotes] = useState("");
  const [weightDate, setWeightDate] = useState(todayISO());

  // Progress photo form state
  const [showPhotoForm, setShowPhotoForm] = useState(false);
  const [photoDate, setPhotoDate] = useState(todayISO());
  const [photoWeight, setPhotoWeight] = useState(
    bodyMetrics.length > 0 ? String(bodyMetrics[bodyMetrics.length - 1].weightKg) : String(profile.weightKg)
  );
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoNotes, setPhotoNotes] = useState("");
  const [compareIdA, setCompareIdA] = useState<string>("");
  const [compareIdB, setCompareIdB] = useState<string>("");
  const [appliedTargetNotice, setAppliedTargetNotice] = useState<string | null>(null);

  const bmi = calculateBmi(profile.weightKg, profile.heightCm);

  // Weight trend engine
  const weightTrend = useMemo(() => {
    const points = bodyMetrics.map((m) => ({
      loggedDate: m.loggedDate,
      weightKg: m.weightKg,
    }));
    return calculateWeightTrend(points);
  }, [bodyMetrics]);

  // Phase 5: 14-Day Lean-Bulk Energy Calibrator
  const leanBulkCalibration = useMemo(() => {
    const now = new Date();
    const cutoff14d = new Date(now);
    cutoff14d.setDate(cutoff14d.getDate() - 14);

    // Filter confirmed nutrition days in last 14d
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

    // Weigh-ins in last 14d
    const recentWeighIns = bodyMetrics
      .filter((m) => new Date(m.loggedDate) >= cutoff14d)
      .map((m) => ({ loggedDate: m.loggedDate, weightKg: m.weightKg }))
      .sort((a, b) => a.loggedDate.localeCompare(b.loggedDate));

    // Waist in last 14d
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

  // Phase 5: Multi-Sport Fatigue Advisor
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

  // Workout volume stats
  const totalSessionsLast30 = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    return workoutSessions.filter((s) => new Date(s.loggedDate) >= cutoff).length;
  }, [workoutSessions]);

  const totalVolumeLast30 = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    return workoutSessions
      .filter((s) => new Date(s.loggedDate) >= cutoff)
      .flatMap((s) => s.sets)
      .filter((s) => s.isCompleted && !s.isBodyweight)
      .reduce((sum, s) => sum + s.reps * s.loadKg, 0);
  }, [workoutSessions]);

  const totalPRs = useMemo(() => {
    return workoutSessions.flatMap((s) => s.sets).filter((s) => s.isPr).length;
  }, [workoutSessions]);

  // Activity stats
  const totalRunKm = useMemo(() => {
    return activitySessions
      .filter((s) => s.activityType === "running" && s.distanceKm)
      .reduce((sum, s) => sum + (s.distanceKm || 0), 0);
  }, [activitySessions]);

  const totalBadmintonMin = useMemo(() => {
    return activitySessions
      .filter((s) => s.activityType === "badminton")
      .reduce((sum, s) => sum + s.durationMinutes, 0);
  }, [activitySessions]);

  // Average daily protein this week
  const avgWeeklyProteinG = useMemo(() => {
    const today = new Date();
    const daysWithEntries: Record<string, number> = {};
    foodEntries.forEach((e) => {
      const entryDate = new Date(e.loggedDate);
      const diffDays = (today.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24);
      const isConf = e.is_confirmed !== undefined ? Boolean(e.is_confirmed) : Boolean(e.isConfirmed);
      if (diffDays <= 7 && isConf) {
        daysWithEntries[e.loggedDate] = (daysWithEntries[e.loggedDate] || 0) + e.proteinG * e.quantity;
      }
    });
    const dayValues = Object.values(daysWithEntries);
    if (dayValues.length === 0) return null;
    return Math.round(dayValues.reduce((a, b) => a + b, 0) / dayValues.length);
  }, [foodEntries]);

  const handleAddWeight = () => {
    const kg = parseFloat(weightInput);
    if (!kg || kg <= 0) return;
    addBodyMetric({
      loggedDate: weightDate,
      weightKg: kg,
      waistCm: waistInput ? parseFloat(waistInput) : null,
      chestCm: chestInput ? parseFloat(chestInput) : null,
      armCm: armInput ? parseFloat(armInput) : null,
      notes: weightNotes || undefined,
    });
    setWeightInput("");
    setWaistInput("");
    setChestInput("");
    setArmInput("");
    setWeightNotes("");
    setWeightDate(todayISO());
    setShowWeightForm(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const res = uploadEvent.target?.result as string;
      if (res) setPhotoUrl(res);
    };
    reader.readAsDataURL(file);
  };

  const handleAddPhoto = () => {
    if (!photoUrl) return;
    const wt = parseFloat(photoWeight) || profile.weightKg;
    addProgressPhoto({
      loggedDate: photoDate,
      weightKg: wt,
      imageUrl: photoUrl,
      notes: photoNotes || undefined,
      category: "progress",
    });
    setPhotoUrl("");
    setPhotoNotes("");
    setPhotoDate(todayISO());
    setShowPhotoForm(false);
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

  const latestWeight =
    bodyMetrics.length > 0
      ? [...bodyMetrics].sort((a, b) => b.loggedDate.localeCompare(a.loggedDate))[0]
      : null;

  // Selected compare photos
  const selectedPhotoA = progressPhotos.find((p) => p.id === compareIdA) || progressPhotos[progressPhotos.length - 1];
  const selectedPhotoB = progressPhotos.find((p) => p.id === compareIdB) || progressPhotos[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E2330] pb-5">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2 tracking-tight">
            <TrendingUp className="h-6 w-6 text-athloniq-lime" />
            Physique, Calibrations & Recovery Analytics
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Deterministic energy calibrations, multi-sport fatigue flags, private photo timeline, and volume metrics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="lime">LEAN BULK</Badge>
          <ProvenanceBadge provenance="calculated_estimate" />
          <Button variant="secondary" onClick={() => setShowPhotoForm(!showPhotoForm)}>
            <Camera className="h-4 w-4" /> Add Photo
          </Button>
          <Button variant="primary" onClick={() => setShowWeightForm(!showWeightForm)}>
            <Scale className="h-4 w-4" /> Log Weigh-In
          </Button>
        </div>
      </div>

      {appliedTargetNotice && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          {appliedTargetNotice}
        </div>
      )}

      {/* 1. Key Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Current Weight",
            value: latestWeight ? `${latestWeight.weightKg.toFixed(1)} kg` : `${profile.weightKg.toFixed(1)} kg`,
            sub: latestWeight ? latestWeight.loggedDate : "Profile baseline",
            color: "text-athloniq-lime",
          },
          {
            label: "7d Rolling Avg",
            value: weightTrend.rolling7dKg != null ? `${weightTrend.rolling7dKg.toFixed(2)} kg` : "—",
            sub:
              weightTrend.status === "insufficient_data"
                ? `${bodyMetrics.length}/3 weigh-ins`
                : `Δ ${weightTrend.weeklyDeltaKg && weightTrend.weeklyDeltaKg >= 0 ? "+" : ""}${
                    weightTrend.weeklyDeltaKg?.toFixed(2) ?? "—"
                  } kg`,
            color: "text-emerald-400",
          },
          {
            label: "Avg Daily Protein",
            value: avgWeeklyProteinG != null ? `${avgWeeklyProteinG} g` : "—",
            sub: `Target: ${goals.proteinTargetG} g/day`,
            color:
              avgWeeklyProteinG != null && avgWeeklyProteinG >= goals.proteinTargetG
                ? "text-athloniq-lime"
                : "text-amber-400",
          },
          {
            label: "BMI (Screening)",
            value: `${bmi.bmi}`,
            sub: bmi.category.replace("_", " "),
            color: "text-slate-300",
          },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="p-4 rounded-2xl bg-[#12151E] border border-[#1E2330] space-y-1">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</div>
            <div className={`text-2xl font-black font-mono tabular-nums ${color}`}>{value}</div>
            <div className="text-[11px] text-slate-400">{sub}</div>
          </div>
        ))}
      </div>

      {/* 2. Phase 5: Adaptive Lean-Bulk Calibrator Card */}
      <Card className="space-y-4 border-athloniq-lime/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E2330] pb-3">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-athloniq-lime" />
            <div>
              <h3 className="text-base font-bold text-white">14-Day Lean-Bulk Energy Calibrator</h3>
              <p className="text-xs text-slate-400">
                Auditable energy recalibration gated by 10 nutrition days and 4 fasted weigh-ins over 14 days.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
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
            <ProvenanceBadge provenance={leanBulkCalibration.provenance} />
          </div>
        </div>

        {/* Observation Progress Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-[#181D2A] border border-[#1E2330]">
            <div className="text-[11px] text-slate-400">14-Day Nutrition Adherence</div>
            <div className="text-lg font-black font-mono text-white mt-1 tabular-nums">
              {leanBulkCalibration.observation_days_logged} / 10{" "}
              <span className="text-xs font-normal text-slate-400">days logged</span>
            </div>
            <div className="w-full bg-[#12151E] rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-athloniq-lime h-full rounded-full"
                style={{ width: `${Math.min(100, (leanBulkCalibration.observation_days_logged / 10) * 100)}%` }}
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#181D2A] border border-[#1E2330]">
            <div className="text-[11px] text-slate-400">14-Day Fasted Weigh-Ins</div>
            <div className="text-lg font-black font-mono text-white mt-1 tabular-nums">
              {leanBulkCalibration.observation_weigh_ins} / 4{" "}
              <span className="text-xs font-normal text-slate-400">weigh-ins</span>
            </div>
            <div className="w-full bg-[#12151E] rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-emerald-400 h-full rounded-full"
                style={{ width: `${Math.min(100, (leanBulkCalibration.observation_weigh_ins / 4) * 100)}%` }}
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#181D2A] border border-[#1E2330]">
            <div className="text-[11px] text-slate-400">Target Gain Corridor (55 kg BW)</div>
            <div className="text-sm font-bold text-slate-200 mt-1 font-mono">
              +0.10 to +0.25 kg/wk
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Current Delta:{" "}
              <span className="font-mono font-bold text-athloniq-lime">
                {leanBulkCalibration.weekly_delta_kg != null
                  ? `${leanBulkCalibration.weekly_delta_kg > 0 ? "+" : ""}${leanBulkCalibration.weekly_delta_kg.toFixed(2)} kg/wk`
                  : "Insufficient data"}
              </span>
            </div>
          </div>
        </div>

        {/* Explanation & Recommendation */}
        <div className="p-4 rounded-xl bg-[#181D2A] border border-[#1E2330] space-y-2">
          <p className="text-xs text-slate-300 leading-relaxed">{leanBulkCalibration.explanation}</p>
          <p className="text-xs text-athloniq-lime font-medium leading-relaxed">
            {leanBulkCalibration.recommendation}
          </p>
        </div>

        {/* Explicit Adjustment Confirmation Action */}
        {(leanBulkCalibration.status === "increase_surplus" || leanBulkCalibration.status === "trim_surplus") && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-athloniq-lime/10 to-[#181D2A] border border-athloniq-lime/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-white uppercase tracking-wider">
                Recommendation: {leanBulkCalibration.suggested_calorie_delta_kcal > 0 ? "+" : ""}
                {leanBulkCalibration.suggested_calorie_delta_kcal} kcal/day
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Current: {leanBulkCalibration.current_calorie_target_kcal} kcal → Recommended:{" "}
                <span className="text-white font-bold">{leanBulkCalibration.new_calorie_target_kcal} kcal</span>
              </div>
            </div>
            <Button variant="primary" size="sm" onClick={handleApplyCalibratedTarget}>
              <CheckCircle2 className="h-4 w-4" /> Confirm & Apply Adjusted Target
            </Button>
          </div>
        )}
      </Card>

      {/* 3. Phase 5: Multi-Sport Fatigue & Recovery Advisory */}
      <Card className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E2330] pb-3">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-400" />
            <div>
              <h3 className="text-base font-bold text-white">Multi-Sport Workload & Fatigue Advisory</h3>
              <p className="text-xs text-slate-400">
                Lifting volume synthesized with Badminton footwork, Running mileage, and self-reported recovery.
              </p>
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

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-[#181D2A] border border-[#1E2330]">
            <div className="text-[10px] uppercase font-bold text-slate-500">Gym Sessions (7d)</div>
            <div className="text-xl font-black font-mono text-white mt-1">{fatigueAdvisory.gym_sessions_7d}</div>
          </div>
          <div className="p-3 rounded-xl bg-[#181D2A] border border-[#1E2330]">
            <div className="text-[10px] uppercase font-bold text-slate-500">Badminton (7d)</div>
            <div className="text-xl font-black font-mono text-white mt-1">
              {fatigueAdvisory.badminton_minutes_7d.toFixed(0)}{" "}
              <span className="text-xs font-normal text-slate-400">min</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[#181D2A] border border-[#1E2330]">
            <div className="text-[10px] uppercase font-bold text-slate-500">Running (7d)</div>
            <div className="text-xl font-black font-mono text-white mt-1">
              {fatigueAdvisory.running_km_7d.toFixed(1)}{" "}
              <span className="text-xs font-normal text-slate-400">km</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[#181D2A] border border-[#1E2330]">
            <div className="text-[10px] uppercase font-bold text-slate-500">Sleep / Soreness</div>
            <div className="text-base font-black font-mono text-white mt-1">
              {fatigueAdvisory.avg_sleep_hours_7d ? `${fatigueAdvisory.avg_sleep_hours_7d}h` : "—"} /{" "}
              {fatigueAdvisory.avg_soreness_7d ? `${fatigueAdvisory.avg_soreness_7d}/5` : "—"}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#181D2A] border border-[#1E2330] space-y-2">
          <p className="text-xs text-slate-300 leading-relaxed">{fatigueAdvisory.explanation}</p>
          <div className="space-y-1 pt-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Actionable Adjustments:</span>
            <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
              {fatigueAdvisory.recommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#12151E] border border-[#1E2330] flex items-center gap-2 text-[11px] text-slate-500">
          <ShieldAlert className="h-4 w-4 text-slate-400 shrink-0" />
          <span>{fatigueAdvisory.disclaimer}</span>
        </div>
      </Card>

      {/* 4. Phase 5: Private Progress Photo Timeline */}
      <Card className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E2330] pb-3">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-athloniq-lime" />
            <div>
              <h3 className="text-base font-bold text-white">Private Progress Photo Timeline</h3>
              <p className="text-xs text-slate-400">
                Encrypted, client-isolated visual records with date and weight anchors.
              </p>
            </div>
          </div>
          <Badge variant="lime">PRIVATE LOCAL STORAGE</Badge>
        </div>

        {/* Mandatory Scientific Disclaimer Banner */}
        <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-start gap-2.5 text-xs text-purple-200 leading-relaxed">
          <Info className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-white">Visual Progress Reference Only: </span>
            Body-fat percentage and lean muscle mass cannot be accurately calculated from ordinary photographs or scale weight alone.
          </div>
        </div>

        {/* Add Progress Photo Form */}
        {showPhotoForm && (
          <div className="p-4 rounded-xl bg-[#181D2A] border border-[#1E2330] space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Camera className="h-4 w-4 text-athloniq-lime" /> Upload Progress Photo
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-medium">Date</label>
                <input
                  type="date"
                  value={photoDate}
                  onChange={(e) => setPhotoDate(e.target.value)}
                  className="w-full mt-1 bg-[#12151E] border border-[#1E2330] rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-athloniq-lime focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium">Weight Badge (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={photoWeight}
                  onChange={(e) => setPhotoWeight(e.target.value)}
                  className="w-full mt-1 bg-[#12151E] border border-[#1E2330] rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-athloniq-lime focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium">Lighting / Pose Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Fasted AM, relaxed front pose"
                  value={photoNotes}
                  onChange={(e) => setPhotoNotes(e.target.value)}
                  className="w-full mt-1 bg-[#12151E] border border-[#1E2330] rounded-xl px-3 py-2 text-sm text-white focus:border-athloniq-lime focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="text-xs text-slate-400 font-medium">Select Image File or Paste URL</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#12151E] file:text-athloniq-lime hover:file:bg-[#1e2433] cursor-pointer"
                />
                <input
                  type="text"
                  placeholder="Or paste image URL / data URL..."
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  className="flex-1 bg-[#12151E] border border-[#1E2330] rounded-xl px-3 py-2 text-xs text-white focus:border-athloniq-lime focus:outline-none"
                />
              </div>
            </div>

            {photoUrl && (
              <div className="w-28 h-36 rounded-xl overflow-hidden border border-[#1E2330] bg-[#12151E]">
                <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="primary" size="sm" onClick={handleAddPhoto} disabled={!photoUrl}>
                <CheckCircle2 className="h-4 w-4" /> Save Photo Record
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowPhotoForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Side-by-Side Comparison Selector */}
        {progressPhotos.length >= 2 && (
          <div className="p-4 rounded-xl bg-[#181D2A] border border-[#1E2330] space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <ArrowLeftRight className="h-4 w-4 text-athloniq-lime" /> Side-by-Side Comparison
              </h4>
              <span className="text-[11px] text-slate-400">Comparing 2 Check-Ins</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] text-slate-400 font-medium">Baseline / Prior Date</label>
                <select
                  value={selectedPhotoA?.id}
                  onChange={(e) => setCompareIdA(e.target.value)}
                  className="w-full mt-1 bg-[#12151E] border border-[#1E2330] rounded-xl px-3 py-2 text-xs text-white focus:border-athloniq-lime focus:outline-none"
                >
                  {progressPhotos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.loggedDate} ({p.weightKg.toFixed(1)} kg) — {p.notes || "Check-in"}
                    </option>
                  ))}
                </select>
                {selectedPhotoA && (
                  <div className="mt-3 p-3 rounded-xl bg-[#12151E] border border-[#1E2330] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-white font-bold">{selectedPhotoA.loggedDate}</span>
                      <Badge variant="lime">{selectedPhotoA.weightKg.toFixed(1)} kg</Badge>
                    </div>
                    <div className="h-48 rounded-lg overflow-hidden bg-[#181D2A] border border-[#1E2330] flex items-center justify-center">
                      <img
                        src={selectedPhotoA.imageUrl}
                        alt="Baseline"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    {selectedPhotoA.notes && <div className="text-[11px] text-slate-400">{selectedPhotoA.notes}</div>}
                  </div>
                )}
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-medium">Recent / Latest Date</label>
                <select
                  value={selectedPhotoB?.id}
                  onChange={(e) => setCompareIdB(e.target.value)}
                  className="w-full mt-1 bg-[#12151E] border border-[#1E2330] rounded-xl px-3 py-2 text-xs text-white focus:border-athloniq-lime focus:outline-none"
                >
                  {progressPhotos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.loggedDate} ({p.weightKg.toFixed(1)} kg) — {p.notes || "Check-in"}
                    </option>
                  ))}
                </select>
                {selectedPhotoB && (
                  <div className="mt-3 p-3 rounded-xl bg-[#12151E] border border-[#1E2330] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-white font-bold">{selectedPhotoB.loggedDate}</span>
                      <Badge variant="lime">{selectedPhotoB.weightKg.toFixed(1)} kg</Badge>
                    </div>
                    <div className="h-48 rounded-lg overflow-hidden bg-[#181D2A] border border-[#1E2330] flex items-center justify-center">
                      <img
                        src={selectedPhotoB.imageUrl}
                        alt="Current"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    {selectedPhotoB.notes && <div className="text-[11px] text-slate-400">{selectedPhotoB.notes}</div>}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Photo Gallery Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {progressPhotos.map((photo) => (
            <div
              key={photo.id}
              className="p-3 rounded-xl bg-[#181D2A] border border-[#1E2330] space-y-2 relative group"
            >
              <div className="h-40 rounded-lg overflow-hidden bg-[#12151E] flex items-center justify-center">
                <img src={photo.imageUrl} alt="Progress" className="w-full h-full object-cover" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-white">{photo.loggedDate}</span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#12151E] text-athloniq-lime">
                  {photo.weightKg.toFixed(1)} kg
                </span>
              </div>
              {photo.notes && <div className="text-[11px] text-slate-400 truncate">{photo.notes}</div>}
              <button
                onClick={() => deleteProgressPhoto(photo.id)}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-950/80 text-slate-400 hover:text-red-400 transition-colors"
                title="Delete photo record"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* 5. Weigh-In Form (Modal/Drawer) */}
      {showWeightForm && (
        <Card className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#1E2330] pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Scale className="h-4 w-4 text-athloniq-lime" /> Log Weigh-In
            </h3>
            <Badge variant="lime">REQUIRED: 3 weigh-ins for 7-day rolling trend</Badge>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-400 font-medium">Date</label>
              <input
                type="date"
                value={weightDate}
                onChange={(e) => setWeightDate(e.target.value)}
                className="w-full mt-1 bg-[#181D2A] border border-[#1E2330] rounded-xl px-3 py-2.5 text-sm text-white focus:border-athloniq-lime focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium">Weight (kg) *</label>
              <input
                type="number"
                min="20"
                max="300"
                step="0.1"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                placeholder="e.g. 55.4"
                className="w-full mt-1 bg-[#181D2A] border border-[#1E2330] rounded-xl px-3 py-2.5 text-sm text-white font-mono focus:border-athloniq-lime focus:outline-none tabular-nums"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium">Waist (cm)</label>
              <input
                type="number"
                min="40"
                max="200"
                step="0.5"
                value={waistInput}
                onChange={(e) => setWaistInput(e.target.value)}
                placeholder="optional"
                className="w-full mt-1 bg-[#181D2A] border border-[#1E2330] rounded-xl px-3 py-2.5 text-sm text-white font-mono focus:border-athloniq-lime focus:outline-none tabular-nums"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium">Chest (cm)</label>
              <input
                type="number"
                min="40"
                max="200"
                step="0.5"
                value={chestInput}
                onChange={(e) => setChestInput(e.target.value)}
                placeholder="optional"
                className="w-full mt-1 bg-[#181D2A] border border-[#1E2330] rounded-xl px-3 py-2.5 text-sm text-white font-mono focus:border-athloniq-lime focus:outline-none tabular-nums"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium">Arm (cm)</label>
              <input
                type="number"
                min="20"
                max="100"
                step="0.5"
                value={armInput}
                onChange={(e) => setArmInput(e.target.value)}
                placeholder="optional"
                className="w-full mt-1 bg-[#181D2A] border border-[#1E2330] rounded-xl px-3 py-2.5 text-sm text-white font-mono focus:border-athloniq-lime focus:outline-none tabular-nums"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium">Notes</label>
              <input
                type="text"
                value={weightNotes}
                onChange={(e) => setWeightNotes(e.target.value)}
                placeholder="Fasted AM, post-workout..."
                className="w-full mt-1 bg-[#181D2A] border border-[#1E2330] rounded-xl px-3 py-2.5 text-sm text-white focus:border-athloniq-lime focus:outline-none"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="primary" size="sm" onClick={handleAddWeight}>
              <CheckCircle2 className="h-4 w-4" /> Save Weigh-In
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowWeightForm(false)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* 6. 7-Day Rolling Weight Trend Engine */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#1E2330] pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-athloniq-lime" /> 7-Day Rolling Weight Trend
          </h3>
          <Badge variant={weightTrend.status === "ok" ? "lime" : "amber"}>
            {weightTrend.status === "ok" ? "ACTIVE" : `${bodyMetrics.length}/3 WEIGH-INS`}
          </Badge>
        </div>

        {weightTrend.status === "insufficient_data" ? (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-sm text-amber-200 leading-relaxed">
            <p className="font-bold text-white text-xs mb-1">Insufficient Data — Minimum 3 Weigh-Ins Required</p>
            <p className="text-xs">{weightTrend.explanation}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-[#181D2A] border border-[#1E2330] text-center">
                <div className="text-xs text-slate-400 font-medium mb-1">7-Day Rolling Avg</div>
                <div className="text-xl font-black font-mono tabular-nums text-athloniq-lime">
                  {weightTrend.rolling7dKg?.toFixed(2)} kg
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#181D2A] border border-[#1E2330] text-center">
                <div className="text-xs text-slate-400 font-medium mb-1">Weekly Delta</div>
                <div
                  className={`text-xl font-black font-mono tabular-nums ${
                    (weightTrend.weeklyDeltaKg ?? 0) > 0
                      ? "text-emerald-400"
                      : (weightTrend.weeklyDeltaKg ?? 0) < 0
                      ? "text-red-400"
                      : "text-slate-300"
                  }`}
                >
                  {(weightTrend.weeklyDeltaKg ?? 0) >= 0 ? "+" : ""}
                  {weightTrend.weeklyDeltaKg?.toFixed(2)} kg
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">{weightTrend.explanation}</p>

            {/* Weight history table */}
            <div className="max-h-48 overflow-y-auto">
              <table className="w-full text-xs font-mono tabular-nums">
                <thead className="border-b border-[#1E2330]">
                  <tr className="text-slate-500 text-left">
                    <th className="pb-2 font-bold">Date</th>
                    <th className="pb-2 font-bold text-right">Weight</th>
                    <th className="pb-2 font-bold text-right">7d Avg</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2330]">
                  {weightTrend.entries
                    .slice()
                    .reverse()
                    .map((entry) => (
                      <tr key={entry.logged_date} className="hover:bg-[#181D2A] transition-colors">
                        <td className="py-2 text-slate-300">{entry.logged_date}</td>
                        <td className="py-2 text-right text-white font-bold">{entry.weight_kg.toFixed(1)} kg</td>
                        <td className="py-2 text-right text-athloniq-lime">
                          {entry.rolling_7d_kg != null ? `${entry.rolling_7d_kg.toFixed(2)} kg` : "—"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>

      {/* 7. Body Metric History */}
      {bodyMetrics.length > 0 && (
        <Card className="space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-[#1E2330] pb-3">
            <Scale className="h-4 w-4 text-athloniq-lime" /> Weigh-In History
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {[...bodyMetrics]
              .sort((a, b) => b.loggedDate.localeCompare(a.loggedDate))
              .map((metric) => (
                <div
                  key={metric.id}
                  className="flex items-start justify-between p-3 rounded-xl bg-[#181D2A] border border-[#1E2330]"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-white font-mono tabular-nums">
                        {metric.weightKg.toFixed(1)} kg
                      </span>
                      <span className="text-xs text-slate-400 font-mono">{metric.loggedDate}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono tabular-nums flex flex-wrap gap-x-3">
                      {metric.waistCm && <span>Waist: {metric.waistCm} cm</span>}
                      {metric.chestCm && <span>Chest: {metric.chestCm} cm</span>}
                      {metric.armCm && <span>Arm: {metric.armCm} cm</span>}
                    </div>
                    {metric.notes && <div className="text-[11px] text-slate-500">{metric.notes}</div>}
                  </div>
                  <button
                    onClick={() => deleteBodyMetric(metric.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors shrink-0 ml-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
          </div>
        </Card>
      )}

      {/* 8. Training Volume Analytics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Gym Sessions (30d)</span>
            <BarChart2 className="h-4 w-4 text-athloniq-lime" />
          </div>
          <div className="text-3xl font-black text-white font-mono tabular-nums">{totalSessionsLast30}</div>
          <div className="text-xs text-slate-400">Last 30 days</div>
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Volume (30d)</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-white font-mono tabular-nums">
            {totalVolumeLast30.toLocaleString()}
            <span className="text-sm text-slate-400 font-normal ml-1">kg</span>
          </div>
          <div className="text-xs text-slate-400">Barbell sets only</div>
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Personal Records</span>
            <Award className="h-4 w-4 text-athloniq-lime" />
          </div>
          <div className="text-3xl font-black text-white font-mono tabular-nums">{totalPRs}</div>
          <div className="text-xs text-slate-400">All-time tracked PRs</div>
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Running — All Time</span>
            <Activity className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-white font-mono tabular-nums">
            {totalRunKm.toFixed(1)} <span className="text-sm text-slate-400 font-normal">km</span>
          </div>
          <div className="text-xs text-slate-400">+ {Math.round(totalBadmintonMin / 60)}h badminton</div>
        </Card>
      </div>

      {/* 9. BMI Disclaimer */}
      <Card className="space-y-2">
        <div className="flex items-center gap-2 text-slate-300 font-bold text-xs">
          <Info className="h-4 w-4 text-athloniq-lime" />
          <span>Screening Metric Disclaimer</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          {bmi.disclaimer} AthlonIQ prioritizes progressive tension overload, lean tissue accrual, and performance over
          static height-to-weight ratios.
        </p>
      </Card>
    </div>
  );
};
