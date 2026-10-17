"""Health check, security auth, and core deterministic domain unit tests."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.domain.performance import (
    calculate_one_rep_max_epley,
    calculate_one_rep_max_brzycki,
    calculate_bmi,
    calculate_protein_reference,
    calculate_initial_energy_estimate,
    calculate_rules_readiness,
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
    est_1rm = calculate_one_rep_max_epley(100.0, 10)
    assert est_1rm == 133.3
    assert calculate_one_rep_max_epley(140.0, 1) == 140.0
    assert calculate_one_rep_max_epley(100.0, 0) == 0.0


def test_calculate_one_rep_max_brzycki() -> None:
    """Test 1RM estimation via Brzycki formula."""
    est_1rm = calculate_one_rep_max_brzycki(100.0, 5)
    assert est_1rm == 112.5
    assert calculate_one_rep_max_brzycki(100.0, 1) == 100.0


def test_calculate_bmi_deterministic() -> None:
    """Test deterministic BMI: 55.0 kg / 173.0 cm must yield exactly 18.4."""
    result = calculate_bmi(weight_kg=55.0, height_cm=173.0)
    assert result["bmi"] == 18.4
    assert result["category"] == "underweight"
    assert result["provenance"] == "calculated_estimate"
    assert "disclaimer" in result
    assert "screening metric only" in result["disclaimer"].lower()


def test_calculate_protein_reference_range() -> None:
    """Test evidence-based protein range (1.6-2.2 g/kg): 55.0 kg -> 88-121 g."""
    result = calculate_protein_reference(weight_kg=55.0)
    assert result["protein_min_g"] == 88
    assert result["protein_max_g"] == 121
    assert result["protein_target_g"] == 110
    assert result["provenance"] == "provisional_default"

    # User confirmed override within range
    custom = calculate_protein_reference(weight_kg=55.0, custom_target_g=115)
    assert custom["protein_target_g"] == 115
    assert custom["provenance"] == "user_confirmed"


def test_calculate_initial_energy_estimate_onboarding_gate() -> None:
    """Test that energy targets remain None until onboarding biometrics and sleep are completed."""
    # Before onboarding completion
    pre = calculate_initial_energy_estimate(
        weight_kg=55.0,
        height_cm=173.0,
        age=20,
        onboarding_completed=False,
        sleep_baseline_hours=None,
        experience_level=None,
    )
    assert pre["estimated_kcal"] is None
    assert pre["provenance"] == "awaiting_onboarding"
    assert pre["macros"] is None

    # After onboarding completion with baselines confirmed
    post = calculate_initial_energy_estimate(
        weight_kg=55.0,
        height_cm=173.0,
        age=20,
        sex=None,  # Unknown sex
        onboarding_completed=True,
        sleep_baseline_hours=7.5,
        experience_level="beginner",
        weekly_badminton_sessions=2,
        weekly_running_sessions=1,
    )
    assert post["estimated_kcal"] is not None
    assert post["estimated_kcal"] > 1800
    assert post["provenance"] == "calculated_estimate"
    assert post["sex_assumed"] is True
    assert post["surplus_kcal"] == 250
    assert post["macros"]["protein_g"] == 110
    assert post["macros"]["fat_g"] > 0
    assert post["macros"]["carbs_g"] > 0


def test_calculate_rules_readiness() -> None:
    """Test transparent rules-based readiness score and triggers."""
    # Optimal recovery inputs
    prime = calculate_rules_readiness(
        sleep_hours=8.5,
        sleep_quality=5,
        soreness=1,
        fatigue=1,
        stress=1,
    )
    assert prime["readiness_score"] >= 80
    assert prime["status"] == "Prime"
    assert len(prime["triggers"]) >= 4

    # Compromised / exhausted inputs
    recover = calculate_rules_readiness(
        sleep_hours=4.5,
        sleep_quality=1,
        soreness=5,
        fatigue=5,
        stress=5,
    )
    assert recover["readiness_score"] < 55
    assert recover["status"] == "Recover"
    assert any("deficit" in t.lower() or "warning" in t.lower() for t in recover["triggers"])


@pytest.mark.asyncio
async def test_auth_security_gating() -> None:
    """Verify that protected endpoints return 401 Unauthorized without valid Bearer token."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        # 1. Unauthenticated requests must fail with 401
        res1 = await client.post(
            "/api/v1/coaching/targets-preview",
            json={"weight_kg": 55.0, "height_cm": 173.0},
        )
        assert res1.status_code == 401

        res2 = await client.post(
            "/api/v1/coaching/readiness",
            json={
                "sleep_hours": 7.5,
                "sleep_quality": 4,
                "soreness": 2,
                "fatigue": 2,
            },
        )
        assert res2.status_code == 401

        # 2. Authenticated test request with Bearer token passes
        headers = {"Authorization": "Bearer test-token-athlete-test"}
        auth_res = await client.post(
            "/api/v1/coaching/targets-preview",
            json={
                "weight_kg": 55.0,
                "height_cm": 173.0,
                "age": 20,
                "onboarding_completed": True,
                "sleep_baseline_hours": 7.5,
                "experience_level": "beginner",
            },
            headers=headers,
        )
        assert auth_res.status_code == 200
        data = auth_res.json()
        assert data["success"] is True
        assert data["data"]["bmi_info"]["bmi"] == 18.4
        assert data["data"]["protein_info"]["protein_target_g"] == 110
