/**
 * AUTO-GENERATED FILE — DO NOT EDIT DIRECTLY.
 *
 * AthlonIQ API TypeScript Definitions
 * Source: docs/openapi.json (OpenAPI 3.1.0)
 * Title: AthlonIQ API
 * Version: 0.1.0
 *
 * To regenerate, run:
 *   node tools/generate-api-types.mjs
 */

export interface APIResponse_CoachTurnResponse_ {
  success?: boolean;
  message?: string | null;
  data?: CoachTurnResponse | null;
}

export interface APIResponse_FatigueAdvisoryResult_ {
  success?: boolean;
  message?: string | null;
  data?: FatigueAdvisoryResult | null;
}

export interface APIResponse_HealthStatus_ {
  success?: boolean;
  message?: string | null;
  data?: HealthStatus | null;
}

export interface APIResponse_LeanBulkCalibrationResult_ {
  success?: boolean;
  message?: string | null;
  data?: LeanBulkCalibrationResult | null;
}

export interface APIResponse_List_CoachToolMetadata__ {
  success?: boolean;
  message?: string | null;
  data?: CoachToolMetadata[] | null;
}

export interface APIResponse_List_FoodCatalogItem__ {
  success?: boolean;
  message?: string | null;
  data?: FoodCatalogItem[] | null;
}

export interface APIResponse_MealAnalysisResponse_ {
  success?: boolean;
  message?: string | null;
  data?: MealAnalysisResponse | null;
}

export interface APIResponse_NutritionSummaryResponse_ {
  success?: boolean;
  message?: string | null;
  data?: NutritionSummaryResponse | null;
}

export interface APIResponse_ProgressionSuggestionResponse_ {
  success?: boolean;
  message?: string | null;
  data?: ProgressionSuggestionResponse | null;
}

export interface APIResponse_ReadinessCheckInResponse_ {
  success?: boolean;
  message?: string | null;
  data?: ReadinessCheckInResponse | null;
}

export interface APIResponse_RunningPaceResponse_ {
  success?: boolean;
  message?: string | null;
  data?: RunningPaceResponse | null;
}

export interface APIResponse_TargetsPreviewResponse_ {
  success?: boolean;
  message?: string | null;
  data?: TargetsPreviewResponse | null;
}

export interface APIResponse_WeeklyReviewReport_ {
  success?: boolean;
  message?: string | null;
  data?: WeeklyReviewReport | null;
}

export interface APIResponse_WeightTrendResponse_ {
  success?: boolean;
  message?: string | null;
  data?: WeightTrendResponse | null;
}

export interface Body_analyze_meal_photo_api_v1_vision_analyze_meal_post {
  file: string;
}

/**
 * A single candidate food item detected by vision analysis.
 */
export interface CandidateFoodItem {
  id: string;
  catalog_id?: string | null;
  food_name: string;
  matched_catalog_name?: string | null;
  estimated_serving: string;
  serving_label?: string;
  quantity?: number;
  calories_kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  confidence?: string;
  provenance?: string;
  is_confirmed?: boolean;
}

/**
 * Request payload for an interactive AI Coach chat turn.
 */
export interface CoachChatRequest {
  /** Athlete query or message */
  message: string;
  /** Optional conversation UUID */
  conversation_id?: string | null;
  /** Optional client-side state snapshot */
  context?: UserCoachingContext | null;
  /** Optional evaluation date override */
  today?: string | null;
}

/**
 * Metadata specification for an allowlisted typed tool.
 */
export interface CoachToolMetadata {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  returns: string;
}

/**
 * Structured response adhering to epistemic separation and safety guardrails.
 */
export interface CoachTurnResponse {
  /** Concise, tool-grounded coaching reply */
  reply_markdown: string;
  /** Allowlisted tools executed for this turn */
  tools_used?: string[];
  /** Verified facts from logs */
  facts_from_tools?: string[];
  /** Deterministic calculations computed by AthlonIQ */
  app_calculations?: string[];
  /** Actionable coaching recommendations */
  recommendations?: string[];
  /** Explicit missing or sparse data notices */
  missing_or_uncertain?: string[];
  /** Action awaiting user confirmation */
  proposed_action?: ProposedAction | null;
}

/**
 * Input payload to assess multi-sport cumulative fatigue.
 */
export interface FatigueAdvisoryRequest {
  gym_sessions_7d: number;
  badminton_minutes_7d: number;
  running_km_7d: number;
  avg_sleep_hours_7d?: number | null;
  avg_soreness_7d?: number | null;
  avg_fatigue_7d?: number | null;
}

/**
 * Workload fatigue advisory across strength, badminton, and running disciplines.
 */
