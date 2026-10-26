"""AthlonIQ Phase 5 / Lane A — CORS and DEBUG Environment Configuration Tests.

Tests:
1. Settings parsing of BACKEND_CORS_ORIGINS (JSON list, comma-separated) and DEBUG from env.
2. LAN origin allowed in a CORS preflight when configured in BACKEND_CORS_ORIGINS.
3. Disallowed origin rejected in CORS preflight.
4. Wildcard '*' CORS origin strictly refused when ENVIRONMENT == 'production'.
5. Operational warning logged if DEBUG is True when ENVIRONMENT == 'production'.
"""

import logging
import pytest
from httpx import ASGITransport, AsyncClient

from app.core.config import Settings
from app.main import create_app, validate_security_configuration


def test_settings_cors_and_debug_defaults_and_parsing(monkeypatch: pytest.MonkeyPatch) -> None:
    """Verify default values and env-driven parsing for DEBUG and BACKEND_CORS_ORIGINS."""
    # 1. Default settings (no env overrides)
    default_cfg = Settings(_env_file=None)
    assert default_cfg.DEBUG is False
    assert default_cfg.BACKEND_CORS_ORIGINS == [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

    # 2. JSON list parsing from environment
    monkeypatch.setenv(
        "BACKEND_CORS_ORIGINS",
        '["http://localhost:5173", "http://192.168.29.8:5173"]',
    )
    monkeypatch.setenv("DEBUG", "true")
    custom_cfg = Settings(_env_file=None)
    assert custom_cfg.DEBUG is True
    assert custom_cfg.BACKEND_CORS_ORIGINS == [
        "http://localhost:5173",
        "http://192.168.29.8:5173",
    ]

    # 3. Comma-separated list parsing from environment
    monkeypatch.setenv(
        "BACKEND_CORS_ORIGINS",
        "http://localhost:5173, http://192.168.29.8:5173, http://tablet.lan:3000",
    )
    csv_cfg = Settings(_env_file=None)
    assert csv_cfg.BACKEND_CORS_ORIGINS == [
        "http://localhost:5173",
        "http://192.168.29.8:5173",
        "http://tablet.lan:3000",
    ]


@pytest.mark.asyncio
async def test_cors_lan_origin_allowed_preflight() -> None:
    """Verify that a configured LAN origin is allowed during a CORS OPTIONS preflight request."""
    lan_origin = "http://192.168.29.8:5173"
    custom_settings = Settings(
        _env_file=None,
        ENVIRONMENT="development",
        DEBUG=False,
        BACKEND_CORS_ORIGINS=[
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            lan_origin,
        ],
    )
    test_app = create_app(custom_settings)

    headers = {
        "Origin": lan_origin,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "authorization,content-type",
    }
    async with AsyncClient(
        transport=ASGITransport(app=test_app), base_url="http://test"
    ) as client:
        response = await client.options("/api/v1/coaching/chat", headers=headers)
        assert response.status_code == 200
        assert response.headers.get("access-control-allow-origin") == lan_origin
        assert "POST" in response.headers.get("access-control-allow-methods", "")


@pytest.mark.asyncio
async def test_cors_disallowed_origin_rejected() -> None:
    """Verify that an unlisted disallowed origin is rejected and receives no allow-origin header."""
    custom_settings = Settings(
        _env_file=None,
        ENVIRONMENT="development",
        DEBUG=False,
        BACKEND_CORS_ORIGINS=["http://localhost:5173", "http://127.0.0.1:5173"],
    )
    test_app = create_app(custom_settings)

    disallowed_origin = "http://malicious-site.example.com"
    headers = {
        "Origin": disallowed_origin,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "authorization,content-type",
    }
    async with AsyncClient(
        transport=ASGITransport(app=test_app), base_url="http://test"
    ) as client:
        response = await client.options("/api/v1/coaching/chat", headers=headers)
        # CORSMiddleware does not attach Access-Control-Allow-Origin for unauthorized origins
        assert "access-control-allow-origin" not in response.headers


def test_production_wildcard_cors_refused() -> None:
    """Verify startup strictly refuses wildcard '*' CORS origin when ENVIRONMENT == 'production'."""
    prod_wildcard_settings = Settings(
        _env_file=None,
        ENVIRONMENT="production",
        DEBUG=False,
        DEV_AUTH_BYPASS=False,
        BACKEND_CORS_ORIGINS=["*"],
    )
    with pytest.raises(RuntimeError, match="Wildcard '\\*' CORS origin is strictly forbidden"):
        validate_security_configuration(prod_wildcard_settings)

    with pytest.raises(RuntimeError, match="Wildcard '\\*' CORS origin is strictly forbidden"):
        create_app(prod_wildcard_settings)


def test_production_debug_warning_logged(caplog: pytest.LogCaptureFixture) -> None:
    """Verify startup logs an explicit security warning when DEBUG is True in production."""
    prod_debug_settings = Settings(
        _env_file=None,
        ENVIRONMENT="production",
        DEBUG=True,
        DEV_AUTH_BYPASS=False,
        BACKEND_CORS_ORIGINS=["https://app.athloniq.io"],
    )
    with caplog.at_level(logging.WARNING):
        validate_security_configuration(prod_debug_settings)
        assert any(
            "DEBUG is enabled in production environment" in record.message
            for record in caplog.records
        )
