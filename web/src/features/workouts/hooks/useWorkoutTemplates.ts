import { useState, useEffect, useCallback } from "react";
import { WorkoutTemplate, Weekday } from "@/types";
import { STARTER_TEMPLATES } from "../constants";

function cloneStarterTemplates(): WorkoutTemplate[] {
  return STARTER_TEMPLATES.map((t) => ({
    ...t,
    scheduledWeekdays: [...(t.scheduledWeekdays ?? [])],
    exercises: t.exercises.map((e) => ({ ...e })),
  }));
}

function storageKeyForUser(userId?: string | null): string {
  return `athloniq_workout_templates_${userId || "anon"}`;
}

function loadTemplates(userId?: string | null): WorkoutTemplate[] {
  try {
    const raw = localStorage.getItem(storageKeyForUser(userId));
    if (!raw) return cloneStarterTemplates();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return cloneStarterTemplates();
    }
    return parsed;
  } catch {
    return cloneStarterTemplates();
  }
}

/**
 * Manages athlete workout templates (initialized from Starter templates) and weekday assignments.
 * Scoped per user ID so edits and weekday schedules persist without leaking across accounts.
 */
export function useWorkoutTemplates(userId?: string | null) {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>(() =>
    loadTemplates(userId)
  );

  useEffect(() => {
    setTemplates(loadTemplates(userId));
  }, [userId]);

  const persist = useCallback(
    (next: WorkoutTemplate[]) => {
      try {
        localStorage.setItem(storageKeyForUser(userId), JSON.stringify(next));
      } catch {
        // Ignore storage quota errors in constrained environments
      }
    },
    [userId]
  );

  const updateTemplate = useCallback(
    (updated: WorkoutTemplate) => {
      setTemplates((prev) => {
        const assignedDays = new Set(updated.scheduledWeekdays ?? []);
        const next = prev.map((t) => {
          if (t.id === updated.id) {
            return {
              ...updated,
              scheduledWeekdays: [...assignedDays],
            };
          }
          // Ensure each weekday belongs to at most one template
          const filteredDays = (t.scheduledWeekdays ?? []).filter(
            (d) => !assignedDays.has(d)
          );
          return { ...t, scheduledWeekdays: filteredDays };
        });
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const toggleWeekday = useCallback(
    (templateId: string, day: Weekday) => {
      setTemplates((prev) => {
        const target = prev.find((t) => t.id === templateId);
        const currentlyAssigned = Boolean(target?.scheduledWeekdays?.includes(day));

        const next = prev.map((t) => {
          const existing = t.scheduledWeekdays ?? [];
          if (t.id === templateId) {
            return {
              ...t,
              scheduledWeekdays: currentlyAssigned
                ? existing.filter((d) => d !== day)
                : [...existing.filter((d) => d !== day), day],
            };
          }
          // Remove this weekday from other templates when assigning it here
          if (!currentlyAssigned && existing.includes(day)) {
            return {
              ...t,
              scheduledWeekdays: existing.filter((d) => d !== day),
            };
          }
          return t;
        });
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const getTemplateForWeekday = useCallback(
    (day: Weekday): WorkoutTemplate | null => {
      return (
        templates.find((t) => t.scheduledWeekdays?.includes(day)) ?? null
      );
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
