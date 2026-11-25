import { describe, it, expect } from "vitest";
import type * as Generated from "@/types/api.generated";
import type * as HandWritten from "@/types";

/**
 * Compile-time assignability assertion helper.
 * Causes a strict TypeScript error during `tsc` if `Source` is not assignable to `Target`.
 */
type AssertAssignable<Target, _Source extends Target> = true;

// =============================================================================
// Compile-Time Conformance Checks (Hand-Written / App Types → Generated OpenAPI)
// =============================================================================

// 1. Vision & Meal Analysis Responses
const _mealAnalysisConformance: AssertAssignable<
  Generated.MealAnalysisResponse,
  HandWritten.MealAnalysisResponse
> = true;
const _visionMetaConformance: AssertAssignable<
  Generated.VisionMeta,
  HandWritten.VisionMeta
> = true;
const _visionProviderConformance: AssertAssignable<
  Generated.VisionProvider,
  HandWritten.VisionProvider
> = true;
const _visionModeConformance: AssertAssignable<
  Generated.VisionMode,
  HandWritten.VisionMode
> = true;
const _candidateFoodItemConformance: AssertAssignable<
  Generated.CandidateFoodItem,
  HandWritten.CandidateFoodItem
> = true;

// 2. Coach & Weekly Review Responses
const _coachTurnConformance: AssertAssignable<
  Generated.CoachTurnResponse,
  HandWritten.CoachTurnResponse
> = true;
const _coachToolConformance: AssertAssignable<
  Generated.CoachToolMetadata,
  HandWritten.CoachToolMetadata
> = true;
const _proposedActionConformance: AssertAssignable<
  Generated.ProposedAction,
  HandWritten.ProposedCoachAction
> = true;
const _weeklyReviewConformance: AssertAssignable<
  Generated.WeeklyReviewReport,
  HandWritten.WeeklyReviewReport
> = true;
const _leanBulkConformance: AssertAssignable<
  Generated.LeanBulkCalibrationResult,
  HandWritten.LeanBulkCalibrationResult
> = true;
const _fatigueAdvisoryConformance: AssertAssignable<
  Generated.FatigueAdvisoryResult,
  HandWritten.FatigueAdvisoryResult
> = true;

// 3. Readiness & Biometric Preview Responses
const _readinessConformance: AssertAssignable<
  Generated.ReadinessCheckInResponse,
  HandWritten.ReadinessCheckInResponse
> = true;
const _targetsPreviewConformance: AssertAssignable<
  Generated.TargetsPreviewResponse,
  HandWritten.TargetsPreviewResponse
> = true;

// 4. Tracking Responses
const _nutritionSummaryConformance: AssertAssignable<
  Generated.NutritionSummaryResponse,
  HandWritten.NutritionSummaryResponse
> = true;
const _macroTotalsConformance: AssertAssignable<
  Generated.MacroTotalsResponse,
  HandWritten.MacroTotalsResponse
> = true;
const _runningPaceConformance: AssertAssignable<
  Generated.RunningPaceResponse,
  HandWritten.RunningPaceResponse
> = true;
const _progressionSuggestionConformance: AssertAssignable<
  Generated.ProgressionSuggestionResponse,
  HandWritten.ProgressionSuggestionResponse
> = true;
const _weightTrendConformance: AssertAssignable<
  Generated.WeightTrendResponse,
  HandWritten.WeightTrendResponse
> = true;
const _weightTrendEntryConformance: AssertAssignable<
  Generated.WeightTrendEntry,
  HandWritten.WeightTrendEntry
> = true;

// 5. System Health Response
const _healthStatusConformance: AssertAssignable<
  Generated.HealthStatus,
  HandWritten.HealthStatus
> = true;

describe("API Type Contract Conformance (Web ↔ Generated OpenAPI)", () => {
  it("verifies all hand-written and re-exported web response types compile as assignable to api.generated.ts", () => {
    const checks = [
      _mealAnalysisConformance,
      _visionMetaConformance,
      _visionProviderConformance,
      _visionModeConformance,
      _candidateFoodItemConformance,
      _coachTurnConformance,
      _coachToolConformance,
      _proposedActionConformance,
      _weeklyReviewConformance,
      _leanBulkConformance,
      _fatigueAdvisoryConformance,
      _readinessConformance,
      _targetsPreviewConformance,
      _nutritionSummaryConformance,
      _macroTotalsConformance,
      _runningPaceConformance,
      _progressionSuggestionConformance,
      _weightTrendConformance,
      _weightTrendEntryConformance,
      _healthStatusConformance,
    ];
    expect(checks.every(Boolean)).toBe(true);
    expect(checks).toHaveLength(20);
  });
});
