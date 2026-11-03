"""AthlonIQ Phase 3 — Vision AI Unit & Integration Tests

Tests:
  1. analyze_meal_image parses structured JSON array from Gemini 2.5 Flash
  2. analyze_meal_image handles markdown code blocks and formatting variances
  3. analyze_meal_image raises clean HTTP exceptions on invalid JSON or API failure
  4. POST /api/v1/vision/analyze-meal returns 401 Unauthorized without JWT
  5. POST /api/v1/vision/analyze-meal successfully maps candidates to INDIAN_FOOD_CATALOG
  6. Provenance and confirmation guardrails: all returned candidates have is_confirmed=False
     and provenance="ai_estimated"
  7. Rejection of invalid / empty file uploads
  8. Vision response carries typed provider/mode metadata (gemini/live, mock/demo, mock/fallback)
  9. Gemini failure returns NO candidates, provider mock, mode fallback, and message
 10. Demo mode returns sample candidates
 11. Client force_mode override rejected in production environment
"""

import io
import json
from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.api.v1.vision import estimate_quantity_multiplier, match_food_to_catalog
from app.core.config import settings
from app.core.security import AuthenticatedUser, get_current_user
from app.domain.tracking import INDIAN_FOOD_CATALOG
from app.main import app
from app.services.vision_adapter import VisionAnalysisRaw, analyze_meal_image

client = TestClient(app)

TEST_AUTH_HEADERS = {"Authorization": "Bearer test-token-phase3-athlete"}

SAMPLE_JPEG_BYTES = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb"


# =============================================================================
# 1. Vision Adapter Unit Tests
# =============================================================================


