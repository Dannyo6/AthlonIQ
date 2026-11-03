"""AthlonIQ Phase 2 — Tracking API Endpoints

Routes:
  GET  /api/v1/tracking/foods                 — search Indian food catalog (public with rate limit)
  POST /api/v1/tracking/nutrition-summary     — confirmed daily macro totals
  POST /api/v1/tracking/running-pace          — deterministic MM:SS pace
  POST /api/v1/tracking/progression-suggestion — rules-based overload engine
  POST /api/v1/tracking/weight-trend          — 7-day rolling average
"""

import time
from collections import defaultdict
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel, Field, field_validator

from app.core.config import settings
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
from app.schemas.tracking import (
    FoodCatalogItem,
    MacroTotalsResponse,
    NutritionSummaryResponse,
    ProgressionSuggestionResponse,
    RunningPaceResponse,
    WeightTrendEntry,
    WeightTrendResponse,
)

router = APIRouter(prefix="/tracking", tags=["tracking"])


# =============================================================================
# Rate Limiter for Public Food Catalog
# 60 requests per minute per client IP.
# Keyed on client IP from X-Forwarded-For (first hop) behind trusted proxies.
# Documented in docs/SECURITY.md §7.
# =============================================================================

_food_catalog_rate_limits: Dict[str, List[float]] = defaultdict(list)
FOOD_CATALOG_RATE_LIMIT = 60
FOOD_CATALOG_RATE_WINDOW_SECONDS = 60.0


def reset_food_catalog_rate_limiter() -> None:
    """Reset the in-memory rate limiter state (used in testing)."""
    _food_catalog_rate_limits.clear()


def get_client_ip(request: Request) -> str:
    """Extract the client IP address, safely evaluating X-Forwarded-For.

    Security model:
    - Checks request.client.host (the direct connection peer).
    - If peer is in settings.TRUSTED_PROXIES (or '*' is in trusted proxies),
      inspects the X-Forwarded-For header and extracts the first hop (the original client IP).
    - If peer is NOT in TRUSTED_PROXIES or header is absent, uses the direct peer IP.
      This prevents untrusted clients from spoofing X-Forwarded-For to bypass limits.
    """
    peer_ip = request.client.host if request.client else "127.0.0.1"

    trusted = settings.TRUSTED_PROXIES
    if isinstance(trusted, str):
        trusted_set = {ip.strip() for ip in trusted.split(",") if ip.strip()}
    elif isinstance(trusted, (list, tuple, set)):
        trusted_set = {str(ip).strip() for ip in trusted}
    else:
        trusted_set = {"127.0.0.1", "::1"}

    if "*" in trusted_set or peer_ip in trusted_set:
        xff = request.headers.get("x-forwarded-for")
        if xff:
            first_hop = xff.split(",")[0].strip()
            if first_hop:
                return first_hop

    return peer_ip


def check_food_catalog_rate_limit(request: Request) -> None:
    """Enforce IP-based sliding-window rate limit on public /foods endpoint.

    Limitation Notice:
    Rate limit state is maintained in-process in memory (_food_catalog_rate_limits).
    In a multi-process or multi-instance deployment (e.g. Uvicorn with multiple workers
    or container replicas behind a load balancer), rate limits are enforced per process
    rather than globally across the cluster.
    """
    client_ip = get_client_ip(request)
    now = time.time()
    cutoff = now - FOOD_CATALOG_RATE_WINDOW_SECONDS

    # Filter out timestamps outside window
    timestamps = [t for t in _food_catalog_rate_limits[client_ip] if t > cutoff]
    if len(timestamps) >= FOOD_CATALOG_RATE_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded for food catalog (max 60 requests per minute).",
        )

    timestamps.append(now)
    _food_catalog_rate_limits[client_ip] = timestamps


