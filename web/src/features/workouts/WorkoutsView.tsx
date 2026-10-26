import React, { useState, useRef, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Badge, ProvenanceBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAthloniqState } from "@/hooks/useAthloniqState";
import { useUnsavedWork } from "@/features/navigation/UnsavedWorkContext";
import { gatedProgressionSuggestion } from "@/lib";
import {
  WorkoutTemplate,
  ExerciseSet,
  TemplateExercise,
  ProgressionSuggestion,
} from "@/types";
import {
  Dumbbell,
  Plus,
  AlertTriangle,
  Timer,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  TrendingUp,
  Star,
  X,
  Clock,
  Trash2,
} from "lucide-react";

const HOME_GYM_TEMPLATES: WorkoutTemplate[] = [
  {
    id: "tmpl-upper-a",
    name: "Upper A: Horizontal Push/Pull",
    focus: "Chest, Lats, Side Delts",
    estimatedDurationMin: 65,
    exercises: [
      { id: "e1", exerciseName: "Barbell Bench Press", category: "compound", equipmentKey: "bench", targetSets: 4, targetRepsMin: 6, targetRepsMax: 10, restSeconds: 120, sortOrder: 1 },
      { id: "e2", exerciseName: "Bent-Over Barbell Row", category: "compound", equipmentKey: "free_weights_70kg", targetSets: 4, targetRepsMin: 6, targetRepsMax: 10, restSeconds: 120, sortOrder: 2 },
      { id: "e3", exerciseName: "Dumbbell Incline Press", category: "isolation", equipmentKey: "bench", targetSets: 3, targetRepsMin: 8, targetRepsMax: 12, restSeconds: 90, sortOrder: 3 },
      { id: "e4", exerciseName: "Lat Pulldown", category: "compound", equipmentKey: "lat_pulldown_station", targetSets: 3, targetRepsMin: 8, targetRepsMax: 12, restSeconds: 90, sortOrder: 4 },
      { id: "e5", exerciseName: "Dumbbell Lateral Raise", category: "isolation", equipmentKey: "free_weights_70kg", targetSets: 3, targetRepsMin: 12, targetRepsMax: 15, restSeconds: 60, sortOrder: 5 },
      { id: "e6", exerciseName: "Cable/Band Face Pull", category: "isolation", equipmentKey: "lat_pulldown_station", targetSets: 3, targetRepsMin: 12, targetRepsMax: 15, restSeconds: 60, sortOrder: 6 },
    ],
  },
  {
    id: "tmpl-lower-a",
    name: "Lower A: Squat & Hinge",
    focus: "Quads, Hamstrings, Glutes",
    estimatedDurationMin: 75,
    exercises: [
      { id: "e7", exerciseName: "Barbell Back Squat", category: "compound", equipmentKey: "squat_rack", targetSets: 4, targetRepsMin: 5, targetRepsMax: 8, restSeconds: 150, sortOrder: 1 },
      { id: "e8", exerciseName: "Romanian Deadlift", category: "compound", equipmentKey: "free_weights_70kg", targetSets: 3, targetRepsMin: 8, targetRepsMax: 12, restSeconds: 120, sortOrder: 2 },
      { id: "e9", exerciseName: "Dumbbell Goblet Squat", category: "compound", equipmentKey: "free_weights_70kg", targetSets: 3, targetRepsMin: 10, targetRepsMax: 15, restSeconds: 90, sortOrder: 3 },
      { id: "e10", exerciseName: "Nordic Curl / Leg Curl", category: "isolation", equipmentKey: null, targetSets: 3, targetRepsMin: 6, targetRepsMax: 10, restSeconds: 90, sortOrder: 4 },
      { id: "e11", exerciseName: "Standing Calf Raise", category: "isolation", equipmentKey: "free_weights_70kg", targetSets: 4, targetRepsMin: 12, targetRepsMax: 20, restSeconds: 60, sortOrder: 5 },
    ],
  },
  {
    id: "tmpl-upper-b",
    name: "Upper B: Vertical Push/Pull & Dips",
    focus: "Shoulders, Triceps, Biceps, Dips",
    estimatedDurationMin: 60,
    exercises: [
      { id: "e12", exerciseName: "Overhead Press (BB/DB)", category: "compound", equipmentKey: "free_weights_70kg", targetSets: 4, targetRepsMin: 6, targetRepsMax: 10, restSeconds: 120, sortOrder: 1 },
      { id: "e13", exerciseName: "Parallel Bar Dips", category: "compound", equipmentKey: "dips_station", targetSets: 4, targetRepsMin: 8, targetRepsMax: 12, restSeconds: 90, sortOrder: 2, },
      { id: "e14", exerciseName: "Pull-ups / Chin-ups", category: "compound", equipmentKey: null, targetSets: 4, targetRepsMin: 6, targetRepsMax: 12, restSeconds: 90, sortOrder: 3 },
      { id: "e15", exerciseName: "Dumbbell Curl", category: "isolation", equipmentKey: "free_weights_70kg", targetSets: 3, targetRepsMin: 10, targetRepsMax: 15, restSeconds: 60, sortOrder: 4 },
      { id: "e16", exerciseName: "Overhead Tricep Extension", category: "isolation", equipmentKey: "free_weights_70kg", targetSets: 3, targetRepsMin: 10, targetRepsMax: 15, restSeconds: 60, sortOrder: 5 },
    ],
  },
  {
    id: "tmpl-full-body",
    name: "Full Body & Calisthenics Hybrid",
    focus: "Full Body, Skill Work",
    estimatedDurationMin: 70,
    exercises: [
      { id: "e17", exerciseName: "Barbell Deadlift", category: "compound", equipmentKey: "free_weights_70kg", targetSets: 3, targetRepsMin: 5, targetRepsMax: 8, restSeconds: 150, sortOrder: 1 },
      { id: "e18", exerciseName: "Push-ups (Weighted)", category: "compound", equipmentKey: null, targetSets: 3, targetRepsMin: 10, targetRepsMax: 15, restSeconds: 60, sortOrder: 2 },
      { id: "e19", exerciseName: "Pull-ups", category: "compound", equipmentKey: null, targetSets: 3, targetRepsMin: 6, targetRepsMax: 12, restSeconds: 90, sortOrder: 3 },
      { id: "e20", exerciseName: "Hanging Leg Raises", category: "isolation", equipmentKey: null, targetSets: 3, targetRepsMin: 10, targetRepsMax: 15, restSeconds: 60, sortOrder: 4 },
      { id: "e21", exerciseName: "L-Sit Hold", category: "skill", equipmentKey: null, targetSets: 3, targetRepsMin: 10, targetRepsMax: 30, restSeconds: 90, sortOrder: 5 },
    ],
  },
];

