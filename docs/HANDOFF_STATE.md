# AthlonIQ — Handoff State & Verification Snapshot

**Timestamp**: 2026-11-03 18:28 IST  
**Project**: AthlonIQ (Personal AI Performance & Physique OS)  
**Hosted Supabase Reference**: `ghxotyoiquyyowydxshb`  
**API Auth**: FastAPI with PyJWKClient against Supabase Auth JWKS (`https://ghxotyoiquyyowydxshb.supabase.co/auth/v1/.well-known/jwks.json`)  
**Current Branch**: `main`  

---

## 1. Git State & Recent Commit Log

### Existing Recent Commits (`git log --oneline -n 6`)
```text
958beaf test(api): NULL timezone resolves to Asia/Kolkata, stored zone respected feat(web): honest null states, timezone onboarding, shared progression gate" -m "No default readiness score without a check-in. Onboarding captures and confirms device timezone. Meal-photo badge no longer hard-codes a model name. gatedProgressionSuggestion moved to lib and tested. Client never sends 'today' to coaching endpoints. Not verified: real-device UI, live vision API.
8ce72d5 HOSTED RLS + LIVE 200 JWT CHECK + COACH OFFLINE FALLBACK FIX
06930bb Lane A2 — api/ and AGENTS.md only, Lane B2 — web/ only\
3e2a02c SYNC AGENTS.md and docs/HANDOFF_STATE.md
f557fe6 feat(web): remove fabricated fallback defaults and enforce equipment progression gating
4ef4fc3 Merge branch 'main' of https://github.com/Dannyo6/AthlonIQ
```

### Current Working Tree (`git status -s`)
```text
 M .gitignore
 M docs/HANDOFF_STATE.md
?? web/.gitignore
```
*(Zero unapproved agent commits. All working tree changes staged/inspected without auto-commit).*

---

## 2. Test Execution Matrix (Backed by Raw Terminal Output)

| Test Suite | Command | Scope | Raw Result | Duration |
| :--- | :--- | :--- | :--- | :--- |
| **Pytest** (`api/`) | `cd api; .\.venv\Scripts\python.exe -m pytest -v` | API routes, JWT security, CORS, timezone calculation, production override rejection, biometrics, vision fallback, coach tools | **133 passed**, 2 warnings | 7.33s |
| **Vitest** (`web/`) | `npm test` | React UI, routing, PWA caching, optimistic rollback, auth gate, progression fallbacks, recovery slider, profile live BMI, offline weekly review, Lane B3 honest null states | **63 passed** (11 files) | 12.37s |
| **PGlite RLS Suite** (`tools/`) | `npm --prefix tools run test:rls` | PostgreSQL hermetic RLS: 18 tables, dual tenant isolation, storage buckets, anti-spoofing | **279 checks passed** (0 failures) | ~2s |
| **Vite Production Build** (`web/`) | `npm run build` | TypeScript strict mode (`tsc`) + Vite bundler | **0 errors** (18 chunks generated, PWA precache 31 entries) | 5.12s |
| **Hosted Supabase RLS** (`tools/`) | `node tools/test-hosted-rls.mjs` | End-to-end multi-tenant check against live hosted Supabase (17 tables, 2 buckets) | **NOT RUN** (Requires confirmed athlete credentials in environment) | — |
| **Hosted Token Verification** (`tools/`) | `python tools/verify_hosted_token.py` | PyJWKClient asymmetric ES256 verification against live JWKS (401, 401, 200) | **NOT RUN** (Requires confirmed athlete credentials in environment) | — |

---

## 3. Raw Execution Outputs

