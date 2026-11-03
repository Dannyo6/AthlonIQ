"""Typed response schemas for tracking endpoints.

Replaces Dict[str, Any] return types with strict Pydantic v2 models so the
OpenAPI spec is fully documented and frontend types can be auto-generated.
"""

from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field


# =============================================================================
# Food Catalog Response
# =============================================================================


class FoodCatalogItem(BaseModel):
    """A single item from the Indian & Athletic Food Reference Catalog."""

    id: str
    name: str
    category: str
    serving_label: str
    serving_weight_g: float
    calories_kcal: float
    protein_g: float
    carbs_g: float
    fat_g: float
    provenance: str = "verified_reference"


# =============================================================================
# Nutrition Summary Response
# =============================================================================


class MacroTotalsResponse(BaseModel):
    """Summed macro totals for a group of food entries."""

    calories_kcal: float
    protein_g: float
    carbs_g: float
    fat_g: float
    entry_count: int


class NutritionSummaryResponse(BaseModel):
    """Daily nutrition totals with confirmed/unconfirmed guardrail separation."""

    user_id: str
    confirmed_totals: MacroTotalsResponse
    unconfirmed_estimates: MacroTotalsResponse
    guardrail_note: str = (
        "Unconfirmed photo estimates (is_confirmed=False) are tabulated separately "
        "and excluded from confirmed_totals by design."
    )


# =============================================================================
# Running Pace Response
# =============================================================================


class RunningPaceResponse(BaseModel):
    """Deterministic running pace calculation result."""

    distance_km: float
    duration_minutes: float
    pace_decimal_min_per_km: float
    pace_formatted: str
    provenance: str = "calculated_deterministic"


# =============================================================================
# Progression Suggestion Response
# =============================================================================


class ProgressionSuggestionResponse(BaseModel):
    """Rules-based progressive overload suggestion."""

    exercise_name: str
    action: str = Field(..., description="increase_load | increase_reps_or_tempo | maintain_or_deload | confirm_equipment_first | maintain")
    explanation: str
    new_load_kg: Optional[float] = None
    new_reps_suggestion: Optional[str] = None
    requires_user_confirmation: bool = True
    provenance: str = "rules_based_progression"


# =============================================================================
# Weight Trend Response
# =============================================================================


class WeightTrendEntry(BaseModel):
    """A single data point in the weight trend chart."""

    logged_date: str
    weight_kg: float
    rolling_7d_kg: Optional[float] = None


class WeightTrendResponse(BaseModel):
    """7-day rolling weight trend with data-gate."""

    status: str = Field(..., description="'insufficient_data' or 'ok'")
    rolling_7d_kg: Optional[float] = None
    weekly_delta_kg: Optional[float] = None
    explanation: str
    entries: List[WeightTrendEntry] = Field(default_factory=list)

