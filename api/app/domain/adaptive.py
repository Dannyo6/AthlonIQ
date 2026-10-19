"""AthlonIQ Phase 5 — Adaptive Personalization & Fatigue Engine.

Provides:
  - evaluate_lean_bulk_calibration: 14-day deterministic energy recalibration
    gated by strict data sufficiency requirements.
  - evaluate_multisport_fatigue: Rules-based cumulative workload fatigue advisor
    combining Lifting, Badminton, and Running with sleep and soreness logs.
"""

from __future__ import annotations

from typing import List, Optional
from pydantic import BaseModel, Field

from app.domain.tracking import WeightPoint, calculate_weight_trend


class LeanBulkCalibrationResult(BaseModel):
    """Calibrated energy target evaluation with audit provenance and confirmation gating."""

    status: str = Field(
        ...,
        description="Status: 'insufficient_history' | 'on_track' | 'increase_surplus' | 'trim_surplus'",
    )
    current_calorie_target_kcal: Optional[int] = Field(None, description="Current calorie target")
    new_calorie_target_kcal: Optional[int] = Field(None, description="Recommended calorie target")
    suggested_calorie_delta_kcal: int = Field(0, description="Suggested daily calorie delta (+150, -150, or 0)")
    weekly_delta_kg: Optional[float] = Field(None, description="Weekly weight change rate in kg/week")
    waist_delta_cm: Optional[float] = Field(None, description="Waist circumference delta over the period")
    observation_days_logged: int = Field(..., description="Number of nutrition logging days over last 14 days")
    observation_weigh_ins: int = Field(..., description="Number of weigh-in records over last 14 days")
    explanation: str = Field(..., description="Detailed deterministic rationale")
    recommendation: str = Field(..., description="Actionable athlete recommendation")
    requires_user_confirmation: bool = Field(True, description="Always requires explicit athlete confirmation")
    provenance: str = Field("calculated_estimate", description="Provenance marker")


class FatigueAdvisoryResult(BaseModel):
    """Workload fatigue advisory across strength, badminton, and running disciplines."""

    status: str = Field(..., description="Status: 'high_cumulative_fatigue' | 'moderate_strain' | 'optimal'")
    is_high_fatigue: bool = Field(..., description="Whether cumulative fatigue exceeds threshold")
    sport_volume_flag: bool = Field(..., description="Whether running or badminton volume is elevated")
    recovery_deficit_flag: bool = Field(..., description="Whether sleep or soreness indicates deficit")
    gym_sessions_7d: int
    badminton_minutes_7d: float
    running_km_7d: float
    avg_sleep_hours_7d: Optional[float] = None
    avg_soreness_7d: Optional[float] = None
    avg_fatigue_7d: Optional[float] = None
    explanation: str
    recommendations: List[str]
    disclaimer: str = (
        "AthlonIQ fatigue advisory is a workload and neuromuscular training strain calculation only. "
        "It is not a clinical medical diagnosis or physiological injury risk assessment."
    )


