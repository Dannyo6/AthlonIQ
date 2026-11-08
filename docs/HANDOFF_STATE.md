# AthlonIQ — Handoff State & Verification Snapshot

**Timestamp**: 2026-11-08 16:35 IST  
**Project**: AthlonIQ (Personal AI Performance & Physique OS)  
**Hosted Supabase Reference**: `ghxotyoiquyyowydxshb`  
**API Auth**: FastAPI with PyJWKClient against Supabase Auth JWKS (`https://ghxotyoiquyyowydxshb.supabase.co/auth/v1/.well-known/jwks.json`)  
**Current Branch**: `main`  
**Node Version**: `v22.23.4` (Node 22 LTS pinned via `.nvmrc`)  

---

## 1. Git State & Recent Commit Log

### Recent Commits (`git log --oneline -n 5`)
```text
f353b4a UI-3 — First-Run Onboarding Flow & Equipment-Confirmation Gate (390px Mobile-First)
bb12008 feat(web): restructure Today for mobile with quick actions and progressive disclosure
1f49f70 feat(web): restructure Today for mobile with quick actions and progressive disclosure
c865914 refactor(web): replace arbitrary hex classes with brand tokens
2cdb248 fix(ci): pin Node 22 via .nvmrc; jsdom 30 requires 22.22.2 or later
```

### Current Working Tree (`git status -s`)
```text
 M docs/HANDOFF_STATE.md
 M web/src/components/ui/Badge.tsx
 M web/src/components/ui/Button.tsx
 M web/src/features/activities/ActivitiesView.tsx
 M web/src/features/auth/SignInView.tsx
 M web/src/features/coach/CoachView.tsx
 M web/src/features/nutrition/NutritionView.tsx
 M web/src/features/nutrition/components/MealPhotoUploader.tsx
 M web/src/features/progress/ProgressView.tsx
 M web/src/features/pwa/PwaComponents.tsx
 M web/src/features/recovery/RecoveryView.tsx
 M web/src/test/routes-navigation.test.tsx
 M web/src/test/tailwind-tokens.test.ts
```
*(Zero unapproved agent commits. All working tree changes inspected without auto-commit).*

---

## 2. Test Execution Matrix (Backed by Raw Terminal Output)

| Test Suite | Command | Scope | Raw Result | Duration |
| :--- | :--- | :--- | :--- | :--- |
| **Pytest** (`api/`) | `api\.venv\Scripts\python.exe -m pytest -q` | API routes, JWT security, CORS, timezone calculation, production override rejection, biometrics, vision fallback & demo modes, coach tools, acceptance contracts | **154 passed**, 2 warnings | 5.20s |
| **Vitest** (`web/`) | `npx -y node@22 ... test` | Full client test suite across 16 files: routing, PWA caching, optimistic rollback, auth gate, progression fallbacks, recovery slider, profile live BMI, offline weekly review, Lane B3 honest null states, MealPhotoUploader, UI-2 Today 390px, UI-3 Onboarding & Equipment Gate, and UI-4 Full-App Theme Token & Zero-Hex Enforcement | **107 passed** (16 files) | 23.82s |
| **Vite Production Build** (`web/`) | `npx -y node@22 ... run build` | TypeScript strict mode (`tsc`) + Vite bundler (with `web/.env.local` absent) | **0 errors** (18 chunks generated, PWA precache 31 entries) | 4.46s |
| **PGlite RLS Suite** (`tools/`) | `npm --prefix tools run test:rls` | PostgreSQL hermetic RLS: 18 tables, dual tenant isolation, storage buckets, anti-spoofing | **279 checks passed** (0 failures) | ~3s |
| **Secrets Scanner** (`tools/`) | `npm run scan:secrets` | Scans `git ls-files` for `sb_secret_`, JWT-like strings, service role keys, and `.env*` files other than `.env.example` | **Clean: 0 violations** across 159 tracked files | <3s |
| **Secret Scanner Unit Test** (`tools/`) | `npm run test:scan` | Temporary git repo unit verification with planted secret fixtures | **Clean: 2 tests passed** (0 violations) | ~2s |
| **Hosted Supabase RLS** (`tools/`) | `node tools/test-hosted-rls.mjs` | End-to-end multi-tenant check against live hosted Supabase (17 tables, 2 buckets) | **NOT RUN** (Requires confirmed athlete credentials in environment) | — |
| **Hosted Token Verification** (`tools/`) | `python tools/verify_hosted_token.py` | PyJWKClient asymmetric ES256 verification against live JWKS (401, 401, 200) | **NOT RUN** (Requires confirmed athlete credentials in environment) | — |

