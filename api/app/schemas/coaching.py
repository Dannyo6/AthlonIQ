"""Schemas for coaching, deterministic targets preview, and readiness assessment."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


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
