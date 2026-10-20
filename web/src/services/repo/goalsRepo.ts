import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { UserGoals, ValueProvenance } from "@/types";

export const GoalsDbRowSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  protein_min_g: z.coerce.number().int().min(1).default(88),
  protein_max_g: z.coerce.number().int().min(1).default(121),
  protein_target_g: z.coerce.number().int().min(1).default(110),
  protein_provenance: z.string().default("provisional_default"),
  calorie_target_kcal: z.coerce.number().int().nullable().default(null),
  calorie_provenance: z.string().default("provisional_default"),
  carbs_target_g: z.coerce.number().int().nullable().default(null),
  fat_target_g: z.coerce.number().int().nullable().default(null),
  water_target_ml: z.coerce.number().int().min(1).default(3500),
});

export type GoalsDbRow = z.infer<typeof GoalsDbRowSchema>;

export function mapDbGoalsToDomain(row: GoalsDbRow): UserGoals {
  return {
    proteinMinG: row.protein_min_g,
    proteinMaxG: row.protein_max_g,
    proteinTargetG: row.protein_target_g,
    proteinProvenance: row.protein_provenance as ValueProvenance,
    calorieTargetKcal: row.calorie_target_kcal,
    calorieProvenance: row.calorie_provenance as ValueProvenance,
    carbsTargetG: row.carbs_target_g,
    fatTargetG: row.fat_target_g,
    waterTargetMl: row.water_target_ml,
  };
}

export const goalsRepo = {
  async fetchGoals(userId: string): Promise<UserGoals | null> {
    const { data, error } = await supabase
      .from("user_goals")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw new Error(`[goalsRepo] Error fetching goals: ${error.message}`);
    }
    if (!data) return null;

    return mapDbGoalsToDomain(GoalsDbRowSchema.parse(data));
  },

  async upsertGoals(userId: string, goals: UserGoals): Promise<UserGoals> {
    const payload = {
      user_id: userId,
      protein_min_g: goals.proteinMinG,
      protein_max_g: goals.proteinMaxG,
      protein_target_g: goals.proteinTargetG,
      protein_provenance: goals.proteinProvenance,
      calorie_target_kcal: goals.calorieTargetKcal,
      calorie_provenance: goals.calorieProvenance,
      carbs_target_g: goals.carbsTargetG,
      fat_target_g: goals.fatTargetG,
      water_target_ml: goals.waterTargetMl,
    };

    const { data, error } = await supabase
      .from("user_goals")
      .upsert(payload, { onConflict: "user_id" })
      .select()
      .single();

    if (error) {
      throw new Error(`[goalsRepo] Error upserting goals: ${error.message}`);
    }

    return mapDbGoalsToDomain(GoalsDbRowSchema.parse(data));
  },
};
