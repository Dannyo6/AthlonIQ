import React from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  EquipmentItem,
  UserProfile,
  ExerciseSet,
  ProgressionSuggestion,
} from "@/types";
import { SessionExercise } from "../constants";
import { WorkoutProgressionSuggestion } from "./WorkoutProgressionSuggestion";
import { gatedProgressionSuggestion } from "@/lib/calculations";
import {
  CheckCircle2,
  Clock,
  Dumbbell,
  Pause,
  Play,
  RotateCcw,
  Star,
  Timer,
  X,
} from "lucide-react";

export interface WorkoutActiveSessionProps {
  sessionTitle: string;
  onSessionTitleChange: (title: string) => void;
  sessionStartTime: Date | null;
  sessionExercises: SessionExercise[];
  sessionRpe: number | null;
  onSessionRpeChange: (rpe: number | null) => void;
  sessionNotes: string;
  onSessionNotesChange: (notes: string) => void;
  // Rest timer
  restTimer: number;
  restRunning: boolean;
  restPreset: 60 | 90 | 120;
  onStartRestTimer: (seconds: number) => void;
  onAdjustRestTimer: (delta: number) => void;
  onToggleRestRunning: () => void;
  onResetRestTimer: () => void;
  onSelectRestPreset: (preset: 60 | 90 | 120) => void;
  // Sets management
  onAddSet: (exerciseId: string) => void;
  onUpdateSet: (
    exerciseId: string,
    setIndex: number,
    update: Partial<ExerciseSet>
  ) => void;
  onRemoveSet: (exerciseId: string, setIndex: number) => void;
  // Actions
  onFinishSession: () => void;
  onBrowseTemplates: () => void;
  // Progression gate context
  equipment: EquipmentItem[];
  profile: Partial<UserProfile>;
  readiness?: { status: string; readinessScore?: number } | null;
}