### A. Pytest Output (`api/`)
```text
============================= test session starts =============================
platform win32 -- Python 3.14.4, pytest-9.1.1, pluggy-1.7.0
rootdir: C:\Users\vijay\OneDrive\Documents\GitHub\AthlonIQ\api
configfile: pyproject.toml
testpaths: tests
plugins: anyio-4.15.1, asyncio-1.4.0
asyncio: mode=Mode.AUTO, debug=False, asyncio_default_fixture_loop_scope=None, asyncio_default_test_loop_scope=function
collected 133 items

tests\test_cors_config.py .....                                          [  3%]
tests\test_health.py ..........                                          [ 11%]
tests\test_jwt_security.py ............                                  [ 20%]
tests\test_phase2_tracking.py .......................................... [ 51%]
..............                                                           [ 62%]
tests\test_phase3_vision.py ..............                               [ 72%]
tests\test_phase4_coach.py ................                              [ 84%]
tests\test_phase5_acceptance.py ............                             [ 93%]
tests\test_server_today.py ........                                      [100%]

============================== warnings summary ===============================
.venv\Lib\site-packages\google\genai\types.py:42
  C:\Users\vijay\OneDrive\Documents\GitHub\AthlonIQ\api\.venv\Lib\site-packages\google\genai\types.py:42: DeprecationWarning: '_UnionGenericAlias' is deprecated and slated for removal in Python 3.17
    VersionedUnionType = Union[builtin_types.UnionType, _UnionGenericAlias]

.venv\Lib\site-packages\fastapi\testclient.py:1
  C:\Users\vijay\OneDrive\Documents\GitHub\AthlonIQ\api\.venv\Lib\site-packages\fastapi\testclient.py:1: StarletteDeprecationWarning: Using `httpx` with `starlette.testclient` is deprecated; install `httpx2` instead.
    from starlette.testclient import TestClient as TestClient  # noqa

-- Docs: https://docs.pytest.org/en/stable/how-to/capture-warnings.html
======================= 133 passed, 2 warnings in 7.33s =======================
```