class TestVisionAdapter:
    """Tests for analyze_meal_image service logic."""

    @patch("app.services.vision_adapter.get_gemini_client")
    def test_analyze_meal_image_parses_valid_json(self, mock_get_client):
        # Mock Gemini response
        mock_response = MagicMock()
        mock_response.text = json.dumps([
            {"food_name": "Whole Wheat Roti", "estimated_serving": "2 rotis", "confidence": "high"},
            {"food_name": "Dal Tadka", "estimated_serving": "1 katori", "confidence": "high"},
        ])
        mock_client = MagicMock()
        mock_client.models.generate_content.return_value = mock_response
        mock_get_client.return_value = mock_client

        result = analyze_meal_image(SAMPLE_JPEG_BYTES, "image/jpeg")

        assert isinstance(result, VisionAnalysisRaw)
        assert len(result.candidates) == 2
        assert result.candidates[0]["food_name"] == "Whole Wheat Roti"
        assert result.candidates[0]["estimated_serving"] == "2 rotis"
        assert result.candidates[0]["confidence"] == "high"
        assert result.candidates[1]["food_name"] == "Dal Tadka"

    @patch("app.services.vision_adapter.get_gemini_client")
    def test_analyze_meal_image_returns_gemini_live_metadata(self, mock_get_client):
        """Successful Gemini call sets provider=gemini, mode=live."""
        mock_response = MagicMock()
        mock_response.text = json.dumps([
            {"food_name": "Rice", "estimated_serving": "1 katori", "confidence": "high"},
        ])
        mock_client = MagicMock()
        mock_client.models.generate_content.return_value = mock_response
        mock_get_client.return_value = mock_client

        result = analyze_meal_image(SAMPLE_JPEG_BYTES, "image/jpeg")

        assert result.provider == "gemini"
        assert result.mode == "live"
        assert result.model_name is not None
        assert "gemini" in result.model_name

    @patch("app.services.vision_adapter.get_gemini_client")
    def test_analyze_meal_image_handles_markdown_code_fence(self, mock_get_client):
        # Model returns json enclosed in ```json ... ```
        mock_response = MagicMock()
        mock_response.text = (
            "```json\n"
            "[\n"
            '  {"food_name": "Cooked Steamed Rice", "estimated_serving": "150g", "confidence": "high"}\n'
            "]\n"
            "```"
        )
        mock_client = MagicMock()
        mock_client.models.generate_content.return_value = mock_response
        mock_get_client.return_value = mock_client

        result = analyze_meal_image(SAMPLE_JPEG_BYTES, "image/jpeg")

        assert len(result.candidates) == 1
        assert result.candidates[0]["food_name"] == "Cooked Steamed Rice"
        assert result.candidates[0]["estimated_serving"] == "150g"

    def test_analyze_meal_image_empty_bytes_raises_400(self):
        with pytest.raises(HTTPException) as exc_info:
            analyze_meal_image(b"", "image/jpeg")
        assert exc_info.value.status_code == 400

    @patch("app.services.vision_adapter.get_gemini_client")
    def test_analyze_meal_image_invalid_json_raises_502(self, mock_get_client):
        mock_response = MagicMock()
        mock_response.text = "This is not JSON text."
        mock_client = MagicMock()
        mock_client.models.generate_content.return_value = mock_response
        mock_get_client.return_value = mock_client

        with pytest.raises(HTTPException) as exc_info:
            analyze_meal_image(SAMPLE_JPEG_BYTES, "image/jpeg")
        assert exc_info.value.status_code == 502
        assert "valid JSON" in exc_info.value.detail

    def test_analyze_meal_image_force_mode_demo(self):
        """Demo mode returns sample candidates."""
        result = analyze_meal_image(SAMPLE_JPEG_BYTES, "image/jpeg", force_mode="demo")
        assert result.provider == "mock"
        assert result.mode == "demo"
        assert len(result.candidates) == 2

    def test_analyze_meal_image_force_mode_fallback(self):
        """Fallback mode returns NO candidates (zero fabricated defaults)."""
        result = analyze_meal_image(SAMPLE_JPEG_BYTES, "image/jpeg", force_mode="fallback")
        assert result.provider == "mock"
        assert result.mode == "fallback"
        assert len(result.candidates) == 0

    @patch("app.services.vision_adapter.get_gemini_client")
    def test_analyze_meal_image_allow_fallback_on_gemini_error(self, mock_get_client):
        """When Gemini call fails and allow_fallback=True, return empty candidates with mock/fallback."""
        mock_client = MagicMock()
        mock_client.models.generate_content.side_effect = Exception("API quota exceeded")
        mock_get_client.return_value = mock_client

        result = analyze_meal_image(SAMPLE_JPEG_BYTES, "image/jpeg", allow_fallback=True)
        assert result.provider == "mock"
        assert result.mode == "fallback"
        assert len(result.candidates) == 0

    def test_vision_adapter_rejects_force_mode_in_production(self, monkeypatch):
        """Adapter itself rejects force_mode overrides when ENVIRONMENT is production."""
        monkeypatch.setattr(settings, "ENVIRONMENT", "production")
        with pytest.raises(HTTPException) as exc_info:
            analyze_meal_image(SAMPLE_JPEG_BYTES, "image/jpeg", force_mode="demo")
        assert exc_info.value.status_code == 400
        assert "rejected in production" in exc_info.value.detail


# =============================================================================
# 2. Vision Provider/Mode Metadata Tests
# =============================================================================


