/**
 * AthlonIQ Core Domain Types & Data Contracts
 * Enforces auditable provenance, deterministic biometrics, and equipment verification.
 */

export type ValueProvenance =
  | "provisional_default"
  | "calculated_estimate"
  | "user_confirmed"
  | "ai_estimated"
  | "awaiting_onboarding"
  | "unconfirmed_equipment"
  | "verified_reference"
  | "manual_entry"
  | "user_corrected"
  | "rules_based_progression";

export type FoodProvenance =
  | "verified_reference"
  | "manual_entry"
  | "user_corrected"
  | "ai_estimated";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  age: number; // default 20
  heightCm: number; // default 173.0
  weightKg: number; // default 55.0
  dietaryPattern:
    | "nonvegetarian"
    | "vegetarian"
    | "vegan"
    | "pescatarian"
    | "eggetarian"
    | "keto"
    | "other";
  primaryGoal:
    | "lean_bulk"
    | "hypertrophy"
    | "strength"
    | "fat_loss"
    | "recomposition"
    | "endurance"
    | "maintenance";
  trainingScope: string[]; // ["gym", "calisthenics", "badminton", "running"]
  trainingDaysPerWeek: number; // default 5
  trainingEnvironment: "home_gym" | "commercial_gym" | "calisthenics_park" | "hybrid";
  calorieTrackingHabit:
    | "weighing_foods"
    | "rough_estimates"
    | "visual_portions"
    | "mindful_eating"
    | "none";

  // Known unknowns (MUST default to null until explicitly provided)
  sex: "male" | "female" | "other" | null;
  waistCm: number | null;
  experienceLevel: "beginner" | "intermediate" | "advanced" | "elite" | null;
  currentSplit:
    | "ppl"
    | "upper_lower"
    | "full_body"
    | "bro_split"
    | "custom"
    | "need_recommendation"
    | null;
  weeklyBadmintonSessions: number | null;
  weeklyRunningSessions: number | null;
  sleepBaselineHours: number | null;
  exerciseLimitations: string | null;

  // Onboarding & confirmation flags
  onboardingStep: number; // 1 to 5
  onboardingCompleted: boolean;
  equipmentConfirmed: boolean;
}

export interface EquipmentItem {
  id: string;
  itemKey: string;
  itemName: string;
  maxLoadKg: number | null;
  minIncrementKg: number | null;
  isAvailable: boolean;
  isConfirmed: boolean;
  notes?: string | null;
}

export interface UserGoals {
  proteinMinG: number; // 88
  proteinMaxG: number; // 121
  proteinTargetG: number; // 110
  proteinProvenance: ValueProvenance; // "provisional_default"
  calorieTargetKcal: number | null; // null awaiting onboarding
  calorieProvenance: ValueProvenance; // "awaiting_onboarding"
  carbsTargetG: number | null;
  fatTargetG: number | null;
  waterTargetMl: number; // 3500
}

