"""Pydantic schema definitions."""

from app.schemas.common import APIResponse
from app.schemas.health import HealthStatus
from app.schemas.tracking import (
    FoodCatalogItem,
    MacroTotalsResponse,
    NutritionSummaryResponse,
    ProgressionSuggestionResponse,
    RunningPaceResponse,
    WeightTrendEntry,
    WeightTrendResponse,
)
from app.schemas.vision import (
    CandidateFoodItem,
    MealAnalysisResponse,
    VisionMeta,
    VisionMode,
    VisionProvider,
)

__all__ = [
    "APIResponse",
    "HealthStatus",
    "FoodCatalogItem",
    "MacroTotalsResponse",
    "NutritionSummaryResponse",
    "ProgressionSuggestionResponse",
    "RunningPaceResponse",
    "WeightTrendEntry",
    "WeightTrendResponse",
    "CandidateFoodItem",
    "MealAnalysisResponse",
    "VisionMeta",
    "VisionMode",
    "VisionProvider",
]
