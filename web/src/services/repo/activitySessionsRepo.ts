import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { ActivitySession, ActivityType, BadmintonFormat } from "@/types";

export const ActivityDbRowSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  logged_date: z.string(),
  activity_type: z.enum(["running", "badminton", "calisthenics", "other"]),
  duration_minutes: z.coerce.number().min(0.1),
  distance_km: z.coerce.number().nullable().default(null),
  pace_min_per_km: z.coerce.number().nullable().default(null),
  match_format: z.enum(["singles", "doubles", "free_play", "drills"]).nullable().default(null),
  skill_name: z.string().nullable().default(null),
  progression_level: z.string().nullable().default(null),
  sets_count: z.coerce.number().int().nullable().default(null),
  reps_or_hold_sec: z.coerce.number().int().nullable().default(null),
  perceived_effort: z.coerce.number().int().min(1).max(10).nullable().default(null),
  route_or_notes: z.string().nullable().default(null),
});

export type ActivityDbRow = z.infer<typeof ActivityDbRowSchema>;

export function mapDbActivityToDomain(row: ActivityDbRow): ActivitySession {
  let paceFormatted: string | null = null;
  if (row.pace_min_per_km && row.pace_min_per_km > 0) {
    const mins = Math.floor(row.pace_min_per_km);
    const secs = Math.round((row.pace_min_per_km - mins) * 60);
    paceFormatted = `${mins}:${secs < 10 ? "0" : ""}${secs} /km`;
  }

  return {
    id: row.id,
    loggedDate: row.logged_date,
    activityType: row.activity_type as ActivityType,
    durationMinutes: row.duration_minutes,
    distanceKm: row.distance_km,
    paceFormatted: paceFormatted || undefined,
    matchFormat: row.match_format as BadmintonFormat | null,
    skillName: row.skill_name,
    progressionLevel: row.progression_level,
    setsCount: row.sets_count,
    repsOrHoldSec: row.reps_or_hold_sec,
    perceivedEffort: row.perceived_effort,
    routeOrNotes: row.route_or_notes || undefined,
  };
}

export const activitySessionsRepo = {
  async fetchActivities(userId: string): Promise<ActivitySession[]> {
    const { data, error } = await supabase
      .from("activity_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("logged_date", { ascending: false });

    if (error) {
      throw new Error(`[activitySessionsRepo] Error fetching activities: ${error.message}`);
    }

    return (data || []).map((row) => mapDbActivityToDomain(ActivityDbRowSchema.parse(row)));
  },

  async createActivity(userId: string, activity: Omit<ActivitySession, "id">): Promise<ActivitySession> {
    let paceMinutes: number | null = null;
    if (activity.activityType === "running" && activity.distanceKm && activity.distanceKm > 0) {
      paceMinutes = activity.durationMinutes / activity.distanceKm;
    }

    const payload = {
      user_id: userId,
      logged_date: activity.loggedDate,
      activity_type: activity.activityType,
      duration_minutes: activity.durationMinutes,
      distance_km: activity.distanceKm || null,
      pace_min_per_km: paceMinutes,
      match_format: activity.matchFormat || null,
      skill_name: activity.skillName || null,
      progression_level: activity.progressionLevel || null,
      sets_count: activity.setsCount || null,
      reps_or_hold_sec: activity.repsOrHoldSec || null,
      perceived_effort: activity.perceivedEffort || null,
      route_or_notes: activity.routeOrNotes || null,
    };

    const { data, error } = await supabase
      .from("activity_sessions")
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw new Error(`[activitySessionsRepo] Error creating activity: ${error.message}`);
    }

    return mapDbActivityToDomain(ActivityDbRowSchema.parse(data));
  },

  async deleteActivity(userId: string, id: string): Promise<void> {
    const { error } = await supabase
      .from("activity_sessions")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`[activitySessionsRepo] Error deleting activity: ${error.message}`);
    }
  },
};