---

## 3. Raw Execution Outputs

### A. Git Status (`git status -s`)
```text
 M docs/HANDOFF_STATE.md
 M web/src/components/ui/Badge.tsx
 M web/src/components/ui/Button.tsx
 M web/src/features/activities/ActivitiesView.tsx
 M web/src/features/auth/SignInView.tsx
 M web/src/features/coach/CoachView.tsx
 M web/src/features/nutrition/NutritionView.tsx
 M web/src/features/nutrition/components/MealPhotoUploader.tsx
 M web/src/features/progress/ProgressView.tsx
 M web/src/features/pwa/PwaComponents.tsx
 M web/src/features/recovery/RecoveryView.tsx
 M web/src/test/routes-navigation.test.tsx
 M web/src/test/tailwind-tokens.test.ts
```

### B. Git Log (`git log --oneline -n 5`)
```text
f353b4a UI-3 — First-Run Onboarding Flow & Equipment-Confirmation Gate (390px Mobile-First)
bb12008 feat(web): restructure Today for mobile with quick actions and progressive disclosure
1f49f70 feat(web): restructure Today for mobile with quick actions and progressive disclosure
c865914 refactor(web): replace arbitrary hex classes with brand tokens
2cdb248 fix(ci): pin Node 22 via .nvmrc; jsdom 30 requires 22.22.2 or later
```

### C. Pytest Output (`api/`)
```text
........................................................................ [ 46%]
........................................................................ [ 93%]
..........                                                               [100%]
============================== warnings summary ===============================
api\.venv\Lib\site-packages\google\genai\types.py:42
  C:\Users\vijay\OneDrive\Documents\GitHub\AthlonIQ\api\.venv\Lib\site-packages\google\genai\types.py:42: DeprecationWarning: '_UnionGenericAlias' is deprecated and slated for removal in Python 3.17
    VersionedUnionType = Union[builtin_types.UnionType, _UnionGenericAlias]

api\.venv\Lib\site-packages\fastapi\testclient.py:1
  C:\Users\vijay\OneDrive\Documents\GitHub\AthlonIQ\api\.venv\Lib\site-packages\fastapi\testclient.py:1: StarletteDeprecationWarning: Using `httpx` with `starlette.testclient` is deprecated; install `httpx2` instead.
    from starlette.testclient import TestClient as TestClient  # noqa

-- Docs: https://docs.pytest.org/en/stable/how-to/capture-warnings.html
154 passed, 2 warnings in 5.20s
```

