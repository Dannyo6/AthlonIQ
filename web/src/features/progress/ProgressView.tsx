import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAthloniqState } from "@/hooks/useAthloniqState";
import {
  calculateBmi,
  calculateWeightTrend,
  evaluateLeanBulkCalibration,
  evaluateMultisportFatigue,
} from "@/lib/calculations";
import { resolveDateInTimezone } from "@/lib/weeklyConsistency";
import { useProgressFormDirty } from "./hooks/useProgressFormDirty";
import { ProgressHeaderActions } from "./components/ProgressHeaderActions";
import { ProgressKeyStatsGrid } from "./components/ProgressKeyStatsGrid";
import { LeanBulkCalibrationCard } from "./components/LeanBulkCalibrationCard";
import { MultiSportFatigueCard } from "./components/MultiSportFatigueCard";
import { ProgressPhotosSection } from "./components/ProgressPhotosSection";
import { ProgressWeighInDrawer } from "./components/ProgressWeighInDrawer";
import { WeightTrendSection } from "./components/WeightTrendSection";
import { ProgressBodyMetricsList } from "./components/ProgressBodyMetricsList";
import { TrainingVolumeSection } from "./components/TrainingVolumeSection";

export interface ProgressViewProps {
  now?: string | Date;
}

export const ProgressView: React.FC<ProgressViewProps> = ({ now }) => {
  const {
    profile,
    goals,
    preferences,
    updateGoals,
    bodyMetrics,
    addBodyMetric,
    deleteBodyMetric,
    workoutSessions,
    activitySessions,
    foodEntries,
    todayCheckIn,
    hasTodayCheckIn,
    progressPhotos,
    addProgressPhoto,
    deleteProgressPhoto,
    isDemoFixtureActive,
    loadDemoFixture,
    resetDemoFixture,
  } = useAthloniqState();

  const timezone = preferences?.timezone ?? "Asia/Kolkata";
  const defaultToday = useMemo(() => resolveDateInTimezone(now, timezone), [now, timezone]);

  const latestWeight = useMemo(
    () =>
      bodyMetrics.length > 0
        ? [...bodyMetrics].sort((a, b) => b.loggedDate.localeCompare(a.loggedDate))[0]
        : null,
    [bodyMetrics]
  );

  const initialPhotoWeight = useMemo(() => {
    if (latestWeight) return String(latestWeight.weightKg);
    if (profile.weightKg != null && Number.isFinite(profile.weightKg)) {
      return String(profile.weightKg);
    }
    return "";
  }, [latestWeight, profile.weightKg]);

  const [showWeightForm, setShowWeightForm] = useState(false);
  const [weightInput, setWeightInput] = useState("");
  const [waistInput, setWaistInput] = useState("");
  const [chestInput, setChestInput] = useState("");
  const [armInput, setArmInput] = useState("");
  const [weightNotes, setWeightNotes] = useState("");
  const [weightDate, setWeightDate] = useState(defaultToday);

  const [showPhotoForm, setShowPhotoForm] = useState(false);
  const [photoDate, setPhotoDate] = useState(defaultToday);
  const [photoWeight, setPhotoWeight] = useState(initialPhotoWeight);
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoNotes, setPhotoNotes] = useState("");
  const [compareIdA, setCompareIdA] = useState("");
  const [compareIdB, setCompareIdB] = useState("");
  const [appliedTargetNotice, setAppliedTargetNotice] = useState<string | null>(null);

  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    };
  }, []);

  const isWeighInDirty = Boolean(
    showWeightForm &&
      (weightInput.trim() !== "" ||
        waistInput.trim() !== "" ||
        chestInput.trim() !== "" ||
        armInput.trim() !== "" ||
        weightNotes.trim() !== "")
  );

  const isPhotoDirty = Boolean(
    showPhotoForm &&
      (photoUrl.trim() !== "" ||
        photoNotes.trim() !== "" ||
        photoWeight.trim() !== initialPhotoWeight)
  );

  useProgressFormDirty(isWeighInDirty, isPhotoDirty);

  const bmi = calculateBmi(profile.weightKg, profile.heightCm);

  const weightTrend = useMemo(() => {
    const points = bodyMetrics.map((m) => ({
      loggedDate: m.loggedDate,
      weightKg: m.weightKg,
    }));
    return calculateWeightTrend(points);
  }, [bodyMetrics]);

  const leanBulkCalibration = useMemo(() => {
    const now = new Date(`${defaultToday}T00:00:00Z`);
    const cutoff14d = new Date(now);
    cutoff14d.setUTCDate(cutoff14d.getUTCDate() - 14);

    const daysMap: Record<string, number> = {};
    foodEntries.forEach((e) => {
      const isConf =
        e.is_confirmed !== undefined ? Boolean(e.is_confirmed) : Boolean(e.isConfirmed);
      if (isConf && new Date(`${e.loggedDate}T00:00:00Z`) >= cutoff14d) {
        daysMap[e.loggedDate] = (daysMap[e.loggedDate] || 0) + e.caloriesKcal * e.quantity;
      }
    });

    const loggedNutritionDays = Object.keys(daysMap).length;
    const dayCals = Object.values(daysMap);
    const avgConfirmedIntake =
      dayCals.length > 0 ? Math.round(dayCals.reduce((a, b) => a + b, 0) / dayCals.length) : null;

    const recentWeighIns = bodyMetrics
      .filter((m) => new Date(`${m.loggedDate}T00:00:00Z`) >= cutoff14d)
      .map((m) => ({ loggedDate: m.loggedDate, weightKg: m.weightKg }))
      .sort((a, b) => a.loggedDate.localeCompare(b.loggedDate));

    const waistEntries = bodyMetrics
      .filter((m) => m.waistCm != null && new Date(`${m.loggedDate}T00:00:00Z`) >= cutoff14d)
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
  }, [defaultToday, goals.calorieTargetKcal, foodEntries, bodyMetrics]);

  const fatigueAdvisory = useMemo(() => {
    const now = new Date(`${defaultToday}T00:00:00Z`);
    const cutoff7d = new Date(now);
    cutoff7d.setUTCDate(cutoff7d.getUTCDate() - 7);

    const gymSessions7d = workoutSessions.filter(
      (s) => new Date(`${s.loggedDate}T00:00:00Z`) >= cutoff7d
    ).length;
    const badmintonMinutes7d = activitySessions
      .filter(
        (s) =>
          s.activityType === "badminton" && new Date(`${s.loggedDate}T00:00:00Z`) >= cutoff7d
      )
      .reduce((sum, s) => sum + s.durationMinutes, 0);
    const runningKm7d = activitySessions
      .filter(
        (s) =>
          s.activityType === "running" &&
          new Date(`${s.loggedDate}T00:00:00Z`) >= cutoff7d &&
          s.distanceKm != null
      )
      .reduce((sum, s) => sum + (s.distanceKm ?? 0), 0);

    return evaluateMultisportFatigue(
      gymSessions7d,
      badmintonMinutes7d,
      runningKm7d,
      hasTodayCheckIn && todayCheckIn ? todayCheckIn.sleepHours : null,
      hasTodayCheckIn && todayCheckIn ? todayCheckIn.soreness : null,
      hasTodayCheckIn && todayCheckIn ? todayCheckIn.fatigue : null
    );
  }, [defaultToday, workoutSessions, activitySessions, todayCheckIn, hasTodayCheckIn]);

  const { totalSessionsLast30, totalVolumeLast30, totalPRs } = useMemo(() => {
    const cutoff = new Date(`${defaultToday}T00:00:00Z`);
    cutoff.setUTCDate(cutoff.getUTCDate() - 30);
    const recent = workoutSessions.filter((s) => new Date(`${s.loggedDate}T00:00:00Z`) >= cutoff);
    const vol = recent
      .flatMap((s) => s.sets)
      .filter((s) => s.isCompleted && !s.isBodyweight)
      .reduce((sum, s) => sum + s.reps * s.loadKg, 0);
    const prs = workoutSessions.flatMap((s) => s.sets).filter((s) => s.isPr).length;
    return { totalSessionsLast30: recent.length, totalVolumeLast30: vol, totalPRs: prs };
  }, [defaultToday, workoutSessions]);

  const { totalRunKm, totalBadmintonMin } = useMemo(() => {
    const runKm = activitySessions
      .filter((s) => s.activityType === "running" && s.distanceKm != null)
      .reduce((sum, s) => sum + (s.distanceKm ?? 0), 0);
    const badMin = activitySessions
      .filter((s) => s.activityType === "badminton")
      .reduce((sum, s) => sum + s.durationMinutes, 0);
    return { totalRunKm: runKm, totalBadmintonMin: badMin };
  }, [activitySessions]);

  const avgWeeklyProteinG = useMemo(() => {
    const today = new Date(`${defaultToday}T00:00:00Z`);
    const daysWithEntries: Record<string, number> = {};
    foodEntries.forEach((e) => {
      const entryDate = new Date(`${e.loggedDate}T00:00:00Z`);
      const diffDays = (today.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24);
      const isConf =
        e.is_confirmed !== undefined ? Boolean(e.is_confirmed) : Boolean(e.isConfirmed);
      if (diffDays <= 7 && isConf) {
        daysWithEntries[e.loggedDate] =
          (daysWithEntries[e.loggedDate] || 0) + e.proteinG * e.quantity;
      }
    });
    const dayValues = Object.values(daysWithEntries);
    if (dayValues.length === 0) return null;
    return Math.round(dayValues.reduce((a, b) => a + b, 0) / dayValues.length);
  }, [defaultToday, foodEntries]);

  const resetWeightForm = () => {
    setWeightInput("");
    setWaistInput("");
    setChestInput("");
    setArmInput("");
    setWeightNotes("");
    setWeightDate(defaultToday);
    setShowWeightForm(false);
    document.getElementById("progress-weight-trigger")?.focus();
  };

  const resetPhotoForm = () => {
    setPhotoUrl("");
    setPhotoNotes("");
    setPhotoWeight(initialPhotoWeight);
    setPhotoDate(defaultToday);
    setShowPhotoForm(false);
    document.getElementById("progress-photo-trigger")?.focus();
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
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
      noticeTimerRef.current = setTimeout(() => setAppliedTargetNotice(null), 5000);
    }
  };

  return (
    <div className="space-y-6">
      <ProgressHeaderActions
        isDemoFixtureActive={isDemoFixtureActive}
        appliedTargetNotice={appliedTargetNotice}
        onToggleDemo={() => (isDemoFixtureActive ? resetDemoFixture() : loadDemoFixture())}
        onTogglePhotoForm={() => (showPhotoForm ? resetPhotoForm() : setShowPhotoForm(true))}
        onToggleWeightForm={() => (showWeightForm ? resetWeightForm() : setShowWeightForm(true))}
      />

      <ProgressKeyStatsGrid
        latestWeight={latestWeight}
        profileWeightKg={profile.weightKg}
        weightTrend={weightTrend}
        bodyMetricsCount={bodyMetrics.length}
        avgWeeklyProteinG={avgWeeklyProteinG}
        proteinTargetG={goals.proteinTargetG ?? null}
        bmi={bmi}
      />

      <LeanBulkCalibrationCard
        calibration={leanBulkCalibration}
        referenceWeightKg={latestWeight?.weightKg ?? profile.weightKg}
        onApplyTarget={handleApplyCalibratedTarget}
      />

      <MultiSportFatigueCard advisory={fatigueAdvisory} />

      <ProgressPhotosSection
        progressPhotos={progressPhotos}
        showPhotoForm={showPhotoForm}
        photoDate={photoDate}
        photoWeight={photoWeight}
        photoUrl={photoUrl}
        photoNotes={photoNotes}
        compareIdA={compareIdA}
        compareIdB={compareIdB}
        onPhotoDateChange={setPhotoDate}
        onPhotoWeightChange={setPhotoWeight}
        onPhotoUrlChange={setPhotoUrl}
        onPhotoNotesChange={setPhotoNotes}
        onCompareIdAChange={setCompareIdA}
        onCompareIdBChange={setCompareIdB}
        onSubmitPhoto={(payload) => {
          addProgressPhoto({ ...payload, category: "progress" });
          resetPhotoForm();
        }}
        onCancelPhotoForm={resetPhotoForm}
        onDeletePhoto={deleteProgressPhoto}
      />

      {showWeightForm && (
        <ProgressWeighInDrawer
          weightDate={weightDate}
          weightInput={weightInput}
          waistInput={waistInput}
          chestInput={chestInput}
          armInput={armInput}
          weightNotes={weightNotes}
          onWeightDateChange={setWeightDate}
          onWeightInputChange={setWeightInput}
          onWaistInputChange={setWaistInput}
          onChestInputChange={setChestInput}
          onArmInputChange={setArmInput}
          onWeightNotesChange={setWeightNotes}
          onSubmit={(metric) => {
            addBodyMetric(metric);
            resetWeightForm();
          }}
          onCancel={resetWeightForm}
        />
      )}

      <WeightTrendSection weightTrend={weightTrend} bodyMetricsCount={bodyMetrics.length} />

      <ProgressBodyMetricsList bodyMetrics={bodyMetrics} onDeleteMetric={deleteBodyMetric} />

      <TrainingVolumeSection
        totalSessionsLast30={totalSessionsLast30}
        totalVolumeLast30={totalVolumeLast30}
        totalPRs={totalPRs}
        totalRunKm={totalRunKm}
        totalBadmintonMin={totalBadmintonMin}
        bmiDisclaimer={bmi.disclaimer}
      />
    </div>
  );
};