interface SessionExercise extends TemplateExercise {
  sets: ExerciseSet[];
}

function blankSet(exerciseName: string, order: number, isBodyweight: boolean): ExerciseSet {
  return {
    id: `set-${Date.now()}-${order}`,
    exerciseName,
    setOrder: order,
    reps: 0,
    loadKg: 0,
    isBodyweight,
    rpe: null,
    rir: null,
    isCompleted: false,
    isPr: false,
  };
}

export const WorkoutsView: React.FC = () => {
  const {
    equipment,
    profile,
    readiness,
    addWorkoutSession,
    deleteWorkoutSession,
    workoutSessions,
  } = useAthloniqState();
  const [activeTab, setActiveTab] = useState<"templates" | "active" | "history">("templates");
  const [selectedTemplate, setSelectedTemplate] = useState<WorkoutTemplate | null>(null);
  const [sessionTitle, setSessionTitle] = useState("");
  const [sessionExercises, setSessionExercises] = useState<SessionExercise[]>([]);
  const [sessionRpe, setSessionRpe] = useState<number | null>(null);
  const [sessionNotes, setSessionNotes] = useState("");
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);

  const { setFormDirty } = useUnsavedWork();

  const hasLoggedSets = sessionExercises.some((ex) =>
    ex.sets.some((s) => s.isCompleted || s.reps > 0 || s.loadKg > 0 || (s.rpe != null && s.rpe > 0))
  );
  const hasTypedSessionNotes = Boolean(sessionNotes.trim());
  const hasUnsavedWorkout = activeTab === "active" && (hasLoggedSets || hasTypedSessionNotes);

  useEffect(() => {
    setFormDirty("workout-session", hasUnsavedWorkout, "Workout Session");
    return () => {
      setFormDirty("workout-session", false);
    };
  }, [hasUnsavedWorkout, setFormDirty]);

  // Rest timer
  const [restTimer, setRestTimer] = useState<number>(0);
  const [restRunning, setRestRunning] = useState(false);
  const [restPreset, setRestPreset] = useState<60 | 90 | 120>(90);
  const restIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const unconfirmedEquipment = equipment.filter((i) => !i.isConfirmed);
  const freeWeights = equipment.find((e) => e.itemKey === "free_weights_70kg");

  // Rest timer logic — clean single interval on unmount
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
        sets: [blankSet(ex.exerciseName, 1, ex.equipmentKey === null)],
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
            blankSet(ex.exerciseName, order, ex.equipmentKey === null),
          ],
        };
      })
    );
  };

  const updateSet = (exerciseId: string, setIndex: number, update: Partial<ExerciseSet>) => {
    setSessionExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const newSets = ex.sets.map((s, i) => (i === setIndex ? { ...s, ...update } : s));
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

  const getProgressionSuggestion = (ex: SessionExercise): ProgressionSuggestion | null => {
    if (ex.sets.length === 0) return null;
    const completed = ex.sets.filter((s) => s.isCompleted);
    if (completed.length === 0) return null;

    const maxLoad = freeWeights?.maxLoadKg ?? null;
    const minIncrement = freeWeights?.minIncrementKg ?? null;
    return gatedProgressionSuggestion(
      maxLoad,
      minIncrement,
      profile.equipmentConfirmed,
      completed.map((s) => ({ reps: s.reps, loadKg: s.loadKg, rpe: s.rpe, isBodyweight: s.isBodyweight })),
      ex.targetRepsMax,
      ex.exerciseName,
      readiness ? readiness.status : "Moderate"
    );
  };

  const restFormatted = `${Math.floor(restTimer / 60)}:${String(restTimer % 60).padStart(2, "0")}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E2330] pb-5">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2 tracking-tight">
            <Dumbbell className="h-6 w-6 text-athloniq-lime" />
            Training & Progression Engine
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Equipment-constrained home-gym templates, live session logger, and deterministic overload engine.
          </p>
        </div>
        {activeTab === "templates" && (
          <Button variant="primary" onClick={() => setActiveTab("active")}>
            <Plus className="h-4 w-4" /> Custom Session
          </Button>
        )}
        {activeTab === "active" && sessionExercises.length > 0 && (
          <Button variant="primary" onClick={finishSession}>
            <CheckCircle2 className="h-4 w-4" /> Finish Session
          </Button>
        )}
      </div>

      {/* Equipment Warning */}
      {unconfirmedEquipment.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-bold text-white">
                Confirm your 70 kg Home Gym before applying equipment-specific load progressions
              </div>
              <p className="text-xs text-amber-300/90 mt-0.5">
                {unconfirmedEquipment.length} item(s) unconfirmed — load progression is blocked until verified in Profile → Equipment.
              </p>
            </div>
          </div>
          <ProvenanceBadge provenance="unconfirmed_equipment" />
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#1E2330] pb-2">
        {(["templates", "active", "history"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors capitalize ${
              activeTab === tab
                ? "bg-athloniq-lime/15 text-athloniq-lime border border-athloniq-lime/40"
                : "text-slate-400 hover:text-white hover:bg-[#181D2A]"
            }`}
          >
            {tab === "templates" ? "Templates" : tab === "active" ? "Active Session" : "History"}
          </button>
        ))}
      </div>

      {/* Templates Tab */}
      {activeTab === "templates" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {HOME_GYM_TEMPLATES.map((tmpl) => (
            <Card key={tmpl.id} className="space-y-4 hover:border-slate-700 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-white">{tmpl.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">{tmpl.focus}</p>
                </div>
                <Badge variant="lime">Est. {tmpl.estimatedDurationMin}m</Badge>
              </div>
              <div className="space-y-1.5 border-t border-[#1E2330] pt-3">
                {tmpl.exercises.map((ex, idx) => (
                  <div key={ex.id} className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">{idx + 1}. {ex.exerciseName}</span>
                    <span className="text-slate-500 font-mono tabular-nums">
                      {ex.targetSets}×{ex.targetRepsMin}–{ex.targetRepsMax}
                    </span>
                  </div>
                ))}
              </div>
              <Button variant="secondary" className="w-full" onClick={() => startSession(tmpl)}>
                <Play className="h-4 w-4" /> Start This Template
              </Button>
            </Card>
          ))}
        </div>
      )}

      {/* Active Session Tab */}
      {activeTab === "active" && (
        <div className="space-y-6">
          {sessionExercises.length === 0 && (
            <div className="text-center py-16 text-slate-400 space-y-3">
              <Dumbbell className="h-12 w-12 mx-auto text-slate-600" />
              <p>Choose a template or start a custom session.</p>
              <Button variant="outline" onClick={() => setActiveTab("templates")}>
                Browse Templates
              </Button>
            </div>
          )}

          {sessionExercises.length > 0 && (
            <>
              {/* Session Header */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl bg-[#12151E] border border-[#1E2330]">
                <div className="flex-1">
                  <input
                    value={sessionTitle}
                    onChange={(e) => setSessionTitle(e.target.value)}
                    className="w-full bg-transparent text-lg font-black text-white focus:outline-none border-b border-transparent focus:border-athloniq-lime/40 pb-0.5"
                  />
                  <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    {sessionStartTime ? `Started ${sessionStartTime.toLocaleTimeString()}` : "Not started"}
                  </div>
                </div>
                {/* Rest Timer */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 bg-[#0C0E15] p-2.5 rounded-xl border border-white/[0.06]">
                  <div className="flex items-center gap-1.5 mr-1">
                    <Timer className="h-4 w-4 text-athloniq-lime" />
                    <div className={`font-mono text-2xl font-black tabular-nums ${restTimer > 0 ? "text-athloniq-lime" : "text-slate-500"}`}>
                      {restFormatted}
                    </div>
                  </div>

                  {/* Quick adjustments: -15s and +15s */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => adjustRestTimer(-15)}
                      className="px-2 py-1 rounded-lg text-[10px] font-mono font-bold bg-[#141824] text-slate-300 border border-white/[0.08] hover:text-white hover:border-white/[0.20]"
                      title="Decrease 15 seconds"
                    >
                      -15s
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustRestTimer(15)}
                      className="px-2 py-1 rounded-lg text-[10px] font-mono font-bold bg-[#141824] text-slate-300 border border-white/[0.08] hover:text-white hover:border-white/[0.20]"
                      title="Add 15 seconds"
                    >
                      +15s
                    </button>
                  </div>

                  {/* Presets */}
                  <div className="flex items-center gap-1">
                    {([60, 90, 120] as const).map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => {
                          setRestPreset(sec);
                          startRestTimer(sec);
                        }}
                        className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                          restPreset === sec
                            ? "bg-athloniq-lime/15 text-athloniq-lime border border-athloniq-lime/40 font-black"
                            : "bg-[#141824] text-slate-400 border border-white/[0.06] hover:text-white"
                        }`}
                      >
                        {sec}s
                      </button>
                    ))}
                  </div>

                  {/* Play/Pause & Reset */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setRestRunning(!restRunning)}
                      className={`p-1.5 rounded-lg border transition-all ${
                        restRunning
                          ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                          : "bg-athloniq-lime/15 border-athloniq-lime/40 text-athloniq-lime"
                      }`}
                      title={restRunning ? "Pause timer" : "Start timer"}
                    >
                      {restRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRestTimer(0);
                        setRestRunning(false);
                      }}
                      className="p-1.5 rounded-lg bg-[#141824] border border-white/[0.08] text-slate-400 hover:text-white"
                      title="Reset timer"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Exercises */}
              {sessionExercises.map((ex) => {
                const suggestion = getProgressionSuggestion(ex);
                return (
                  <Card key={ex.id} className="space-y-3">
                    <div className="flex items-center justify-between border-b border-[#1E2330] pb-3">
                      <div>
                        <h3 className="font-bold text-white">{ex.exerciseName}</h3>
                        <div className="text-xs text-slate-400 font-mono mt-0.5 flex flex-wrap items-center gap-x-2">
                          <span>Target: {ex.targetSets}×{ex.targetRepsMin}–{ex.targetRepsMax} · Rest: {ex.restSeconds}s</span>
                          {ex.equipmentKey && (
                            <span className="text-slate-500">
                              · Equipment: {equipment.find((e) => e.itemKey === ex.equipmentKey)?.itemName ?? ex.equipmentKey} (
                              {equipment.find((e) => e.itemKey === ex.equipmentKey)?.maxLoadKg != null
                                ? `${equipment.find((e) => e.itemKey === ex.equipmentKey)?.maxLoadKg} kg cap`
                                : "Load not set"}
                              )
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => startRestTimer(ex.restSeconds)}
                        className="p-1.5 rounded-lg bg-[#181D2A] border border-[#1E2330] text-slate-400 hover:text-athloniq-lime text-xs font-mono"
                      >
                        <Timer className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Progression Suggestion Pill */}
                    {suggestion && suggestion.action !== "maintain" && (
                      <div className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                        suggestion.action === "increase_load"
                          ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                          : suggestion.action === "increase_reps_or_tempo"
                          ? "bg-athloniq-lime/10 border border-athloniq-lime/30 text-athloniq-lime"
                          : suggestion.action === "confirm_equipment_first"
                          ? "bg-amber-500/10 border border-amber-500/30 text-amber-300"
                          : "bg-orange-500/10 border border-orange-500/30 text-orange-300"
                      }`}>
                        <TrendingUp className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="font-bold uppercase tracking-wide text-[10px] mb-0.5">
                            {suggestion.action === "increase_load" ? `+${(suggestion.newLoadKg! - (ex.sets[ex.sets.length - 1]?.loadKg ?? 0)).toFixed(2)} kg suggestion` :
                             suggestion.action === "increase_reps_or_tempo" ? "Reps / Tempo progression" :
                             suggestion.action === "confirm_equipment_first" ? "⚠ Confirm Equipment First" : "Maintain / Deload"}
                          </div>
                          <div className="leading-relaxed text-[11px] opacity-90">
                            {suggestion.explanation}
                          </div>
                          {suggestion.requiresUserConfirmation && (
                            <div className="mt-1.5 text-[10px] opacity-60 font-mono">
                              REQUIRES USER CONFIRMATION — weights are never auto-mutated.
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Set Rows */}
                    <div className="space-y-2">
                      <div className="grid grid-cols-12 gap-1 text-[10px] font-bold text-slate-500 uppercase px-1">
                        <div className="col-span-1">Set</div>
                        <div className="col-span-3">Load (kg)</div>
                        <div className="col-span-2">Reps</div>
                        <div className="col-span-2">RPE</div>
                        <div className="col-span-2">Done</div>
                        <div className="col-span-1">PR</div>
                        <div className="col-span-1"></div>
                      </div>
                      {ex.sets.map((set, idx) => (
                        <div key={set.id} className="grid grid-cols-12 gap-1 items-center">
                          <div className="col-span-1 text-xs font-mono text-slate-400 tabular-nums">{idx + 1}</div>
                          <div className="col-span-3">
                            {set.isBodyweight ? (
                              <span className="text-xs text-slate-400 font-mono">BW</span>
                            ) : (
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                value={set.loadKg === 0 ? "" : set.loadKg}
                                placeholder="0"
                                onChange={(e) => {
                                  const val = e.target.value;
                                  updateSet(ex.id, idx, {
                                    loadKg: val === "" ? 0 : parseFloat(val) || 0,
                                  });
                                }}
                                className="w-full bg-[#181D2A] border border-[#1E2330] rounded-lg px-2 py-1 text-xs text-white font-mono focus:border-athloniq-lime focus:outline-none tabular-nums"
                              />
                            )}
                          </div>
                          <div className="col-span-2">
                            <input
                              type="number"
                              min="0"
                              value={set.reps === 0 ? "" : set.reps}
                              placeholder="0"
                              onChange={(e) => {
                                const val = e.target.value;
                                updateSet(ex.id, idx, {
                                  reps: val === "" ? 0 : parseInt(val, 10) || 0,
                                });
                              }}
                              className="w-full bg-[#181D2A] border border-[#1E2330] rounded-lg px-2 py-1 text-xs text-white font-mono focus:border-athloniq-lime focus:outline-none tabular-nums"
                            />
                          </div>
                          <div className="col-span-2">
                            <input
                              type="number"
                              min="1"
                              max="10"
                              step="0.5"
                              value={set.rpe ?? ""}
                              placeholder="–"
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === "") {
                                  updateSet(ex.id, idx, { rpe: null });
                                } else {
                                  const n = parseFloat(val);
                                  updateSet(ex.id, idx, {
                                    rpe: isNaN(n) ? null : Math.min(10, Math.max(1, n)),
                                  });
                                }
                              }}
                              className="w-full bg-[#181D2A] border border-[#1E2330] rounded-lg px-2 py-1 text-xs text-white font-mono focus:border-athloniq-lime focus:outline-none tabular-nums"
                            />
                          </div>
                          <div className="col-span-2 flex justify-center">
                            <input
                              type="checkbox"
                              checked={set.isCompleted}
                              onChange={(e) => updateSet(ex.id, idx, { isCompleted: e.target.checked })}
                              className="w-4 h-4 accent-athloniq-lime"
                            />
                          </div>
                          <div className="col-span-1 flex justify-center">
                            {set.isPr && <Star className="h-3.5 w-3.5 text-amber-400" />}
                          </div>
                          <div className="col-span-1 flex justify-center">
                            <button
                              onClick={() => removeSet(ex.id, idx)}
                              className="text-slate-500 hover:text-red-400 transition-colors p-1"
                              title="Delete set"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => addSet(ex.id)}
                      className="w-full py-1.5 rounded-xl border border-dashed border-[#1E2330] text-xs text-slate-500 hover:text-athloniq-lime hover:border-athloniq-lime/40 transition-colors font-mono"
                    >
                      + Add Set
                    </button>
                  </Card>
                );
              })}

              {/* Session Notes & RPE */}
              <Card className="space-y-3">
                <h3 className="text-sm font-bold text-white">Session Summary</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400">Session RPE (1–10)</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      step="0.5"
                      value={sessionRpe ?? ""}
                      placeholder="–"
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "") {
                          setSessionRpe(null);
                        } else {
                          const n = parseFloat(val);
                          setSessionRpe(isNaN(n) ? null : Math.min(10, Math.max(1, n)));
                        }
                      }}
                      className="w-full mt-1 bg-[#181D2A] border border-[#1E2330] rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-athloniq-lime focus:outline-none tabular-nums"
                    />
                  </div>
                </div>
                <textarea
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder="Session notes..."
                  rows={2}
                  className="w-full bg-[#181D2A] border border-[#1E2330] rounded-xl px-3 py-2 text-sm text-white focus:border-athloniq-lime focus:outline-none resize-none"
                />
                <Button variant="primary" className="w-full" onClick={finishSession}>
                  <CheckCircle2 className="h-4 w-4" /> Finish & Save Session
                </Button>
              </Card>
            </>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <div className="space-y-4">
          {workoutSessions.length === 0 ? (
            <div className="text-center py-16 text-slate-400 space-y-3">
              <Dumbbell className="h-12 w-12 mx-auto text-slate-600" />
              <p>No sessions logged yet. Start your first workout!</p>
            </div>
          ) : (
            [...workoutSessions]
              .sort((a, b) => b.loggedDate.localeCompare(a.loggedDate))
              .map((session) => {
                const totalVolume = session.sets
                  .filter((s) => s.isCompleted && !s.isBodyweight)
                  .reduce((sum, s) => sum + s.reps * s.loadKg, 0);
                const prs = session.sets.filter((s) => s.isPr).length;
                return (
                  <Card key={session.id} className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-white">{session.title}</h3>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">
                          {session.loggedDate}
                          {session.durationMinutes && ` · ${session.durationMinutes} min`}
                          {session.sessionRpe && ` · RPE ${session.sessionRpe}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {prs > 0 && <Badge variant="lime">{prs} PR{prs > 1 ? "s" : ""}</Badge>}
                        <Badge variant={session.completed ? "emerald" : "amber"}>
                          {session.completed ? "COMPLETED" : "IN PROGRESS"}
                        </Badge>
                        <button
                          onClick={() => deleteWorkoutSession(session.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors ml-1"
                          title="Delete workout entry"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    {totalVolume > 0 && (
                      <div className="text-xs text-slate-400 font-mono tabular-nums">
                        Total Volume: <span className="text-white font-bold">{totalVolume.toLocaleString()} kg</span>
                        {" · "}{session.sets.filter((s) => s.isCompleted).length} sets completed
                      </div>
                    )}
                  </Card>
                );
              })
          )}
        </div>
      )}
    </div>
  );
};