### D. Vitest Output (`web/`)
```text
> athloniq-web@0.1.0 test
> vitest run


 RUN  v2.1.9 C:/Users/vijay/OneDrive/Documents/GitHub/AthlonIQ/web

 ✓ src/test/pwa-caching.test.ts (8 tests) 32ms
 ✓ src/test/weekly-consistency.test.ts (15 tests) 232ms
 ✓ src/test/repo-zod.test.ts (9 tests) 27ms
 ✓ src/test/optimistic-rollback.test.tsx (2 tests) 280ms
 ✓ src/test/signout-isolation.test.tsx (1 test) 345ms
   ✓ Sign-Out and Cross-Athlete State Isolation > resets all in-memory athlete state on sign out and prevents leakage when signing in as User B 344ms
 ✓ src/test/meal-photo-uploader.test.tsx (16 tests) 2457ms
   ✓ Lane B4: MealPhotoUploader Provider & Mode Handling > MealPhotoUploader UI badge updates from API result > displays live provider and mode when API returns gemini/live 314ms
   ✓ Lane B4: MealPhotoUploader Provider & Mode Handling > Lane B5: Vision Fallback, Demo Labeling & Live Confirmation > live shows candidates needing confirmation (ai_estimated until the user confirms) 1250ms
 ✓ src/test/lane-b2-features.test.tsx (4 tests) 2435ms
   ✓ RecoveryView Stress Slider & Null State > initializes stress state to null, displays 'Not set', and submits stress: null when untouched 1064ms
   ✓ RecoveryView Stress Slider & Null State > sends stress value when user touches slider and supports clearing back to 'Not set' 430ms
   ✓ ProfileView Live BMI Validation > shows 'Enter height and weight' when height or weight is empty, never a BMI from seed values 357ms
   ✓ ProfileView Live BMI Validation > calculates live BMI when valid height and weight are entered, and reverts to 'Enter height and weight' if cleared 582ms
 ✓ src/test/onboarding-equipment-gate.test.tsx (4 tests) 3007ms
   ✓ UI-3: First-Run Onboarding Flow & Equipment-Confirmation Gate > navigating to /profile?step=equipment opens Step 3 and displays 'Not set' for null limits and '70 kg' for free_weights_70kg 2080ms
   ✓ UI-3: First-Run Onboarding Flow & Equipment-Confirmation Gate > clicking 'Confirm All Home Gym Equipment' marks equipment confirmed without fabricating non-null increments 628ms
 ✓ src/test/today-dashboard-ui2.test.tsx (6 tests) 3369ms
   ✓ UI-2: Today Dashboard Screen & Components (390px spec) > renders quick-action links with correct href destinations and touch target classes 1779ms
   ✓ UI-2: Today Dashboard Screen & Components (390px spec) > null calorie target displays fallback message and strictly hides kcal ratios 462ms
   ✓ UI-2: Today Dashboard Screen & Components (390px spec) > greeting uses profile name only when set, falling back to clean greeting without null 360ms
 ✓ src/test/lane-b3.test.tsx (8 tests) 3378ms
   ✓ Lane B3 Requirements Suite > Item 2: Readiness widget and Today card show 'No check-in yet' when unlogged > Today card renders 'No check-in yet' and link when hasTodayCheckIn is false 1550ms
   ✓ Lane B3 Requirements Suite > Item 2: Readiness widget and Today card show 'No check-in yet' when unlogged > Sidebar readiness widget renders 'No check-in yet' and link when hasTodayCheckIn is false 1292ms
 ✓ src/test/routes-navigation.test.tsx (15 tests) 6882ms
   ✓ AthlonIQ Routing, Code Splitting & Unsaved Guard > renders /today view with Today Dashboard heading 1013ms
   ✓ AthlonIQ Routing, Code Splitting & Unsaved Guard > redirects '/' root path to '/today' 2474ms
   ✓ AthlonIQ Routing, Code Splitting & Unsaved Guard > renders /nutrition view directly 1228ms
   ✓ AthlonIQ Routing, Code Splitting & Unsaved Guard > renders /workouts view directly 567ms
   ✓ AthlonIQ Routing, Code Splitting & Unsaved Guard > renders designed 404 page for unknown paths with link to /today 531ms
 ✓ src/test/progression-fallbacks.test.ts (9 tests) 4ms
 ✓ src/test/legacy-import.test.ts (2 tests) 6ms
 ✓ src/test/tailwind-tokens.test.ts (3 tests) 84ms
 ✓ src/test/coach-weekly-review-offline.test.tsx (2 tests) 1309ms
   ✓ CoachView Weekly Review Offline Catch & Retry > shows 'Weekly review needs a connection' and retry button on fetch failure without synthesized values 971ms
   ✓ CoachView Weekly Review Offline Catch & Retry > retries fetching weekly review when retry button is clicked 336ms
 ✓ src/test/auth-gate.test.tsx (3 tests) 572ms
   ✓ Application Session Gate > gates application and renders SignInView when athlete is unauthenticated 321ms

 Test Files  16 passed (16)
      Tests  107 passed (107)
   Start at  16:31:05
   Duration  23.82s (transform 12.51s, setup 18.14s, collect 38.86s, tests 24.42s, environment 104.62s, prepare 10.39s)
```

