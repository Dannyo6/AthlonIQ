import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { FoodCatalogItem, FoodProvenance } from "@/types";

export const CustomFoodDbRowSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z.string(),
  category: z.string().default("custom"),
  serving_label: z.string(),
  serving_weight_g: z.coerce.number().nullable().default(null),
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
  ]).default("manual_entry"),
});

export type CustomFoodDbRow = z.infer<typeof CustomFoodDbRowSchema>;

export function mapDbCustomFoodToDomain(row: CustomFoodDbRow): FoodCatalogItem {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    serving_label: row.serving_label,
    serving_weight_g: row.serving_weight_g,
    calories_kcal: row.calories_kcal,
    protein_g: row.protein_g,
    carbs_g: row.carbs_g,
    fat_g: row.fat_g,
    provenance: row.provenance as FoodProvenance,
  };
}

export const customFoodsRepo = {
  async fetchCustomFoods(userId: string): Promise<FoodCatalogItem[]> {
    const { data, error } = await supabase
      .from("custom_foods")
      .select("*")
      .eq("user_id", userId)
      .order("name", { ascending: true });

    if (error) {
      throw new Error(`[customFoodsRepo] Error fetching custom foods: ${error.message}`);
    }

    return (data || []).map((row) => mapDbCustomFoodToDomain(CustomFoodDbRowSchema.parse(row)));
  },

  async createCustomFood(userId: string, food: Omit<FoodCatalogItem, "id">): Promise<FoodCatalogItem> {
    const payload = {
      user_id: userId,
      name: food.name,
      category: food.category || "custom",
      serving_label: food.serving_label,
      serving_weight_g: food.serving_weight_g,
      calories_kcal: food.calories_kcal,
      protein_g: food.protein_g,
      carbs_g: food.carbs_g,
      fat_g: food.fat_g,
      provenance: food.provenance,
    };

    const { data, error } = await supabase
      .from("custom_foods")
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw new Error(`[customFoodsRepo] Error creating custom food: ${error.message}`);
    }

    return mapDbCustomFoodToDomain(CustomFoodDbRowSchema.parse(data));
  },

  async deleteCustomFood(userId: string, id: string): Promise<void> {
    const { error } = await supabase
      .from("custom_foods")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`[customFoodsRepo] Error deleting custom food: ${error.message}`);
    }
  },
};
