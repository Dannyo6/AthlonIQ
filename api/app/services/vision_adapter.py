"""AthlonIQ Phase 3 — Vision AI Adapter for Meal Analysis.

Integrates with Google GenAI SDK (gemini-2.5-flash) to perform multimodal
image analysis on meal photos, extracting candidate food items with portion
estimations and confidence ratings.
"""

from __future__ import annotations

import json
import logging
import re
from typing import Any, Dict, List

from fastapi import HTTPException, status
from google import genai
from google.genai import types

from app.core.config import settings

logger = logging.getLogger(__name__)

SYSTEM_INSTRUCTION = (
    "You are a specialized sports nutrition AI. Analyze the food in the image. "
    "Identify the items, focusing on Indian cuisine and athletic staples. "
    "Estimate the portion size (e.g., '2 katoris', '150g'). "
    "Return ONLY a valid JSON array of objects with keys: "
    "`food_name` (string), `estimated_serving` (string), `confidence` ('high', 'medium', 'low')."
)


def get_gemini_client() -> genai.Client:
    """Return an initialized Google GenAI Client using settings.GEMINI_API_KEY."""
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GEMINI_API_KEY is not configured on the server",
        )
    return genai.Client(api_key=api_key)


def _clean_json_text(raw_text: str) -> str:
    """Strip markdown code block fences and isolate JSON payload."""
    text = (raw_text or "").strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
        text = re.sub(r"\s*```$", "", text)
        text = text.strip()
    return text


def analyze_meal_image(image_bytes: bytes, mime_type: str = "image/jpeg") -> List[Dict[str, Any]]:
    """Analyze a meal image using Gemini 2.5 Flash and return detected candidate foods.

    Parameters:
      image_bytes: Raw binary bytes of uploaded image
      mime_type: MIME type of image (e.g. 'image/jpeg', 'image/png')

    Returns:
      List of dicts: [
        {"food_name": "...", "estimated_serving": "...", "confidence": "high"|"medium"|"low"},
        ...
      ]

    Raises:
      HTTPException on missing API key, network failure, or invalid JSON output.
    """
    if not image_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image bytes cannot be empty",
        )

    client = get_gemini_client()

    try:
        model_name = settings.GEMINI_MODEL or "gemini-2.5-flash"
        response = client.models.generate_content(
            model=model_name,
            contents=[
                types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                "Analyze the food items in this meal and return the structured JSON array.",
            ],
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                response_mime_type="application/json",
                temperature=0.2,
            ),
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Gemini Vision API generation error: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Gemini Vision API call failed: {str(exc)}",
        )

    raw_text = getattr(response, "text", "") or ""
    cleaned_json = _clean_json_text(raw_text)

    if not cleaned_json:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Gemini Vision returned an empty response",
        )

    try:
        parsed = json.loads(cleaned_json)
    except json.JSONDecodeError as err:
        logger.error(f"Failed to parse Gemini response as JSON: {raw_text}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Gemini Vision response was not valid JSON: {str(err)}",
        )

    # Normalize response to a list of dicts
    candidates_list: List[Any]
    if isinstance(parsed, list):
        candidates_list = parsed
    elif isinstance(parsed, dict):
        # In case the model wrapped it in a key like {"foods": [...]} or {"items": [...]}
        for key in ("foods", "items", "candidates", "food_items", "meals"):
            if key in parsed and isinstance(parsed[key], list):
                candidates_list = parsed[key]
                break
        else:
            if "food_name" in parsed:
                candidates_list = [parsed]
            else:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Gemini Vision response did not contain a list of candidate items",
                )
    else:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Gemini Vision response must be a JSON array",
        )

    sanitized: List[Dict[str, Any]] = []
    for item in candidates_list:
        if not isinstance(item, dict):
            continue
        food_name = str(item.get("food_name") or "").strip()
        if not food_name:
            continue
        estimated_serving = str(item.get("estimated_serving") or "1 serving").strip()
        confidence = str(item.get("confidence") or "medium").strip().lower()
        if confidence not in ("high", "medium", "low"):
            confidence = "medium"

        sanitized.append({
            "food_name": food_name,
            "estimated_serving": estimated_serving,
            "confidence": confidence,
        })

    if not sanitized:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No recognizable food items could be identified in the image",
        )

    return sanitized
