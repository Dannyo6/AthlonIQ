"""Pytest configuration and global fixtures for AthlonIQ API test suite."""

import pytest
from app.core.config import settings


@pytest.fixture(autouse=True)
def configure_test_auth_bypass(monkeypatch):
    """Enable dev auth bypass explicitly for test execution via monkeypatch.
    
    This replaces implicit module detection. Individual test suites (e.g. test_jwt_security)
    can explicitly override settings.DEV_AUTH_BYPASS = False or settings.ENVIRONMENT = "production"
    to verify security rejection rules.
    """
    monkeypatch.setattr(settings, "DEV_AUTH_BYPASS", True)
    monkeypatch.setattr(settings, "ENVIRONMENT", "test")