export interface FatigueAdvisoryResult {
  /** Status: 'high_cumulative_fatigue' | 'moderate_strain' | 'optimal' */
  status: string;
  /** Whether cumulative fatigue exceeds threshold */
  is_high_fatigue: boolean;
  /** Whether running or badminton volume is elevated */
  sport_volume_flag: boolean;
  /** Whether sleep or soreness indicates deficit */
  recovery_deficit_flag: boolean;
  gym_sessions_7d: number;
  badminton_minutes_7d: number;
  running_km_7d: number;
  avg_sleep_hours_7d?: number | null;
  avg_soreness_7d?: number | null;
  avg_fatigue_7d?: number | null;
  explanation: string;
  recommendations: string[];
  disclaimer?: string;
}

/**
 * A single item from the Indian & Athletic Food Reference Catalog.
 */
export interface FoodCatalogItem {
  id: string;
  name: string;
  category: string;
  serving_label: string;
  serving_weight_g: number;
  calories_kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  provenance?: string;
}

export interface FoodEntryRequest {
  food_name: string;
  calories_kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  quantity?: number;
  is_confirmed?: boolean;
  provenance?: string;
}

export interface HTTPValidationError {
  detail?: ValidationError[];
}

/**
 * Health check response payload.
 */
export interface HealthStatus {
  status: string;
  environment: string;
  version: string;
  project: string;
}

/**
 * Input payload to evaluate 14-day lean bulk energy calibration.
 */
export interface LeanBulkCalibrationRequest {
  /** Current daily calorie target */
  current_calorie_target_kcal?: number | null;
  /** Logged food days over last 14 days */
  logged_nutrition_days: number;
  average_confirmed_intake_kcal?: number | null;
  weigh_ins_last_14d?: Record<string, unknown>[];
  waist_start_cm?: number | null;
  waist_current_cm?: number | null;
}

/**
 * Calibrated energy target evaluation with audit provenance and confirmation gating.
 */
export interface LeanBulkCalibrationResult {
  /** Status: 'insufficient_history' | 'on_track' | 'increase_surplus' | 'trim_surplus' */
  status: string;
  /** Current calorie target */
  current_calorie_target_kcal?: number | null;
  /** Recommended calorie target */
  new_calorie_target_kcal?: number | null;
  /** Suggested daily calorie delta (+150, -150, or 0) */
  suggested_calorie_delta_kcal?: number;
  /** Weekly weight change rate in kg/week */
  weekly_delta_kg?: number | null;
  /** Waist circumference delta over the period */
  waist_delta_cm?: number | null;
  /** Number of nutrition logging days over last 14 days */
  observation_days_logged: number;
  /** Number of weigh-in records over last 14 days */
  observation_weigh_ins: number;
  /** Detailed deterministic rationale */
  explanation: string;
  /** Actionable athlete recommendation */
  recommendation: string;
  /** Always requires explicit athlete confirmation */
  requires_user_confirmation?: boolean;
  /** Provenance marker */
  provenance?: string;
}

/**
 * Summed macro totals for a group of food entries.
 */
export interface MacroTotalsResponse {
  calories_kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  entry_count: number;
}

/**
 * Complete meal analysis result with typed provenance metadata.
 */
export interface MealAnalysisResponse {
  candidates: CandidateFoodItem[];
  detected_item_count: number;
  /** 'gemini' or 'mock' */
  provider: VisionProvider;
  /** 'live', 'fallback', or 'demo' */
  mode: VisionMode;
  /** Model identifier when provider is gemini */
  model_name?: string | null;
  provenance?: string;
  notes?: string | null;
  /** Provider/mode metadata for auditing the analysis source */
  vision_meta: VisionMeta;
}

export interface NutritionSummaryRequest {
  entries: FoodEntryRequest[];
}

/**
 * Daily nutrition totals with confirmed/unconfirmed guardrail separation.
 */
export interface NutritionSummaryResponse {
  user_id: string;
  confirmed_totals: MacroTotalsResponse;
  unconfirmed_estimates: MacroTotalsResponse;
  guardrail_note?: string;
}

export interface PreviousSetRequest {
  reps: number;
  load_kg: number;
  rpe?: number | null;
  is_bodyweight?: boolean;
}

export interface ProgressionRequest {
  exercise_name: string;
  previous_sets: PreviousSetRequest[];
  equipment_max_load_kg?: number;
  equipment_min_increment_kg?: number;
  equipment_confirmed?: boolean;
  readiness_status?: string;
  target_reps_max?: number;
}

/**
 * Rules-based progressive overload suggestion.
 */