### B. Vitest Output (`web/`)
```text
> athloniq-web@0.1.0 test
> vitest run


 RUN  v2.1.9 C:/Users/vijay/OneDrive/Documents/GitHub/AthlonIQ/web

 ✓ src/test/legacy-import.test.ts (2 tests) 6ms
 ✓ src/test/pwa-caching.test.ts (8 tests) 15ms
 ✓ src/test/progression-fallbacks.test.ts (9 tests) 9ms
 ✓ src/test/repo-zod.test.ts (9 tests) 22ms
stderr | src/test/optimistic-rollback.test.tsx > Optimistic Updates and Rollback Behavior > applies optimistic update immediately, then rolls back and shows AthlonToast on repository failure
[AthlonIQ Repo Sync Failed]: Error: Database connection dropped (Network Failure)
    at C:\Users\vijay\OneDrive\Documents\GitHub\AthlonIQ\web\src\test\optimistic-rollback.test.tsx:105:7
    at file:///C:/Users/vijay/OneDrive/Documents/GitHub/AthlonIQ/web/node_modules/@vitest/runner/dist/index.js:146:14
    at file:///C:/Users/vijay/OneDrive/Documents/GitHub/AthlonIQ/web/node_modules/@vitest/runner/dist/index.js:533:11
    at runWithTimeout (file:///C:/Users/vijay/OneDrive/Documents/GitHub/AthlonIQ/web/node_modules/@vitest/runner/dist/index.js:39:7)
    at runTest (file:///C:/Users/vijay/OneDrive/Documents/GitHub/AthlonIQ/web/node_modules/@vitest/runner/dist/index.js:1056:17)
    at processTicksAndRejections (node:internal/process/task_queues:104:5)
    at runSuite (file:///C:/Users/vijay/OneDrive/Documents/GitHub/AthlonIQ/web/node_modules/@vitest/runner/dist/index.js:1205:15)
    at runSuite (file:///C:/Users/vijay/OneDrive/Documents/GitHub/AthlonIQ/web/node_modules/@vitest/runner/dist/index.js:1205:15)
    at runFiles (file:///C:/Users/vijay/OneDrive/Documents/GitHub/AthlonIQ/web/node_modules/@vitest/runner/dist/index.js:1262:5)
    at startTests (file:///C:/Users/vijay/OneDrive/Documents/GitHub/AthlonIQ/web/node_modules/@vitest/runner/dist/index.js:1271:3)

 ✓ src/test/optimistic-rollback.test.tsx (2 tests) 131ms
 ✓ src/test/signout-isolation.test.tsx (1 test) 171ms
 ✓ src/test/coach-weekly-review-offline.test.tsx (2 tests) 1028ms
   ✓ CoachView Weekly Review Offline Catch & Retry > shows 'Weekly review needs a connection' and retry button on fetch failure without synthesized values 705ms
   ✓ CoachView Weekly Review Offline Catch & Retry > retries fetching weekly review when retry button is clicked 321ms
 ✓ src/test/lane-b2-features.test.tsx (4 tests) 1050ms
   ✓ RecoveryView Stress Slider & Null State > initializes stress state to null, displays 'Not set', and submits stress: null when untouched 555ms
stderr | src/test/auth-gate.test.tsx > Application Session Gate > renders authenticated application workspace when session is present
Warning: An update to AppShell inside a test was not wrapped in act(...).

When testing, code that causes React state updates should be wrapped into act(...):

act(() => {
  /* fire events that update state */
});
/* assert on the output */

This ensures that you're testing the behavior the user would see in the browser. Learn more at https://reactjs.org/link/wrap-tests-with-act
    at AppShell (C:\Users\vijay\OneDrive\Documents\GitHub\AthlonIQ\web\src\app\App.tsx:87:69)
    at UnsavedWorkProvider (C:\Users\vijay\OneDrive\Documents\GitHub\AthlonIQ\web\src\features\navigation\UnsavedWorkContext.tsx:10:32)
    at Router (file:///C:/Users/vijay/OneDrive/Documents/GitHub/AthlonIQ/web/node_modules/react-router/dist/development/chunk-OB3PAWPO.mjs:7134:13)
    at BrowserRouter (file:///C:/Users/vijay/OneDrive/Documents/GitHub/AthlonIQ/web/node_modules/react-router/dist/development/chunk-OB3PAWPO.mjs:10493:3)
    at EnsureRouter (C:\Users\vijay\OneDrive\Documents\GitHub\AthlonIQ\web\src\app\App.tsx:1443:25)
    at AthloniqProvider (C:\Users\vijay\OneDrive\Documents\GitHub\AthlonIQ\web\src\hooks\useAthloniqState.tsx:147:29)
    at EnsureAthloniqProvider (C:\Users\vijay\OneDrive\Documents\GitHub\AthlonIQ\web\src\app\App.tsx:1421:35)
    at App

 ✓ src/test/auth-gate.test.tsx (3 tests) 737ms
   ✓ Application Session Gate > gates application and renders SignInView when athlete is unauthenticated 376ms
stderr | src/test/lane-b3.test.tsx > Lane B3 Requirements Suite > Item 2: Readiness widget and Today card show 'No check-in yet' when unlogged > Sidebar readiness widget renders 'No check-in yet' and link when hasTodayCheckIn is false
Warning: An update to AppShell inside a test was not wrapped in act(...).

When testing, code that causes React state updates should be wrapped into act(...):

act(() => {
  /* fire events that update state */
});
/* assert on the output */

This ensures that you're testing the behavior the user would see in the browser. Learn more at https://reactjs.org/link/wrap-tests-with-act
    at AppShell (C:\Users\vijay\OneDrive\Documents\GitHub\AthlonIQ\web\src\app\App.tsx:87:69)
    at UnsavedWorkProvider (C:\Users\vijay\OneDrive\Documents\GitHub\AthlonIQ\web\src\features\navigation\UnsavedWorkContext.tsx:10:32)
    at EnsureRouter (C:\Users\vijay\OneDrive\Documents\GitHub\AthlonIQ\web\src\app\App.tsx:1443:25)
    at EnsureAthloniqProvider (C:\Users\vijay\OneDrive\Documents\GitHub\AthlonIQ\web\src\app\App.tsx:1421:35)
    at App
    at Router (file:///C:/Users/vijay/OneDrive/Documents/GitHub/AthlonIQ/web/node_modules/react-router/dist/development/chunk-OB3PAWPO.mjs:7134:13)
    at MemoryRouter (file:///C:/Users/vijay/OneDrive/Documents/GitHub/AthlonIQ/web/node_modules/react-router/dist/development/chunk-OB3PAWPO.mjs:7044:3)
Warning: A suspended resource finished loading inside a test, but the event was not wrapped in act(...).

When testing, code that resolves suspended data should be wrapped into act(...):

act(() => {
  /* finish loading suspended data */
});
/* assert on the output */

This ensures that you're testing the behavior the user would see in the browser. Learn more at https://reactjs.org/link/wrap-tests-with-act

 ✓ src/test/lane-b3.test.tsx (8 tests) 867ms
   ✓ Lane B3 Requirements Suite > Item 2: Readiness widget and Today card show 'No check-in yet' when unlogged > Today card renders 'No check-in yet' and link when hasTodayCheckIn is false 416ms
 ✓ src/test/routes-navigation.test.tsx (15 tests) 1726ms
   ✓ AthlonIQ Routing, Code Splitting & Unsaved Guard > renders /today view with Today Dashboard heading 407ms
   ✓ AthlonIQ Routing, Code Splitting & Unsaved Guard > redirects '/' root path to '/today' 576ms

 Test Files  11 passed (11)
      Tests  63 passed (63)
   Start at  18:23:35
   Duration  12.37s (transform 3.13s, setup 13.43s, collect 11.68s, tests 5.76s, environment 47.83s, prepare 5.88s)
```

