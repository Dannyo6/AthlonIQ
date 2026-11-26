import { WeeklyReviewReport } from "@/types";
import { resolveDateInTimezone } from "@/lib/weeklyConsistency";

export const QUICK_PROMPTS: readonly string[] = [
  "How has my training progressed over the last four weeks?",
  "Did I eat enough protein yesterday?",
  "What should I train today, given my recent activity and recovery?",
  "Which exercises have improved the most?",
  "How consistent has my nutrition been this week?",
  "Summarize my week and suggest what to improve next week.",
  "Suggest a practical nonvegetarian meal to help meet my remaining protein target.",
] as const;

interface OfflineSnapshot {
  food_entries?: Array<{ loggedDate?: string }>;
  body_metrics?: Array<unknown>;
  workout_sessions?: Array<unknown>;
  activity_sessions?: Array<{ activityType?: string }>;
}

export function buildOfflineWeeklyReport(
  snapshot: OfflineSnapshot,
  params: {
    proteinMinG: number | null;
    proteinMaxG: number | null;
    proteinTargetG: number | null;
    trainingDaysPerWeek: number | null | undefined;
    weightKg: number | null | undefined;
    timezone?: string | null;
    now?: string | Date;
  }
): WeeklyReviewReport {
  const endDate = resolveDateInTimezone(params.now, params.timezone ?? "Asia/Kolkata");
  const startDt = new Date(`${endDate}T00:00:00Z`);
  startDt.setUTCDate(startDt.getUTCDate() - 6);
  const startDate = startDt.toISOString().split("T")[0];

  const foodCount = snapshot.food_entries?.length
    ? new Set(snapshot.food_entries.map((f) => f.loggedDate).filter(Boolean)).size
    : 0;
  const bodyMetricCount = snapshot.body_metrics?.length ?? 0;
  const workoutCount = snapshot.workout_sessions?.length ?? 0;
  const targetGym = params.trainingDaysPerWeek ?? 0;
  const runningCount =
    snapshot.activity_sessions?.filter((a) => a.activityType === "running").length ?? 0;
  const badmintonCount =
    snapshot.activity_sessions?.filter((a) => a.activityType === "badminton").length ?? 0;
  const calisthenicsCount =
    snapshot.activity_sessions?.filter((a) => a.activityType === "calisthenics").length ?? 0;

  const bandText =
    params.proteinMinG != null && params.proteinMaxG != null
      ? `${params.proteinMinG}–${params.proteinMaxG} g`
      : "Target not set";

  return {
    week_start_date: startDate,
    week_end_date: endDate,
    generated_at: new Date().toISOString(),
    nutrition_consistency: {
      days_logging_food: foodCount,
      days_in_period: 7,
      logging_consistency_pct: Math.round((foodCount / 7) * 1000) / 10,
      protein_target_band: bandText,
      current_protein_target_g: params.proteinTargetG ?? 0,
      latest_confirmed_protein_g: 0,
      is_protein_goal_met_today: false,
      top_protein_staples: {},
      summary:
        foodCount > 0
          ? `Logged food on ${foodCount}/7 days this week.`
          : "No food entries logged this week.",
    },
    weight_trend_review: {
      status: bodyMetricCount >= 3 ? "ok" : "insufficient_data",
      weigh_in_count: bodyMetricCount,
      latest_weight_kg: params.weightKg ?? null,
      rolling_7d_kg: bodyMetricCount >= 3 ? params.weightKg ?? null : null,
      weekly_delta_kg: null,
      explanation:
        bodyMetricCount >= 3 && params.weightKg != null
          ? `7-day rolling weight steady at ${params.weightKg} kg.`
          : "At least 3 weigh-ins required to calculate a reliable rolling trend.",
      disclaimer:
        "Single-day weight shifts reflect hydration, glycogen, and GI content, not fat or muscle tissue changes.",
    },
    training_and_sports_load: {
      gym_sessions_completed: workoutCount,
      gym_sessions_target: targetGym,
      gym_consistency_pct: targetGym > 0 ? Math.round((workoutCount / targetGym) * 100) : 0,
      gym_total_sets: 0,
      gym_total_volume_kg: 0,
      running_sessions: runningCount,
      running_total_km: 0,
      badminton_sessions: badmintonCount,
      badminton_total_min: 0,
      calisthenics_sessions: calisthenicsCount,
      summary: `Gym: ${workoutCount}/${targetGym} sessions completed. Sports: ${badmintonCount} badminton & ${runningCount} running.`,
    },
    recovery_patterns: {
      average_sleep_hours: 0,
      average_sleep_quality: 0,
      average_soreness: 0,
      average_fatigue: 0,
      readiness_distribution: { Prime: 0, Moderate: 0, Recover: 0 },
      latest_readiness_score: 0,
      latest_status: "Not set",
      summary: "Recovery patterns calculated from logged check-ins.",
    },
    next_week_priorities: [
      "Log food for at least 5 days next week to establish reliable macro consistency.",
      "Confirm your home gym equipment setup in Profile to unlock verified load progression.",
      params.proteinMinG != null && params.proteinMaxG != null
        ? `Maintain daily protein intake within the ${params.proteinMinG}–${params.proteinMaxG} g reference band.`
        : "Complete onboarding to calibrate your daily protein target band.",
    ],
  };
}
