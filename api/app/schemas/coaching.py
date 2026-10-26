"""Schemas for coaching, deterministic targets preview, and readiness assessment."""

from datetime import date
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from app.domain.coach_tools import (
    UserCoachingContext,
    WeeklyReviewReport,
    CoachToolMetadata,
)


class TargetsPreviewRequest(BaseModel):
    """Input payload to compute deterministic biometric and energy targets."""

    weight_kg: float = Field(..., gt=0, description="Athlete weight in kg")
    height_cm: float = Field(..., gt=0, description="Athlete height in cm")
    age: int = Field(20, gt=0, lt=130, description="Athlete age in years")
    sex: Optional[str] = Field(None, description="Biological sex (male, female, or None)")
    primary_goal: str = Field("lean_bulk", description="Primary physical goal")
    onboarding_completed: bool = Field(False, description="Whether onboarding has been completed")
    sleep_baseline_hours: Optional[float] = Field(None, description="Self-reported sleep baseline")
    experience_level: Optional[str] = Field(None, description="Training experience level")
    activity_multiplier: Optional[float] = Field(None, description="Custom activity multiplier")
    weekly_badminton_sessions: Optional[int] = Field(None, ge=0)
    weekly_running_sessions: Optional[int] = Field(None, ge=0)
    custom_protein_target_g: Optional[int] = Field(None, ge=0)


class TargetsPreviewResponse(BaseModel):
    """Calibrated targets preview with deterministic math and auditable provenance."""

    bmi_info: Dict[str, Any]
    protein_info: Dict[str, Any]
    energy_estimate: Dict[str, Any]


class ReadinessCheckInRequest(BaseModel):
    """Subjective daily recovery and strain check-in inputs."""

    sleep_hours: float = Field(..., ge=0, le=24, description="Sleep duration in hours")
    sleep_quality: int = Field(..., ge=1, le=5, description="Sleep quality rating (1 to 5)")
    soreness: int = Field(..., ge=1, le=5, description="Muscle soreness rating (1=none, 5=crippling)")
    fatigue: int = Field(..., ge=1, le=5, description="Fatigue rating (1=energized, 5=exhausted)")
    stress: Optional[int] = Field(None, ge=1, le=5, description="Optional stress rating (1 to 5)")


class ReadinessCheckInResponse(BaseModel):
    """Rules-based readiness score and transparent rule triggers."""

    readiness_score: int
    status: str
    guidance: str
    triggers: List[str]
    provenance: str


# =============================================================================
# Phase 4 Coach Chat & Weekly Review Schemas
# =============================================================================

class ProposedAction(BaseModel):
    """Explicit action proposal requiring athlete confirmation before mutation."""

    type: str = Field(..., description="Action type: log_meal, update_protein_target, or apply_progression")
    summary: str = Field(..., description="Human-readable description of proposed change")
    payload: Dict[str, Any] = Field(default_factory=dict, description="Concrete payload to apply upon confirmation")


class CoachTurnResponse(BaseModel):
    """Structured response adhering to epistemic separation and safety guardrails."""

    reply_markdown: str = Field(..., description="Concise, tool-grounded coaching reply")
    tools_used: List[str] = Field(default_factory=list, description="Allowlisted tools executed for this turn")
    facts_from_tools: List[str] = Field(default_factory=list, description="Verified facts from logs")
    app_calculations: List[str] = Field(default_factory=list, description="Deterministic calculations computed by AthlonIQ")
    recommendations: List[str] = Field(default_factory=list, description="Actionable coaching recommendations")
    missing_or_uncertain: List[str] = Field(default_factory=list, description="Explicit missing or sparse data notices")
    proposed_action: Optional[ProposedAction] = Field(None, description="Action awaiting user confirmation")


class CoachChatRequest(BaseModel):
    """Request payload for an interactive AI Coach chat turn."""

    message: str = Field(..., min_length=1, description="Athlete query or message")
    conversation_id: Optional[str] = Field(None, description="Optional conversation UUID")
    context: Optional[UserCoachingContext] = Field(None, description="Optional client-side state snapshot")
    today: Optional[date] = Field(None, description="Optional evaluation date override")


class WeeklyReviewRequest(BaseModel):
    """Request payload to synthesize a deterministic weekly review."""

    context: Optional[UserCoachingContext] = Field(None, description="User-scoped context snapshot")
    today: Optional[date] = Field(None, description="Optional evaluation date override")
    week_start_date: Optional[str] = Field(None, description="Optional start date ISO string")
    week_end_date: Optional[str] = Field(None, description="Optional end date ISO string")


# =============================================================================
# Phase 5 Adaptive Calibration & Fatigue Advisory Schemas
# =============================================================================

class LeanBulkCalibrationRequest(BaseModel):
    """Input payload to evaluate 14-day lean bulk energy calibration."""

    current_calorie_target_kcal: Optional[int] = Field(None, description="Current daily calorie target")
    logged_nutrition_days: int = Field(..., ge=0, description="Logged food days over last 14 days")
    average_confirmed_intake_kcal: Optional[float] = Field(None, ge=0)
    weigh_ins_last_14d: List[Dict[str, Any]] = Field(default_factory=list)
    waist_start_cm: Optional[float] = Field(None, gt=0)
    waist_current_cm: Optional[float] = Field(None, gt=0)


class FatigueAdvisoryRequest(BaseModel):
    """Input payload to assess multi-sport cumulative fatigue."""

    gym_sessions_7d: int = Field(..., ge=0)
    badminton_minutes_7d: float = Field(..., ge=0)
    running_km_7d: float = Field(..., ge=0)
    avg_sleep_hours_7d: Optional[float] = Field(None, ge=0, le=24)
    avg_soreness_7d: Optional[float] = Field(None, ge=1, le=5)
    avg_fatigue_7d: Optional[float] = Field(None, ge=1, le=5)

