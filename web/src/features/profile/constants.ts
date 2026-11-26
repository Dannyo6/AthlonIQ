import * as z from "zod";
import type { UserGoals, UserPreferences, UserProfile } from "@/types";

export const onboardingSchema = z.object({
  // Step 1: Biometrics
  age: z.coerce.number().min(12, "Age must be at least 12").max(120, "Age must be 120 or below"),
  heightCm: z.coerce
    .number()
    .min(100, "Height must be at least 100 cm")
    .max(250, "Height must be 250 cm or below"),
  weightKg: z.coerce
    .number()
    .min(30, "Weight must be at least 30 kg")
    .max(300, "Weight must be 300 kg or below"),
  timezone: z.string().min(1, "Timezone is required").default("Asia/Kolkata"),
  sex: z.enum(["male", "female", "other", "unknown"]).optional().nullable(),
  waistCm: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? null : v),
    z.coerce
      .number()
      .min(40, "Waist must be at least 40 cm")
      .max(200, "Waist must be 200 cm or below")
      .nullable()
  ),

  // Step 2: Goals & Diet
  primaryGoal: z.enum([
    "lean_bulk",
    "hypertrophy",
    "strength",
    "fat_loss",
    "recomposition",
    "endurance",
    "maintenance",
  ]),
  dietaryPattern: z.enum([
    "nonvegetarian",
    "vegetarian",
    "vegan",
    "pescatarian",
    "eggetarian",
    "keto",
    "other",
  ]),
  customProteinG: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? null : v),
    z.coerce
      .number()
      .min(50, "Protein target must be at least 50 g")
      .max(350, "Protein target must be 350 g or below")
      .nullable()
  ),
  dietaryRestrictions: z.string().optional().nullable(),

  // Step 4: Training & Sleep
  trainingDaysPerWeek: z.coerce.number().min(1).max(7),
  experienceLevel: z.enum(["beginner", "intermediate", "advanced", "elite"]),
  currentSplit: z.enum([
    "ppl",
    "upper_lower",
    "full_body",
    "bro_split",
    "custom",
    "need_recommendation",
  ]),
  weeklyBadmintonSessions: z.coerce.number().min(0).max(14),
  weeklyRunningSessions: z.coerce.number().min(0).max(14),
  sleepBaselineHours: z.coerce.number().min(4).max(14),
  exerciseLimitations: z.string().optional().nullable(),
});

export type OnboardingFormData = z.infer<typeof onboardingSchema>;

export interface ProfileWizardStep {
  num: number;
  label: string;
}

export const PROFILE_WIZARD_STEPS: readonly ProfileWizardStep[] = [
  { num: 1, label: "Biometrics & Units" },
  { num: 2, label: "Goals & Diet" },
  { num: 3, label: "Home Equipment" },
  { num: 4, label: "Training & Sleep" },
  { num: 5, label: "Review & Activation" },
] as const;

export const STEP_QUERY_MAP: Record<string, number> = {
  biometrics: 1,
  goals: 2,
  equipment: 3,
  preferences: 4,
  training: 4,
  review: 5,
};

export const PRIMARY_GOAL_LABELS: Record<OnboardingFormData["primaryGoal"], string> = {
  lean_bulk: "Lean Bulk (+250 kcal surplus)",
  hypertrophy: "Hypertrophy (Targeted Muscle Growth)",
  strength: "Strength Focus (Neural & Max Overload)",
  fat_loss: "Fat Loss (-400 kcal deficit)",
  recomposition: "Body Recomposition",
  endurance: "Endurance & Conditioning",
  maintenance: "Maintenance",
};

export const DIETARY_PATTERN_OPTIONS = [
  { value: "nonvegetarian", label: "Nonvegetarian (Omnivore)" },
  { value: "vegetarian", label: "Vegetarian (Lacto-Ovo)" },
  { value: "eggetarian", label: "Eggetarian" },
  { value: "vegan", label: "Vegan / Plant-Based" },
  { value: "pescatarian", label: "Pescatarian" },
  { value: "keto", label: "Ketogenic" },
  { value: "other", label: "Other" },
] as const;

