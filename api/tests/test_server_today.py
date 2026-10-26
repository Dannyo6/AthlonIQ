"""Tests for server-side 'today' computation and environment-gated override rules.

Lane A2 Requirements:
1. Compute 'today' server-side from authenticated user's profile timezone.
   Default to 'Asia/Kolkata' only if stored timezone is NULL (stated in docstring).
2. Accept a client 'today' override ONLY when ENVIRONMENT != 'production'.
   In production, client override must be rejected with HTTP 400 Bad Request.
3. Tests:
   - 00:30 IST case with an injected clock.
   - 23:30 IST case with an injected clock.
   - Production rejects the client 'today' override (unit function + API endpoints).
   - Non-production allows the client 'today' override.
"""

from datetime import date, datetime, timezone
import pytest
from fastapi import HTTPException
from httpx import ASGITransport, AsyncClient

from app.core.config import Settings
from app.core.security import AuthenticatedUser, get_current_user
from app.domain.coach_tools import (
    UserCoachingContext,
    resolve_server_today,
)
from app.main import create_app


# =============================================================================
# Unit Tests: 00:30 IST and 23:30 IST Injected Clock
# =============================================================================

def test_server_today_0030_ist_injected_clock() -> None:
    """Verify that at 00:30 IST, today is the new day, even though UTC is still yesterday.
    
    00:30 IST on 2026-10-20 corresponds to 19:00 UTC on 2026-10-19.
    Server-side resolution must localize UTC 19:00 to 2026-10-20.
    """
    # 19:00 UTC on 2026-10-19 == 00:30 IST on 2026-10-20
    clock_0030_ist = datetime(2026, 10, 19, 19, 0, 0, tzinfo=timezone.utc)

    # Explicit Asia/Kolkata timezone
    today_explicit = resolve_server_today(
        user_timezone="Asia/Kolkata",
        now=clock_0030_ist,
        environment="development",
    )
    assert today_explicit == date(2026, 10, 20)

    # In Context preferences
    ctx_kolkata = UserCoachingContext(preferences={"timezone": "Asia/Kolkata"})
    today_ctx = resolve_server_today(
        context=ctx_kolkata,
        now=clock_0030_ist,
        environment="development",
    )
    assert today_ctx == date(2026, 10, 20)

    # NULL stored timezone: defaults to "Asia/Kolkata" as documented
    ctx_null_tz = UserCoachingContext(preferences={"timezone": None})
    today_null = resolve_server_today(
        context=ctx_null_tz,
        now=clock_0030_ist,
        environment="development",
    )
    assert today_null == date(2026, 10, 20)

    # Discriminate against another timezone: America/New_York (UTC-4 in October)
    # At 19:00 UTC on 2026-10-19, New York is at 15:00 on 2026-10-19
    today_ny = resolve_server_today(
        user_timezone="America/New_York",
        now=clock_0030_ist,
        environment="development",
    )
    assert today_ny == date(2026, 10, 19)


def test_server_today_2330_ist_injected_clock() -> None:
    """Verify that at 23:30 IST, today is still the current day in IST.
    
    23:30 IST on 2026-10-20 corresponds to 18:00 UTC on 2026-10-20.
    """
    # 18:00 UTC on 2026-10-20 == 23:30 IST on 2026-10-20
    clock_2330_ist = datetime(2026, 10, 20, 18, 0, 0, tzinfo=timezone.utc)

    today_ist = resolve_server_today(
        user_timezone="Asia/Kolkata",
        now=clock_2330_ist,
        environment="development",
    )
    assert today_ist == date(2026, 10, 20)

    # Edge case: 23:59:59 IST on 2026-10-20 == 18:29:59 UTC on 2026-10-20
    clock_2359_ist = datetime(2026, 10, 20, 18, 29, 59, tzinfo=timezone.utc)
    today_edge = resolve_server_today(
        user_timezone="Asia/Kolkata",
        now=clock_2359_ist,
        environment="development",
    )
    assert today_edge == date(2026, 10, 20)


# =============================================================================
# Unit Tests: Client 'today' Override Rules
# =============================================================================

