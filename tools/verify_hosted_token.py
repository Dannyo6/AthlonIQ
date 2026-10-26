"""Verify live Supabase Auth ES256 token against protected FastAPI endpoints.

Ensures:
1. Supabase Auth signs in athlete A.
2. Real ES256/RS256 JWT is returned.
3. FastAPI with DEV_AUTH_BYPASS=False cryptographically validates the token
   via PyJWKClient against {SUPABASE_URL}/auth/v1/.well-known/jwks.json.
4. GET /api/v1/coaching/tools returns 200 OK.
5. POST /api/v1/coaching/readiness returns 200 OK.
Never logs or prints raw JWT strings or passwords.
"""

import os
import sys
import json
import httpx
from pathlib import Path

# Add api directory to sys.path
api_dir = Path(__file__).resolve().parent.parent / "api"
sys.path.insert(0, str(api_dir))

from fastapi.testclient import TestClient
from app.main import create_app
from app.core.config import Settings


def read_env_local():
    env_local = Path(__file__).resolve().parent.parent / "web" / ".env.local"
    data = {}
    if env_local.exists():
        for line in env_local.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                data[k.strip()] = v.strip()
    return data


def verify_hosted_token():
    env_local = read_env_local()
    supabase_url = os.getenv("VITE_SUPABASE_URL") or env_local.get("VITE_SUPABASE_URL") or "https://ghxotyoiquyyowydxshb.supabase.co"
    publishable_key = os.getenv("VITE_SUPABASE_PUBLISHABLE_KEY") or env_local.get("VITE_SUPABASE_PUBLISHABLE_KEY")
    email = os.getenv("TEST_ATHLETE_A_EMAIL")
    password = os.getenv("TEST_ATHLETE_A_PASSWORD")

    print("================================================================================")
    print("ATHLONIQ HOSTED FASTAPI TOKEN VERIFICATION")
    print(f"Supabase Endpoint: {supabase_url}")
    print("================================================================================")

    if not email or not password:
        print("\n[Notice]: TEST_ATHLETE_A_EMAIL or TEST_ATHLETE_A_PASSWORD is not set in environment.")
        print("To verify live JWT against FastAPI, provide:")
        print("  $env:TEST_ATHLETE_A_EMAIL='your-athlete-email@domain.com'")
        print("  $env:TEST_ATHLETE_A_PASSWORD='your-athlete-password'")
        return False

    print(f"Authenticating as: {email}")
    token_url = f"{supabase_url.rstrip('/')}/auth/v1/token?grant_type=password"
    headers = {
        "apikey": publishable_key,
        "Content-Type": "application/json",
    }
    payload = {"email": email, "password": password}

    try:
        resp = httpx.post(token_url, json=payload, headers=headers, timeout=15.0)
    except Exception as e:
        print(f"Network error contacting Supabase Auth: {e}")
        return False

    if resp.status_code != 200:
        print(f"Supabase Auth error ({resp.status_code}): {resp.text}")
        return False

    auth_data = resp.json()
    access_token = auth_data.get("access_token")
    if not access_token:
        print(f"Error: No access_token returned in auth response: {auth_data}")
        return False

    token_type = auth_data.get("token_type", "bearer")
    user_id = auth_data.get("user", {}).get("id")
    print(f"✓ Obtained real JWT for User ID: {user_id}")
    print(f"✓ Token Type: {token_type} (length: {len(access_token)} chars, redacted)")

    # Create FastAPI app with DEV_AUTH_BYPASS=False
    app_settings = Settings(
        DEV_AUTH_BYPASS=False,
        SUPABASE_URL=supabase_url,
        ENVIRONMENT="development",
    )
    app = create_app(app_settings)
    client = TestClient(app)

    auth_headers = {"Authorization": f"Bearer {access_token}"}

    # 1. GET /api/v1/coaching/tools
    print("\n--- 1. Testing GET /api/v1/coaching/tools ---")
    resp_tools = client.get("/api/v1/coaching/tools", headers=auth_headers)
    print(f"HTTP Status: {resp_tools.status_code}")
    try:
        print(f"Response Body: {json.dumps(resp_tools.json(), indent=2)}")
    except Exception:
        print(f"Response Raw: {resp_tools.text}")

    # 2. POST /api/v1/coaching/readiness
    print("\n--- 2. Testing POST /api/v1/coaching/readiness ---")
    readiness_payload = {
        "sleep_hours": 8.0,
        "sleep_quality": 4,
        "soreness": 2,
        "fatigue": 2,
        "stress": 1,
    }
    resp_readiness = client.post("/api/v1/coaching/readiness", json=readiness_payload, headers=auth_headers)
    print(f"HTTP Status: {resp_readiness.status_code}")
    try:
        print(f"Response Body: {json.dumps(resp_readiness.json(), indent=2)}")
    except Exception:
        print(f"Response Raw: {resp_readiness.text}")

    success = (resp_tools.status_code == 200 and resp_readiness.status_code == 200)
    print("\n================================================================================")
    print(f"Live 200 OK FastAPI Token Verification: {'PASSED' if success else 'FAILED'}")
    print("================================================================================")
    return success


if __name__ == "__main__":
    verify_hosted_token()
