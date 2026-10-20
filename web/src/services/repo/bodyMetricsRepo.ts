import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { BodyMetric } from "@/types";

export const BodyMetricDbRowSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  logged_date: z.string(),
  weight_kg: z.coerce.number().min(25).max(250),
  waist_cm: z.coerce.number().nullable().default(null),
  chest_cm: z.coerce.number().nullable().default(null),
  arm_cm: z.coerce.number().nullable().default(null),
  notes: z.string().nullable().default(null),
});

export type BodyMetricDbRow = z.infer<typeof BodyMetricDbRowSchema>;

export function mapDbBodyMetricToDomain(row: BodyMetricDbRow): BodyMetric {
  return {
    id: row.id,
    loggedDate: row.logged_date,
    weightKg: row.weight_kg,
    waistCm: row.waist_cm,
    chestCm: row.chest_cm,
    armCm: row.arm_cm,
    notes: row.notes || undefined,
  };
}

export const bodyMetricsRepo = {
  async fetchMetrics(userId: string): Promise<BodyMetric[]> {
    const { data, error } = await supabase
      .from("body_metrics")
      .select("*")
      .eq("user_id", userId)
      .order("logged_date", { ascending: false });

    if (error) {
      throw new Error(`[bodyMetricsRepo] Error fetching body metrics: ${error.message}`);
    }

    return (data || []).map((row) => mapDbBodyMetricToDomain(BodyMetricDbRowSchema.parse(row)));
  },

  async createMetric(userId: string, metric: Omit<BodyMetric, "id">): Promise<BodyMetric> {
    const payload = {
      user_id: userId,
      logged_date: metric.loggedDate,
      weight_kg: metric.weightKg,
      waist_cm: metric.waistCm || null,
      chest_cm: metric.chestCm || null,
      arm_cm: metric.armCm || null,
      notes: metric.notes || null,
    };

    const { data, error } = await supabase
      .from("body_metrics")
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw new Error(`[bodyMetricsRepo] Error creating body metric: ${error.message}`);
    }

    return mapDbBodyMetricToDomain(BodyMetricDbRowSchema.parse(data));
  },

  async deleteMetric(userId: string, id: string): Promise<void> {
    const { error } = await supabase
      .from("body_metrics")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`[bodyMetricsRepo] Error deleting body metric: ${error.message}`);
    }
  },
};
