import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { FoodEntry, FoodProvenance, MealSlot } from "@/types";

export const FoodEntryDbRowSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  logged_date: z.string(),
  meal_slot: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  food_name: z.string(),
  quantity: z.coerce.number().min(0.01).default(1.0),
  serving_label: z.string(),
  calories_kcal: z.coerce.number().min(0),
  protein_g: z.coerce.number().min(0),
  carbs_g: z.coerce.number().min(0),
  fat_g: z.coerce.number().min(0),
  provenance: z.enum([
    "user_confirmed",
    "calculated_estimate",
    "provisional_default",
    "verified_reference",
    "manual_entry",
    "user_corrected",
    "ai_estimated",
  ]).default("verified_reference"),
  is_confirmed: z.boolean().default(true),
  notes: z.string().nullable().default(null),
});

export type FoodEntryDbRow = z.infer<typeof FoodEntryDbRowSchema>;

export function mapDbFoodEntryToDomain(row: FoodEntryDbRow): FoodEntry {
  return {
    id: row.id,
    loggedDate: row.logged_date,
    mealSlot: row.meal_slot as MealSlot,
    foodName: row.food_name,
    quantity: row.quantity,
    servingLabel: row.serving_label,
    caloriesKcal: row.calories_kcal,
    proteinG: row.protein_g,
    carbsG: row.carbs_g,
    fatG: row.fat_g,
    provenance: row.provenance as FoodProvenance,
    isConfirmed: row.is_confirmed,
    notes: row.notes ?? undefined,
  };
}

export const foodEntriesRepo = {
  async fetchEntries(userId: string, date?: string): Promise<FoodEntry[]> {
    let query = supabase
      .from("food_entries")
      .select("*")
      .eq("user_id", userId);

    if (date) {
      query = query.eq("logged_date", date);
    }

    const { data, error } = await query.order("created_at", { ascending: true });

    if (error) {
      throw new Error(`[foodEntriesRepo] Error fetching food entries: ${error.message}`);
    }

    return (data || []).map((row) => mapDbFoodEntryToDomain(FoodEntryDbRowSchema.parse(row)));
  },

  async createEntry(userId: string, entry: Omit<FoodEntry, "id">): Promise<FoodEntry> {
    const payload = {
      user_id: userId,
      logged_date: entry.loggedDate,
      meal_slot: entry.mealSlot,
      food_name: entry.foodName,
      quantity: entry.quantity,
      serving_label: entry.servingLabel,
      calories_kcal: entry.caloriesKcal,
      protein_g: entry.proteinG,
      carbs_g: entry.carbsG,
      fat_g: entry.fatG,
      provenance: entry.provenance,
      is_confirmed: entry.isConfirmed,
      notes: entry.notes || null,
    };

    const { data, error } = await supabase
      .from("food_entries")
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw new Error(`[foodEntriesRepo] Error creating food entry: ${error.message}`);
    }

    return mapDbFoodEntryToDomain(FoodEntryDbRowSchema.parse(data));
  },

  async updateEntry(userId: string, id: string, patch: Partial<FoodEntry>): Promise<FoodEntry> {
    const payload: Record<string, any> = {};
    if (patch.loggedDate !== undefined) payload.logged_date = patch.loggedDate;
    if (patch.mealSlot !== undefined) payload.meal_slot = patch.mealSlot;
    if (patch.foodName !== undefined) payload.food_name = patch.foodName;
    if (patch.quantity !== undefined) payload.quantity = patch.quantity;
    if (patch.servingLabel !== undefined) payload.serving_label = patch.servingLabel;
    if (patch.caloriesKcal !== undefined) payload.calories_kcal = patch.caloriesKcal;
    if (patch.proteinG !== undefined) payload.protein_g = patch.proteinG;
    if (patch.carbsG !== undefined) payload.carbs_g = patch.carbsG;
    if (patch.fatG !== undefined) payload.fat_g = patch.fatG;
    if (patch.provenance !== undefined) payload.provenance = patch.provenance;
    if (patch.isConfirmed !== undefined) payload.is_confirmed = patch.isConfirmed;
    if (patch.notes !== undefined) payload.notes = patch.notes;

    const { data, error } = await supabase
      .from("food_entries")
      .update(payload)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      throw new Error(`[foodEntriesRepo] Error updating food entry: ${error.message}`);
    }

    return mapDbFoodEntryToDomain(FoodEntryDbRowSchema.parse(data));
  },

  async deleteEntry(userId: string, id: string): Promise<void> {
    const { error } = await supabase
      .from("food_entries")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`[foodEntriesRepo] Error deleting food entry: ${error.message}`);
    }
  },
};