### C. Web Production Build (`web/`)
```text
> athloniq-web@0.1.0 build
> tsc && vite build

vite v5.4.21 building for production...
transforming...
✓ 1733 modules transformed.
rendering chunks...
computing gzip size...
dist/manifest.webmanifest                          0.59 kB
dist/index.html                                    2.20 kB │ gzip:  0.95 kB
dist/assets/index-CPsX5d6Q.css                    51.71 kB │ gzip:  8.92 kB
dist/assets/Button-CuzURBVn.js                     1.95 kB │ gzip:  0.80 kB
dist/assets/workbox-window.prod.es5-BqEJf4Xk.js    5.71 kB │ gzip:  2.34 kB
dist/assets/RecoveryView-CO08Q-QA.js              10.83 kB │ gzip:  3.17 kB
dist/assets/ActivitiesView-C-SGA1Ka.js            13.15 kB │ gzip:  3.45 kB
dist/assets/WorkoutsView-wygAZxx7.js              20.55 kB │ gzip:  5.57 kB
dist/assets/DashboardView-C9oiyGnI.js             23.06 kB │ gzip:  5.75 kB
dist/assets/vendor-icons-DeLAjw6t.js              28.04 kB │ gzip:  5.70 kB
dist/assets/CoachView-BEIn5boC.js                 28.84 kB │ gzip:  7.61 kB
dist/assets/ProgressView-BymR-AKh.js              31.32 kB │ gzip:  6.81 kB
dist/assets/vendor-query-DG3adNQi.js              36.35 kB │ gzip: 11.32 kB
dist/assets/NutritionView-KV9fcjcz.js             36.55 kB │ gzip:  8.98 kB
dist/assets/ProfileView-BsC0FNvt.js               75.29 kB │ gzip: 21.38 kB
dist/assets/vendor-router-BCYiucz2.js            172.63 kB │ gzip: 56.86 kB
dist/assets/index--1g24LHl.js                    203.03 kB │ gzip: 53.76 kB
dist/assets/vendor-supabase-f4bNl52y.js          227.07 kB │ gzip: 58.98 kB
✓ built in 5.12s

PWA v2.0.0
mode      generateSW
precache  31 entries (1207.61 KiB)
files generated
  dist/sw.js
  dist/workbox-98f7a950.js
```

### D. PGlite Hermetic RLS Suite Output (`tools/`)
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

### E. Hosted Supabase RLS Execution (`tools/test-hosted-rls.mjs`)
**Status: NOT RUN** (Awaiting real athlete credentials in environment)

Both throwaway signup paths and password reading from `.env.local` have been completely removed. The script strictly requires pre-existing verified credentials from `process.env`:
- `TEST_ATHLETE_A_EMAIL`
- `TEST_ATHLETE_A_PASSWORD`
- `TEST_ATHLETE_B_EMAIL`
- `TEST_ATHLETE_B_PASSWORD`

Raw terminal execution without credentials (enforces NON-ZERO exit):
```text
PS C:\Users\vijay\OneDrive\Documents\GitHub\AthlonIQ> node tools/test-hosted-rls.mjs
ERROR: Missing required credentials in environment:
  - TEST_ATHLETE_A_EMAIL
  - TEST_ATHLETE_A_PASSWORD
  - TEST_ATHLETE_B_EMAIL
  - TEST_ATHLETE_B_PASSWORD
[Exit Code: 1]
```
*Full live run against hosted Supabase marked as NOT RUN until real athlete credentials are provided in the environment.*

### F. Live FastAPI Token Verification Tool (`tools/verify_hosted_token.py`)
**Status: NOT RUN** (Awaiting real athlete credentials in environment for positive 200 OK)

Enforces strict environment-only credentials, never reads passwords from `.env.local`, never prints raw tokens or passwords, and prints only status codes and response bodies. Requires 3 distinct checks:
1. No header -> expected 401
2. Tampered token -> expected 401
3. Valid token -> expected 200 (GET `/api/v1/coaching/tools` and POST `/api/v1/coaching/readiness`)

Raw terminal execution without credentials (enforces NON-ZERO exit):
```text
PS C:\Users\vijay\OneDrive\Documents\GitHub\AthlonIQ> .\api\.venv\Scripts\python.exe tools\verify_hosted_token.py
ERROR: Missing required credentials in environment:
  - TEST_ATHLETE_A_EMAIL
  - TEST_ATHLETE_A_PASSWORD
[Exit Code: 1]
```
*Positive 200 OK check marked as NOT RUN until real athlete credentials are provided in the environment.*

