# AthlonIQ — Personal AI Athlete & Physique OS

> **AthlonIQ** is a high-precision Personal AI Performance & Physique Operating System engineered to synthesize strength training, endurance conditioning, nutrition science, biometric recovery, and physique optimization into a single unified intelligence loop.

---

## 🌟 Key Capabilities

- 🏋️ **Adaptive Workout & Strength Engine**: Double-progression overload engine respecting home-gym load caps (70 kg free-weights), auto-regulating load increases and tempo/reps progressions.
- 🥗 **Dynamic Macro & Energy System**: 22+ item Indian and athletic staple reference catalog (sourced from ICMR 2017 & standard food composition benchmarks), isolated photo meal estimates with auditable provider/mode metadata, and 14-day deterministic lean-bulk energy calibration.
- ⚡ **Multi-Sport Workload & Recovery**: Cumulative fatigue triangulation combining Gym Lifting, Badminton (min), and Running (km & pace MM:SS /km) with sleep, HRV, and soreness tracking.
- 🧠 **Personal AI Coach with 8 Typed Tools**: Provider-independent AI Coach operating strictly over user snapshots with medical safety red-flag escalation and offline deterministic fallback.
- 📸 **Private Progress Photo Timeline**: Secure photo logging with side-by-side comparison, weight stamps, and scientific visual-only disclaimers.
- 🔒 **Data Portability & Sovereignty**: Full JSON archive export, clean CSV spreadsheet export, and two-step permanent data wipe.

---

## 🏗️ Architecture & Technology Stack

| Layer | Stack | Key Technologies |
| :--- | :--- | :--- |
| **Frontend** | React 18, TypeScript (Strict), Vite, PWA | Tailwind CSS, Lucide Icons, TanStack Query, Obsidian/Lime/Cyan Palette |
| **Backend API** | FastAPI, Python 3.12+ / 3.14+ | Pydantic v2, PyJWKClient, Uvicorn, Pytest, HTTPX |
| **Database & Auth** | PostgreSQL, Supabase | Row Level Security (RLS) on all tables, Asymmetric ES256/RS256 JWT Auth |
| **AI Intelligence** | Google Gemini 2.5 Flash / SDK | Structured JSON schemas, 8 allowlisted tools, offline fallback with zero fabricated defaults |

---

## 📁 Repository Layout

```text
athloniq/
├── AGENTS.md                  # Workspace rules & agent instructions
├── README.md                  # Project overview (this file)
├── docs/                      # Technical documentation & design specs
│   ├── ARCHITECTURE.md        # Deep-dive system architecture
│   ├── DATABASE.md            # Schema, entities & RLS models
│   ├── SECURITY.md            # Auth, encryption, rate limiting & env checklist
│   ├── AI_DESIGN.md           # AI Coach reasoning & orchestration
│   ├── ROADMAP.md             # Multi-phase milestone roadmap
│   └── HANDOFF_STATE.md       # Audit snapshots & verification test logs
├── supabase/                  # Database migrations and seed fixtures
│   ├── migrations/            # Versioned SQL migration scripts
│   └── seed.sql               # Seed data for development
├── api/                       # FastAPI intelligence service
│   ├── app/                   # Application code (routes, domain, schemas, services)
│   └── tests/                 # Automated test suite (154 tests across 8 suites)
├── web/                       # React + TypeScript client application
│   ├── src/                   # Feature-driven UI components, state & hooks
│   └── src/test/              # Web automated test suite (75 tests across 12 files)
└── tools/                     # Verification harnesses & RLS isolation tests
    ├── test-rls.js            # PGlite automated RLS suite (279 checks)
    ├── test-hosted-rls.mjs    # Hosted Supabase multi-tenant RLS validator
    └── verify_hosted_token.py # Live PyJWKClient token verification tool
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18.0.0 or later (v20+ / v22+ recommended)
- **Python**: v3.12 or later (Python 3.14 supported)
- **Git**

### 2. Backend (FastAPI API)
```bash
cd api
python -m venv .venv

# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
# source .venv/bin/activate

