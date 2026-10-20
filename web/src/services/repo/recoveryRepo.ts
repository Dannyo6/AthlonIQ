import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { RecoveryCheckIn } from "@/types";

export const RecoveryDbRowSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  logged_date: z.string(),
  sleep_hours: z.coerce.number().min(0).max(24),
  sleep_quality: z.coerce.number().int().min(1).max(5),
  soreness: z.coerce.number().int().min(1).max(5),
  fatigue: z.coerce.number().int().min(1).max(5),
  stress: z.coerce.number().int().min(1).max(5).nullable().default(null),
  readiness_score: z.coerce.number().int().min(0).max(100),
  readiness_status: z.enum(["Prime", "Moderate", "Recover"]),
  triggers: z.array(z.string()).default([]),
  notes: z.string().nullable().default(null),
});

export type RecoveryDbRow = z.infer<typeof RecoveryDbRowSchema>;

export function mapDbRecoveryToDomain(row: RecoveryDbRow): RecoveryCheckIn {
  return {
    date: row.logged_date,
    sleepHours: row.sleep_hours,
    sleepQuality: row.sleep_quality,
    soreness: row.soreness,
    fatigue: row.fatigue,
    stress: row.stress,
    notes: row.notes ?? undefined,
  };
}

export const recoveryRepo = {
  async fetchHistory(userId: string, limit = 30): Promise<RecoveryCheckIn[]> {
    const { data, error } = await supabase
      .from("recovery_logs")
      .select("*")
      .eq("user_id", userId)
      .order("logged_date", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`[recoveryRepo] Error fetching recovery history: ${error.message}`);
    }

    return (data || []).map((row) => mapDbRecoveryToDomain(RecoveryDbRowSchema.parse(row)));
  },

  async fetchByDate(userId: string, date: string): Promise<RecoveryCheckIn | null> {
    const { data, error } = await supabase
      .from("recovery_logs")
      .select("*")
      .eq("user_id", userId)
      .eq("logged_date", date)
      .maybeSingle();

    if (error) {
      throw new Error(`[recoveryRepo] Error fetching recovery log for ${date}: ${error.message}`);
    }
    if (!data) return null;

    return mapDbRecoveryToDomain(RecoveryDbRowSchema.parse(data));
  },

  async upsertLog(
    userId: string,
    checkin: RecoveryCheckIn,
    readiness: { score: number; status: "Prime" | "Moderate" | "Recover"; triggers?: string[] }
  ): Promise<RecoveryCheckIn> {
    const payload = {
      user_id: userId,
      logged_date: checkin.date,
      sleep_hours: checkin.sleepHours,
      sleep_quality: checkin.sleepQuality,
      soreness: checkin.soreness,
      fatigue: checkin.fatigue,
      stress: checkin.stress ?? null,
      readiness_score: readiness.score,
      readiness_status: readiness.status,
      triggers: readiness.triggers || [],
      notes: checkin.notes || null,
    };

    const { data, error } = await supabase
      .from("recovery_logs")
      .upsert(payload, { onConflict: "user_id, logged_date" })
      .select()
      .single();

    if (error) {
      throw new Error(`[recoveryRepo] Error upserting recovery log: ${error.message}`);
    }

    return mapDbRecoveryToDomain(RecoveryDbRowSchema.parse(data));
  },
};
