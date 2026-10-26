"""Verify live Supabase Auth ES256/RS256 token against protected FastAPI endpoints.

Ensures:
1. Rejects request without Authorization header with HTTP 401.
2. Rejects request with tampered/invalid token with HTTP 401.
3. Authenticates athlete against Supabase Auth using credentials strictly from environment.
4. FastAPI with DEV_AUTH_BYPASS=False cryptographically validates the token
   via PyJWKClient against {SUPABASE_URL}/auth/v1/.well-known/jwks.json.
5. GET /api/v1/coaching/tools returns HTTP 200.
6. POST /api/v1/coaching/readiness returns HTTP 200.

Rules:
- Must use only existing credentials from os.environ.
- Stops reading passwords from .env.local.
- If any credential is missing, prints which names are missing (never values) and exits with a NON-ZERO code.
- Non-zero exit code if credentials are missing or any check fails.
- Never prints the token or password; prints only status codes and response bodies.
"""

import json
import os
import sys
from pathlib import Path
import httpx

# Add api directory to sys.path
api_dir = Path(__file__).resolve().parent.parent / "api"
sys.path.insert(0, str(api_dir))

from fastapi.testclient import TestClient
from app.main import create_app
from app.core.config import Settings


def get_credentials():
    supabase_url = os.getenv("VITE_SUPABASE_URL") or os.getenv("SUPABASE_URL")
    publishable_key = (
        os.getenv("VITE_SUPABASE_PUBLISHABLE_KEY")
        or os.getenv("VITE_SUPABASE_ANON_KEY")
        or os.getenv("SUPABASE_ANON_KEY")
    )

    # Read web/.env.local ONLY for non-secret endpoint/key if not in environment
    # Never read passwords or user credentials from .env.local
    candidate_env_files = [
        Path(__file__).resolve().parent.parent / "web" / ".env.local",
        Path(__file__).resolve().parent.parent / ".env",
    ]
    for env_file in candidate_env_files:
        if env_file.exists():
            for line in env_file.read_text(encoding="utf-8").splitlines():
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    k = k.strip()
                    v = v.strip()
                    if not supabase_url and k in ("VITE_SUPABASE_URL", "SUPABASE_URL"):
                        supabase_url = v
                    if not publishable_key and k in (
                        "VITE_SUPABASE_PUBLISHABLE_KEY",
                        "VITE_SUPABASE_ANON_KEY",
                        "SUPABASE_ANON_KEY",
                    ):
                        publishable_key = v

    email = os.getenv("TEST_ATHLETE_A_EMAIL")
    password = os.getenv("TEST_ATHLETE_A_PASSWORD")

    missing = []
    if not supabase_url:
        missing.append("VITE_SUPABASE_URL (or SUPABASE_URL)")
    if not publishable_key:
        missing.append("VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY)")
    if not email:
        missing.append("TEST_ATHLETE_A_EMAIL")
    if not password:
        missing.append("TEST_ATHLETE_A_PASSWORD")

    if missing:
        print("ERROR: Missing required credentials in environment:", file=sys.stderr)
        for name in missing:
            print(f"  - {name}", file=sys.stderr)
        sys.exit(1)

    return supabase_url, publishable_key, email, password


def verify_hosted_token():
    supabase_url, publishable_key, email, password = get_credentials()

    print("================================================================================")
    print("ATHLONIQ HOSTED FASTAPI TOKEN VERIFICATION")
    print(f"Supabase Endpoint: {supabase_url}")
    print("================================================================================")

    # Create FastAPI app with DEV_AUTH_BYPASS=False
    app_settings = Settings(
        DEV_AUTH_BYPASS=False,
        SUPABASE_URL=supabase_url,
        ENVIRONMENT="development",
    )
    app = create_app(app_settings)
    client = TestClient(app)

    # 1. Check: No header -> expect 401
    print("\n--- 1. Testing GET /api/v1/coaching/tools (No Authorization Header) ---")
    resp_no_header = client.get("/api/v1/coaching/tools")
    print(f"Status Code: {resp_no_header.status_code}")
    print(f"Response Body: {resp_no_header.text}")
    if resp_no_header.status_code != 401:
        print(f"ERROR: Expected status 401, got {resp_no_header.status_code}", file=sys.stderr)
        sys.exit(1)

    # 2. Check: Tampered token -> expect 401
    print("\n--- 2. Testing GET /api/v1/coaching/tools (Tampered Token) ---")
    tampered_headers = {
        "Authorization": "Bearer eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.invalidpayload.tampered_signature"
    }
    resp_tampered = client.get("/api/v1/coaching/tools", headers=tampered_headers)
    print(f"Status Code: {resp_tampered.status_code}")
    print(f"Response Body: {resp_tampered.text}")
    if resp_tampered.status_code != 401:
        print(f"ERROR: Expected status 401, got {resp_tampered.status_code}", file=sys.stderr)
        sys.exit(1)

    # 3. Check: Valid token -> expect 200
    print("\n--- 3. Authenticating against Supabase Auth to obtain valid JWT ---")
    token_url = f"{supabase_url.rstrip('/')}/auth/v1/token?grant_type=password"
    headers = {
        "apikey": publishable_key,
        "Content-Type": "application/json",
    }
    payload = {"email": email, "password": password}

    try:
        resp = httpx.post(token_url, json=payload, headers=headers, timeout=15.0)
    except Exception as e:
        print(f"Network error contacting Supabase Auth: {e}", file=sys.stderr)
        sys.exit(1)

    print(f"Supabase Auth Status Code: {resp.status_code}")
    if resp.status_code != 200:
        print(f"Response Body: {resp.text}", file=sys.stderr)
        sys.exit(1)

    auth_data = resp.json()
    access_token = auth_data.get("access_token")
    if not access_token:
        print("ERROR: No access_token returned in auth response", file=sys.stderr)
        sys.exit(1)

    auth_headers = {"Authorization": f"Bearer {access_token}"}

    print("\n--- 3a. Testing GET /api/v1/coaching/tools (Valid Token) ---")
    resp_tools = client.get("/api/v1/coaching/tools", headers=auth_headers)
    print(f"Status Code: {resp_tools.status_code}")
    print(f"Response Body: {resp_tools.text}")
    if resp_tools.status_code != 200:
        print(f"ERROR: Expected status 200, got {resp_tools.status_code}", file=sys.stderr)
        sys.exit(1)

    print("\n--- 3b. Testing POST /api/v1/coaching/readiness (Valid Token) ---")
    readiness_payload = {
        "sleep_hours": 8.0,
        "sleep_quality": 4,
        "soreness": 2,
        "fatigue": 2,
        "stress": 1,
    }
    resp_readiness = client.post(
        "/api/v1/coaching/readiness", json=readiness_payload, headers=auth_headers
    )
    print(f"Status Code: {resp_readiness.status_code}")
    print(f"Response Body: {resp_readiness.text}")
    if resp_readiness.status_code != 200:
        print(f"ERROR: Expected status 200, got {resp_readiness.status_code}", file=sys.stderr)
        sys.exit(1)

    print("\n================================================================================")
    print("ALL HOSTED TOKEN VERIFICATION CHECKS PASSED (401, 401, 200)")
    print("================================================================================")
    sys.exit(0)


if __name__ == "__main__":
    verify_hosted_token()