class TestVisionProviderMode:
    """Tests for provider/mode metadata in endpoint responses."""

    @patch("app.api.v1.vision.analyze_meal_image")
    def test_gemini_live_mode_in_response(self, mock_analyze):
        """When adapter returns provider=gemini, mode=live, the response reflects it."""
        mock_analyze.return_value = VisionAnalysisRaw(
            candidates=[
                {"food_name": "Roti", "estimated_serving": "2 rotis", "confidence": "high"},
            ],
            provider="gemini",
            mode="live",
            model_name="gemini-2.5-flash",
        )

        file_payload = {"file": ("meal.jpg", io.BytesIO(SAMPLE_JPEG_BYTES), "image/jpeg")}
        response = client.post(
            "/api/v1/vision/analyze-meal",
            headers=TEST_AUTH_HEADERS,
            files=file_payload,
        )

        assert response.status_code == 200
        data = response.json()["data"]
        assert data["vision_meta"]["provider"] == "gemini"
        assert data["vision_meta"]["mode"] == "live"
        assert data["vision_meta"]["model_name"] == "gemini-2.5-flash"

    @patch("app.api.v1.vision.analyze_meal_image")
    def test_mock_demo_mode_in_response(self, mock_analyze):
        """Mock/demo path sets provider=mock, mode=demo."""
        mock_analyze.return_value = VisionAnalysisRaw(
            candidates=[
                {"food_name": "Paneer Cubes", "estimated_serving": "100g", "confidence": "high"},
            ],
            provider="mock",
            mode="demo",
            model_name=None,
        )

        file_payload = {"file": ("test.jpg", io.BytesIO(SAMPLE_JPEG_BYTES), "image/jpeg")}
        response = client.post(
            "/api/v1/vision/analyze-meal",
            headers=TEST_AUTH_HEADERS,
            files=file_payload,
        )

        assert response.status_code == 200
        data = response.json()["data"]
        assert data["vision_meta"]["provider"] == "mock"
        assert data["vision_meta"]["mode"] == "demo"
        assert data["vision_meta"]["model_name"] is None

    @patch("app.api.v1.vision.analyze_meal_image")
    def test_mock_fallback_mode_in_response(self, mock_analyze):
        """Fallback path after Gemini failure sets provider=mock, mode=fallback, 0 candidates, and message."""
        mock_analyze.return_value = VisionAnalysisRaw(
            candidates=[],
            provider="mock",
            mode="fallback",
            model_name=None,
        )

        file_payload = {"file": ("fallback.jpg", io.BytesIO(SAMPLE_JPEG_BYTES), "image/jpeg")}
        response = client.post(
            "/api/v1/vision/analyze-meal",
            headers=TEST_AUTH_HEADERS,
            files=file_payload,
        )

        assert response.status_code == 200
        body = response.json()
        assert body["message"] == "Vision unavailable — log manually"
        data = body["data"]
        assert data["candidates"] == []
        assert data["detected_item_count"] == 0
        assert data["provider"] == "mock"
        assert data["mode"] == "fallback"
        assert data["notes"] == "Vision unavailable — log manually"
        assert data["vision_meta"]["provider"] == "mock"
        assert data["vision_meta"]["mode"] == "fallback"


# =============================================================================
# 3. Catalog Mapping & Portion Scaler Tests
# =============================================================================


class TestCatalogMapping:
    """Tests for matching AI food predictions to INDIAN_FOOD_CATALOG."""

    def test_synonym_matching_roti(self):
        match = match_food_to_catalog("2 chapati")
        assert match is not None
        assert match["id"] == "roti-wheat"

    def test_synonym_matching_paneer(self):
        match = match_food_to_catalog("Paneer Cubes")
        assert match is not None
        assert match["id"] == "paneer-raw"

    def test_substring_matching_chicken(self):
        match = match_food_to_catalog("Grilled Chicken Breast Fillet")
        assert match is not None
        assert match["id"] == "chicken-breast-cooked"

    def test_fuzzy_matching_dosa(self):
        match = match_food_to_catalog("Crispy Plain Dosa")
        assert match is not None
        assert match["id"] == "dosa-plain"

    def test_portion_multiplier_gram_calculation(self):
        rice_catalog = next(i for i in INDIAN_FOOD_CATALOG if i["id"] == "rice-steamed")
        # 300g serving for a 150g base = 2.0x
        qty = estimate_quantity_multiplier("300g", rice_catalog)
        assert qty == 2.0

    def test_portion_multiplier_count_calculation(self):
        roti_catalog = next(i for i in INDIAN_FOOD_CATALOG if i["id"] == "roti-wheat")
        # 3 rotis for 1 medium base = 3.0x
        qty = estimate_quantity_multiplier("3 rotis", roti_catalog)
        assert qty == 3.0


# =============================================================================
# 4. API Endpoint Integration Tests
# =============================================================================