export interface ProgressionSuggestionResponse {
  exercise_name: string;
  /** increase_load | increase_reps_or_tempo | maintain_or_deload | confirm_equipment_first | maintain */
  action: string;
  explanation: string;
  new_load_kg?: number | null;
  new_reps_suggestion?: string | null;
  requires_user_confirmation?: boolean;
  provenance?: string;
}

/**
 * Explicit action proposal requiring athlete confirmation before mutation.
 */
export interface ProposedAction {
  /** Action type: log_meal, update_protein_target, or apply_progression */
  type: string;
  /** Human-readable description of proposed change */
  summary: string;
  /** Concrete payload to apply upon confirmation */
  payload?: Record<string, unknown>;
}

/**
 * Subjective daily recovery and strain check-in inputs.
 */
export interface ReadinessCheckInRequest {
  /** Sleep duration in hours */
  sleep_hours: number;
  /** Sleep quality rating (1 to 5) */
  sleep_quality: number;
  /** Muscle soreness rating (1=none, 5=crippling) */
  soreness: number;
  /** Fatigue rating (1=energized, 5=exhausted) */
  fatigue: number;
  /** Optional stress rating (1 to 5) */
  stress?: number | null;
}

/**
 * Rules-based readiness score and transparent rule triggers.
 */
export interface ReadinessCheckInResponse {
  readiness_score: number;
  status: string;
  guidance: string;
  triggers: string[];
  provenance: string;
}

export interface RunningPaceRequest {
  /** Distance in kilometres, must be > 0 */
  distance_km: number;
  /** Duration in minutes, must be > 0 */
  duration_minutes: number;
}

/**
 * Deterministic running pace calculation result.
 */
export interface RunningPaceResponse {
  distance_km: number;
  duration_minutes: number;
  pace_decimal_min_per_km: number;
  pace_formatted: string;
  provenance?: string;
}

/**
 * Input payload to compute deterministic biometric and energy targets.
 */
export interface TargetsPreviewRequest {
  /** Athlete weight in kg */
  weight_kg: number;
  /** Athlete height in cm */
  height_cm: number;
  /** Athlete age in years */
  age?: number;
  /** Biological sex (male, female, or None) */
  sex?: string | null;
  /** Primary physical goal */
  primary_goal?: string;
  /** Whether onboarding has been completed */
  onboarding_completed?: boolean;
  /** Self-reported sleep baseline */
  sleep_baseline_hours?: number | null;
  /** Training experience level */
  experience_level?: string | null;
  /** Custom activity multiplier */
  activity_multiplier?: number | null;
  weekly_badminton_sessions?: number | null;
  weekly_running_sessions?: number | null;
  custom_protein_target_g?: number | null;
}

/**
 * Calibrated targets preview with deterministic math and auditable provenance.
 */
export interface TargetsPreviewResponse {
  bmi_info: Record<string, unknown>;
  protein_info: Record<string, unknown>;
  energy_estimate: Record<string, unknown>;
}

/**
 * Auditable, user-scoped snapshot of an athlete's biometrics, logs, and preferences.
 */
export interface UserCoachingContext {
  profile?: Record<string, unknown>;
  equipment?: Record<string, unknown>[];
  goals?: Record<string, unknown>;
  preferences?: Record<string, unknown>;
  today_check_in?: Record<string, unknown> | null;
  food_entries?: Record<string, unknown>[];
  workout_sessions?: Record<string, unknown>[];
  activity_sessions?: Record<string, unknown>[];
  body_metrics?: Record<string, unknown>[];
  recovery_logs?: Record<string, unknown>[];
}

export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
  input?: unknown;
  ctx?: Record<string, unknown>;
}

/**
 * Metadata about the vision analysis provenance.
 */
export interface VisionMeta {
  /** Which backend produced the result ('gemini' | 'mock') */
  provider: VisionProvider;
  /** How the result was obtained ('live' | 'fallback' | 'demo') */
  mode: VisionMode;
  /** Model identifier when provider is gemini */
  model_name?: string | null;
}

/**
 * How the analysis was obtained.
 */
export type VisionMode = "live" | "fallback" | "demo";

/**
 * Which backend produced the vision analysis.
 */
export type VisionProvider = "gemini" | "mock";

/**
 * Deterministic weekly progress review synthesized across all athlete domains.
 */
export interface WeeklyReviewReport {
  week_start_date: string;
  week_end_date: string;
  generated_at: string;
  nutrition_consistency: Record<string, unknown>;
  weight_trend_review: Record<string, unknown>;
  training_and_sports_load: Record<string, unknown>;
  recovery_patterns: Record<string, unknown>;
  next_week_priorities: string[];
}