### E. Web Production Build (`web/`)
```text
> athloniq-web@0.1.0 build
> tsc && vite build

vite v5.4.21 building for production...
transforming...
✓ 1742 modules transformed.
rendering chunks...
computing gzip size...
dist/manifest.webmanifest                          0.59 kB
dist/index.html                                    2.20 kB │ gzip:  0.95 kB
dist/assets/index-B0gfO29p.css                    50.71 kB │ gzip:  8.77 kB
dist/assets/Card-HnRmJ3Pj.js                       1.97 kB │ gzip:  0.79 kB
dist/assets/workbox-window.prod.es5-BqEJf4Xk.js    5.71 kB │ gzip:  2.34 kB
dist/assets/RecoveryView-FU5fyeEp.js              11.01 kB │ gzip:  3.19 kB
dist/assets/ActivitiesView-KV-JAi0g.js            13.48 kB │ gzip:  3.46 kB
dist/assets/WorkoutsView-B_i1odA6.js              21.37 kB │ gzip:  5.72 kB
dist/assets/vendor-icons-C8Lldopg.js              28.97 kB │ gzip:  5.82 kB
dist/assets/CoachView-BQDe0DDr.js                 29.44 kB │ gzip:  7.53 kB
dist/assets/ProgressView-DH2rkR5Q.js              31.95 kB │ gzip:  6.83 kB
dist/assets/vendor-query-DG3adNQi.js              36.35 kB │ gzip: 11.32 kB
dist/assets/NutritionView-DxCeRUdf.js             40.35 kB │ gzip:  9.61 kB
dist/assets/DashboardView-CxXq_C51.js             43.14 kB │ gzip:  9.27 kB
dist/assets/ProfileView-CtiwXIK9.js               77.58 kB │ gzip: 21.73 kB
dist/assets/vendor-router-C0CbzL8b.js            173.50 kB │ gzip: 57.21 kB
dist/assets/index-DjPYnZHD.js                    204.42 kB │ gzip: 53.96 kB
dist/assets/vendor-supabase-f4bNl52y.js          227.07 kB │ gzip: 58.98 kB
✓ built in 4.46s

PWA v2.0.0
mode      generateSW
precache  31 entries (1237.81 KiB)
files generated
  dist/sw.js
  dist/workbox-98f7a950.js
```

