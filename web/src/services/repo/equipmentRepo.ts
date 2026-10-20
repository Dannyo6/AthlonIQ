import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { EquipmentItem } from "@/types";

export const EquipmentDbRowSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  item_key: z.string(),
  item_name: z.string(),
  max_load_kg: z.coerce.number().nullable().default(null),
  min_increment_kg: z.coerce.number().nullable().default(null),
  is_available: z.boolean().default(true),
  is_confirmed: z.boolean().default(false),
  notes: z.string().nullable().default(null),
});

export type EquipmentDbRow = z.infer<typeof EquipmentDbRowSchema>;

export function mapDbEquipmentToDomain(row: EquipmentDbRow): EquipmentItem {
  return {
    id: row.id,
    itemKey: row.item_key,
    itemName: row.item_name,
    maxLoadKg: row.max_load_kg,
    minIncrementKg: row.min_increment_kg,
    isAvailable: row.is_available,
    isConfirmed: row.is_confirmed,
    notes: row.notes,
  };
}

export const equipmentRepo = {
  async fetchEquipment(userId: string): Promise<EquipmentItem[]> {
    const { data, error } = await supabase
      .from("user_equipment")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(`[equipmentRepo] Error fetching equipment: ${error.message}`);
    }

    return (data || []).map((row) => mapDbEquipmentToDomain(EquipmentDbRowSchema.parse(row)));
  },

  async upsertEquipment(userId: string, items: EquipmentItem[]): Promise<EquipmentItem[]> {
    if (items.length === 0) return [];

    const dbRows = items.map((item) => ({
      user_id: userId,
      item_key: item.itemKey,
      item_name: item.itemName,
      max_load_kg: item.maxLoadKg,
      min_increment_kg: item.minIncrementKg ?? null,
      is_available: item.isAvailable,
      is_confirmed: item.isConfirmed,
      notes: item.notes ?? null,
    }));

    const { data, error } = await supabase
      .from("user_equipment")
      .upsert(dbRows, { onConflict: "user_id, item_key" })
      .select();

    if (error) {
      throw new Error(`[equipmentRepo] Error upserting equipment: ${error.message}`);
    }

    return (data || []).map((row) => mapDbEquipmentToDomain(EquipmentDbRowSchema.parse(row)));
  },

  async updateItem(userId: string, item: EquipmentItem): Promise<EquipmentItem> {
    const { data, error } = await supabase
      .from("user_equipment")
      .upsert({
        user_id: userId,
        item_key: item.itemKey,
        item_name: item.itemName,
        max_load_kg: item.maxLoadKg,
        min_increment_kg: item.minIncrementKg ?? null,
        is_available: item.isAvailable,
        is_confirmed: item.isConfirmed,
        notes: item.notes ?? null,
      }, { onConflict: "user_id, item_key" })
      .select()
      .single();

    if (error) {
      throw new Error(`[equipmentRepo] Error updating item ${item.itemKey}: ${error.message}`);
    }

    return mapDbEquipmentToDomain(EquipmentDbRowSchema.parse(data));
  },

  async deleteItem(userId: string, itemKey: string): Promise<void> {
    const { error } = await supabase
      .from("user_equipment")
      .delete()
      .eq("user_id", userId)
      .eq("item_key", itemKey);

    if (error) {
      throw new Error(`[equipmentRepo] Error deleting item ${itemKey}: ${error.message}`);
    }
  },
};