export function detectDeviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata";
  } catch {
    return "Asia/Kolkata";
  }
}

/**
 * Build deterministic form baseline from hydrated profile, goals, and preferences.
 * When onboarding is incomplete and height/weight equal untouched initial defaults (173 / 55),
 * inputs remain blank so BMI renders "Enter height and weight" instead of prefilled defaults.
 */
export function buildProfileBaseline(
  profile: Partial<UserProfile>,
  goals: Partial<UserGoals>,
  preferences: Partial<UserPreferences>,
  detectedTimezone: string
): OnboardingFormData {
  const heightBlank = !profile.onboardingCompleted && (!profile.heightCm || profile.heightCm === 173.0);
  const weightBlank = !profile.onboardingCompleted && (!profile.weightKg || profile.weightKg === 55.0);

  return {
    age: profile.age || 20,
    heightCm: (heightBlank ? "" : profile.heightCm) as unknown as number,
    weightKg: (weightBlank ? "" : profile.weightKg) as unknown as number,
    sex: (profile.sex as OnboardingFormData["sex"]) || "unknown",
    waistCm: (profile.waistCm ?? "") as unknown as number | null,
    primaryGoal: (profile.primaryGoal as OnboardingFormData["primaryGoal"]) || "lean_bulk",
    dietaryPattern: (profile.dietaryPattern as OnboardingFormData["dietaryPattern"]) || "nonvegetarian",
    customProteinG: goals.proteinTargetG || 110,
    dietaryRestrictions: "",
    trainingDaysPerWeek: profile.trainingDaysPerWeek || 5,
    experienceLevel: (profile.experienceLevel as OnboardingFormData["experienceLevel"]) || "beginner",
    currentSplit: (profile.currentSplit as OnboardingFormData["currentSplit"]) || "need_recommendation",
    weeklyBadmintonSessions: profile.weeklyBadmintonSessions ?? 2,
    weeklyRunningSessions: profile.weeklyRunningSessions ?? 1,
    sleepBaselineHours: profile.sleepBaselineHours ?? 7.5,
    exerciseLimitations: profile.exerciseLimitations || "",
    timezone: preferences.timezone || detectedTimezone || "Asia/Kolkata",
  };
}

function normVal(val: unknown): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "number") {
    return Number.isFinite(val) ? String(val) : "";
  }
  return String(val).trim();
}

export type NormalizedProfileSnapshot = Record<keyof OnboardingFormData, string>;

/**
 * Normalize every form value symmetrically so null, undefined, and empty strings
 * compare identically without false-positive dirty detection on mount/hydration.
 */
export function normalizeProfileSnapshot(
  values: Partial<OnboardingFormData>
): NormalizedProfileSnapshot {
  return {
    age: normVal(values.age),
    heightCm: normVal(values.heightCm),
    weightKg: normVal(values.weightKg),
    timezone: normVal(values.timezone),
    sex: normVal(values.sex) || "unknown",
    waistCm: normVal(values.waistCm),
    primaryGoal: normVal(values.primaryGoal) || "lean_bulk",
    dietaryPattern: normVal(values.dietaryPattern) || "nonvegetarian",
    customProteinG: normVal(values.customProteinG),
    dietaryRestrictions: normVal(values.dietaryRestrictions),
    trainingDaysPerWeek: normVal(values.trainingDaysPerWeek),
    experienceLevel: normVal(values.experienceLevel) || "beginner",
    currentSplit: normVal(values.currentSplit) || "need_recommendation",
    weeklyBadmintonSessions: normVal(values.weeklyBadmintonSessions),
    weeklyRunningSessions: normVal(values.weeklyRunningSessions),
    sleepBaselineHours: normVal(values.sleepBaselineHours),
    exerciseLimitations: normVal(values.exerciseLimitations),
  };
}

export function areProfileSnapshotsEqual(
  a: NormalizedProfileSnapshot,
  b: NormalizedProfileSnapshot
): boolean {
  const keys = Object.keys(a) as (keyof NormalizedProfileSnapshot)[];
  return keys.every((key) => a[key] === b[key]);
}