pip install -r requirements.txt
pytest
uvicorn app.main:app --reload --port 8000
```
- API Documentation (Swagger UI): `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

### 3. Frontend (Vite + React)
```bash
cd web
npm install
npm test
npm run build
npm run dev
```
- Frontend application will launch at: `http://localhost:5173`

---

## 🧪 Automated Test Suites & Verification Matrix

All test counts reflect live, un-doctored terminal runs:

| Test Suite | Command | Scope & Contracts | Results |
| :--- | :--- | :--- | :--- |
| **API Pytest** (`api/`) | `pytest` | API routes, PyJWKClient JWT auth, CORS allowlists, timezone resolution, rate limits with trusted proxies, vision fallback & demo modes, coach tools, acceptance contracts | **154 passed** across 8 suites (4.03s) |
| **Web Vitest** (`web/`) | `npm test` | React components, routing, PWA caching, optimistic rollback, auth session gate, progression fallbacks, recovery slider, profile BMI, offline weekly review, null states, meal photo uploader | **75 passed** across 12 test files (11.45s) |
| **PGlite RLS Suite** (`tools/`) | `npm --prefix tools run test:rls` | PostgreSQL hermetic RLS: 18 public tables, dual-tenant isolation, storage bucket security, anti-spoofing policies | **279 checks passed** (0 failures, ~2s) |
| **Vite Production Build** (`web/`) | `npm run build` | TypeScript strict mode (`tsc`) + Vite production bundler | **0 errors** (18 chunks, 31 PWA precache entries) |
| **Hosted Supabase RLS** (`tools/`) | `npm --prefix tools run test:hosted-rls` | End-to-end multi-tenant RLS check against live hosted Supabase instance | **NOT RUN** (Requires confirmed athlete credentials in environment; see notice below) |
| **Hosted Token Verification** (`tools/`) | `python tools/verify_hosted_token.py` | PyJWKClient asymmetric ES256 verification against live JWKS | **NOT RUN** (Requires confirmed athlete credentials in environment; see notice below) |

> [!IMPORTANT] Hosted Verification Execution Policy
> Hosted Supabase RLS isolation checks (`node tools/test-hosted-rls.mjs`) and live token verification (`python tools/verify_hosted_token.py`) were run only if actual raw terminal outputs are recorded in [`docs/HANDOFF_STATE.md`](docs/HANDOFF_STATE.md). Currently, they remain marked **NOT RUN** pending live confirmed test athlete credentials (`TEST_ATHLETE_A_EMAIL` / `TEST_ATHLETE_B_EMAIL`) in the execution environment.

### Backend Test Breakdown (`api/tests/` — 154 Tests)
1. `tests/test_cors_config.py` (5 tests): Explicit origin allowlists, regex matching, rejection of wildcards in production.
2. `tests/test_health.py` (10 tests): System health probes, database connection checks, and environment status.
3. `tests/test_jwt_security.py` (12 tests): PyJWKClient asymmetric JWKS key retrieval, issuer validation, symmetric HS256 fallbacks, and dev bypass enforcement.
4. `tests/test_phase2_tracking.py` (65 tests): Food catalog search, `X-Forwarded-For` trusted proxy rate limiting, confirmed daily macro totals, running pace calculation, progressive overload rules, and weight trends.
5. `tests/test_phase3_vision.py` (26 tests): Multimodal meal analysis, Gemini live/mock metadata, empty candidate fallback on failure with `"Vision unavailable — log manually"` notice, demo sample candidates, and rejection of client `force_mode` in production.
6. `tests/test_phase4_coach.py` (16 tests): AI Coach 8 typed tools, weekly review synthesis, medical red-flag detection, and JWT authentication gating.
7. `tests/test_phase5_acceptance.py` (12 tests): End-to-end acceptance suite verifying all 12 core operational contracts.
8. `tests/test_server_today.py` (8 tests): Frozen clock independence, deterministic date calculations, and timezone fallbacks.

---

## 🌐 Production Deployment

### 1. Database Setup (Supabase)
Apply versioned migrations in chronological order from `supabase/migrations/`:
```bash
supabase db push
```

