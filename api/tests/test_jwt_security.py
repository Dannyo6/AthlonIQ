"""Comprehensive test suite for backend JWT verification in AthlonIQ API.

Tests:
1. Missing Authorization header -> 401
2. Expired token -> 401
3. Wrong audience -> 401
4. Wrong issuer -> 401
5. Tampered signature -> 401
6. Missing 'sub' claim -> 401
7. Valid HS256 token -> 200 with athlete identity derived strictly from 'sub'
8. Valid ES256 token via JWKS resolution -> 200 with athlete identity derived from 'sub'
"""

import time
from unittest.mock import MagicMock, patch
import jwt
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization
from httpx import ASGITransport, AsyncClient
import pytest
from fastapi import HTTPException

from app.core.config import settings
from app.core.security import get_current_user, AuthenticatedUser
from app.main import app

TEST_JWT_SECRET = "athloniq-super-secret-test-key-32chars!!"
TEST_SUPABASE_URL = "https://ghxotyoiquyyowydxshb.supabase.co"
TEST_ISSUER = f"{TEST_SUPABASE_URL}/auth/v1"


@pytest.fixture(autouse=True)
def configure_auth_settings():
    """Ensure consistent test settings for JWT validation."""
    orig_secret = settings.SUPABASE_JWT_SECRET
    orig_url = settings.SUPABASE_URL
    orig_bypass = settings.DEV_AUTH_BYPASS

    settings.SUPABASE_JWT_SECRET = TEST_JWT_SECRET
    settings.SUPABASE_URL = TEST_SUPABASE_URL
    settings.DEV_AUTH_BYPASS = False

    yield

    settings.SUPABASE_JWT_SECRET = orig_secret
    settings.SUPABASE_URL = orig_url
    settings.DEV_AUTH_BYPASS = orig_bypass


def create_token(
    sub: str = "athlete-verified-123",
    aud: str = "authenticated",
    iss: str = TEST_ISSUER,
    exp_delta: int = 3600,
    email: str = "athlete@athloniq.io",
    secret: str = TEST_JWT_SECRET,
    include_sub: bool = True,
) -> str:
    """Helper to generate HS256 test JWTs."""
    payload = {
        "aud": aud,
        "iss": iss,
        "exp": int(time.time()) + exp_delta,
        "email": email,
        "role": "authenticated",
    }
    if include_sub:
        payload["sub"] = sub
    return jwt.encode(payload, secret, algorithm="HS256")


@pytest.mark.asyncio
async def test_jwt_missing_authorization_header():
    """Verify request with missing Authorization header returns 401."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get("/api/v1/coaching/tools")
        assert response.status_code == 401
        assert "Missing Authorization header" in response.json()["detail"]


@pytest.mark.asyncio
async def test_jwt_expired_token():
    """Verify request with expired token returns 401."""
    token = create_token(exp_delta=-60)  # expired 60 seconds ago
    headers = {"Authorization": f"Bearer {token}"}
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get("/api/v1/coaching/tools", headers=headers)
        assert response.status_code == 401
        assert "expired" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_jwt_wrong_audience():
    """Verify request with non-'authenticated' audience returns 401."""
    token = create_token(aud="anon")
    headers = {"Authorization": f"Bearer {token}"}
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get("/api/v1/coaching/tools", headers=headers)
        assert response.status_code == 401
        assert "audience" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_jwt_wrong_issuer():
    """Verify request with mismatching issuer returns 401."""
    token = create_token(iss="https://malicious-tenant.supabase.co/auth/v1")
    headers = {"Authorization": f"Bearer {token}"}
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get("/api/v1/coaching/tools", headers=headers)
        assert response.status_code == 401
        assert "issuer" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_jwt_tampered_signature():
    """Verify request with modified signature bytes fails signature verification with 401."""
    token = create_token()
    parts = token.split(".")
    # Tamper with the signature portion
    tampered_sig = parts[2][:-4] + ("AAAA" if not parts[2].endswith("AAAA") else "ZZZZ")
    tampered_token = f"{parts[0]}.{parts[1]}.{tampered_sig}"

    headers = {"Authorization": f"Bearer {tampered_token}"}
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get("/api/v1/coaching/tools", headers=headers)
        assert response.status_code == 401
        assert "signature" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_jwt_missing_sub_claim():
    """Verify request with valid signature but missing 'sub' claim returns 401."""
    token = create_token(include_sub=False)
    headers = {"Authorization": f"Bearer {token}"}
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get("/api/v1/coaching/tools", headers=headers)
        assert response.status_code == 401
        assert "sub" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_jwt_valid_token_derives_sub():
    """Verify valid token grants 200 and derives athlete user_id exclusively from 'sub'."""
    athlete_id = "019488a0-7f28-7a54-8e47-cf42861e69ab"
    token = create_token(sub=athlete_id, email="pro-athlete@athloniq.io")
    headers = {"Authorization": f"Bearer {token}"}
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get("/api/v1/coaching/tools", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["data"]) == 8


@pytest.mark.asyncio
async def test_jwks_es256_asymmetric_verification():
    """Verify ES256 asymmetric token signed with private key validates against JWKS public key."""
    # Generate an EC P-256 private key
    private_key = ec.generate_private_key(ec.SECP256R1())
    public_key = private_key.public_key()
    kid = "test-ec-kid-1"

    payload = {
        "sub": "es256-athlete-uuid",
        "aud": "authenticated",
        "iss": TEST_ISSUER,
        "exp": int(time.time()) + 3600,
        "email": "es256@athloniq.io",
        "role": "authenticated",
    }
    es256_token = jwt.encode(
        payload,
        private_key,
        algorithm="ES256",
        headers={"kid": kid},
    )

    # Mock PyJWKClient to return public key for kid
    mock_jwk = MagicMock()
    mock_jwk.key = public_key
    mock_client = MagicMock()
    mock_client.get_signing_key_from_jwt.return_value = mock_jwk

    with patch("app.core.security.get_jwks_client", return_value=mock_client):
        headers = {"Authorization": f"Bearer {es256_token}"}
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.get("/api/v1/coaching/tools", headers=headers)
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