class TestVisionEndpoint:
    """Integration tests for POST /api/v1/vision/analyze-meal."""

    def test_analyze_meal_unauthorized_without_jwt(self):
        # Must return 401 without Bearer token
        file_payload = {"file": ("meal.jpg", io.BytesIO(SAMPLE_JPEG_BYTES), "image/jpeg")}
        response = client.post("/api/v1/vision/analyze-meal", files=file_payload)
        assert response.status_code == 401

    @patch("app.api.v1.vision.analyze_meal_image")
    def test_analyze_meal_authorized_with_catalog_mapping(self, mock_analyze):
        mock_analyze.return_value = VisionAnalysisRaw(
            candidates=[
                {"food_name": "Whole Wheat Roti", "estimated_serving": "2 rotis", "confidence": "high"},
                {"food_name": "Toor Dal Tadka", "estimated_serving": "1 katori (150g)", "confidence": "high"},
            ],
            provider="gemini",
            mode="live",
            model_name="gemini-2.5-flash",
        )

        file_payload = {"file": ("thali.jpg", io.BytesIO(SAMPLE_JPEG_BYTES), "image/jpeg")}
        response = client.post(
            "/api/v1/vision/analyze-meal",
            headers=TEST_AUTH_HEADERS,
            files=file_payload,
        )

        assert response.status_code == 200
        body = response.json()
        assert body["success"] is True

        data = body["data"]
        candidates = data["candidates"]
        assert len(candidates) == 2

        # Candidate 1: 2 rotis (base cal 104 * 2 = 208, pro 3.5 * 2 = 7.0)
        c1 = candidates[0]
        assert c1["catalog_id"] == "roti-wheat"
        assert c1["quantity"] == 2.0
        assert c1["calories_kcal"] == 208.0
        assert c1["protein_g"] == 7.0
        assert c1["provenance"] == "ai_estimated"
        assert c1["is_confirmed"] is False  # CRITICAL GUARDRAIL

        # Candidate 2: 1 katori dal (base cal 150.0, pro 9.0)
        c2 = candidates[1]
        assert c2["catalog_id"] == "dal-tadka"
        assert c2["quantity"] == 1.0
        assert c2["calories_kcal"] == 150.0
        assert c2["protein_g"] == 9.0
        assert c2["provenance"] == "ai_estimated"
        assert c2["is_confirmed"] is False  # CRITICAL GUARDRAIL

        # Vision metadata is present
        assert data["vision_meta"]["provider"] == "gemini"
        assert data["vision_meta"]["mode"] == "live"

    def test_analyze_meal_invalid_file_type_rejected(self):
        # Plain text file should be rejected with 400
        file_payload = {"file": ("data.txt", io.BytesIO(b"Hello world"), "text/plain")}
        response = client.post(
            "/api/v1/vision/analyze-meal",
            headers=TEST_AUTH_HEADERS,
            files=file_payload,
        )
        assert response.status_code == 400
        assert "supported image format" in response.json()["detail"]

    def test_analyze_meal_empty_file_rejected(self):
        file_payload = {"file": ("empty.jpg", io.BytesIO(b""), "image/jpeg")}
        response = client.post(
            "/api/v1/vision/analyze-meal",
            headers=TEST_AUTH_HEADERS,
            files=file_payload,
        )
        assert response.status_code == 400
        assert "empty" in response.json()["detail"]

    @patch("app.services.vision_adapter.get_gemini_client")
    def test_analyze_meal_on_gemini_failure_returns_fallback_and_message(self, mock_get_client):
        """Lane A6: On Gemini failure, return NO candidates, provider mock, mode fallback, and message."""
        mock_client = MagicMock()
        mock_client.models.generate_content.side_effect = Exception("Service unavailable / Quota exhausted")
        mock_get_client.return_value = mock_client

        file_payload = {"file": ("food.jpg", io.BytesIO(SAMPLE_JPEG_BYTES), "image/jpeg")}
        response = client.post(
            "/api/v1/vision/analyze-meal",
            headers=TEST_AUTH_HEADERS,
            files=file_payload,
        )

        assert response.status_code == 200
        body = response.json()
        assert body["success"] is True
        assert body["message"] == "Vision unavailable — log manually"

        data = body["data"]
        assert data["candidates"] == []
        assert data["detected_item_count"] == 0
        assert data["provider"] == "mock"
        assert data["mode"] == "fallback"
        assert data["notes"] == "Vision unavailable — log manually"
        assert data["vision_meta"]["provider"] == "mock"
        assert data["vision_meta"]["mode"] == "fallback"

    def test_analyze_meal_demo_mode_returns_samples(self):
        """Lane A6: Demo mode returns sample candidates only."""
        file_payload = {"file": ("demo.jpg", io.BytesIO(SAMPLE_JPEG_BYTES), "image/jpeg")}
        response = client.post(
            "/api/v1/vision/analyze-meal?mode=demo",
            headers=TEST_AUTH_HEADERS,
            files=file_payload,
        )

        assert response.status_code == 200
        body = response.json()
        assert body["success"] is True
        assert "candidate food items" in body["message"]

        data = body["data"]
        assert len(data["candidates"]) == 2
        assert data["detected_item_count"] == 2
        assert data["provider"] == "mock"
        assert data["mode"] == "demo"
        assert data["vision_meta"]["provider"] == "mock"
        assert data["vision_meta"]["mode"] == "demo"

        names = [c["food_name"] for c in data["candidates"]]
        assert "Whole Wheat Roti" in names
        assert "Toor Dal Tadka" in names

    def test_analyze_meal_rejects_client_force_mode_in_production(self, monkeypatch):
        """Lane A6: When ENVIRONMENT == 'production', client force_mode is rejected."""
        monkeypatch.setattr(settings, "ENVIRONMENT", "production")
        app.dependency_overrides[get_current_user] = lambda: AuthenticatedUser(
            user_id="prod-athlete-01", email="athlete@prod.io"
        )
        try:
            file_payload = {"file": ("meal.jpg", io.BytesIO(SAMPLE_JPEG_BYTES), "image/jpeg")}

            # Test ?mode=demo
            resp_demo = client.post(
                "/api/v1/vision/analyze-meal?mode=demo",
                headers=TEST_AUTH_HEADERS,
                files=file_payload,
            )
            assert resp_demo.status_code == 400
            assert "rejected in production" in resp_demo.json()["detail"]

            # Test ?mode=fallback
            file_payload = {"file": ("meal.jpg", io.BytesIO(SAMPLE_JPEG_BYTES), "image/jpeg")}
            resp_fallback = client.post(
                "/api/v1/vision/analyze-meal?mode=fallback",
                headers=TEST_AUTH_HEADERS,
                files=file_payload,
            )
            assert resp_fallback.status_code == 400
            assert "rejected in production" in resp_fallback.json()["detail"]

            # Test ?force_mode=demo
            file_payload = {"file": ("meal.jpg", io.BytesIO(SAMPLE_JPEG_BYTES), "image/jpeg")}
            resp_force = client.post(
                "/api/v1/vision/analyze-meal?force_mode=demo",
                headers=TEST_AUTH_HEADERS,
                files=file_payload,
            )
            assert resp_force.status_code == 400
            assert "rejected in production" in resp_force.json()["detail"]
        finally:
            app.dependency_overrides.pop(get_current_user, None)

    @patch("app.api.v1.vision.analyze_meal_image")
    def test_analyze_meal_allows_request_without_force_mode_in_production(self, mock_analyze, monkeypatch):
        """Lane A6: When ENVIRONMENT == 'production', request without force_mode succeeds."""
        monkeypatch.setattr(settings, "ENVIRONMENT", "production")
        app.dependency_overrides[get_current_user] = lambda: AuthenticatedUser(
            user_id="prod-athlete-01", email="athlete@prod.io"
        )
        try:
            mock_analyze.return_value = VisionAnalysisRaw(
                candidates=[{"food_name": "Rice", "estimated_serving": "150g", "confidence": "high"}],
                provider="gemini",
                mode="live",
                model_name="gemini-2.5-flash",
            )

            file_payload = {"file": ("meal.jpg", io.BytesIO(SAMPLE_JPEG_BYTES), "image/jpeg")}
            response = client.post(
                "/api/v1/vision/analyze-meal",
                headers=TEST_AUTH_HEADERS,
                files=file_payload,
            )
            assert response.status_code == 200
            data = response.json()["data"]
            assert data["provider"] == "gemini"
            assert data["mode"] == "live"
        finally:
            app.dependency_overrides.pop(get_current_user, None)
