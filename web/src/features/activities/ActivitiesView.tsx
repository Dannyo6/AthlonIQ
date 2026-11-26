import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useAthloniqState } from "@/hooks/useAthloniqState";
import { calculateRunningPace } from "@/lib/calculations";
import { resolveDateInTimezone } from "@/lib/weeklyConsistency";
import { ActivityType, BadmintonFormat } from "@/types";
import { Activity, Plus } from "lucide-react";
import { CALISTHENICS_SKILLS } from "./constants";
import { useActivityFormDirty } from "./hooks/useActivityFormDirty";
import { ActivityWeeklySummary } from "./components/ActivityWeeklySummary";
import { ActivityLogForm } from "./components/ActivityLogForm";
import { ActivityHistoryList } from "./components/ActivityHistoryList";

export const ActivitiesView: React.FC = () => {
  const {
    activitySessions,
    preferences,
    addActivitySession,
    deleteActivitySession,
    getWeeklyActivities,
  } = useAthloniqState();

  const timezone = preferences?.timezone ?? "Asia/Kolkata";

  const [activeMode, setActiveMode] = useState<ActivityType>("running");
  const [filterType, setFilterType] = useState<ActivityType | "all">("all");
  const [showForm, setShowForm] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [logDate, setLogDate] = useState(() => resolveDateInTimezone(undefined, timezone));
  const [duration, setDuration] = useState("");
  const [effort, setEffort] = useState<number | null>(7);
  const [notes, setNotes] = useState("");
  const [distance, setDistance] = useState("");
  const [matchFormat, setMatchFormat] = useState<BadmintonFormat>("singles");
  const [skill, setSkill] = useState<string>(CALISTHENICS_SKILLS[0]);
  const [progressionLevel, setProgressionLevel] = useState("");
  const [setsCount, setSetsCount] = useState("");
  const [repsOrHold, setRepsOrHold] = useState("");

  const hasUnsavedInput = Boolean(
    showForm &&
      (duration.trim() !== "" ||
        distance.trim() !== "" ||
        notes.trim() !== "" ||
        progressionLevel.trim() !== "" ||
        setsCount.trim() !== "" ||
        repsOrHold.trim() !== "" ||
        effort !== 7 ||
        matchFormat !== "singles")
  );
  useActivityFormDirty(hasUnsavedInput);

  const livePace = useMemo(() => {
    const parsedKm = distance.trim() === "" ? null : Number(distance);
    const parsedDur = duration.trim() === "" ? null : Number(duration);
    if (
      activeMode === "running" &&
      parsedKm !== null &&
      parsedDur !== null &&
      Number.isFinite(parsedKm) &&
      Number.isFinite(parsedDur) &&
      parsedKm > 0 &&
      parsedDur > 0
    ) {
      try {
        return calculateRunningPace(parsedKm, parsedDur);
      } catch {
        return null;
      }
    }
    return null;
  }, [activeMode, distance, duration]);

  const resetForm = () => {
    setDuration("");
    setDistance("");
    setNotes("");
    setEffort(7);
    setMatchFormat("singles");
    setSkill(CALISTHENICS_SKILLS[0]);
    setProgressionLevel("");
    setSetsCount("");
    setRepsOrHold("");
    setValidationError(null);
    setShowForm(false);
  };

  const handleSubmit = () => {
    const dur = duration.trim() === "" ? NaN : Number(duration);
    if (!Number.isFinite(dur) || dur <= 0) {
      setValidationError("Enter a duration greater than 0 minutes.");
      return;
    }
    setValidationError(null);

    const base = {
      loggedDate: logDate,
      activityType: activeMode,
      durationMinutes: dur,
      perceivedEffort: effort,
      routeOrNotes: notes,
    };

    if (activeMode === "running") {
      const km = distance.trim() === "" ? NaN : Number(distance);
      addActivitySession({
        ...base,
        distanceKm: Number.isFinite(km) && km > 0 ? km : null,
        paceFormatted: livePace?.paceFormatted ?? null,
      });
    } else if (activeMode === "badminton") {
      addActivitySession({ ...base, matchFormat });
    } else if (activeMode === "calisthenics") {
      const parsedSets = setsCount.trim() === "" ? null : parseInt(setsCount, 10);
      const parsedReps = repsOrHold.trim() === "" ? null : parseInt(repsOrHold, 10);
      addActivitySession({
        ...base,
        skillName: skill,
        progressionLevel: progressionLevel.trim() || null,
        setsCount: parsedSets !== null && Number.isFinite(parsedSets) ? parsedSets : null,
        repsOrHoldSec: parsedReps !== null && Number.isFinite(parsedReps) ? parsedReps : null,
      });
    } else {
      addActivitySession(base);
    }

    resetForm();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-athloniq-border pb-5">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2 tracking-tight">
            <Activity className="h-6 w-6 text-athloniq-lime" />
            Sports &amp; Activity Tracker
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Running, Badminton, Calisthenics. No fabricated calorie burn or heart rate.
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          className="min-h-[44px]"
          onClick={() => (showForm ? resetForm() : setShowForm(true))}
        >
          <Plus className="h-4 w-4" /> Log Activity
        </Button>
      </div>

      <ActivityWeeklySummary weeklyActivities={getWeeklyActivities()} />

      {showForm && (
        <ActivityLogForm
          activeMode={activeMode}
          logDate={logDate}
          duration={duration}
          effort={effort}
          notes={notes}
          distance={distance}
          matchFormat={matchFormat}
          skill={skill}
          progressionLevel={progressionLevel}
          setsCount={setsCount}
          repsOrHold={repsOrHold}
          livePace={livePace}
          validationError={validationError}
          onModeChange={(mode) => {
            setActiveMode(mode);
            setValidationError(null);
          }}
          onLogDateChange={setLogDate}
          onDurationChange={(val) => {
            setDuration(val);
            if (validationError) setValidationError(null);
          }}
          onEffortChange={setEffort}
          onNotesChange={setNotes}
          onDistanceChange={setDistance}
          onMatchFormatChange={setMatchFormat}
          onSkillChange={setSkill}
          onProgressionLevelChange={setProgressionLevel}
          onSetsCountChange={setSetsCount}
          onRepsOrHoldChange={setRepsOrHold}
          onSubmit={handleSubmit}
          onCancel={resetForm}
        />
      )}

      <ActivityHistoryList
        activities={activitySessions}
        filterType={filterType}
        onFilterChange={setFilterType}
        onDelete={deleteActivitySession}
      />
    </div>
  );
};