### F. PGlite Hermetic RLS Suite Output (`tools/`)
```text
> athloniq-tools@1.0.0 test:rls
> node test-rls.js

================================================================
       AthlonIQ Automated RLS & Schema Isolation Suite          
================================================================

1. Applying Migrations in Order:
  ✓ Applied 20261017000001_athloniq_init.sql
  ✓ Applied 20261017000002_phase2_tracking.sql
  ✓ Applied 20261019000003_phase4_coach_and_reviews.sql
  ✓ Applied seed.sql (Global reference exercises)

2. Auditing Public Tables for RLS & Policy Completeness:
  Found 18 tables in public schema.
  ✓ activity_sessions           : RLS ENABLED (4 policies: SELECT, INSERT, UPDATE, DELETE)
  ✓ body_metrics                : RLS ENABLED (4 policies: SELECT, INSERT, UPDATE, DELETE)
  ✓ coach_conversations         : RLS ENABLED (4 policies: SELECT, INSERT, UPDATE, DELETE)
  ✓ coach_messages              : RLS ENABLED (4 policies: SELECT, INSERT, UPDATE, DELETE)
  ✓ custom_foods                : RLS ENABLED (4 policies: SELECT, INSERT, UPDATE, DELETE)
  ✓ exercise_sets               : RLS ENABLED (4 policies: SELECT, INSERT, UPDATE, DELETE)
  ✓ exercises                   : RLS ENABLED (4 policies: SELECT, INSERT, UPDATE, DELETE)
  ✓ food_entries                : RLS ENABLED (4 policies: SELECT, INSERT, UPDATE, DELETE)
  ✓ profiles                    : RLS ENABLED (4 policies: SELECT, INSERT, UPDATE, DELETE)
  ✓ progress_photos             : RLS ENABLED (4 policies: SELECT, INSERT, UPDATE, DELETE)
  ✓ recovery_logs               : RLS ENABLED (4 policies: SELECT, INSERT, UPDATE, DELETE)
  ✓ user_equipment              : RLS ENABLED (4 policies: SELECT, INSERT, UPDATE, DELETE)
  ✓ user_goals                  : RLS ENABLED (4 policies: SELECT, INSERT, UPDATE, DELETE)
  ✓ user_preferences            : RLS ENABLED (4 policies: SELECT, INSERT, UPDATE, DELETE)
  ✓ weekly_reports              : RLS ENABLED (4 policies: SELECT, INSERT, UPDATE, DELETE)
  ✓ workout_sessions            : RLS ENABLED (4 policies: SELECT, INSERT, UPDATE, DELETE)
  ✓ workout_template_exercises  : RLS ENABLED (4 policies: SELECT, INSERT, UPDATE, DELETE)
  ✓ workout_templates           : RLS ENABLED (4 policies: SELECT, INSERT, UPDATE, DELETE)

3. Provisioning Isolated Athletes in auth.users:
  ✓ Created Athlete A (11111111-1111-4111-a111-111111111111)
  ✓ Created Athlete B (22222222-2222-4222-a222-222222222222)
  ✓ Seeded equipment verified: max_load_kg/min_increment_kg NULL except 70kg free-weights, all is_confirmed=false
  ✓ Signup trigger verified: NULL full_name preserved without fallback, provenance-safe baselines intact
  ✓ REVOKE verified: direct execution of handle_new_athlete_signup by authenticated role is blocked

4. Populating Private Dataset for Athlete B:
  ✓ Inserted records for Athlete B across all tables and private storage.

5. Testing Athlete A Cross-Tenant Isolation (Anti-Tampering & Anti-Leakage):
  ✓ profiles                    : SELECT blocked (0 rows), UPDATE blocked (0 affected), DELETE blocked (0 affected)
  ✓ user_equipment              : SELECT blocked (0 rows), UPDATE blocked (0 affected), DELETE blocked (0 affected)
  ✓ user_goals                  : SELECT blocked (0 rows), UPDATE blocked (0 affected), DELETE blocked (0 affected)
  ✓ user_preferences            : SELECT blocked (0 rows), UPDATE blocked (0 affected), DELETE blocked (0 affected)
  ✓ custom_foods                : SELECT blocked (0 rows), UPDATE blocked (0 affected), DELETE blocked (0 affected)
  ✓ food_entries                : SELECT blocked (0 rows), UPDATE blocked (0 affected), DELETE blocked (0 affected)
  ✓ workout_templates           : SELECT blocked (0 rows), UPDATE blocked (0 affected), DELETE blocked (0 affected)
  ✓ workout_template_exercises  : SELECT blocked (0 rows), UPDATE blocked (0 affected), DELETE blocked (0 affected)
  ✓ workout_sessions            : SELECT blocked (0 rows), UPDATE blocked (0 affected), DELETE blocked (0 affected)
  ✓ exercise_sets               : SELECT blocked (0 rows), UPDATE blocked (0 affected), DELETE blocked (0 affected)
  ✓ activity_sessions           : SELECT blocked (0 rows), UPDATE blocked (0 affected), DELETE blocked (0 affected)
  ✓ body_metrics                : SELECT blocked (0 rows), UPDATE blocked (0 affected), DELETE blocked (0 affected)
  ✓ recovery_logs               : SELECT blocked (0 rows), UPDATE blocked (0 affected), DELETE blocked (0 affected)
  ✓ coach_conversations         : SELECT blocked (0 rows), UPDATE blocked (0 affected), DELETE blocked (0 affected)
  ✓ coach_messages              : SELECT blocked (0 rows), UPDATE blocked (0 affected), DELETE blocked (0 affected)
  ✓ weekly_reports              : SELECT blocked (0 rows), UPDATE blocked (0 affected), DELETE blocked (0 affected)
  ✓ progress_photos             : SELECT blocked (0 rows), UPDATE blocked (0 affected), DELETE blocked (0 affected)

6. Testing Spoofed Foreign Key Inserts (User A inserting with User B's user_id):
  ✓ Spoofed INSERT on custom_foods BLOCKED by RLS WITH CHECK
  ✓ Spoofed INSERT on workout_templates BLOCKED by RLS WITH CHECK
  ✓ Spoofed INSERT on workout_template_exercises BLOCKED by RLS WITH CHECK
  ✓ Spoofed INSERT on exercise_sets BLOCKED by RLS WITH CHECK
  ✓ Spoofed INSERT on coach_messages BLOCKED by RLS WITH CHECK
  ✓ Spoofed INSERT on recovery_logs BLOCKED by RLS WITH CHECK

7. Testing Exercise Library Permissions:
  ✓ Global reference exercise readable by authenticated Athlete A
  ✓ Custom exercise created by Athlete B is HIDDEN from Athlete A

8. Testing Storage Object Isolation:
  ✓ Athlete B storage object is INVISIBLE to Athlete A
  ✓ Cross-tenant storage upload BLOCKED by folder-name RLS check

9. Testing Anonymous (Unauthenticated) Access Rejection:
  ✓ Role 'anon' read query returned 0 rows across all 17 public tables
  ✓ Role 'anon' storage query returned 0 rows
  ✓ Role 'anon' write attempts REJECTED by RLS

================================================================
  ALL 279 RLS & ISOLATION CHECKS PASSED PERFECTLY! (0 failures)
================================================================
```