export interface UserPreferences {
  weightUnit: "kg" | "lbs";
  distanceUnit: "km" | "miles";
  timezone: string;
  notificationsEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

export interface RecoveryCheckIn {
  date: string;
  sleepHours: number;
  sleepQuality: number; // 1 - 5
  soreness: number; // 1 - 5
  fatigue: number; // 1 - 5
  stress: number | null; // 1 - 5
  notes?: string;
}

export interface ReadinessResult {
  readinessScore: number; // 0 - 100
  status: "Prime" | "Moderate" | "Recover";
  guidance: string;
  triggers: string[];
  provenance: ValueProvenance;
}

// Legacy view models maintained for compatibility
export interface AthleteProfile extends UserProfile {
  tier?: "beginner" | "intermediate" | "advanced" | "elite";
  bodyFatPct?: number;
  targetWeightKg?: number;
}

export interface DailyReadiness extends ReadinessResult {
  date: string;
  sleepDurationHours: number;
  sleepQualityScore: number;
  sorenessScore: number;
}

export interface MacroTarget {
  targetCalories: number;
  loggedCalories: number;
  proteinGrams: number;
  loggedProtein: number;
  carbsGrams: number;
  loggedCarbs: number;
  fatGrams: number;
  loggedFat: number;
  waterMl: number;
  loggedWaterMl: number;
}

export interface WorkoutSummary {
  id: string;
  name: string;
  date: string;
  durationMinutes: number;
  totalVolumeKg: number;
  exerciseCount: number;
  perceivedRpe: number;
}

export interface ProposedCoachAction {
  type: "log_meal" | "update_protein_target" | "apply_progression" | string;
  summary: string;
  payload: Record<string, any>;
  status?: "pending" | "applied" | "dismissed";
}

export interface EpistemicCoachMessage {
  id: string;
  sender: "athlete" | "coach";
  text: string;
  timestamp: string;
  toolsUsed?: string[];
  factsFromTools?: string[];
  appCalculations?: string[];
  recommendations?: string[];
  missingOrUncertain?: string[];
  proposedAction?: ProposedCoachAction | null;
}

export interface WeeklyReviewReport {
  week_start_date: string;
  week_end_date: string;
  generated_at: string;
  nutrition_consistency: {
    days_logging_food: number;
    days_in_period: number;
    logging_consistency_pct: number;
    protein_target_band: string;
    current_protein_target_g: number;
    latest_confirmed_protein_g: number;
    is_protein_goal_met_today: boolean;
    top_protein_staples: Record<string, number>;
    summary: string;
  };
  weight_trend_review: {
    status: string;
    weigh_in_count: number;
    latest_weight_kg?: number | null;
    rolling_7d_kg?: number | null;
    weekly_delta_kg?: number | null;
    explanation: string;
    disclaimer: string;
  };
  training_and_sports_load: {
    gym_sessions_completed: number;
    gym_sessions_target: number;
    gym_consistency_pct: number;
    gym_total_sets: number;
    gym_total_volume_kg: number;
    running_sessions: number;
    running_total_km: number;
    badminton_sessions: number;
    badminton_total_min: number;
    calisthenics_sessions: number;
    summary: string;
  };
  recovery_patterns: {
    average_sleep_hours: number;
    average_sleep_quality: number;
    average_soreness: number;
    average_fatigue: number;
    readiness_distribution: Record<string, number>;
    latest_readiness_score: number;
    latest_status: string;
    summary: string;
  };
  next_week_priorities: string[];
}

export interface CoachMessage {
  id: string;
  role: "athlete" | "coach" | "system";
  content: string;
  timestamp: string;
  actionRecommendation?: {
    type: "deload" | "macro_shift" | "swap_exercise";
    description: string;
  };
}

// =============================================================================
// PHASE 2: Tracking Domain Types
// =============================================================================

/** A food item from the verified Indian & athletic reference catalog */
export interface FoodCatalogItem {
  id: string;
  name: string;
  category: string;
  serving_label: string;
  serving_weight_g: number | null;
  calories_kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  provenance: FoodProvenance;
}

export type MealSlot = "breakfast" | "lunch" | "dinner" | "snack";

/** A single logged food entry for a given day */
export interface FoodEntry {
  id: string;
  loggedDate: string; // ISO date "YYYY-MM-DD"
  mealSlot: MealSlot;
  foodName: string;
  quantity: number;
  servingLabel: string;
  caloriesKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  provenance: FoodProvenance;
  /** CRITICAL: FALSE = unconfirmed estimate; MUST NEVER pollute confirmed daily totals */
  isConfirmed: boolean;
  is_confirmed?: boolean;
  confidence?: "high" | "medium" | "low";
  notes?: string;
}

export interface CandidateFoodItem {
  id: string;
  catalog_id?: string | null;
  food_name: string;
  matched_catalog_name?: string | null;
  estimated_serving: string;
  serving_label: string;
  quantity: number;
  calories_kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  confidence: "high" | "medium" | "low";
  provenance: FoodProvenance;
  is_confirmed: boolean;
  isConfirmed?: boolean;
}

export interface MealAnalysisResponse {
  candidates: CandidateFoodItem[];
  detected_item_count: number;
  provenance: "ai_estimated";
  notes?: string | null;
}

export interface DailyMacroTotals {
  caloriesKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  entryCount: number;
}

export interface DailyNutritionSummary {
  /** Only entries where isConfirmed === true */
  confirmedTotals: DailyMacroTotals;
  /** Unconfirmed photo/AI estimates, tracked separately */
  unconfirmedEstimates: DailyMacroTotals;
}

/** A logged strength training set */
export interface ExerciseSet {
  id: string;
  exerciseName: string;
  equipmentKey?: string | null;
  setOrder: number;
  reps: number;
  loadKg: number;
  isBodyweight: boolean;
  rpe?: number | null; // 1-10
  rir?: number | null; // 0-6
  isCompleted: boolean;
  isPr: boolean;
  notes?: string;
}

/** A complete workout session */
export interface WorkoutSession {
  id: string;
  loggedDate: string;
  title: string;
  templateId?: string | null;
  durationMinutes?: number | null;
  sessionRpe?: number | null;
  completed: boolean;
  sets: ExerciseSet[];
  notes?: string;
}

/** A pre-defined workout template with exercise prescriptions */
export interface WorkoutTemplate {
  id: string;
  name: string;
  focus: string;
  estimatedDurationMin?: number;
  exercises: TemplateExercise[];
}

export interface TemplateExercise {
  id: string;
  exerciseName: string;
  category: string;
  equipmentKey?: string | null;
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number;
  restSeconds: number;
  sortOrder: number;
}

export type ActivityType = "running" | "badminton" | "calisthenics" | "other";
export type BadmintonFormat = "singles" | "doubles" | "free_play" | "drills";

/** A non-gym sport or activity session */
export interface ActivitySession {
  id: string;
  loggedDate: string;
  activityType: ActivityType;
  durationMinutes: number;
  // Running
  distanceKm?: number | null;
  paceFormatted?: string | null; // "MM:SS /km"
  // Badminton
  matchFormat?: BadmintonFormat | null;
  // Calisthenics
  skillName?: string | null;
  progressionLevel?: string | null;
  setsCount?: number | null;
  repsOrHoldSec?: number | null;
  // Shared
  perceivedEffort?: number | null; // 1-10
  routeOrNotes?: string;
}

/** Daily body composition measurement */
export interface BodyMetric {
  id: string;
  loggedDate: string;
  weightKg: number;
  waistCm?: number | null;
  chestCm?: number | null;
  armCm?: number | null;
  notes?: string;
}

/** Progression engine output */
export type ProgressionAction =
  | "increase_load"
  | "increase_reps_or_tempo"
  | "maintain_or_deload"
  | "maintain"
  | "confirm_equipment_first";

export interface ProgressionSuggestion {
  exerciseName: string;
  action: ProgressionAction;
  explanation: string;
  newLoadKg?: number | null;
  newRepsSuggestion?: string | null;
  requiresUserConfirmation: boolean;
  provenance: ValueProvenance;
}

/** Weight trend result from the rolling-average engine */
export interface WeightTrendResult {
  status: "ok" | "insufficient_data";
  rolling7dKg: number | null;
  weeklyDeltaKg: number | null;
  explanation: string;
  entries: Array<{
    logged_date: string;
    weight_kg: number;
    rolling_7d_kg: number | null;
  }>;
}

// =============================================================================
// PHASE 5: Advanced Personalization, Fatigue Advisory & Progress Photos
// =============================================================================

export interface LeanBulkCalibrationResult {
  status: "insufficient_history" | "on_track" | "increase_surplus" | "trim_surplus";
  current_calorie_target_kcal: number | null;
  new_calorie_target_kcal: number | null;
  suggested_calorie_delta_kcal: number;
  weekly_delta_kg: number | null;
  waist_delta_cm: number | null;
  observation_days_logged: number;
  observation_weigh_ins: number;
  explanation: string;
  recommendation: string;
  requires_user_confirmation: boolean;
  provenance: ValueProvenance;
}

export interface FatigueAdvisoryResult {
  status: "high_cumulative_fatigue" | "moderate_strain" | "optimal";
  is_high_fatigue: boolean;
  sport_volume_flag: boolean;
  recovery_deficit_flag: boolean;
  gym_sessions_7d: number;
  badminton_minutes_7d: number;
  running_km_7d: number;
  avg_sleep_hours_7d: number | null;
  avg_soreness_7d: number | null;
  avg_fatigue_7d: number | null;
  explanation: string;
  recommendations: string[];
  disclaimer: string;
}

export interface ProgressPhotoAsset {
  id: string;
  loggedDate: string;
  weightKg: number;
  imageUrl: string;
  notes?: string;
  category: "meal" | "progress";
}

