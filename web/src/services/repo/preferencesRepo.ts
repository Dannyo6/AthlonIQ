import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { UserPreferences } from "@/types";

export const PreferencesDbRowSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  weight_unit: z.enum(["kg", "lbs"]).default("kg"),
  distance_unit: z.enum(["km", "miles"]).default("km"),
  timezone: z.string().default("Asia/Kolkata"),
  notifications_enabled: z.boolean().default(false),
  quiet_hours_start: z.string().default("22:30"),
  quiet_hours_end: z.string().default("07:00"),
});

export type PreferencesDbRow = z.infer<typeof PreferencesDbRowSchema>;

export function mapDbPreferencesToDomain(row: PreferencesDbRow): UserPreferences {
  return {
    weightUnit: row.weight_unit,
    distanceUnit: row.distance_unit,
    timezone: row.timezone,
    notificationsEnabled: row.notifications_enabled,
    quietHoursStart: row.quiet_hours_start.slice(0, 5),
    quietHoursEnd: row.quiet_hours_end.slice(0, 5),
  };
}

export const preferencesRepo = {
  async fetchPreferences(userId: string): Promise<UserPreferences | null> {
    const { data, error } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw new Error(`[preferencesRepo] Error fetching preferences: ${error.message}`);
    }
    if (!data) return null;

    return mapDbPreferencesToDomain(PreferencesDbRowSchema.parse(data));
  },

  async upsertPreferences(userId: string, prefs: UserPreferences): Promise<UserPreferences> {
    const payload = {
      user_id: userId,
      weight_unit: prefs.weightUnit,
      distance_unit: prefs.distanceUnit,
      timezone: prefs.timezone,
      notifications_enabled: prefs.notificationsEnabled,
      quiet_hours_start: prefs.quietHoursStart,
      quiet_hours_end: prefs.quietHoursEnd,
    };

    const { data, error } = await supabase
      .from("user_preferences")
      .upsert(payload, { onConflict: "user_id" })
      .select()
      .single();

    if (error) {
      throw new Error(`[preferencesRepo] Error upserting preferences: ${error.message}`);
    }

    return mapDbPreferencesToDomain(PreferencesDbRowSchema.parse(data));
  },
};