### G. Secrets Scanner Output (`scan:secrets`)
```text
> scan:secrets
> node tools/scan-secrets.mjs

Secrets scan clean: 0 violations found across 159 tracked files.
```

### H. Secret Scanner Unit Verification (`test:scan`)
```text
> test:scan
> node tools/test-scan-secrets.mjs

--- Starting scan-secrets unit verification ---
✓ Test 1 Passed: Clean repo exits 0 and .env.example is permitted.
✓ Test 2 Passed: Dirty repo exits 1, prints file:line only, and never leaks secret values.
--- All scan-secrets tests passed successfully ---
```

### I. Hosted Supabase RLS Execution (`tools/test-hosted-rls.mjs`)
**Status: NOT RUN** (Awaiting real athlete credentials in environment)

Both throwaway signup paths and password reading from `.env.local` have been completely removed. The script strictly requires pre-existing verified credentials from `process.env`:
- `TEST_ATHLETE_A_EMAIL`
- `TEST_ATHLETE_A_PASSWORD`
- `TEST_ATHLETE_B_EMAIL`
- `TEST_ATHLETE_B_PASSWORD`

Raw terminal execution without credentials (enforces NON-ZERO exit):
```text
PS C:\Users\vijay\OneDrive\Documents\GitHub\AthlonIQ> node tools/test-hosted-rls.mjs
================================================================================
ATHLONIQ HOSTED RLS & MULTI-TENANT ISOLATION VERIFICATION
Endpoint: https://ghxotyoiquyyowydxshb.supabase.co
================================================================================
Authenticating Athlete Alpha: rls-test-a@athloniq.local
Authenticating Athlete Bravo: rls-test-b@athloniq.local

[RLS Verification Error]: Authentication failed for rls-test-a@athloniq.local: Invalid login credentials
Assertion failed: !(handle->flags & UV_HANDLE_CLOSING), file src\win\async.c, line 76
[Exit Code: 1]
```
*Full live run against hosted Supabase marked as NOT RUN until real athlete credentials are provided in the environment.*

### J. Live FastAPI Token Verification Tool (`tools/verify_hosted_token.py`)
**Status: NOT RUN** (Awaiting real athlete credentials in environment for positive 200 OK)

Enforces strict environment-only credentials, never reads passwords from `.env.local`, never prints raw tokens or passwords, and prints only status codes and response bodies. Requires 3 distinct checks:
1. No header -> expected 401
2. Tampered token -> expected 401
3. Valid token -> expected 200 (GET `/api/v1/coaching/tools` and POST `/api/v1/coaching/readiness`)

Raw terminal execution without credentials (enforces NON-ZERO exit):
```text
PS C:\Users\vijay\OneDrive\Documents\GitHub\AthlonIQ> .\api\.venv\Scripts\python.exe tools\verify_hosted_token.py
C:\Users\vijay\OneDrive\Documents\GitHub\AthlonIQ\api\.venv\Lib\site-packages\fastapi\testclient.py:1: StarletteDeprecationWarning: Using `httpx` with `starlette.testclient` is deprecated; install `httpx2` instead.
  from starlette.testclient import TestClient as TestClient  # noqa
Response Body: {"code":400,"error_code":"invalid_credentials","msg":"Invalid login credentials"}
================================================================================
ATHLONIQ HOSTED FASTAPI TOKEN VERIFICATION
Supabase Endpoint: https://ghxotyoiquyyowydxshb.supabase.co
================================================================================

--- 1. Testing GET /api/v1/coaching/tools (No Authorization Header) ---
Status Code: 401
Response Body: {"detail":"Missing Authorization header with Bearer token"}

--- 2. Testing GET /api/v1/coaching/tools (Tampered Token) ---
Status Code: 401
Response Body: {"detail":"Unable to resolve JWKS signing key: The specified key was not found in the JWKS"}

--- 3. Authenticating against Supabase Auth to obtain valid JWT ---
Supabase Auth Status Code: 400
[Exit Code: 1]
```
*Positive 200 OK check marked as NOT RUN until real athlete credentials are provided in the environment.*