/**
 * Request payload to synthesize a deterministic weekly review.
 */
export interface WeeklyReviewRequest {
  /** User-scoped context snapshot */
  context?: UserCoachingContext | null;
  /** Optional evaluation date override */
  today?: string | null;
  /** Optional start date ISO string */
  week_start_date?: string | null;
  /** Optional end date ISO string */
  week_end_date?: string | null;
}

export interface WeightPointRequest {
  /** ISO date string YYYY-MM-DD */
  logged_date: string;
  weight_kg: number;
}

/**
 * A single data point in the weight trend chart.
 */
export interface WeightTrendEntry {
  logged_date: string;
  weight_kg: number;
  rolling_7d_kg?: number | null;
}

export interface WeightTrendRequest {
  entries: WeightPointRequest[];
}

/**
 * 7-day rolling weight trend with data-gate.
 */
export interface WeightTrendResponse {
  /** 'insufficient_data' or 'ok' */
  status: string;
  rolling_7d_kg?: number | null;
  weekly_delta_kg?: number | null;
  explanation: string;
  entries?: WeightTrendEntry[];
}

/**
 * AthlonIQ REST API Endpoint Route Contracts
 */
export interface ApiEndpoints {
  "/health": {
    get: {
      // Root Health
      requestBody?: never;
      response: APIResponse_HealthStatus_;
    };
  };
  "/": {
    get: {
      // Root Info
      requestBody?: never;
      response: Record<string, unknown>;
    };
  };
  "/api/v1/health": {
    get: {
      // Health Check
      requestBody?: never;
      response: APIResponse_HealthStatus_;
    };
  };
  "/api/v1/coaching/targets-preview": {
    post: {
      // Preview Athlete Targets
      requestBody: TargetsPreviewRequest;
      response: APIResponse_TargetsPreviewResponse_;
    };
  };
  "/api/v1/coaching/readiness": {
    post: {
      // Assess Athlete Readiness
      requestBody: ReadinessCheckInRequest;
      response: APIResponse_ReadinessCheckInResponse_;
    };
  };
  "/api/v1/coaching/chat": {
    post: {
      // Coach Chat Turn
      requestBody: CoachChatRequest;
      response: APIResponse_CoachTurnResponse_;
    };
  };
  "/api/v1/coaching/weekly-review": {
    post: {
      // Generate Athlete Weekly Review
      requestBody: WeeklyReviewRequest;
      response: APIResponse_WeeklyReviewReport_;
    };
  };
  "/api/v1/coaching/tools": {
    get: {
      // Get Coach Tool Registry
      requestBody?: never;
      response: APIResponse_List_CoachToolMetadata__;
    };
  };
  "/api/v1/coaching/calibrate-lean-bulk": {
    post: {
      // Calibrate Athlete Lean Bulk
      requestBody: LeanBulkCalibrationRequest;
      response: APIResponse_LeanBulkCalibrationResult_;
    };
  };
  "/api/v1/coaching/fatigue-advisory": {
    post: {
      // Assess Athlete Fatigue Advisory
      requestBody: FatigueAdvisoryRequest;
      response: APIResponse_FatigueAdvisoryResult_;
    };
  };
  "/api/v1/tracking/foods": {
    get: {
      // Search Indian & Athletic Food Reference Catalog
      requestBody?: never;
      response: APIResponse_List_FoodCatalogItem__;
    };
  };
  "/api/v1/tracking/nutrition-summary": {
    post: {
      // Calculate confirmed daily macro totals
      requestBody: NutritionSummaryRequest;
      response: APIResponse_NutritionSummaryResponse_;
    };
  };
  "/api/v1/tracking/running-pace": {
    post: {
      // Calculate running pace (MM:SS /km)
      requestBody: RunningPaceRequest;
      response: APIResponse_RunningPaceResponse_;
    };
  };
  "/api/v1/tracking/progression-suggestion": {
    post: {
      // Equipment-constrained progressive overload suggestion
      requestBody: ProgressionRequest;
      response: APIResponse_ProgressionSuggestionResponse_;
    };
  };
  "/api/v1/tracking/weight-trend": {
    post: {
      // 7-day rolling weight trend with data-gate
      requestBody: WeightTrendRequest;
      response: APIResponse_WeightTrendResponse_;
    };
  };
  "/api/v1/vision/analyze-meal": {
    post: {
      // Analyze meal photo using Gemini Vision and map to verified catalog
      requestBody: Body_analyze_meal_photo_api_v1_vision_analyze_meal_post;
      response: APIResponse_MealAnalysisResponse_;
    };
  };
}
