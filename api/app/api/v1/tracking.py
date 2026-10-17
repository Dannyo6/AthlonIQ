"""AthlonIQ Phase 2 — Tracking API Endpoints

Routes:
  GET  /api/v1/tracking/foods                 — search Indian food catalog
  POST /api/v1/tracking/nutrition-summary     — confirmed daily macro totals
  POST /api/v1/tracking/running-pace          — deterministic MM:SS pace
  POST /api/v1/tracking/progression-suggestion — rules-based overload engine
  POST /api/v1/tracking/weight-trend          — 7-day rolling average
"""

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field, field_validator

from app.core.security import AuthenticatedUser, get_current_user
from app.domain.tracking import (
    DailyNutritionSummary,
    FoodEntryInput,
    PreviousSet,
    WeightPoint,
    calculate_daily_nutrition_totals,
    calculate_running_pace,
    calculate_weight_trend,
    evaluate_progression_suggestion,
    search_food_catalog,
)
from app.schemas.common import APIResponse

router = APIRouter(prefix="/tracking", tags=["tracking"])


# =============================================================================
# Request / Response Schemas (Pydantic v2)
# =============================================================================


class FoodEntryRequest(BaseModel):
    food_name: str = Field(..., min_length=1)
    calories_kcal: float = Field(..., ge=0)
    protein_g: float = Field(..., ge=0)
    carbs_g: float = Field(..., ge=0)
    fat_g: float = Field(..., ge=0)
    quantity: float = Field(default=1.0, gt=0)
    is_confirmed: bool = Field(default=True)
    provenance: str = Field(default="verified_reference")


class NutritionSummaryRequest(BaseModel):
    entries: List[FoodEntryRequest] = Field(..., min_length=0)


class RunningPaceRequest(BaseModel):
    distance_km: float = Field(..., gt=0, description="Distance in kilometres, must be > 0")
    duration_minutes: float = Field(..., gt=0, description="Duration in minutes, must be > 0")


class PreviousSetRequest(BaseModel):
    reps: int = Field(..., ge=0)
    load_kg: float = Field(..., ge=0)
    rpe: Optional[float] = Field(default=None, ge=1, le=10)
    is_bodyweight: bool = Field(default=False)


class ProgressionRequest(BaseModel):
    exercise_name: str = Field(..., min_length=1)
    previous_sets: List[PreviousSetRequest] = Field(..., min_length=0)
    equipment_max_load_kg: float = Field(default=70.0, gt=0)
    equipment_min_increment_kg: float = Field(default=2.5, gt=0)
    equipment_confirmed: bool = Field(default=False)
    readiness_status: str = Field(default="Moderate")
    target_reps_max: int = Field(default=10, ge=1)

    @field_validator("readiness_status")
    @classmethod
    def validate_readiness(cls, v: str) -> str:
        allowed = {"Prime", "Moderate", "Recover"}
        if v not in allowed:
            raise ValueError(f"readiness_status must be one of {allowed}")
        return v


class WeightPointRequest(BaseModel):
    logged_date: str = Field(..., description="ISO date string YYYY-MM-DD")
    weight_kg: float = Field(..., gt=0)


class WeightTrendRequest(BaseModel):
    entries: List[WeightPointRequest] = Field(..., min_length=0)


# =============================================================================
# Endpoints
# =============================================================================


@router.get(
    "/foods",
    response_model=APIResponse[List[Dict[str, Any]]],
    summary="Search Indian & Athletic Food Reference Catalog",
)
async def get_food_catalog(
    query: Optional[str] = Query(default=None, description="Food name search term"),
    category: Optional[str] = Query(default=None, description="Filter by category"),
) -> APIResponse[List[Dict[str, Any]]]:
    """Search the 22+ item Indian & Athletic food reference catalog.

    Does NOT require authentication — the catalog is read-only reference data.
    """
    results = search_food_catalog(query=query, category=category)
    return APIResponse(
        success=True,
        message=f"{len(results)} food(s) found",
        data=results,
    )


