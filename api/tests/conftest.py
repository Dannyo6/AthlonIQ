import os
from datetime import date
import pytest
from app.core.config import settings
from app.domain import coach_tools


@pytest.fixture(autouse=True)
def configure_test_auth_bypass(monkeypatch):
    """Enable dev auth bypass explicitly for test execution via monkeypatch.
    
    This replaces implicit module detection. Individual test suites (e.g. test_jwt_security)
    can explicitly override settings.DEV_AUTH_BYPASS = False or settings.ENVIRONMENT = "production"
    to verify security rejection rules.
    """
    monkeypatch.setattr(settings, "DEV_AUTH_BYPASS", True)
    monkeypatch.setattr(settings, "ENVIRONMENT", "test")


@pytest.fixture(autouse=True)
def configure_faked_date(monkeypatch):
    """Allow faking system date via FAKED_DATE / ATHLONIQ_FAKE_DATE env var for clock isolation testing."""
    faked_date_str = os.getenv("FAKED_DATE") or os.getenv("ATHLONIQ_FAKE_DATE")
    if faked_date_str:
        target_date = date.fromisoformat(faked_date_str)
        monkeypatch.setattr(coach_tools, "get_today", lambda: target_date)