def evaluate_lean_bulk_calibration(
    current_calorie_target_kcal: Optional[int],
    logged_nutrition_days: int,
    average_confirmed_intake_kcal: Optional[float],
    weigh_ins_last_14d: List[WeightPoint],
    waist_start_cm: Optional[float] = None,
    waist_current_cm: Optional[float] = None,
) -> LeanBulkCalibrationResult:
    """Evaluate 14-day energy calibration for lean-bulk progression.

    Target rate of gain for a ~55 kg athlete is +0.10 to +0.25 kg/week (~0.2% to 0.45% BW/week).
    Zero black-box ML: strictly rules-based and gated by sufficient observation history.
    """
    # Calculate waist delta if available
    waist_delta_cm: Optional[float] = None
    if waist_start_cm is not None and waist_current_cm is not None:
        waist_delta_cm = round(waist_current_cm - waist_start_cm, 1)

    # Calculate weekly delta if weigh-ins available
    weekly_delta_kg: Optional[float] = None
    if len(weigh_ins_last_14d) >= 2:
        sorted_points = sorted(weigh_ins_last_14d, key=lambda p: p.logged_date)
        trend = calculate_weight_trend(sorted_points)
        if trend.weekly_delta_kg is not None:
            weekly_delta_kg = trend.weekly_delta_kg
        else:
            delta = sorted_points[-1].weight_kg - sorted_points[0].weight_kg
            weekly_delta_kg = round(delta, 2)

    # 1. Insufficient Data Gate
    # Requires active current_calorie_target_kcal, >= 10 logged nutrition days, and >= 4 weigh-ins
    if (
        current_calorie_target_kcal is None
        or logged_nutrition_days < 10
        or len(weigh_ins_last_14d) < 4
    ):
        explanation = (
            "Need at least 10 logged nutrition days and 4 weigh-ins over 14 days before calibrating your initial energy estimate. "
            f"Current observation: {logged_nutrition_days}/10 nutrition days, {len(weigh_ins_last_14d)}/4 weigh-ins."
        )
        if current_calorie_target_kcal is None:
            explanation = "Caloric targets are gated until onboarding is completed. Complete onboarding to establish your initial estimate."

        return LeanBulkCalibrationResult(
            status="insufficient_history",
            current_calorie_target_kcal=current_calorie_target_kcal,
            new_calorie_target_kcal=current_calorie_target_kcal,
            suggested_calorie_delta_kcal=0,
            weekly_delta_kg=weekly_delta_kg,
            waist_delta_cm=waist_delta_cm,
            observation_days_logged=logged_nutrition_days,
            observation_weigh_ins=len(weigh_ins_last_14d),
            explanation=explanation,
            recommendation="Continue logging daily meals and fasted morning weigh-ins to establish an auditable baseline.",
            requires_user_confirmation=True,
            provenance="calculated_estimate",
        )

    # Safe weekly delta fallback for logic below
    delta_kg = weekly_delta_kg if weekly_delta_kg is not None else 0.0

    # 2. Rapid Gain / Waist Creep Check
    # Weekly delta > 0.30 kg/week OR waist circumference increased by >= 1.5 cm
    if delta_kg > 0.30 or (waist_delta_cm is not None and waist_delta_cm >= 1.5):
        suggested_delta = -150
        new_target = max(1600, current_calorie_target_kcal + suggested_delta)
        reasons = []
        if delta_kg > 0.30:
            reasons.append(f"weight gain rate ({delta_kg:+.2f} kg/wk) exceeds the lean-bulk ceiling (+0.25 kg/wk)")
        if waist_delta_cm is not None and waist_delta_cm >= 1.5:
            reasons.append(f"waist circumference expanded by +{waist_delta_cm:.1f} cm")

        explanation = (
            f"Trim surplus recommended: {' and '.join(reasons)}. "
            "Trimming daily intake by 150 kcal curbs excessive adiposity while preserving muscle protein synthesis."
        )
        recommendation = (
            f"Adjust daily target from {current_calorie_target_kcal} kcal to {new_target} kcal (-150 kcal/day). "
            "Keep daily protein fixed at 1.6–2.2 g/kg."
        )

        return LeanBulkCalibrationResult(
            status="trim_surplus",
            current_calorie_target_kcal=current_calorie_target_kcal,
            new_calorie_target_kcal=new_target,
            suggested_calorie_delta_kcal=suggested_delta,
            weekly_delta_kg=weekly_delta_kg,
            waist_delta_cm=waist_delta_cm,
            observation_days_logged=logged_nutrition_days,
            observation_weigh_ins=len(weigh_ins_last_14d),
            explanation=explanation,
            recommendation=recommendation,
            requires_user_confirmation=True,
            provenance="calculated_estimate",
        )

    # 3. Under-Gaining / Flat Trend Check
    # Weekly delta < 0.08 kg/week
    if delta_kg < 0.08:
        suggested_delta = 150
        new_target = current_calorie_target_kcal + suggested_delta
        explanation = (
            f"Under-gaining detected: 14-day rolling weight delta ({delta_kg:+.2f} kg/wk) is below "
            "the target lean-bulk rate (+0.10 to +0.25 kg/wk). A modest caloric increment is warranted."
        )
        recommendation = (
            f"Increase daily target from {current_calorie_target_kcal} kcal to {new_target} kcal (+150 kcal/day, primarily via complex carbohydrates). "
            "Apply after user confirmation."
        )

        return LeanBulkCalibrationResult(
            status="increase_surplus",
            current_calorie_target_kcal=current_calorie_target_kcal,
            new_calorie_target_kcal=new_target,
            suggested_calorie_delta_kcal=suggested_delta,
            weekly_delta_kg=weekly_delta_kg,
            waist_delta_cm=waist_delta_cm,
            observation_days_logged=logged_nutrition_days,
            observation_weigh_ins=len(weigh_ins_last_14d),
            explanation=explanation,
            recommendation=recommendation,
            requires_user_confirmation=True,
            provenance="calculated_estimate",
        )

    # 4. On-Target Lean Bulk
    # 0.08 <= delta_kg <= 0.30
    explanation = (
        f"On-track lean bulk: 14-day weight gain rate ({delta_kg:+.2f} kg/wk) is squarely within "
        "the optimal lean-bulk corridor (+0.10 to +0.25 kg/wk). Current caloric intake is well-calibrated."
    )
    recommendation = (
        f"Maintain current daily target of {current_calorie_target_kcal} kcal. "
        "Continue consistent resistance training and protein adherence."
    )

    return LeanBulkCalibrationResult(
        status="on_track",
        current_calorie_target_kcal=current_calorie_target_kcal,
        new_calorie_target_kcal=current_calorie_target_kcal,
        suggested_calorie_delta_kcal=0,
        weekly_delta_kg=weekly_delta_kg,
        waist_delta_cm=waist_delta_cm,
        observation_days_logged=logged_nutrition_days,
        observation_weigh_ins=len(weigh_ins_last_14d),
        explanation=explanation,
        recommendation=recommendation,
        requires_user_confirmation=True,
        provenance="calculated_estimate",
    )


