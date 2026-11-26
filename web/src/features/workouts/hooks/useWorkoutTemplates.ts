import { useState, useCallback } from "react";
import { WorkoutTemplate, Weekday } from "@/types";
import { useAthloniqState } from "@/hooks/useAthloniqState";
import { cloneStarterTemplates } from "../constants";

/**
 * Provides workout templates and weekday schedule actions.
 * Uses the Supabase-backed AthloniqProvider state when available, with an
 * in-memory fallback only for isolated component tests that partially mock useAthloniqState.
 */
export function useWorkoutTemplates() {
  const state = useAthloniqState() as ReturnType<typeof useAthloniqState> & {
    workoutTemplates?: WorkoutTemplate[];
    updateWorkoutTemplate?: (updated: WorkoutTemplate) => Promise<void> | void;
    toggleTemplateWeekday?: (templateId: string, day: Weekday) => Promise<void> | void;
  };

  const [fallbackTemplates, setFallbackTemplates] = useState<WorkoutTemplate[]>(
    () => cloneStarterTemplates()
  );

  const templates = state.workoutTemplates ?? fallbackTemplates;

  const updateTemplate = useCallback(
    (updated: WorkoutTemplate) => {
      if (state.updateWorkoutTemplate) {
        return state.updateWorkoutTemplate(updated);
      }
      setFallbackTemplates((prev) => {
        const assignedDays = new Set(updated.scheduledWeekdays);
        return prev.map((t) => {
          if (t.id === updated.id) {
            return { ...updated, scheduledWeekdays: [...assignedDays] };
          }
          return {
            ...t,
            scheduledWeekdays: t.scheduledWeekdays.filter(
              (d) => !assignedDays.has(d)
            ),
          };
        });
      });
    },
    [state.updateWorkoutTemplate]
  );

  const toggleWeekday = useCallback(
    (templateId: string, day: Weekday) => {
      if (state.toggleTemplateWeekday) {
        return state.toggleTemplateWeekday(templateId, day);
      }
      setFallbackTemplates((prev) => {
        const target = prev.find((t) => t.id === templateId);
        const currentlyAssigned = Boolean(
          target?.scheduledWeekdays.includes(day)
        );
        return prev.map((t) => {
          if (t.id === templateId) {
            return {
              ...t,
              scheduledWeekdays: currentlyAssigned
                ? t.scheduledWeekdays.filter((d) => d !== day)
                : [...t.scheduledWeekdays.filter((d) => d !== day), day],
            };
          }
          if (!currentlyAssigned && t.scheduledWeekdays.includes(day)) {
            return {
              ...t,
              scheduledWeekdays: t.scheduledWeekdays.filter((d) => d !== day),
            };
          }
          return t;
        });
      });
    },
    [state.toggleTemplateWeekday]
  );

  const getTemplateForWeekday = useCallback(
    (day: Weekday): WorkoutTemplate | null => {
      return templates.find((t) => t.scheduledWeekdays.includes(day)) ?? null;
    },
    [templates]
  );

  return {
    templates,
    updateTemplate,
    toggleWeekday,
    getTemplateForWeekday,
  };
}
