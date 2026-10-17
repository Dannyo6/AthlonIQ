"""AthlonIQ Phase 3 — Vision AI API Endpoints.

Routes:
  POST /api/v1/vision/analyze-meal — multimodal meal photo analyzer with
                                     deterministic Indian food catalog mapping
"""

from __future__ import annotations

import difflib
import logging
import re
import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel, Field

from app.core.security import AuthenticatedUser, get_current_user
from app.domain.tracking import INDIAN_FOOD_CATALOG
from app.schemas.common import APIResponse
from app.services.vision_adapter import analyze_meal_image

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/vision", tags=["vision"])

ALLOWED_IMAGE_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
}

# Pre-defined synonym dictionary mapping common Indian/athletic meal terms to catalog IDs
CATALOG_SYNONYMS: Dict[str, str] = {
    # Staples
    "rice": "rice-steamed",
    "steamed rice": "rice-steamed",
    "cooked rice": "rice-steamed",
    "white rice": "rice-steamed",
    "chawal": "rice-steamed",
    "roti": "roti-wheat",
    "rotis": "roti-wheat",
    "chapati": "roti-wheat",
    "chapatis": "roti-wheat",
    "phulka": "roti-wheat",
    "wheat roti": "roti-wheat",
    "idli": "idli",
    "idlis": "idli",
    "dosa": "dosa-plain",
    "plain dosa": "dosa-plain",
    "masala dosa": "dosa-masala",
    "oats": "oats-rolled",
    "rolled oats": "oats-rolled",
    "oatmeal": "oats-rolled",
    "banana": "banana",
    "bananas": "banana",
    "kela": "banana",
    # Proteins - Non-Veg
    "egg": "egg-whole-boiled",
    "eggs": "egg-whole-boiled",
    "boiled egg": "egg-whole-boiled",
    "boiled eggs": "egg-whole-boiled",
    "whole egg": "egg-whole-boiled",
    "egg white": "egg-whites",
    "egg whites": "egg-whites",
    "egg bhurji": "egg-bhurji",
    "omelette": "egg-bhurji",
    "omelet": "egg-bhurji",
    "scrambled egg": "egg-bhurji",
    "scrambled eggs": "egg-bhurji",
    "chicken breast": "chicken-breast-cooked",
    "grilled chicken": "chicken-breast-cooked",
    "grilled chicken breast": "chicken-breast-cooked",
    "chicken": "chicken-breast-cooked",
    "chicken curry": "chicken-curry",
    "murgh curry": "chicken-curry",
    "fish": "fish-rohu-cooked",
    "grilled fish": "fish-rohu-cooked",
    "fish curry": "fish-rohu-cooked",
    # Proteins - Veg
    "paneer": "paneer-raw",
    "raw paneer": "paneer-raw",
    "paneer cubes": "paneer-raw",
    "cottage cheese": "paneer-raw",
    "paneer bhurji": "paneer-bhurji",
    "dal": "dal-tadka",
    "daal": "dal-tadka",
    "dal tadka": "dal-tadka",
    "yellow dal": "dal-tadka",
    "toor dal": "dal-tadka",
    "moong dal": "dal-tadka",
    "sambar": "dal-tadka",
    "lentils": "dal-tadka",
    "whey": "whey-protein",
    "whey protein": "whey-protein",
    "protein shake": "whey-protein",
    "curd": "curd-dahi",
    "dahi": "curd-dahi",
    "yogurt": "curd-dahi",
    "milk": "toned-milk",
    "toned milk": "toned-milk",
    # Fats & Snacks
    "peanut butter": "peanut-butter",
    "roasted chana": "roasted-chana",
    "chana": "roasted-chana",
    "peanuts": "roasted-chana",
    "ghee": "ghee-tsp",
    "oil": "cooking-oil-tbsp",
    "cooking oil": "cooking-oil-tbsp",
}


# =============================================================================
# Response Schemas (Pydantic v2)
# =============================================================================


class CandidateFoodItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
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
    confidence: str = "medium"  # "high" | "medium" | "low"
    provenance: str = "ai_estimated"
    is_confirmed: bool = False


class MealAnalysisResponse(BaseModel):
    candidates: List[CandidateFoodItem]
    detected_item_count: int
    provenance: str = "ai_estimated"
    notes: Optional[str] = None


# =============================================================================
# Catalog Matching & Portion Estimation Helpers
# =============================================================================


def match_food_to_catalog(food_name: str) -> Optional[Dict[str, Any]]:
    """Match detected food name to the verified INDIAN_FOOD_CATALOG.

    Uses a 3-tier matching strategy:
      1. Synonym dictionary lookup
      2. Direct name / substring matching against catalog entries
      3. Fuzzy sequence similarity fallback (threshold >= 0.5)
    """
    clean_name = food_name.strip().lower()
    catalog_by_id = {item["id"]: item for item in INDIAN_FOOD_CATALOG}

    # 1. Exact synonym lookup
    if clean_name in CATALOG_SYNONYMS:
        syn_id = CATALOG_SYNONYMS[clean_name]
        if syn_id in catalog_by_id:
            return catalog_by_id[syn_id]

    # Check if any synonym key is a distinct word in the input
    for syn_key, syn_id in CATALOG_SYNONYMS.items():
        if re.search(rf"\b{re.escape(syn_key)}\b", clean_name):
            if syn_id in catalog_by_id:
                return catalog_by_id[syn_id]

    # 2. Substring match against catalog names
    for item in INDIAN_FOOD_CATALOG:
        item_name = item["name"].lower()
        if item_name in clean_name or clean_name in item_name:
            return item

    # 3. Fuzzy similarity match
    best_item: Optional[Dict[str, Any]] = None
    best_score = 0.0

    for item in INDIAN_FOOD_CATALOG:
        item_name = item["name"].lower()
        score = difflib.SequenceMatcher(None, clean_name, item_name).ratio()
        if score > best_score:
            best_score = score
            best_item = item

    if best_score >= 0.5 and best_item is not None:
        return best_item

    return None


def estimate_quantity_multiplier(
    estimated_serving: str, catalog_item: Optional[Dict[str, Any]]
) -> float:
    """Calculate portion scaler from AI estimated serving string.

    Parses gram weights (e.g. '150g' or '300g') against catalog serving weight,
    or extracts unit counts (e.g. '2 katoris', '2 pieces', '3 eggs').
    Defaults to 1.0 if indeterminate.
    """
    clean_serving = estimated_serving.strip().lower()

    # Look for gram specification e.g. "150g", "200 g", "300grams"
    gram_match = re.search(r"(\d+(?:\.\d+)?)\s*(?:g|gm|grams)", clean_serving)
    if gram_match and catalog_item:
        grams = float(gram_match.group(1))
        catalog_grams = catalog_item.get("serving_weight_g")
        if catalog_grams and catalog_grams > 0:
            return max(0.25, min(10.0, round(grams / catalog_grams, 2)))

    # Look for count or unit numbers: e.g. "2", "2.5", "1.5 katori", "3 pieces"
    num_match = re.search(r"(\d+(?:\.\d+)?)", clean_serving)
    if num_match:
        qty = float(num_match.group(1))
        # If catalog serving label starts with a number (e.g. "2 pieces" or "3 large whites")
        if catalog_item:
            cat_label = catalog_item.get("serving_label", "").lower()
            cat_num_match = re.search(r"^(\d+(?:\.\d+)?)", cat_label)
            if cat_num_match:
                base_count = float(cat_num_match.group(1))
                if base_count > 0:
                    qty = qty / base_count
        return max(0.25, min(10.0, round(qty, 2)))

    return 1.0


# =============================================================================
# Endpoint Implementation
# =============================================================================


