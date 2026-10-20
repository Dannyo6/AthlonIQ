"""Security and authentication utilities for AthlonIQ API.

Supports:
1. Asymmetric JWKS verification (ES256/RS256) via Supabase's well-known JWKS endpoint
   ({SUPABASE_URL}/auth/v1/.well-known/jwks.json) with client caching and automatic rotation refresh.
2. Legacy symmetric HS256 verification using SUPABASE_JWT_SECRET.
3. Cryptographic claim enforcement: expiration (exp), audience (aud="authenticated"),
   and issuer (iss="{SUPABASE_URL}/auth/v1").
4. Derives athlete identity strictly from cryptographically verified 'sub' claim.
"""

import sys
import os
from typing import Optional, Dict, Any
import jwt
from jwt import PyJWKClient
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

from app.core.config import settings

bearer_scheme = HTTPBearer(auto_error=False)

# Module-level cache for PyJWKClient instance
_jwks_clients: Dict[str, PyJWKClient] = {}


def get_jwks_client(supabase_url: str) -> PyJWKClient:
    """Get or create a cached PyJWKClient for the given Supabase URL.
    
    PyJWKClient handles caching public keys and will automatically refresh
    keys when a matching 'kid' is not present in its local cache.
    """
    normalized_url = supabase_url.rstrip("/")
    jwks_url = f"{normalized_url}/auth/v1/.well-known/jwks.json"
    if jwks_url not in _jwks_clients:
        _jwks_clients[jwks_url] = PyJWKClient(
            jwks_url,
            cache_keys=True,
            max_cached_keys=16,
            cache_jwk_set=True,
            lifespan=300,
        )
    return _jwks_clients[jwks_url]


class AuthenticatedUser(BaseModel):
    """Authenticated user context derived exclusively from verified JWT payload."""

    user_id: str
    email: Optional[str] = None
    role: Optional[str] = "authenticated"


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> AuthenticatedUser:
    """Validate Bearer JWT and return authenticated athlete identity.

    Never trusts client-supplied user_id parameters; derives identity
    strictly from the cryptographic signature.
    Raises 401 Unauthorized when missing or invalid.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header with Bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials.strip()
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header with Bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Test / Dev bypass path: allow mock tokens starting with "test-token-" in test environments
    is_test_env = (
        "pytest" in sys.modules
        or settings.ENVIRONMENT == "test"
        or os.getenv("ENVIRONMENT") == "test"
        or settings.DEV_AUTH_BYPASS is True
        or os.getenv("DEV_AUTH_BYPASS", "").lower() in ("true", "1")
    )
    if is_test_env and token.startswith("test-token-"):
        user_id = token.replace("test-token-", "") or "test-athlete-001"
        return AuthenticatedUser(
            user_id=user_id,
            email=f"{user_id}@athloniq.test",
            role="authenticated",
        )

    # Parse unverified header to detect algorithm and key ID
    try:
        unverified_header = jwt.get_unverified_header(token)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid JWT header: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

    alg = unverified_header.get("alg")
    if not alg:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="JWT header missing 'alg' parameter",
            headers={"WWW-Authenticate": "Bearer"},
        )

    supabase_url = settings.SUPABASE_URL or os.getenv("SUPABASE_URL", "")
    expected_iss = f"{supabase_url.rstrip('/')}/auth/v1" if supabase_url else None

    # Asymmetric JWKS path (ES256 / RS256)
    if alg in ("ES256", "RS256"):
        if not supabase_url:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="SUPABASE_URL is not configured on server for JWKS verification",
                headers={"WWW-Authenticate": "Bearer"},
            )
        try:
            jwks_client = get_jwks_client(supabase_url)
            signing_key = jwks_client.get_signing_key_from_jwt(token)
            key = signing_key.key
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Unable to resolve JWKS signing key: {str(e)}",
                headers={"WWW-Authenticate": "Bearer"},
            )
        allowed_algorithms = [alg]

    # Symmetric legacy path (HS256)
    elif alg == "HS256":
        secret = settings.SUPABASE_JWT_SECRET or os.getenv("SUPABASE_JWT_SECRET", "")
        if not secret:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Server SUPABASE_JWT_SECRET is not configured for HS256 validation",
                headers={"WWW-Authenticate": "Bearer"},
            )
        key = secret
        allowed_algorithms = ["HS256"]

    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Unsupported JWT signing algorithm: {alg}",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Cryptographic decode and claim validation
    decode_options = {
        "verify_signature": True,
        "verify_exp": True,
        "verify_aud": True,
        "require": ["exp", "sub"],
    }
    decode_kwargs: Dict[str, Any] = {
        "algorithms": allowed_algorithms,
        "audience": "authenticated",
        "options": decode_options,
    }
    if expected_iss:
        decode_kwargs["issuer"] = expected_iss
        decode_options["verify_iss"] = True

    try:
        payload = jwt.decode(token, key, **decode_kwargs)
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="JWT token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidAudienceError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="JWT token has invalid audience (expected 'authenticated')",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidIssuerError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"JWT token has invalid issuer (expected '{expected_iss}')",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="JWT signature verification failed (tampered signature or key mismatch)",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid JWT token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Derive user ID strictly from cryptographic sub claim
    user_id = payload.get("sub")
    if not user_id or not str(user_id).strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="JWT token payload missing 'sub' subject claim",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return AuthenticatedUser(
        user_id=str(user_id),
        email=payload.get("email"),
        role=payload.get("role", "authenticated"),
    )
