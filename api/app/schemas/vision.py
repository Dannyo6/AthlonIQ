"""Typed schemas for Vision AI meal analysis responses.

Provides auditable provider/mode metadata so the athlete and frontend always
know whether the analysis came from a live Gemini call, a fallback path, or
demo/mock data.
"""

from __future__ import annotations

from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


class VisionProvider(str, Enum):
    """Which backend produced the vision analysis."""

    gemini = "gemini"
    mock = "mock"


class VisionMode(str, Enum):
    """How the analysis was obtained."""

    live = "live"          # Real-time Gemini API call succeeded
    fallback = "fallback"  # Gemini call failed; deterministic fallback used
    demo = "demo"          # Mock/demo data for testing


class VisionMeta(BaseModel):
    """Metadata about the vision analysis provenance."""

    provider: VisionProvider = Field(..., description="Which backend produced the result ('gemini' | 'mock')")
    mode: VisionMode = Field(..., description="How the result was obtained ('live' | 'fallback' | 'demo')")
    model_name: Optional[str] = Field(None, description="Model identifier when provider is gemini")


class CandidateFoodItem(BaseModel):
    """A single candidate food item detected by vision analysis."""

    id: str
    catalog_id: Optional[str] = None
    food_name: str
    matched_catalog_name: Optional[str] = None
    estimated_serving: str
    serving_label: str = "1 serving"
    quantity: float = 1.0
    calories_kcal: float
    protein_g: float
    carbs_g: float
    fat_g: float
    confidence: str = "medium"
    provenance: str = "ai_estimated"
    is_confirmed: bool = False


class MealAnalysisResponse(BaseModel):
    """Complete meal analysis result with typed provenance metadata."""

    candidates: List[CandidateFoodItem]
    detected_item_count: int
    provider: VisionProvider = Field(..., description="'gemini' or 'mock'")
    mode: VisionMode = Field(..., description="'live', 'fallback', or 'demo'")
    model_name: Optional[str] = Field(None, description="Model identifier when provider is gemini")
    provenance: str = "ai_estimated"
    notes: Optional[str] = None
    vision_meta: VisionMeta = Field(
        ..., description="Provider/mode metadata for auditing the analysis source"
    )