---

## 4. Completed Scope Summary

### Lane A & A2: Deterministic Backend Tests & CORS/DEBUG Configuration
1. **Clock Decoupling & Server-Side Timezone**:
   - `resolve_server_today(user_id, client_override, environment)`: Resolves date based on user profile timezone (defaulting to `"Asia/Kolkata"` when NULL).
   - In production (`ENVIRONMENT="production"`): Client date overrides are rejected with HTTP 400.
   - Comprehensive test suite in `api/tests/test_server_today.py` (8 tests: 00:30 IST, 23:30 IST, NULL resolution, and prod rejection).
2. **Environment-Driven CORS & DEBUG**:
   - `BACKEND_CORS_ORIGINS` and `DEBUG` parsed safely from `api/.env`.
   - Startup security guard checks reject wildcard `*` origins and warn on `DEBUG=True` when `ENVIRONMENT=production`.

### Lane B, B2 & B3: Removal of Fabricated Fallbacks & Honest Null States
1. **Calorie Target Nullability**:
   - Removed `goals.calorieTargetKcal || 2000` from `NutritionView.tsx`.
   - Null targets render cleanly as `"Calorie target not set — finish onboarding"` with `<Link to="/profile">`.
2. **Equipment Progression Gating**:
   - Removed `?? 70` and `?? 2.5` fallbacks from `WorkoutsView.tsx`.
   - If equipment is unconfirmed or limits are null, the app displays `"Set your equipment limits to get load progressions"` without emitting guessed progression numbers. Shared logic cleanly isolated in `web/src/lib/gatedProgression.ts`.
3. **Recovery Stress Slider & Null State**:
   - Initial stress state initialized to `null`.
   - Range slider input with `"Not set"` status indicator badge when untouched.
   - Interactive `"Clear"` control resetting stress to `null`.
   - Only submits numeric stress when the slider is explicitly touched.
4. **Profile Live BMI Validation & Timezone Onboarding**:
   - Removed fallback seed values `|| 55.0` and `|| 173.0`.
   - Strictly validates height and weight; renders `"Enter height and weight"` with `"NOT SET"` badge when empty or invalid.
   - Onboarding explicitly captures and confirms device timezone (`Intl.DateTimeFormat().resolvedOptions().timeZone`).
5. **Readiness Score Honesty**:
   - No default readiness score is synthesized when today's check-in has not been performed; UI presents an explicit prompt with link to log recovery check-in.
6. **CoachView Offline Catch Block**:
   - Removed fabricated numbers (`|| 1`, `|| 5`, `54.5`, `2450.0`, `chicken: 2`).
   - Uses actual snapshot logged counts (`0` when empty) and displays an offline status notification with `"Retry Review"` button.
   - Client requests never send `today` parameter to coaching endpoints.

---

## 5. Explicit "Not Verified" & Open Action Items

1. **Hosted Supabase Live Session Execution (`tools/test-hosted-rls.mjs`)**:
   - **Status: NOT RUN**.
   - Hermetic PGlite suite (`npm --prefix tools run test:rls`, 279 checks) ran and passed with 100% success.
   - Hosted multi-tenant script against `ghxotyoiquyyowydxshb.supabase.co` is marked **NOT RUN**. All throwaway signup logic and `.env.local` password parsing have been removed. Requires pre-existing verified credentials for Athlete A and Athlete B supplied via `$env:TEST_ATHLETE_A_EMAIL`, `$env:TEST_ATHLETE_A_PASSWORD`, `$env:TEST_ATHLETE_B_EMAIL`, and `$env:TEST_ATHLETE_B_PASSWORD`. Exits with non-zero code until all 17 tables and 2 storage buckets pass (19/19).
2. **Positive 200 Live Token Execution (`tools/verify_hosted_token.py`)**:
   - **Status: NOT RUN**.
   - The unauthenticated rejection (no header 401) and tampered token rejection (tampered token 401) logic is wired and verified.
   - The positive 200 OK check against live JWKS via Supabase Auth is marked **NOT RUN**. Requires real athlete credentials supplied in the terminal environment via `$env:TEST_ATHLETE_A_EMAIL` and `$env:TEST_ATHLETE_A_PASSWORD`. Exits with non-zero code until real output exists.
3. **Physical Mobile Device Testing**:
   - PWA caching, service worker generation, and offline state handling were verified via automated Vitest suites and production bundle generation. Physical hardware testing on iOS Safari / Android Chrome remains open.