def test_client_today_override_accepted_in_development() -> None:
    """Client today override is permitted when ENVIRONMENT != 'production'."""
    custom_date = date(2026, 10, 15)
    resolved = resolve_server_today(
        client_today=custom_date,
        environment="development",
    )
    assert resolved == custom_date


def test_client_today_override_rejected_in_production() -> None:
    """Client today override is strictly rejected with HTTP 400 when ENVIRONMENT == 'production'."""
    with pytest.raises(HTTPException) as exc_info:
        resolve_server_today(
            client_today=date(2026, 10, 15),
            environment="production",
        )
    assert exc_info.value.status_code == 400
    assert "forbidden in production" in exc_info.value.detail.lower()


# =============================================================================
# API Endpoint Integration Tests: Production Rejection of Client Override
# =============================================================================

@pytest.mark.asyncio
async def test_production_endpoint_chat_rejects_today_override(monkeypatch: pytest.MonkeyPatch) -> None:
    """POST /api/v1/coaching/chat returns 400 Bad Request when today override is sent in production."""
    prod_settings = Settings(
        _env_file=None,
        ENVIRONMENT="production",
        DEBUG=False,
        DEV_AUTH_BYPASS=False,
        BACKEND_CORS_ORIGINS=["https://app.athloniq.io"],
    )
    test_app = create_app(prod_settings)
    test_app.dependency_overrides[get_current_user] = lambda: AuthenticatedUser(
        user_id="athlete-prod-001",
        email="athlete@athloniq.test",
        role="authenticated",
    )

    async with AsyncClient(
        transport=ASGITransport(app=test_app), base_url="http://test"
    ) as client:
        # Sending client 'today' in production must be rejected with 400 Bad Request
        response = await client.post(
            "/api/v1/coaching/chat",
            json={
                "message": "How is my recovery?",
                "context": UserCoachingContext().model_dump(),
                "today": "2026-10-19",
            },
            headers={"Authorization": "Bearer any-token"},
        )
        assert response.status_code == 400
        assert "forbidden in production" in response.text.lower()


@pytest.mark.asyncio
async def test_production_endpoint_weekly_review_rejects_today_override() -> None:
    """POST /api/v1/coaching/weekly-review returns 400 Bad Request when today override is sent in production."""
    prod_settings = Settings(
        _env_file=None,
        ENVIRONMENT="production",
        DEBUG=False,
        DEV_AUTH_BYPASS=False,
        BACKEND_CORS_ORIGINS=["https://app.athloniq.io"],
    )
    test_app = create_app(prod_settings)
    test_app.dependency_overrides[get_current_user] = lambda: AuthenticatedUser(
        user_id="athlete-prod-001",
        email="athlete@athloniq.test",
        role="authenticated",
    )

    async with AsyncClient(
        transport=ASGITransport(app=test_app), base_url="http://test"
    ) as client:
        response = await client.post(
            "/api/v1/coaching/weekly-review",
            json={
                "context": UserCoachingContext().model_dump(),
                "today": "2026-10-19",
            },
            headers={"Authorization": "Bearer any-token"},
        )
        assert response.status_code == 400
        assert "forbidden in production" in response.text.lower()


@pytest.mark.asyncio
async def test_production_endpoint_chat_accepts_null_today() -> None:
    """POST /api/v1/coaching/chat succeeds in production when today override is omitted (computed server-side)."""
    prod_settings = Settings(
        _env_file=None,
        ENVIRONMENT="production",
        DEBUG=False,
        DEV_AUTH_BYPASS=False,
        BACKEND_CORS_ORIGINS=["https://app.athloniq.io"],
    )
    test_app = create_app(prod_settings)
    test_app.dependency_overrides[get_current_user] = lambda: AuthenticatedUser(
        user_id="athlete-prod-001",
        email="athlete@athloniq.test",
        role="authenticated",
    )

    async with AsyncClient(
        transport=ASGITransport(app=test_app), base_url="http://test"
    ) as client:
        response = await client.post(
            "/api/v1/coaching/chat",
            json={
                "message": "What should I train today?",
                "context": UserCoachingContext().model_dump(),
            },
            headers={"Authorization": "Bearer any-token"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
