import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { WorkoutTemplate, TemplateExercise } from "@/types";

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
});

export function mapDbTemplateExerciseToDomain(row: z.infer<typeof TemplateExerciseDbRowSchema>): TemplateExercise {
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
      exercisesByTemplate[validated.template_id] = exercisesByTemplate[validated.template_id] || [];
      exercisesByTemplate[validated.template_id].push(mapDbTemplateExerciseToDomain(validated));
    });

    return templateRows.map((row) => {
      const validated = WorkoutTemplateDbRowSchema.parse(row);
      return {
        id: validated.id,
        name: validated.name,
        focus: validated.focus,
        estimatedDurationMin: validated.estimated_duration_min ?? undefined,
        exercises: exercisesByTemplate[validated.id] || [],
      };
    });
  },

  async saveTemplate(userId: string, template: WorkoutTemplate): Promise<WorkoutTemplate> {
    const templatePayload = {
      ...(template.id && !template.id.startsWith("tpl-") ? { id: template.id } : {}),
      user_id: userId,
      name: template.name,
      focus: template.focus,
      estimated_duration_min: template.estimatedDurationMin || null,
    };

    const { data: savedTemplateRow, error: tErr } = await supabase
      .from("workout_templates")
      .upsert(templatePayload)
      .select()
      .single();

    if (tErr) {
      throw new Error(`[workoutTemplatesRepo] Error saving template: ${tErr.message}`);
    }

    const validatedTemplate = WorkoutTemplateDbRowSchema.parse(savedTemplateRow);
    const assignedTemplateId = validatedTemplate.id;

    // Delete existing template exercises to ensure clean atomic sync
    await supabase.from("workout_template_exercises").delete().eq("template_id", assignedTemplateId).eq("user_id", userId);

    const savedExercises: TemplateExercise[] = [];
    if (template.exercises && template.exercises.length > 0) {
      const exercisesPayload = template.exercises.map((ex, idx) => ({
        template_id: assignedTemplateId,
        user_id: userId,
        exercise_name: ex.exerciseName,
        category: ex.category || "compound",
        equipment_key: ex.equipmentKey || null,
        target_sets: ex.targetSets || 3,
        target_reps_min: ex.targetRepsMin || 6,
        target_reps_max: ex.targetRepsMax || 12,
        rest_seconds: ex.restSeconds || 90,
        sort_order: ex.sortOrder !== undefined ? ex.sortOrder : idx,
      }));

      const { data: exRows, error: exErr } = await supabase
        .from("workout_template_exercises")
        .insert(exercisesPayload)
        .select();

      if (exErr) {
        throw new Error(`[workoutTemplatesRepo] Error saving template exercises: ${exErr.message}`);
      }

      (exRows || []).forEach((row) => {
        savedExercises.push(mapDbTemplateExerciseToDomain(TemplateExerciseDbRowSchema.parse(row)));
      });
    }

    return {
      id: assignedTemplateId,
      name: validatedTemplate.name,
      focus: validatedTemplate.focus,
      estimatedDurationMin: validatedTemplate.estimated_duration_min ?? undefined,
      exercises: savedExercises,
    };
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
