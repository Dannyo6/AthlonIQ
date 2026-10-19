"""Coaching and deterministic performance intelligence endpoints."""

from typing import List
from fastapi import APIRouter, Depends
from app.core.security import AuthenticatedUser, get_current_user
from app.domain.performance import (
    calculate_bmi,
    calculate_protein_reference,
    calculate_initial_energy_estimate,
    calculate_rules_readiness,
)
from app.domain.coach_tools import (
    TOOL_METADATA_LIST,
    CoachToolMetadata,
    WeeklyReviewReport,
    UserCoachingContext,
    generate_weekly_review,
)
from app.services.coach_adapter import coach_service
from app.schemas.common import APIResponse
from app.schemas.coaching import (
    TargetsPreviewRequest,
    TargetsPreviewResponse,
    ReadinessCheckInRequest,
    ReadinessCheckInResponse,
    CoachChatRequest,
    CoachTurnResponse,
    WeeklyReviewRequest,
)

router = APIRouter(prefix="/coaching", tags=["coaching"])


# =============================================================================
# Phase 1 & 2 Deterministic Biometric & Readiness Endpoints
# =============================================================================

@router.post("/targets-preview", response_model=APIResponse[TargetsPreviewResponse])
async def preview_athlete_targets(
    payload: TargetsPreviewRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> APIResponse[TargetsPreviewResponse]:
    """Calculate deterministic targets preview for athlete profile and onboarding.

    Protected endpoint requiring Bearer JWT authentication.
    """
    bmi_info = calculate_bmi(
        weight_kg=payload.weight_kg,
        height_cm=payload.height_cm,
    )
    protein_info = calculate_protein_reference(
        weight_kg=payload.weight_kg,
        custom_target_g=payload.custom_protein_target_g,
    )
    energy_estimate = calculate_initial_energy_estimate(
        weight_kg=payload.weight_kg,
        height_cm=payload.height_cm,
        age=payload.age,
        sex=payload.sex,
        activity_multiplier=payload.activity_multiplier,
        primary_goal=payload.primary_goal,
        onboarding_completed=payload.onboarding_completed,
        sleep_baseline_hours=payload.sleep_baseline_hours,
        experience_level=payload.experience_level,
        weekly_badminton_sessions=payload.weekly_badminton_sessions,
        weekly_running_sessions=payload.weekly_running_sessions,
    )

    data = TargetsPreviewResponse(
        bmi_info=bmi_info,
        protein_info=protein_info,
        energy_estimate=energy_estimate,
    )
    return APIResponse(
        success=True,
        message="Targets preview calculated successfully",
        data=data,
    )


@router.post("/readiness", response_model=APIResponse[ReadinessCheckInResponse])
async def assess_athlete_readiness(
    payload: ReadinessCheckInRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> APIResponse[ReadinessCheckInResponse]:
    """Calculate transparent rules-based daily athlete readiness.

    Protected endpoint requiring Bearer JWT authentication.
    Calculates score exclusively from user-reported sleep, soreness, fatigue, and stress.
    """
    result = calculate_rules_readiness(
        sleep_hours=payload.sleep_hours,
        sleep_quality=payload.sleep_quality,
        soreness=payload.soreness,
        fatigue=payload.fatigue,
        stress=payload.stress,
    )

    data = ReadinessCheckInResponse(**result)
    return APIResponse(
        success=True,
        message="Readiness assessed successfully",
        data=data,
    )


# =============================================================================
# Phase 4 AI Coach & Weekly Review Endpoints
# =============================================================================

@router.post("/chat", response_model=APIResponse[CoachTurnResponse])
async def coach_chat_turn(
    payload: CoachChatRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> APIResponse[CoachTurnResponse]:
    """Execute scoped allowlisted tools and generate grounded coaching turn.

    Protected endpoint requiring Bearer JWT authentication.
    Enforces epistemic separation and medical safety guardrails.
    """
    response = await coach_service.chat(
        message=payload.message,
        context=payload.context,
    )
    return APIResponse(
        success=True,
        message="Coach turn completed successfully",
        data=response,
    )


@router.post("/weekly-review", response_model=APIResponse[WeeklyReviewReport])
async def generate_athlete_weekly_review(
    payload: WeeklyReviewRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> APIResponse[WeeklyReviewReport]:
    """Synthesize deterministic weekly progress review across all tracking domains.

    Protected endpoint requiring Bearer JWT authentication.
    """
    context = payload.context or UserCoachingContext()
    report = generate_weekly_review(context)
    return APIResponse(
        success=True,
        message="Weekly review synthesized successfully",
        data=report,
    )


@router.get("/tools", response_model=APIResponse[List[CoachToolMetadata]])
async def get_coach_tool_registry(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> APIResponse[List[CoachToolMetadata]]:
    """Return metadata for the 8 allowlisted typed coach tools.

    Protected endpoint requiring Bearer JWT authentication.
    """
    return APIResponse(
        success=True,
        message="Allowlisted coach tools retrieved successfully",
        data=TOOL_METADATA_LIST,
    )
