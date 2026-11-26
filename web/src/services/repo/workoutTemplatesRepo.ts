import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { WorkoutTemplate, TemplateExercise, Weekday } from "@/types";

export const WeekdaySchema = z.enum([
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
]);

export const TemplateExerciseDbRowSchema = z.object({
  id: z.string().uuid(),
  template_id: z.string().uuid(),
  user_id: z.string().uuid(),
  exercise_name: z.string(),
  category: z.string().default("compound"),
  equipment_key: z.string().nullable().default(null),
  target_sets: z.coerce.number().int().min(1).default(3),
  target_reps_min: z.coerce.number().int().min(1).default(6),
  target_reps_max: z.coerce.number().int().min(1).default(12),
  rest_seconds: z.coerce.number().int().min(0).default(90),
  sort_order: z.coerce.number().int().min(0).default(0),
});

export const WorkoutTemplateDbRowSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z.string(),
  focus: z.string(),
  estimated_duration_min: z.coerce.number().int().nullable().default(null),
  is_starter: z.boolean().default(false),
  starter_key: z.string().nullable().default(null),
  scheduled_weekdays: z.array(WeekdaySchema).default([]),
});

export function mapDbTemplateExerciseToDomain(
  row: z.infer<typeof TemplateExerciseDbRowSchema>
): TemplateExercise {
  return {
    id: row.id,
    exerciseName: row.exercise_name,
    category: row.category,
    equipmentKey: row.equipment_key,
    targetSets: row.target_sets,
    targetRepsMin: row.target_reps_min,
    targetRepsMax: row.target_reps_max,
    restSeconds: row.rest_seconds,
    sortOrder: row.sort_order,
  };
}

export function mapDbTemplateToDomain(
  row: z.infer<typeof WorkoutTemplateDbRowSchema>,
  exercises: TemplateExercise[]
): WorkoutTemplate {
  return {
    id: row.id,
    name: row.name,
    focus: row.focus,
    estimatedDurationMin: row.estimated_duration_min ?? undefined,
    isStarter: row.is_starter,
    starterKey: row.starter_key,
    scheduledWeekdays: row.scheduled_weekdays as Weekday[],
    exercises,
  };
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const workoutTemplatesRepo = {
  async fetchTemplates(userId: string): Promise<WorkoutTemplate[]> {
    const { data: templateRows, error: tErr } = await supabase
      .from("workout_templates")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (tErr) {
      throw new Error(`[workoutTemplatesRepo] Error fetching templates: ${tErr.message}`);
    }
    if (!templateRows || templateRows.length === 0) return [];

    const templateIds = templateRows.map((t) => t.id);
    const { data: exerciseRows, error: exErr } = await supabase
      .from("workout_template_exercises")
      .select("*")
      .eq("user_id", userId)
      .in("template_id", templateIds)
      .order("sort_order", { ascending: true });

    if (exErr) {
      throw new Error(`[workoutTemplatesRepo] Error fetching template exercises: ${exErr.message}`);
    }

    const exercisesByTemplate: Record<string, TemplateExercise[]> = {};
    (exerciseRows || []).forEach((row) => {
      const validated = TemplateExerciseDbRowSchema.parse(row);
      exercisesByTemplate[validated.template_id] =
        exercisesByTemplate[validated.template_id] || [];
      exercisesByTemplate[validated.template_id].push(
        mapDbTemplateExerciseToDomain(validated)
      );
    });

    return templateRows.map((row) => {
      const validated = WorkoutTemplateDbRowSchema.parse(row);
      return mapDbTemplateToDomain(
        validated,
        exercisesByTemplate[validated.id] || []
      );
    });
  },

  async saveTemplate(
    userId: string,
    template: WorkoutTemplate
  ): Promise<WorkoutTemplate> {
    if (typeof template.isStarter !== "boolean") {
      throw new Error(
        "[workoutTemplatesRepo] Explicit isStarter boolean is required to save a workout template."
      );
    }
    if (!Array.isArray(template.scheduledWeekdays)) {
      throw new Error(
        "[workoutTemplatesRepo] Explicit scheduledWeekdays array is required to save a workout template."
      );
    }
    const validatedWeekdays = z.array(WeekdaySchema).parse(template.scheduledWeekdays);

    const hasUuid = Boolean(template.id && UUID_REGEX.test(template.id));
    const resolvedStarterKey =
      template.starterKey ??
      (template.isStarter && !hasUuid ? template.id : null);

    const templatePayload = {
      ...(hasUuid ? { id: template.id } : {}),
      user_id: userId,
      name: template.name,
      focus: template.focus,
      estimated_duration_min: template.estimatedDurationMin ?? null,
      is_starter: template.isStarter,
      starter_key: resolvedStarterKey,
      scheduled_weekdays: validatedWeekdays,
    };

    const query =
      !hasUuid && resolvedStarterKey
        ? supabase
            .from("workout_templates")
            .upsert(templatePayload, { onConflict: "user_id,starter_key" })
        : supabase.from("workout_templates").upsert(templatePayload);

    const { data: savedTemplateRow, error: tErr } = await query
      .select()
      .single();

    if (tErr) {
      throw new Error(`[workoutTemplatesRepo] Error saving template: ${tErr.message}`);
    }

    const validatedTemplate = WorkoutTemplateDbRowSchema.parse(savedTemplateRow);
    const assignedTemplateId = validatedTemplate.id;

    // Delete existing template exercises to ensure clean atomic sync
    const { error: delErr } = await supabase
      .from("workout_template_exercises")
      .delete()
      .eq("template_id", assignedTemplateId)
      .eq("user_id", userId);

    if (delErr) {
      throw new Error(
        `[workoutTemplatesRepo] Error clearing template exercises: ${delErr.message}`
      );
    }

    const savedExercises: TemplateExercise[] = [];
    if (template.exercises && template.exercises.length > 0) {
      const exercisesPayload = template.exercises.map((ex, idx) => ({
        template_id: assignedTemplateId,
        user_id: userId,
        exercise_name: ex.exerciseName,
        category: ex.category || "compound",
        equipment_key: ex.equipmentKey ?? null,
        target_sets: ex.targetSets,
        target_reps_min: ex.targetRepsMin,
        target_reps_max: ex.targetRepsMax,
        rest_seconds: ex.restSeconds,
        sort_order: ex.sortOrder !== undefined ? ex.sortOrder : idx + 1,
      }));

      const { data: exRows, error: exErr } = await supabase
        .from("workout_template_exercises")
        .insert(exercisesPayload)
        .select();

      if (exErr) {
        throw new Error(
          `[workoutTemplatesRepo] Error saving template exercises: ${exErr.message}`
        );
      }

      (exRows || []).forEach((row) => {
        savedExercises.push(
          mapDbTemplateExerciseToDomain(TemplateExerciseDbRowSchema.parse(row))
        );
      });
    }

    return mapDbTemplateToDomain(validatedTemplate, savedExercises);
  },

  async deleteTemplate(userId: string, templateId: string): Promise<void> {
    const { error } = await supabase
      .from("workout_templates")
      .delete()
      .eq("id", templateId)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`[workoutTemplatesRepo] Error deleting template: ${error.message}`);
    }
  },
};