def evaluate_multisport_fatigue(
    gym_sessions_7d: int,
    badminton_minutes_7d: float,
    running_km_7d: float,
    avg_sleep_hours_7d: Optional[float] = None,
    avg_soreness_7d: Optional[float] = None,
    avg_fatigue_7d: Optional[float] = None,
) -> FatigueAdvisoryResult:
    """Evaluate multi-sport training fatigue across gym, badminton, and running.

    Determines cumulative fatigue flags without diagnosing clinical injuries.
    """
    sport_volume_flag = (badminton_minutes_7d >= 120.0 or running_km_7d >= 15.0)
    high_gym = (gym_sessions_7d >= 4)

    sleep_deficit = (avg_sleep_hours_7d is not None and avg_sleep_hours_7d < 6.8)
    soreness_elevated = (avg_soreness_7d is not None and avg_soreness_7d >= 3.8)
    fatigue_elevated = (avg_fatigue_7d is not None and avg_fatigue_7d >= 3.8)

    recovery_deficit_flag = sleep_deficit or soreness_elevated or fatigue_elevated

    recommendations: List[str] = []

    if sport_volume_flag and high_gym and recovery_deficit_flag:
        status = "high_cumulative_fatigue"
        is_high_fatigue = True
        explanation = (
            f"High cumulative workload detected across {gym_sessions_7d} gym sessions, "
            f"{badminton_minutes_7d:.0f} min badminton, and {running_km_7d:.1f} km running, "
            f"coupled with recovery deficits (Sleep: {avg_sleep_hours_7d or 'N/A'}h, Soreness: {avg_soreness_7d or 'N/A'}/5). "
            "High lower-body axial demand and eccentric footwork stress require strategic load auto-regulation."
        )
        recommendations.append("Reduce lower-body compound axial volume (back squats/deadlifts) by 20% this week.")
        recommendations.append("Swap heavy leg training with mobility drills or low-impact calisthenics on consecutive badminton days.")
        recommendations.append("Prioritize sleep hygiene to restore sleep duration to >= 7.5 hours.")
    elif (sport_volume_flag and high_gym) or recovery_deficit_flag or gym_sessions_7d >= 5:
        status = "moderate_strain"
        is_high_fatigue = False
        explanation = (
            f"Moderate multi-sport load ({gym_sessions_7d} gym sessions, {badminton_minutes_7d:.0f} min badminton, {running_km_7d:.1f} km running). "
            "Athletic volume is elevated but currently within adaptive limits."
        )
        recommendations.append("Keep compound resistance working sets strictly between RPE 7.5–8.0.")
        recommendations.append("Ensure 24-hour inter-session spacing between heavy badminton match play and lower-body gym sessions.")
    else:
        status = "optimal"
        is_high_fatigue = False
        explanation = (
            f"Optimal multi-sport balance ({gym_sessions_7d} gym sessions, {badminton_minutes_7d:.0f} min badminton, {running_km_7d:.1f} km running). "
            "Fatigue distribution is balanced with current recovery markers."
        )
        recommendations.append("Maintain planned progression and stay consistent with daily protein targets.")

    return FatigueAdvisoryResult(
        status=status,
        is_high_fatigue=is_high_fatigue,
        sport_volume_flag=sport_volume_flag,
        recovery_deficit_flag=recovery_deficit_flag,
        gym_sessions_7d=gym_sessions_7d,
        badminton_minutes_7d=badminton_minutes_7d,
        running_km_7d=running_km_7d,
        avg_sleep_hours_7d=avg_sleep_hours_7d,
        avg_soreness_7d=avg_soreness_7d,
        avg_fatigue_7d=avg_fatigue_7d,
        explanation=explanation,
        recommendations=recommendations,
    )