---

## 4. Completed Scope Summary

### 1. Full-App Theme Token & Canonical Palette Enforcement (UI-1 & UI-4)
- **Zero Arbitrary `[#hex]` Classes**: Every remaining one-off hex color in `CoachView.tsx`, `MealPhotoUploader.tsx`, `NutritionView.tsx`, and `Button.tsx` was replaced with canonical design tokens (`athloniq-lime`, `athloniq-surface`, `athloniq-card`, `athloniq-border-alt`, etc.).
- **Zero Default `lime-*` Classes**: All legacy Tailwind lime classes (`lime-300`, `lime-400`, `lime-500`) in `Badge.tsx`, `SignInView.tsx`, `CoachView.tsx`, `NutritionView.tsx`, and `PwaComponents.tsx` were replaced with `athloniq-lime`, `athloniq-lime-hover`, and theme opacity variants (`athloniq-lime/10`, `athloniq-lime/20`, etc.).
- **Automated Vitest Token Gate**: Expanded `web/src/test/tailwind-tokens.test.ts` to scan all `.tsx` components under `web/src/features/`, `web/src/components/`, and `web/src/app/`, asserting zero arbitrary `[#hex]` classes and zero default `lime-*` classes anywhere in the UI tree.

### 2. 390px Mobile-First Ergonomics & Numerical Precision (UI-2, UI-3, UI-4)
- **44px Touch Targets**: Enforced `min-h-[44px]` across all primary action buttons, tab switchers, slot cards, and controls in `NutritionView.tsx`, `ActivitiesView.tsx`, `RecoveryView.tsx`, `ProgressView.tsx`, and `CoachView.tsx`.
- **`tabular-nums` Numeric Formatting**: Applied mono tabular numbering across all numeric displays, macro tallies, reps/sets counters, effort selectors, and pace indicators to prevent layout shifts.
- **Responsive Layout Protection**: Added `overflow-x-auto` to prompt chip bars, tab selectors, and wide action rows to prevent horizontal viewport blowout on 390px mobile screens.

---

## 5. Explicit "Not Verified" & Open Action Items

1. **Hosted Cross-User RLS with 2 Confirmed Accounts (`tools/test-hosted-rls.mjs`)**:
   - **Status: NOT RUN**.
   - Hermetic PGlite suite (`npm --prefix tools run test:rls`, 279 checks) ran and passed with 100% success.
   - Hosted multi-tenant script against `ghxotyoiquyyowydxshb.supabase.co` remains **NOT RUN**. Requires real athlete credentials for Athlete A and Athlete B supplied via environment variables.
2. **Positive 200 Live FastAPI Token Verification (`tools/verify_hosted_token.py`)**:
   - **Status: NOT RUN**.
   - Negative paths (401 on missing token, 401 on tampered token) pass deterministically.
   - Positive 200 OK verification against live JWKS via Supabase Auth remains **NOT RUN** until verified user credentials exist in the terminal environment.
3. **Physical Browser Back-Button Guard Check**:
   - Component-level navigation guards and code-splitting fallbacks pass automated Vitest checks. Physical device verification of hardware back-button gestures and browser history navigation remains open.
4. **Live Gemini Vision API Call**:
   - Meal vision fallback and demo mode handling are covered with 16 automated tests in `src/test/meal-photo-uploader.test.tsx`. A live multimodal call using real image bytes against Google Gemini API endpoints remains open until live API tokens are tested.
5. **Owner Review of Staged Changes**:
   - Working tree changes remain uncommitted awaiting owner review and explicit commit approval (AGENTS.md Rule 9).