### 2. Frontend Deployment (Vercel / Netlify)
- **Root Directory**: `web`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Mandatory Environment Variables**:
  - `VITE_API_BASE_URL`: Deployed backend API origin (e.g., `https://api.athloniq.io`)
  - `VITE_SUPABASE_URL`: Hosted Supabase project URL (e.g., `https://<project-ref>.supabase.co`)
  - `VITE_SUPABASE_PUBLISHABLE_KEY`: Hosted Supabase publishable/anon key (or `VITE_SUPABASE_ANON_KEY`)

### 3. Backend Deployment (Render / Cloud Run / Railway)
- **Root Directory**: `api`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Mandatory Environment Variables**:
  - `ENVIRONMENT`: `production` (*Enforces strict security policies; rejects client test overrides such as `force_mode`*)
  - `SUPABASE_URL`: `https://<project-ref>.supabase.co` (*Required for PyJWKClient to fetch public JWKS keys from `/auth/v1/.well-known/jwks.json` and validate the token issuer `https://<project-ref>.supabase.co/auth/v1`*)
  - `BACKEND_CORS_ORIGINS`: `["https://app.athloniq.io"]` (*Must explicitly include the deployed frontend origin; wildcards are strictly prohibited*)
  - `DEBUG`: `false` (*Disables debug traces and OpenAPI documentation in production*)
  - `DEV_AUTH_BYPASS`: `false` (*Strictly requires genuine cryptographic JWT verification against Supabase Auth*)
  - `GEMINI_API_KEY`: Production Google Gemini API key
  - `TRUSTED_PROXIES`: `["127.0.0.1", "::1"]` (*Configurable proxy IP allowlist for secure `X-Forwarded-For` rate limiting*)

For full security specifications and pre-deployment checklists, see [`docs/SECURITY.md`](docs/SECURITY.md).

---

## 📱 Progressive Web App (PWA) & Safe Caching Architecture

AthlonIQ operates as a secure, installable Progressive Web App engineered under a strict **Zero-Private-Data Caching Policy**.

### 1. What is Precached
Only the immutable, compiled application shell is precached by Workbox:
- Static HTML entrypoint (`dist/index.html`)
- Compiled JavaScript & CSS bundles (`dist/assets/`)
- Public brand typography, logos, and PWA icons (`pwa-192x192.png`, `pwa-512x512.png`, `pwa-maskable-512x512.png`, `apple-touch-icon.png`, `athloniq-icon.svg`)
- Web App Manifest (`dist/manifest.webmanifest`)

### 2. What is NEVER Cached (`NetworkOnly` Enforced)
To guarantee athlete privacy and prevent leakage of personal biometric records, the following routes and URL patterns are explicitly configured with `NetworkOnly` and denylisted from any runtime storage or navigation fallback:
- **Supabase Cloud (`*.supabase.co`)**: All Auth tokens, session refreshes, PostgREST database queries, and storage objects.
- **Backend API (`/api/*`, `/health`, port 8000)**: All deterministic calculation endpoints, health probes, and Gemini AI inference turn routes.
- **Signed & Expiring URLs**: Any query containing `token=`, `Signature=`, `X-Amz-Signature=`, or `sig=`.
- **Private Athlete Media**: All requests targeting `meal-photos`, `progress-photos`, `athlete_progress_photos`, or `meal_photos` storage buckets.

### 3. In-Memory Query Cache & Sign-Out Invalidation
- Athlete data queries reside strictly in volatile heap memory managed by TanStack Query.
- Triggering **Sign Out** immediately executes `queryClient.clear()`, wiping all in-memory query snapshots and returning the browser to the unauthenticated session gate.

### 4. Offline UX & Transparency
- When network disconnects, a high-contrast persistent banner alerts the athlete.
- Network-dependent intelligence modules (**AI Performance Coach**, **Vision Meal Recognition**) switch to an informative read-only state.
- **Explicit Guarantee**: AthlonIQ never simulates or promises offline meal syncing or offline generative AI.