@router.post(
    "/analyze-meal",
    response_model=APIResponse[MealAnalysisResponse],
    summary="Analyze meal photo using Gemini Vision and map to verified catalog",
)
async def analyze_meal_photo(
    file: UploadFile = File(...),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> APIResponse[MealAnalysisResponse]:
    """Accepts meal photo upload, detects food items using Gemini Vision AI,
    maps candidates to the verified Indian Food Catalog, and calculates
    estimated macros.

    CRITICAL GUARDRAIL: Returned items are marked provenance="ai_estimated"
    and is_confirmed=False. They require explicit athlete confirmation before
    joining daily totals.
    """
    # 1. Validate file MIME type and extension
    content_type = file.content_type or ""
    filename = (file.filename or "").lower()

    is_valid_mime = content_type.lower() in ALLOWED_IMAGE_TYPES or content_type.startswith("image/")
    is_valid_ext = any(filename.endswith(ext) for ext in (".jpg", ".jpeg", ".png", ".webp", ".heic"))

    if not (is_valid_mime or is_valid_ext):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be a supported image format (JPEG, PNG, WEBP, HEIC)",
        )

    # 2. Read bytes with length check
    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded image file is empty",
        )

    if len(image_bytes) > 15 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Uploaded image exceeds 15MB limit",
        )

    mime_type = content_type if content_type.startswith("image/") else "image/jpeg"

    # 3. Call Vision Adapter
    raw_candidates = analyze_meal_image(image_bytes=image_bytes, mime_type=mime_type)

    # 4. Map candidates to INDIAN_FOOD_CATALOG
    processed_candidates: List[CandidateFoodItem] = []

    for raw in raw_candidates:
        detected_name = raw["food_name"]
        serving_str = raw["estimated_serving"]
        confidence = raw["confidence"]

        catalog_match = match_food_to_catalog(detected_name)

        if catalog_match:
            qty_multiplier = estimate_quantity_multiplier(serving_str, catalog_match)
            cal = round(catalog_match["calories_kcal"] * qty_multiplier, 1)
            pro = round(catalog_match["protein_g"] * qty_multiplier, 1)
            cho = round(catalog_match["carbs_g"] * qty_multiplier, 1)
            fat = round(catalog_match["fat_g"] * qty_multiplier, 1)

            candidate = CandidateFoodItem(
                id=str(uuid.uuid4()),
                catalog_id=catalog_match["id"],
                food_name=detected_name,
                matched_catalog_name=catalog_match["name"],
                estimated_serving=serving_str,
                serving_label=catalog_match["serving_label"],
                quantity=qty_multiplier,
                calories_kcal=cal,
                protein_g=pro,
                carbs_g=cho,
                fat_g=fat,
                confidence=confidence,
                provenance="ai_estimated",
                is_confirmed=False,
            )
        else:
            # Unmatched / Custom item fallback: provide placeholder macros with low confidence
            qty_multiplier = estimate_quantity_multiplier(serving_str, None)
            candidate = CandidateFoodItem(
                id=str(uuid.uuid4()),
                catalog_id=None,
                food_name=detected_name,
                matched_catalog_name=None,
                estimated_serving=serving_str,
                serving_label=serving_str or "1 serving",
                quantity=qty_multiplier,
                calories_kcal=round(150.0 * qty_multiplier, 1),
                protein_g=round(5.0 * qty_multiplier, 1),
                carbs_g=round(20.0 * qty_multiplier, 1),
                fat_g=round(4.0 * qty_multiplier, 1),
                confidence="low",
                provenance="ai_estimated",
                is_confirmed=False,
            )

        processed_candidates.append(candidate)

    response_payload = MealAnalysisResponse(
        candidates=processed_candidates,
        detected_item_count=len(processed_candidates),
        provenance="ai_estimated",
        notes="Portions estimated from visual scale. User review and confirmation required.",
    )

    return APIResponse(
        success=True,
        message=f"Identified {len(processed_candidates)} candidate food items from meal photo",
        data=response_payload,
    )