# =============================================================================
# Request Schemas (Pydantic v2)
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
    response_model=APIResponse[List[FoodCatalogItem]],
    summary="Search Indian & Athletic Food Reference Catalog",
)
async def get_food_catalog(
    query: Optional[str] = Query(default=None, description="Food name search term"),
    category: Optional[str] = Query(default=None, description="Filter by category"),
    _: None = Depends(check_food_catalog_rate_limit),
) -> APIResponse[List[FoodCatalogItem]]:
    """Search the 22+ item Indian & Athletic food reference catalog.

    Does NOT require authentication — the catalog is read-only reference data.
    Protected by a 60 req/min rate limit per IP.
    See docs/SECURITY.md §7 for the security architecture decision.
    """
    results = search_food_catalog(query=query, category=category)
    typed_results = [FoodCatalogItem(**item) for item in results]
    return APIResponse(
        success=True,
        message=f"{len(typed_results)} food(s) found",
        data=typed_results,
    )


@router.post(
    "/nutrition-summary",
    response_model=APIResponse[NutritionSummaryResponse],
    summary="Calculate confirmed daily macro totals",
)
async def post_nutrition_summary(
    body: NutritionSummaryRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> APIResponse[NutritionSummaryResponse]:
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

    response_data = NutritionSummaryResponse(
        user_id=current_user.user_id,
        confirmed_totals=MacroTotalsResponse(
            calories_kcal=summary.confirmed_totals.calories_kcal,
            protein_g=summary.confirmed_totals.protein_g,
            carbs_g=summary.confirmed_totals.carbs_g,
            fat_g=summary.confirmed_totals.fat_g,
            entry_count=summary.confirmed_totals.entry_count,
        ),
        unconfirmed_estimates=MacroTotalsResponse(
            calories_kcal=summary.unconfirmed_estimates.calories_kcal,
            protein_g=summary.unconfirmed_estimates.protein_g,
            carbs_g=summary.unconfirmed_estimates.carbs_g,
            fat_g=summary.unconfirmed_estimates.fat_g,
            entry_count=summary.unconfirmed_estimates.entry_count,
        ),
    )

    return APIResponse(
        success=True,
        message="Daily nutrition totals calculated",
        data=response_data,
    )


@router.post(
    "/running-pace",
    response_model=APIResponse[RunningPaceResponse],
    summary="Calculate running pace (MM:SS /km)",
)
async def post_running_pace(
    body: RunningPaceRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> APIResponse[RunningPaceResponse]:
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

    response_data = RunningPaceResponse(
        distance_km=result.distance_km,
        duration_minutes=result.duration_minutes,
        pace_decimal_min_per_km=result.pace_decimal,
        pace_formatted=result.pace_formatted,
    )

    return APIResponse(
        success=True,
        message="Running pace calculated",
        data=response_data,
    )


@router.post(
    "/progression-suggestion",
    response_model=APIResponse[ProgressionSuggestionResponse],
    summary="Equipment-constrained progressive overload suggestion",
)
async def post_progression_suggestion(
    body: ProgressionRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> APIResponse[ProgressionSuggestionResponse]:
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

    response_data = ProgressionSuggestionResponse(
        exercise_name=body.exercise_name,
        action=suggestion.action,
        explanation=suggestion.explanation,
        new_load_kg=suggestion.new_load_kg,
        new_reps_suggestion=suggestion.new_reps_suggestion,
        requires_user_confirmation=suggestion.requires_user_confirmation,
        provenance=suggestion.provenance,
    )

    return APIResponse(
        success=True,
        message="Progression suggestion evaluated",
        data=response_data,
    )


@router.post(
    "/weight-trend",
    response_model=APIResponse[WeightTrendResponse],
    summary="7-day rolling weight trend with data-gate",
)
async def post_weight_trend(
    body: WeightTrendRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> APIResponse[WeightTrendResponse]:
    """Compute rolling 7-day weight average and weekly trend.

    Returns status='insufficient_data' with explanatory message when
    fewer than 3 weigh-ins are provided.
    """
    weight_points = [
        WeightPoint(logged_date=e.logged_date, weight_kg=e.weight_kg)
        for e in body.entries
    ]

    trend = calculate_weight_trend(weight_points)

    typed_entries = [
        WeightTrendEntry(**entry) for entry in trend.entries
    ]

    response_data = WeightTrendResponse(
        status=trend.status,
        rolling_7d_kg=trend.rolling_7d_kg,
        weekly_delta_kg=trend.weekly_delta_kg,
        explanation=trend.explanation,
        entries=typed_entries,
    )

    return APIResponse(
        success=True,
        message="Weight trend calculated",
        data=response_data,
    )