@router.post(
    "/nutrition-summary",
    response_model=APIResponse[Dict[str, Any]],
    summary="Calculate confirmed daily macro totals",
)
async def post_nutrition_summary(
    body: NutritionSummaryRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> APIResponse[Dict[str, Any]]:
    """Compute daily macro totals, strictly separating confirmed from
    unconfirmed photo-estimate entries.

    CRITICAL: is_confirmed=False entries never contribute to confirmed_totals.
    """
    entries = [
        FoodEntryInput(
            food_name=e.food_name,
            calories_kcal=e.calories_kcal,
            protein_g=e.protein_g,
            carbs_g=e.carbs_g,
            fat_g=e.fat_g,
            quantity=e.quantity,
            is_confirmed=e.is_confirmed,
            provenance=e.provenance,
        )
        for e in body.entries
    ]

    summary: DailyNutritionSummary = calculate_daily_nutrition_totals(entries)

    return APIResponse(
        success=True,
        message="Daily nutrition totals calculated",
        data={
            "user_id": current_user.user_id,
            "confirmed_totals": {
                "calories_kcal": summary.confirmed_totals.calories_kcal,
                "protein_g": summary.confirmed_totals.protein_g,
                "carbs_g": summary.confirmed_totals.carbs_g,
                "fat_g": summary.confirmed_totals.fat_g,
                "entry_count": summary.confirmed_totals.entry_count,
            },
            "unconfirmed_estimates": {
                "calories_kcal": summary.unconfirmed_estimates.calories_kcal,
                "protein_g": summary.unconfirmed_estimates.protein_g,
                "carbs_g": summary.unconfirmed_estimates.carbs_g,
                "fat_g": summary.unconfirmed_estimates.fat_g,
                "entry_count": summary.unconfirmed_estimates.entry_count,
            },
            "guardrail_note": (
                "Unconfirmed photo estimates (is_confirmed=False) are tabulated separately "
                "and excluded from confirmed_totals by design."
            ),
        },
    )


@router.post(
    "/running-pace",
    response_model=APIResponse[Dict[str, Any]],
    summary="Calculate running pace (MM:SS /km)",
)
async def post_running_pace(
    body: RunningPaceRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> APIResponse[Dict[str, Any]]:
    """Deterministic running pace calculation. Validates inputs, returns
    decimal pace and formatted MM:SS /km string.
    """
    try:
        result = calculate_running_pace(body.distance_km, body.duration_minutes)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc

    return APIResponse(
        success=True,
        message="Running pace calculated",
        data={
            "distance_km": result.distance_km,
            "duration_minutes": result.duration_minutes,
            "pace_decimal_min_per_km": result.pace_decimal,
            "pace_formatted": result.pace_formatted,
            "provenance": "calculated_deterministic",
        },
    )


@router.post(
    "/progression-suggestion",
    response_model=APIResponse[Dict[str, Any]],
    summary="Equipment-constrained progressive overload suggestion",
)
async def post_progression_suggestion(
    body: ProgressionRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> APIResponse[Dict[str, Any]]:
    """Rules-based progression engine for home-gym constrained training.

    Always returns requires_user_confirmation=True — the athlete must
    explicitly apply any suggested change. Auto-mutation of weights is
    architecturally forbidden.
    """
    previous_sets = [
        PreviousSet(
            reps=s.reps,
            load_kg=s.load_kg,
            rpe=s.rpe,
            is_bodyweight=s.is_bodyweight,
        )
        for s in body.previous_sets
    ]

    suggestion = evaluate_progression_suggestion(
        exercise_name=body.exercise_name,
        previous_sets=previous_sets,
        equipment_max_load_kg=body.equipment_max_load_kg,
        equipment_min_increment_kg=body.equipment_min_increment_kg,
        equipment_confirmed=body.equipment_confirmed,
        readiness_status=body.readiness_status,
        target_reps_max=body.target_reps_max,
    )

    return APIResponse(
        success=True,
        message="Progression suggestion evaluated",
        data={
            "exercise_name": body.exercise_name,
            "action": suggestion.action,
            "explanation": suggestion.explanation,
            "new_load_kg": suggestion.new_load_kg,
            "new_reps_suggestion": suggestion.new_reps_suggestion,
            "requires_user_confirmation": suggestion.requires_user_confirmation,
            "provenance": suggestion.provenance,
        },
    )


@router.post(
    "/weight-trend",
    response_model=APIResponse[Dict[str, Any]],
    summary="7-day rolling weight trend with data-gate",
)
async def post_weight_trend(
    body: WeightTrendRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> APIResponse[Dict[str, Any]]:
    """Compute rolling 7-day weight average and weekly trend.

    Returns status='insufficient_data' with explanatory message when
    fewer than 3 weigh-ins are provided.
    """
    weight_points = [
        WeightPoint(logged_date=e.logged_date, weight_kg=e.weight_kg)
        for e in body.entries
    ]

    trend = calculate_weight_trend(weight_points)

    return APIResponse(
        success=True,
        message="Weight trend calculated",
        data={
            "status": trend.status,
            "rolling_7d_kg": trend.rolling_7d_kg,
            "weekly_delta_kg": trend.weekly_delta_kg,
            "explanation": trend.explanation,
            "entries": trend.entries,
        },
    )
