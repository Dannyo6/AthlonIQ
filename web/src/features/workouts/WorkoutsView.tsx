import React, { useState, useRef, useEffect, useCallback } from "react";
import { Dumbbell, Plus, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAthloniqState } from "@/hooks/useAthloniqState";
import { WorkoutTemplate, ExerciseSet } from "@/types";
import {
  HOME_GYM_TEMPLATES,
  createBlankSet,
  SessionExercise,
} from "./constants";
import { useWorkoutFormDirty } from "./hooks/useWorkoutFormDirty";
import { WorkoutEquipmentBanner } from "./components/WorkoutEquipmentBanner";
import { WorkoutPlannedSession } from "./components/WorkoutPlannedSession";
import { WorkoutTemplatePicker } from "./components/WorkoutTemplatePicker";
import { WorkoutActiveSession } from "./components/WorkoutActiveSession";
import { WorkoutHistoryList } from "./components/WorkoutHistoryList";
import { WorkoutPersonalRecords } from "./components/WorkoutPersonalRecords";

export const WorkoutsView: React.FC = () => {
  const {
    equipment,
    profile,
    readiness,
    addWorkoutSession,
    deleteWorkoutSession,
    workoutSessions,
  } = useAthloniqState();

  const [activeTab, setActiveTab] = useState<"templates" | "active" | "history">(
    "templates"
  );
  const [selectedTemplate, setSelectedTemplate] = useState<WorkoutTemplate | null>(
    null
  );
  const [sessionTitle, setSessionTitle] = useState("");
  const [sessionExercises, setSessionExercises] = useState<SessionExercise[]>([]);
  const [sessionRpe, setSessionRpe] = useState<number | null>(null);
  const [sessionNotes, setSessionNotes] = useState("");
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);

  // Rest timer state
  const [restTimer, setRestTimer] = useState<number>(0);
  const [restRunning, setRestRunning] = useState(false);
  const [restPreset, setRestPreset] = useState<60 | 90 | 120>(90);
  const restIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Form dirty registration
  const hasLoggedSets = sessionExercises.some((ex) =>
    ex.sets.some(
      (s) =>
        s.isCompleted ||
        s.reps > 0 ||
        s.loadKg > 0 ||
        (s.rpe != null && s.rpe > 0)
    )
  );
  const hasTypedSessionNotes = Boolean(sessionNotes.trim());
  const hasUnsavedWorkout =
    activeTab === "active" && (hasLoggedSets || hasTypedSessionNotes);

  useWorkoutFormDirty(hasUnsavedWorkout);

  // Equipment lock validation
  const unconfirmedEquipment = equipment.filter((i) => !i.isConfirmed);
  const isEquipmentLocked =
    !profile.equipmentConfirmed ||
    unconfirmedEquipment.length > 0 ||
    equipment.some(
      (e) =>
        e.itemKey === "free_weights_70kg" &&
        (e.maxLoadKg === null || e.minIncrementKg === null)
    );

  // Rest timer interval logic
  useEffect(() => {
    if (!restRunning) {
      if (restIntervalRef.current) {
        clearInterval(restIntervalRef.current);
        restIntervalRef.current = null;
      }
      return;
    }

    restIntervalRef.current = setInterval(() => {
      setRestTimer((t) => {
        if (t <= 1) {
          setRestRunning(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      if (restIntervalRef.current) {
        clearInterval(restIntervalRef.current);
        restIntervalRef.current = null;
      }
    };
  }, [restRunning]);

  const startRestTimer = useCallback((seconds: number) => {
    setRestTimer(seconds);
    setRestRunning(true);
  }, []);

  const adjustRestTimer = (deltaSeconds: number) => {
    setRestTimer((t) => Math.max(0, t + deltaSeconds));
  };

  const startSession = (template: WorkoutTemplate) => {
    setSelectedTemplate(template);
    setSessionTitle(template.name);
    setSessionExercises(
      template.exercises.map((ex) => ({
        ...ex,
        sets: [createBlankSet(ex.exerciseName, 1, ex.equipmentKey === null)],
      }))
    );
    setSessionStartTime(new Date());
    setActiveTab("active");
  };

  const addSet = (exerciseId: string) => {
    setSessionExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const order = ex.sets.length + 1;
        return {
          ...ex,
          sets: [
            ...ex.sets,
            createBlankSet(ex.exerciseName, order, ex.equipmentKey === null),
          ],
        };
      })
    );
  };

  const updateSet = (
    exerciseId: string,
    setIndex: number,
    update: Partial<ExerciseSet>
  ) => {
    setSessionExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const newSets = ex.sets.map((s, i) =>
          i === setIndex ? { ...s, ...update } : s
        );
        return { ...ex, sets: newSets };
      })
    );
  };

  const removeSet = (exerciseId: string, setIndex: number) => {
    setSessionExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        return { ...ex, sets: ex.sets.filter((_, i) => i !== setIndex) };
      })
    );
  };

  const finishSession = () => {
    const durationMinutes = sessionStartTime
      ? Math.round((Date.now() - sessionStartTime.getTime()) / 60000)
      : null;

    const allSets: ExerciseSet[] = sessionExercises.flatMap((ex) => ex.sets);
    addWorkoutSession({
      loggedDate: new Date().toISOString().split("T")[0],
      title: sessionTitle || selectedTemplate?.name || "Custom Session",
      templateId: selectedTemplate?.id ?? null,
      durationMinutes,
      sessionRpe,
      completed: true,
      sets: allSets,
      notes: sessionNotes,
    });

    setSelectedTemplate(null);
    setSessionExercises([]);
    setSessionTitle("");
    setSessionRpe(null);
    setSessionNotes("");
    setSessionStartTime(null);
    setActiveTab("history");
  };

  // Determine today's sessions and scheduled template
  const todayStr = new Date().toISOString().split("T")[0];
  const todaySessions = workoutSessions.filter((s) => s.loggedDate === todayStr);
  const defaultTemplate = HOME_GYM_TEMPLATES[0];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-athloniq-border pb-5">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2 tracking-tight">
            <Dumbbell className="h-6 w-6 text-athloniq-lime" />
            Training & Progression Engine
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Equipment-constrained home-gym templates, live session logger, and
            deterministic overload engine.
          </p>
        </div>
        {activeTab === "templates" && (
          <Button
            variant="primary"
            className="min-h-[44px]"
            onClick={() => setActiveTab("active")}
          >
            <Plus className="h-4 w-4" /> Custom Session
          </Button>
        )}
        {activeTab === "active" && sessionExercises.length > 0 && (
          <Button
            variant="primary"
            className="min-h-[44px]"
            onClick={finishSession}
          >
            <CheckCircle2 className="h-4 w-4" /> Finish Session
          </Button>
        )}
      </div>

      {/* 1. Equipment-confirmation banner when unconfirmed */}
      <WorkoutEquipmentBanner isEquipmentLocked={isEquipmentLocked} />

      {/* View Tabs */}
      <div className="flex items-center gap-2 border-b border-athloniq-border pb-2 overflow-x-auto">
        {(["templates", "active", "history"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`min-h-[44px] inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-semibold transition-colors capitalize shrink-0 ${
              activeTab === tab
                ? "bg-athloniq-lime/15 text-athloniq-lime border border-athloniq-lime/40"
                : "text-slate-400 hover:text-white hover:bg-athloniq-surface"
            }`}
          >
            {tab === "templates"
              ? "Templates"
              : tab === "active"
              ? "Active Session"
              : "History"}
          </button>
        ))}
      </div>

      {/* 2 & 3: Templates Tab (Today's planned session + Template picker) */}
      {activeTab === "templates" && (
        <div className="space-y-6">
          <WorkoutPlannedSession
            todaySessions={todaySessions}
            readiness={readiness}
            defaultTemplate={defaultTemplate}
            onStartTemplate={startSession}
          />
          <WorkoutTemplatePicker
            templates={HOME_GYM_TEMPLATES}
            onStartTemplate={startSession}
          />
        </div>
      )}

      {/* 4 & 7: Active Session Tab (Active workout + rest timer + progression suggestions) */}
      {activeTab === "active" && (
        <WorkoutActiveSession
          sessionTitle={sessionTitle}
          onSessionTitleChange={setSessionTitle}
          sessionStartTime={sessionStartTime}
          sessionExercises={sessionExercises}
          sessionRpe={sessionRpe}
          onSessionRpeChange={setSessionRpe}
          sessionNotes={sessionNotes}
          onSessionNotesChange={setSessionNotes}
          restTimer={restTimer}
          restRunning={restRunning}
          restPreset={restPreset}
          onStartRestTimer={startRestTimer}
          onAdjustRestTimer={adjustRestTimer}
          onToggleRestRunning={() => setRestRunning(!restRunning)}
          onResetRestTimer={() => {
            setRestTimer(0);
            setRestRunning(false);
          }}
          onSelectRestPreset={(preset) => {
            setRestPreset(preset);
            startRestTimer(preset);
          }}
          onAddSet={addSet}
          onUpdateSet={updateSet}
          onRemoveSet={removeSet}
          onFinishSession={finishSession}
          onBrowseTemplates={() => setActiveTab("templates")}
          equipment={equipment}
          profile={profile}
          readiness={readiness}
        />
      )}

      {/* 5 & 6: History Tab (Session history + PRs from deterministic lib functions) */}
      {activeTab === "history" && (
        <div className="space-y-6">
          <WorkoutHistoryList
            workoutSessions={workoutSessions}
            onDeleteSession={deleteWorkoutSession}
            onBrowseTemplates={() => setActiveTab("templates")}
          />
          <WorkoutPersonalRecords workoutSessions={workoutSessions} />
        </div>
      )}
    </div>
  );
};
