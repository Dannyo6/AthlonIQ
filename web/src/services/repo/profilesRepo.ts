import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { UserProfile } from "@/types";

export const ProfileDbRowSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  full_name: z.string().nullable().default(""),
  age: z.coerce.number().int().min(1).max(129).default(20),
  height_cm: z.coerce.number().min(1).default(173.0),
  weight_kg: z.coerce.number().min(25).max(250).default(55.0),
  dietary_pattern: z.enum([
    "nonvegetarian",
    "vegetarian",
    "vegan",
    "pescatarian",
    "eggetarian",
    "keto",
    "other",
  ]).default("nonvegetarian"),
  primary_goal: z.enum([
    "lean_bulk",
    "hypertrophy",
    "strength",
    "fat_loss",
    "recomposition",
    "endurance",
    "maintenance",
  ]).default("lean_bulk"),
  training_scope: z.array(z.string()).default(["gym", "calisthenics", "badminton", "running"]),
  training_days_per_week: z.coerce.number().int().min(1).max(7).default(5),
  training_environment: z.enum([
    "home_gym",
    "commercial_gym",
    "calisthenics_park",
    "hybrid",
  ]).default("home_gym"),
  calorie_tracking_habit: z.enum([
    "weighing_foods",
    "rough_estimates",
    "visual_portions",
    "mindful_eating",
    "none",
  ]).default("rough_estimates"),
  sex: z.enum(["male", "female", "other"]).nullable().default(null),
  waist_cm: z.coerce.number().nullable().default(null),
  experience_level: z.enum(["beginner", "intermediate", "advanced", "elite"]).nullable().default(null),
  current_split: z.enum(["ppl", "upper_lower", "full_body", "bro_split", "custom", "need_recommendation"]).nullable().default(null),
  weekly_badminton_sessions: z.coerce.number().nullable().default(null),
  weekly_running_sessions: z.coerce.number().nullable().default(null),
  sleep_baseline_hours: z.coerce.number().nullable().default(null),
  exercise_limitations: z.string().nullable().default(null),
  onboarding_step: z.coerce.number().int().min(1).max(5).default(1),
  onboarding_completed: z.boolean().default(false),
  equipment_confirmed: z.boolean().default(false),
});

export type ProfileDbRow = z.infer<typeof ProfileDbRowSchema>;

export function mapDbProfileToDomain(row: ProfileDbRow): UserProfile {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name || "",
    age: row.age,
    heightCm: row.height_cm,
    weightKg: row.weight_kg,
    dietaryPattern: row.dietary_pattern,
    primaryGoal: row.primary_goal,
    trainingScope: row.training_scope,
    trainingDaysPerWeek: row.training_days_per_week,
    trainingEnvironment: row.training_environment,
    calorieTrackingHabit: row.calorie_tracking_habit,
    sex: row.sex,
    waistCm: row.waist_cm,
    experienceLevel: row.experience_level,
    currentSplit: row.current_split,
    weeklyBadmintonSessions: row.weekly_badminton_sessions,
    weeklyRunningSessions: row.weekly_running_sessions,
    sleepBaselineHours: row.sleep_baseline_hours,
    exerciseLimitations: row.exercise_limitations,
    onboardingStep: row.onboarding_step,
    onboardingCompleted: row.onboarding_completed,
    equipmentConfirmed: row.equipment_confirmed,
  };
}

export function mapDomainProfileToDb(profile: Partial<UserProfile> & { id: string }): Record<string, any> {
  const dbData: Record<string, any> = { id: profile.id };
  if (profile.email !== undefined) dbData.email = profile.email;
  if (profile.fullName !== undefined) dbData.full_name = profile.fullName;
  if (profile.age !== undefined) dbData.age = profile.age;
  if (profile.heightCm !== undefined) dbData.height_cm = profile.heightCm;
  if (profile.weightKg !== undefined) dbData.weight_kg = profile.weightKg;
  if (profile.dietaryPattern !== undefined) dbData.dietary_pattern = profile.dietaryPattern;
  if (profile.primaryGoal !== undefined) dbData.primary_goal = profile.primaryGoal;
  if (profile.trainingScope !== undefined) dbData.training_scope = profile.trainingScope;
  if (profile.trainingDaysPerWeek !== undefined) dbData.training_days_per_week = profile.trainingDaysPerWeek;
  if (profile.trainingEnvironment !== undefined) dbData.training_environment = profile.trainingEnvironment;
  if (profile.calorieTrackingHabit !== undefined) dbData.calorie_tracking_habit = profile.calorieTrackingHabit;
  if (profile.sex !== undefined) dbData.sex = profile.sex;
  if (profile.waistCm !== undefined) dbData.waist_cm = profile.waistCm;
  if (profile.experienceLevel !== undefined) dbData.experience_level = profile.experienceLevel;
  if (profile.currentSplit !== undefined) dbData.current_split = profile.currentSplit;
  if (profile.weeklyBadmintonSessions !== undefined) dbData.weekly_badminton_sessions = profile.weeklyBadmintonSessions;
  if (profile.weeklyRunningSessions !== undefined) dbData.weekly_running_sessions = profile.weeklyRunningSessions;
  if (profile.sleepBaselineHours !== undefined) dbData.sleep_baseline_hours = profile.sleepBaselineHours;
  if (profile.exerciseLimitations !== undefined) dbData.exercise_limitations = profile.exerciseLimitations;
  if (profile.onboardingStep !== undefined) dbData.onboarding_step = profile.onboardingStep;
  if (profile.onboardingCompleted !== undefined) dbData.onboarding_completed = profile.onboardingCompleted;
  if (profile.equipmentConfirmed !== undefined) dbData.equipment_confirmed = profile.equipmentConfirmed;
  return dbData;
}

export const profilesRepo = {
  async fetchProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      throw new Error(`[profilesRepo] Error fetching profile: ${error.message}`);
    }
    if (!data) return null;

    const validated = ProfileDbRowSchema.parse(data);
    return mapDbProfileToDomain(validated);
  },

  async upsertProfile(profile: Partial<UserProfile> & { id: string }): Promise<UserProfile> {
    const payload = mapDomainProfileToDb(profile);
    const { data, error } = await supabase
      .from("profiles")
      .upsert(payload)
      .select()
      .single();

    if (error) {
      throw new Error(`[profilesRepo] Error upserting profile: ${error.message}`);
    }

    const validated = ProfileDbRowSchema.parse(data);
    return mapDbProfileToDomain(validated);
  },
};
