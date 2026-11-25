import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { WorkoutTemplate, TemplateExercise, Weekday } from "@/types";
import { WEEKDAYS } from "../constants";
import { Check, Pencil, Play, Plus, Trash2, X } from "lucide-react";

export interface WorkoutTemplatePickerProps {
  templates: WorkoutTemplate[];
  onStartTemplate: (template: WorkoutTemplate) => void;
  onUpdateTemplate: (updated: WorkoutTemplate) => void;
  onToggleWeekday: (templateId: string, day: Weekday) => void;
}

export const WorkoutTemplatePicker: React.FC<WorkoutTemplatePickerProps> = ({
  templates,
  onStartTemplate,
  onUpdateTemplate,
  onToggleWeekday,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<WorkoutTemplate | null>(null);

  const beginEdit = (tmpl: WorkoutTemplate) => {
    setEditingId(tmpl.id);
    setDraft({
      ...tmpl,
      scheduledWeekdays: [...(tmpl.scheduledWeekdays ?? [])],
      exercises: tmpl.exercises.map((e) => ({ ...e })),
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(null);
  };

  const saveEdit = () => {
    if (!draft) return;
    const cleanedExercises = draft.exercises
      .filter((e) => e.exerciseName.trim().length > 0)
      .map((e, idx) => ({ ...e, sortOrder: idx + 1 }));

    onUpdateTemplate({
      ...draft,
      name: draft.name.trim() || "Untitled Template",
      focus: draft.focus.trim() || "General Strength",
      exercises: cleanedExercises,
    });
    setEditingId(null);
    setDraft(null);
  };

  const updateDraftExercise = (
    idx: number,
    patch: Partial<TemplateExercise>
  ) => {
    if (!draft) return;
    setDraft({
      ...draft,
      exercises: draft.exercises.map((ex, i) =>
        i === idx ? { ...ex, ...patch } : ex
      ),
    });
  };

  const addDraftExercise = () => {
    if (!draft) return;
    const nextOrder = draft.exercises.length + 1;
    setDraft({
      ...draft,
      exercises: [
        ...draft.exercises,
        {
          id: `ex-${Date.now()}-${nextOrder}`,
          exerciseName: "",
          category: "compound",
          equipmentKey: null,
          targetSets: 3,
          targetRepsMin: 8,
          targetRepsMax: 12,
          restSeconds: 90,
          sortOrder: nextOrder,
        },
      ],
    });
  };

  const removeDraftExercise = (idx: number) => {
    if (!draft) return;
    setDraft({
      ...draft,
      exercises: draft.exercises.filter((_, i) => i !== idx),
    });
  };

  const toggleDraftWeekday = (day: Weekday) => {
    if (!draft) return;
    const current = draft.scheduledWeekdays ?? [];
    const next = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day];
    setDraft({ ...draft, scheduledWeekdays: next });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white">Starter templates</h2>
            <Badge variant="neutral" className="font-mono tabular-nums">
              {templates.length} Editable
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Starter templates are fully editable — customize exercises or assign weekdays to schedule Today&apos;s Planned Session.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {templates.map((tmpl) => {
          const isEditing = editingId === tmpl.id && draft !== null;

          if (isEditing && draft) {
            return (
              <Card key={tmpl.id} className="space-y-4 border-athloniq-lime/40">
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 uppercase">
                      Template Name
                    </label>
                    <input
                      type="text"
                      aria-label="Template Name"
                      value={draft.name}
                      onChange={(e) =>
                        setDraft({ ...draft, name: e.target.value })
                      }
                      className="w-full mt-1 bg-athloniq-surface border border-athloniq-border rounded-xl px-3 py-2 text-sm text-white focus:border-athloniq-lime focus:outline-none min-h-[44px]"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 uppercase">
                        Focus
                      </label>
                      <input
                        type="text"
                        aria-label="Template Focus"
                        value={draft.focus}
                        onChange={(e) =>
                          setDraft({ ...draft, focus: e.target.value })
                        }
                        className="w-full mt-1 bg-athloniq-surface border border-athloniq-border rounded-xl px-3 py-2 text-xs text-white focus:border-athloniq-lime focus:outline-none min-h-[44px]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 uppercase">
                        Est. Duration (min)
                      </label>
                      <input
                        type="number"
                        min="1"
                        aria-label="Estimated Duration"
                        value={draft.estimatedDurationMin ?? ""}
                        onChange={(e) => {
                          const parsed = parseInt(e.target.value, 10);
                          setDraft({
                            ...draft,
                            estimatedDurationMin: Number.isNaN(parsed)
                              ? undefined
                              : parsed,
                          });
                        }}
                        className="w-full mt-1 bg-athloniq-surface border border-athloniq-border rounded-xl px-3 py-2 text-xs text-white font-mono tabular-nums focus:border-athloniq-lime focus:outline-none min-h-[44px]"
                      />
                    </div>
                  </div>
                </div>

                {/* Weekday assignment inside edit mode */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase">
                    Assign to Weekdays
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {WEEKDAYS.map((day) => {
                      const active = Boolean(
                        draft.scheduledWeekdays?.includes(day)
                      );
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDraftWeekday(day)}
                          aria-pressed={active}
                          className={`min-h-[44px] px-2.5 rounded-lg text-xs font-mono font-bold border transition-colors ${
                            active
                              ? "bg-athloniq-lime/20 text-athloniq-lime border-athloniq-lime/50"
                              : "bg-athloniq-surface text-slate-400 border-athloniq-border hover:text-white"
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Exercises Editor */}
                <div className="space-y-2 border-t border-athloniq-border pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase">
                      Exercises
                    </span>
                    <button
                      type="button"
                      onClick={addDraftExercise}
                      className="min-h-[44px] px-2.5 rounded-lg text-xs font-semibold text-athloniq-lime hover:bg-athloniq-lime/10 inline-flex items-center gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Exercise
                    </button>
                  </div>

                  {draft.exercises.map((ex, idx) => (
                    <div
                      key={ex.id}
                      className="grid grid-cols-12 gap-1.5 items-center bg-athloniq-surface/60 p-2 rounded-xl border border-athloniq-border"
                    >
                      <input
                        type="text"
                        aria-label={`Exercise ${idx + 1} name`}
                        value={ex.exerciseName}
                        placeholder="Exercise name"
                        onChange={(e) =>
                          updateDraftExercise(idx, {
                            exerciseName: e.target.value,
                          })
                        }
                        className="col-span-5 bg-athloniq-card border border-athloniq-border rounded-lg px-2 py-1 text-xs text-white focus:border-athloniq-lime focus:outline-none min-h-[44px]"
                      />
                      <input
                        type="number"
                        min="1"
                        aria-label={`Exercise ${idx + 1} sets`}
                        value={ex.targetSets}
                        onChange={(e) =>
                          updateDraftExercise(idx, {
                            targetSets: Math.max(
                              1,
                              parseInt(e.target.value, 10) || 1
                            ),
                          })
                        }
                        className="col-span-2 bg-athloniq-card border border-athloniq-border rounded-lg px-2 py-1 text-xs text-white font-mono tabular-nums focus:border-athloniq-lime focus:outline-none min-h-[44px]"
                        title="Target sets"
                      />
                      <input
                        type="number"
                        min="1"
                        aria-label={`Exercise ${idx + 1} min reps`}
                        value={ex.targetRepsMin}
                        onChange={(e) =>
                          updateDraftExercise(idx, {
                            targetRepsMin: Math.max(
                              1,
                              parseInt(e.target.value, 10) || 1
                            ),
                          })
                        }
                        className="col-span-2 bg-athloniq-card border border-athloniq-border rounded-lg px-2 py-1 text-xs text-white font-mono tabular-nums focus:border-athloniq-lime focus:outline-none min-h-[44px]"
                        title="Min reps"
                      />
                      <input
                        type="number"
                        min="1"
                        aria-label={`Exercise ${idx + 1} max reps`}
                        value={ex.targetRepsMax}
                        onChange={(e) =>
                          updateDraftExercise(idx, {
                            targetRepsMax: Math.max(
                              1,
                              parseInt(e.target.value, 10) || 1
                            ),
                          })
                        }
                        className="col-span-2 bg-athloniq-card border border-athloniq-border rounded-lg px-2 py-1 text-xs text-white font-mono tabular-nums focus:border-athloniq-lime focus:outline-none min-h-[44px]"
                        title="Max reps"
                      />
                      <button
                        type="button"
                        onClick={() => removeDraftExercise(idx)}
                        className="col-span-1 min-h-[44px] flex items-center justify-center text-slate-400 hover:text-rose-400"
                        title="Remove exercise"
                        aria-label={`Remove ${ex.exerciseName || "exercise"}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Button
                    type="button"
                    variant="primary"
                    className="flex-1 min-h-[44px]"
                    onClick={saveEdit}
                  >
                    <Check className="h-4 w-4" /> Save Template
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-[44px]"
                    onClick={cancelEdit}
                  >
                    <X className="h-4 w-4" /> Cancel
                  </Button>
                </div>
              </Card>
            );
          }

          return (
            <Card
              key={tmpl.id}
              className="space-y-4 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-white">{tmpl.name}</h3>
                    {tmpl.isStarter && (
                      <Badge variant="neutral">Starter template</Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{tmpl.focus}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {tmpl.estimatedDurationMin != null && (
                    <Badge variant="lime" className="tabular-nums font-mono">
                      Est. {tmpl.estimatedDurationMin}m
                    </Badge>
                  )}
                  <button
                    type="button"
                    onClick={() => beginEdit(tmpl)}
                    aria-label={`Edit ${tmpl.name}`}
                    className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl bg-athloniq-surface border border-athloniq-border text-slate-300 hover:text-athloniq-lime hover:border-athloniq-lime/40 transition-colors"
                    title="Edit template"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Exercises Preview */}
              <div className="space-y-1.5 border-t border-athloniq-border pt-3">
                {tmpl.exercises.map((ex, idx) => (
                  <div
                    key={ex.id}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-slate-300 font-medium">
                      {idx + 1}. {ex.exerciseName}
                    </span>
                    <span className="text-slate-500 font-mono tabular-nums">
                      {ex.targetSets}×{ex.targetRepsMin}–{ex.targetRepsMax}
                    </span>
                  </div>
                ))}
              </div>

              {/* Weekday Scheduling Pills */}
              <div className="border-t border-athloniq-border pt-3 space-y-2">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Schedule Weekdays
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {WEEKDAYS.map((day) => {
                    const isAssigned = Boolean(
                      tmpl.scheduledWeekdays?.includes(day)
                    );
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => onToggleWeekday(tmpl.id, day)}
                        aria-pressed={isAssigned}
                        aria-label={`Assign ${tmpl.name} to ${day}`}
                        className={`min-h-[44px] px-2.5 rounded-lg text-xs font-mono font-bold border transition-colors ${
                          isAssigned
                            ? "bg-athloniq-lime/20 text-athloniq-lime border-athloniq-lime/50"
                            : "bg-athloniq-surface text-slate-400 border-athloniq-border hover:text-white"
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Button
                variant="secondary"
                className="w-full min-h-[44px]"
                onClick={() => onStartTemplate(tmpl)}
              >
                <Play className="h-4 w-4" /> Start This Template
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
