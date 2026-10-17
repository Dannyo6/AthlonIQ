"""Health check and core domain unit tests."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.domain.performance import (
    calculate_one_rep_max_epley,
    calculate_one_rep_max_brzycki,
    calculate_readiness_score,
    calculate_macro_split,
)


@pytest.mark.asyncio
async def test_root_health_endpoint() -> None:
    """Verify root /health returns 200 and valid payload."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["status"] == "healthy"
        assert "environment" in data["data"]
        assert "version" in data["data"]


@pytest.mark.asyncio
async def test_api_v1_health_endpoint() -> None:
    """Verify /api/v1/health returns 200 and operational status."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get("/api/v1/health")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["status"] == "healthy"
        assert data["data"]["project"] == "AthlonIQ API"


@pytest.mark.asyncio
async def test_root_info_endpoint() -> None:
    """Verify root / returns 200 and project metadata."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "online"
        assert data["api_v1"] == "/api/v1"


def test_calculate_one_rep_max_epley() -> None:
    """Test 1RM estimation via Epley formula."""
    # 100kg for 10 reps -> 100 * (1 + 10/30) = 133.3kg
    est_1rm = calculate_one_rep_max_epley(100.0, 10)
    assert est_1rm == 133.3

    # 1 rep returns exact weight
    assert calculate_one_rep_max_epley(140.0, 1) == 140.0

    # 0 or negative reps returns 0.0
    assert calculate_one_rep_max_epley(100.0, 0) == 0.0


def test_calculate_one_rep_max_brzycki() -> None:
    """Test 1RM estimation via Brzycki formula."""
    # 100kg for 5 reps -> 100 / (1.0278 - 0.0278 * 5) = 100 / 0.8888 = 112.5kg
    est_1rm = calculate_one_rep_max_brzycki(100.0, 5)
    assert est_1rm == 112.5

    assert calculate_one_rep_max_brzycki(100.0, 1) == 100.0


def test_calculate_readiness_score() -> None:
    """Test composite readiness score calculation."""
    # High recovery athlete: 8 hours sleep, 85 quality, HRV 55ms (baseline 50), soreness 2/10
    score_high = calculate_readiness_score(
        sleep_quality_score=85,
        sleep_duration_hours=8.0,
        hrv_rmssd_ms=55.0,
        hrv_baseline_ms=50.0,
        soreness_score=2,
    )
    assert 80 <= score_high <= 100

    # Fatigued athlete: 4.5 hours sleep, 40 quality, HRV 28ms (baseline 50), soreness 8/10
    score_low = calculate_readiness_score(
        sleep_quality_score=40,
        sleep_duration_hours=4.5,
        hrv_rmssd_ms=28.0,
        hrv_baseline_ms=50.0,
        soreness_score=8,
    )
    assert score_low < 50


def test_calculate_macro_split() -> None:
    """Test macro distribution calculation."""
    # 80kg athlete, 2600 kcal target, 2.0g/kg protein, 25% fat
    macros = calculate_macro_split(
        weight_kg=80.0,
        target_calories=2600,
        protein_per_kg=2.0,
        fat_pct_of_calories=0.25,
    )
    assert macros["calories"] == 2600
    assert macros["protein_g"] == 160  # 80 * 2.0
    assert macros["fat_g"] == 72  # (2600 * 0.25) / 9 = 72.2 -> 72
    # Carbs: (2600 - (160*4 + 72*9)) / 4 = (2600 - 640 - 648) / 4 = 1312 / 4 = 328g
    assert macros["carbs_g"] == 328
