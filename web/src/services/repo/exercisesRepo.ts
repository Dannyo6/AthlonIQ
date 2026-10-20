import { z } from "zod";
import { supabase } from "@/lib/supabase";

export const ExerciseDbRowSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  category: z.enum(["barbell", "dumbbell", "machine", "cable", "bodyweight", "cardio"]),
  primary_muscle: z.string(),
  secondary_muscles: z.array(z.string()).default([]),
  instructions: z.string().nullable().default(null),
  is_custom: z.boolean().default(false),
  user_id: z.string().uuid().nullable().default(null),
});

export type ExerciseDbRow = z.infer<typeof ExerciseDbRowSchema>;

export const exercisesRepo = {
  async fetchAll(userId?: string): Promise<ExerciseDbRow[]> {
    let query = supabase.from("exercises").select("*");
    if (userId) {
      query = query.or(`is_custom.eq.false,user_id.eq.${userId}`);
    } else {
      query = query.eq("is_custom", false);
    }

    const { data, error } = await query.order("name", { ascending: true });
    if (error) {
      throw new Error(`[exercisesRepo] Error fetching exercises: ${error.message}`);
    }

    return (data || []).map((row) => ExerciseDbRowSchema.parse(row));
  },

  async createCustom(userId: string, exercise: Omit<ExerciseDbRow, "id" | "is_custom" | "user_id">): Promise<ExerciseDbRow> {
    const payload = {
      user_id: userId,
      name: exercise.name,
      category: exercise.category,
      primary_muscle: exercise.primary_muscle,
      secondary_muscles: exercise.secondary_muscles || [],
      instructions: exercise.instructions || null,
      is_custom: true,
    };

    const { data, error } = await supabase.from("exercises").insert(payload).select().single();
    if (error) {
      throw new Error(`[exercisesRepo] Error creating custom exercise: ${error.message}`);
    }

    return ExerciseDbRowSchema.parse(data);
  },
};