export const WorkoutActiveSession: React.FC<WorkoutActiveSessionProps> = ({
  sessionTitle,
  onSessionTitleChange,
  sessionStartTime,
  sessionExercises,
  sessionRpe,
  onSessionRpeChange,
  sessionNotes,
  onSessionNotesChange,
  restTimer,
  restRunning,
  restPreset,
  onStartRestTimer,
  onAdjustRestTimer,
  onToggleRestRunning,
  onResetRestTimer,
  onSelectRestPreset,
  onAddSet,
  onUpdateSet,
  onRemoveSet,
  onFinishSession,
  onBrowseTemplates,
  equipment,
  profile,
  readiness,
}) => {
  if (sessionExercises.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400 space-y-3">
        <Dumbbell className="h-12 w-12 mx-auto text-slate-600" />
        <p>Choose a template or start a custom session.</p>
        <Button
          variant="outline"
          className="min-h-[44px]"
          onClick={onBrowseTemplates}
        >
          Browse Templates
        </Button>
      </div>
    );
  }

  const freeWeights = equipment.find((e) => e.itemKey === "free_weights_70kg");

  const getProgressionSuggestion = (
    ex: SessionExercise
  ): ProgressionSuggestion | null => {
    if (ex.sets.length === 0) return null;
    const completed = ex.sets.filter((s) => s.isCompleted);
    if (completed.length === 0) return null;

    const item = ex.equipmentKey
      ? equipment.find((e) => e.itemKey === ex.equipmentKey)
      : freeWeights;

    const maxLoad = item?.maxLoadKg ?? null;
    const minIncrement = item?.minIncrementKg ?? null;
    const isConfirmed =
      Boolean(profile.equipmentConfirmed) && Boolean(item?.isConfirmed);

    const validReadiness: "Prime" | "Moderate" | "Recover" =
      readiness?.status === "Prime" ||
      readiness?.status === "Moderate" ||
      readiness?.status === "Recover"
        ? readiness.status
        : "Moderate";

    return gatedProgressionSuggestion(
      maxLoad,
      minIncrement,
      isConfirmed,
      completed.map((s) => ({
        reps: s.reps,
        loadKg: s.loadKg,
        rpe: s.rpe,
        isBodyweight: s.isBodyweight,
      })),
      ex.targetRepsMax,
      ex.exerciseName,
      validReadiness
    );
  };

  const restFormatted = `${Math.floor(restTimer / 60)}:${String(
    restTimer % 60
  ).padStart(2, "0")}`;

  return (
    <div className="space-y-6">
      {/* Session Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl bg-athloniq-card border border-athloniq-border">
        <div className="flex-1">
          <input
            value={sessionTitle}
            onChange={(e) => onSessionTitleChange(e.target.value)}
            className="w-full bg-transparent text-lg font-black text-white focus:outline-none border-b border-transparent focus:border-athloniq-lime/40 pb-0.5"
            placeholder="Session Title"
          />
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
            <Clock className="h-3 w-3" />
            {sessionStartTime
              ? `Started ${sessionStartTime.toLocaleTimeString()}`
              : "Not started"}
          </div>
        </div>

        {/* Rest Timer */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 bg-athloniq-dark-nav p-2.5 rounded-xl border border-white/[0.06]">
          <div className="flex items-center gap-1.5 mr-1">
            <Timer className="h-4 w-4 text-athloniq-lime" />
            <div
              className={`font-mono text-2xl font-black tabular-nums ${
                restTimer > 0 ? "text-athloniq-lime" : "text-slate-500"
              }`}
            >
              {restFormatted}
            </div>
          </div>

          {/* Quick adjustments */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onAdjustRestTimer(-15)}
              className="px-2 py-1 rounded-lg text-[10px] font-mono font-bold bg-athloniq-card-alt text-slate-300 border border-white/[0.08] hover:text-white hover:border-white/[0.20]"
              title="Decrease 15 seconds"
            >
              -15s
            </button>
            <button
              type="button"
              onClick={() => onAdjustRestTimer(15)}
              className="px-2 py-1 rounded-lg text-[10px] font-mono font-bold bg-athloniq-card-alt text-slate-300 border border-white/[0.08] hover:text-white hover:border-white/[0.20]"
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
                  onSelectRestPreset(sec);
                  onStartRestTimer(sec);
                }}
                className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                  restPreset === sec
                    ? "bg-athloniq-lime/15 text-athloniq-lime border border-athloniq-lime/40 font-black"
                    : "bg-athloniq-card-alt text-slate-400 border border-white/[0.06] hover:text-white"
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
              onClick={onToggleRestRunning}
              className={`p-1.5 rounded-lg border transition-all ${
                restRunning
                  ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                  : "bg-athloniq-lime/15 border-athloniq-lime/40 text-athloniq-lime"
              }`}
              title={restRunning ? "Pause timer" : "Start timer"}
            >
              {restRunning ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </button>
            <button
              type="button"
              onClick={onResetRestTimer}
              className="p-1.5 rounded-lg bg-athloniq-card-alt border border-white/[0.08] text-slate-400 hover:text-white"
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
        const lastCompletedSet = [...ex.sets]
          .reverse()
          .find((s) => s.isCompleted);
        const lastLoad = lastCompletedSet?.loadKg ?? 0;

        return (
          <Card key={ex.id} className="space-y-3">
            <div className="flex items-center justify-between border-b border-athloniq-border pb-3">
              <div>
                <h3 className="font-bold text-white">{ex.exerciseName}</h3>
                <div className="text-xs text-slate-400 font-mono mt-0.5 flex flex-wrap items-center gap-x-2">
                  <span className="tabular-nums">
                    Target: {ex.targetSets}×{ex.targetRepsMin}–{ex.targetRepsMax} · Rest: {ex.restSeconds}s
                  </span>
                  {ex.equipmentKey && (
                    <span className="text-slate-500">
                      · Equipment:{" "}
                      {equipment.find((e) => e.itemKey === ex.equipmentKey)?.itemName ??
                        ex.equipmentKey}{" "}
                      (
                      {equipment.find((e) => e.itemKey === ex.equipmentKey)?.maxLoadKg != null ? (
                        <span className="tabular-nums">
                          {equipment.find((e) => e.itemKey === ex.equipmentKey)?.maxLoadKg} kg cap
                        </span>
                      ) : (
                        "Load not set"
                      )}
                      )
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => onStartRestTimer(ex.restSeconds)}
                className="p-1.5 rounded-lg bg-athloniq-surface border border-athloniq-border text-slate-400 hover:text-athloniq-lime text-xs font-mono"
                title="Start exercise rest timer"
              >
                <Timer className="h-4 w-4" />
              </button>
            </div>

            {/* Progression Suggestion */}
            <WorkoutProgressionSuggestion
              suggestion={suggestion}
              lastSetLoadKg={lastLoad}
            />

            {/* Set Rows */}
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-1 text-[10px] font-bold text-slate-500 uppercase px-1">
                <div className="col-span-1">Set</div>
                <div className="col-span-3">Load (kg)</div>
                <div className="col-span-2">Reps</div>
                <div className="col-span-2">RPE</div>
                <div className="col-span-2 text-center">Done</div>
                <div className="col-span-1 text-center">PR</div>
                <div className="col-span-1"></div>
              </div>
              {ex.sets.map((set, idx) => (
                <div key={set.id} className="grid grid-cols-12 gap-1 items-center">
                  <div className="col-span-1 text-xs font-mono text-slate-400 tabular-nums">
                    {idx + 1}
                  </div>
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
                          onUpdateSet(ex.id, idx, {
                            loadKg: val === "" ? 0 : parseFloat(val) || 0,
                          });
                        }}
                        className="w-full bg-athloniq-surface border border-athloniq-border rounded-lg px-2 py-1 text-xs text-white font-mono focus:border-athloniq-lime focus:outline-none tabular-nums"
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
                        onUpdateSet(ex.id, idx, {
                          reps: val === "" ? 0 : parseInt(val, 10) || 0,
                        });
                      }}
                      className="w-full bg-athloniq-surface border border-athloniq-border rounded-lg px-2 py-1 text-xs text-white font-mono focus:border-athloniq-lime focus:outline-none tabular-nums"
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
                          onUpdateSet(ex.id, idx, { rpe: null });
                        } else {
                          const n = parseFloat(val);
                          onUpdateSet(ex.id, idx, {
                            rpe: isNaN(n) ? null : Math.min(10, Math.max(1, n)),
                          });
                        }
                      }}
                      className="w-full bg-athloniq-surface border border-athloniq-border rounded-lg px-2 py-1 text-xs text-white font-mono focus:border-athloniq-lime focus:outline-none tabular-nums"
                    />
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <input
                      type="checkbox"
                      checked={set.isCompleted}
                      onChange={(e) =>
                        onUpdateSet(ex.id, idx, { isCompleted: e.target.checked })
                      }
                      className="w-4 h-4 accent-athloniq-lime cursor-pointer"
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    {set.isPr && <Star className="h-3.5 w-3.5 text-amber-400" />}
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <button
                      onClick={() => onRemoveSet(ex.id, idx)}
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
              onClick={() => onAddSet(ex.id)}
              className="w-full min-h-[44px] py-1.5 rounded-xl border border-dashed border-athloniq-border text-xs text-slate-500 hover:text-athloniq-lime hover:border-athloniq-lime/40 transition-colors font-mono inline-flex items-center justify-center"
            >
              + Add Set
            </button>
          </Card>
        );
      })}

      {/* Session Summary Card */}
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
                  onSessionRpeChange(null);
                } else {
                  const n = parseFloat(val);
                  onSessionRpeChange(isNaN(n) ? null : Math.min(10, Math.max(1, n)));
                }
              }}
              className="w-full mt-1 bg-athloniq-surface border border-athloniq-border rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-athloniq-lime focus:outline-none tabular-nums"
            />
          </div>
        </div>
        <textarea
          value={sessionNotes}
          onChange={(e) => onSessionNotesChange(e.target.value)}
          placeholder="Session notes..."
          rows={2}
          className="w-full bg-athloniq-surface border border-athloniq-border rounded-xl px-3 py-2 text-sm text-white focus:border-athloniq-lime focus:outline-none resize-none"
        />
        <Button
          variant="primary"
          className="w-full min-h-[44px]"
          onClick={onFinishSession}
        >
          <CheckCircle2 className="h-4 w-4" /> Finish & Save Session
        </Button>
      </Card>
    </div>
  );
};
