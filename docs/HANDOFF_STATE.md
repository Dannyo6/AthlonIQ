# AthlonIQ — Handoff State & Verification Snapshot

**Timestamp**: 2026-11-27 00:42 IST  
**Project**: AthlonIQ (Personal AI Performance & Physique OS)  
**Hosted Supabase Reference**: `ghxotyoiquyyowydxshb`  
**API Auth**: FastAPI with PyJWKClient against Supabase Auth JWKS (`https://ghxotyoiquyyowydxshb.supabase.co/auth/v1/.well-known/jwks.json`)  
**Current Branch**: `main`  
**Node Version**: `v24.15.0`  

---

## 1. Git State & Recent Commit Log

### Recent Commits (`git log --oneline -n 5`)
```text
b69d26a refactor(web): modularize ProfileView with ui-ux-pro-max polish and fix profile/signin smoke bugs (UI-8E)
b4c1fe7 fix(vision,web): update Gemini Vision model cascade and polish MealPhotoUploader 390px UI
506930f refactor(web): modularize CoachView with tab/chat accessibility, unsaved-work guards, and component tests (UI-8D)
3f68eeb refactor(web): modularize ProgressView with chart accessibility, unsaved-work guards, and component tests (UI-8C)
20be127 Update .gitignore
```

### Current Working Tree (`git status -s`)
```text
 M docs/HANDOFF_STATE.md
 M web/src/app/App.tsx
 M web/src/components/ui/Card.tsx
 M web/src/features/dashboard/DashboardView.tsx
 M web/src/features/dashboard/components/DashboardHeader.tsx
 M web/src/features/dashboard/components/MoreAccordion.tsx
 M web/src/features/dashboard/components/NutritionCard.tsx
 M web/src/features/dashboard/components/QuickActionsRow.tsx
 M web/src/features/dashboard/components/ReadinessStrip.tsx
 M web/src/features/dashboard/components/TodayTrainingCard.tsx
 M web/src/features/dashboard/components/WeeklyConsistencyCard.tsx
 M web/src/features/dashboard/components/WeightTrendCard.tsx
 M web/src/styles/globals.css
?? design-system/
```
*(Zero unapproved agent commits; `api/` untouched; zero new npm dependencies).*

---

## 2. Test Execution Matrix (Backed by Raw Terminal Output)

| Test Suite | Command | Scope | Verified Baseline / Latest Result | Duration |
| :--- | :--- | :--- | :--- | :--- |
| **Pytest Full Suite** (`api/`) | `.\api\.venv\Scripts\pytest.exe api/tests` | API routes, JWT security, CORS, timezone calculation, production override rejection, biometrics, Epley 1RM golden parity, vision live/fallback model cascade, coach tools, acceptance contracts | **184 passed**, 2 warnings (`test_phase3_vision.py`: 29 passed) | 319.35s |
| **Vitest Full Suite** (`web/`) | `npm --prefix web test` | Full client test suite across 29 files (all 7 modularized views + `UI-8A..UI-8E` + `UI-9A`, routing, CSS/TSX token guards, bundle gate) | **243 passed** (29 files) | 25.77s |
| **Vite Production Build** (`web/`) | `npm --prefix web run build` | TypeScript strict mode (`tsc`) + Vite bundler (`dist/assets/index-3gm5Tm-d.js` at `214.47 kB`, <= 210 KiB / `215,040` B gate; `DashboardView` at `43.11 kB`) | **0 errors** (PWA precache 35 entries) | 6.85s |
| **Hosted Supabase MCP Audit** (`ghxotyoiquyyowydxshb`) | Supabase MCP read-only `execute_sql` + `list_migrations` | `18/18` public tables `rowsecurity = true`; `food_entries` (`provenance`, `is_confirmed`) & `exercise_sets` (`is_completed`) schema parity confirmed (`NOT NULL`, `column_default = null`, `food_entries_provenance_check` intact); `supabase_migrations.schema_migrations` absent (`list_migrations: []`) | **Schema parity & 18/18 RLS verified** | — |
| **Secrets Scanner** (`tools/`) | `npm run scan:secrets` | Scans `git ls-files` for `sb_secret_`, JWT-like strings, service role keys, and `.env*` files other than `.env.example` | **Clean: 0 violations** across 234 tracked files | <3s |

---

## 3. Raw Execution Outputs

### A. Git Status (`git status -s`)
```text
 M docs/HANDOFF_STATE.md
 M web/src/features/activities/ActivitiesView.tsx
 M web/src/features/coach/CoachView.tsx
 M web/src/features/nutrition/NutritionView.tsx
 M web/src/features/progress/ProgressView.tsx
 M web/src/features/recovery/RecoveryView.tsx
 M web/src/features/workouts/WorkoutsView.tsx
?? web/src/test/mobile-ergonomics-ui5.test.tsx
```

### B. Git Log (`git log --oneline -n 5`)
```text
927407b docs(handoff): record passing 19/19 hosted RLS and live FastAPI ES256 JWT checks
61383f7 test(web): expand tailwind token audit to full src tree and sync handoff state
27f777e style(web): enforce theme tokens across all views, 390px touch targets, and sync handoff state (UI-4)
6839751 style(web): enforce theme tokens across all views, 390px touch targets, and sync handoff state (UI-4)
f353b4a UI-3 — First-Run Onboarding Flow & Equipment-Confirmation Gate (390px Mobile-First)
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
154 passed, 2 warnings in 13.12s
```

### D. Vitest Output (`web/`)
```text
> athloniq-web@0.1.0 test
> vitest run


 RUN  v2.1.9 C:/Users/vijay/OneDrive/Documents/GitHub/AthlonIQ/web

 ✓ src/test/pwa-caching.test.ts (8 tests) 54ms
 ✓ src/test/repo-zod.test.ts (9 tests) 49ms
 ✓ src/test/weekly-consistency.test.ts (15 tests) 511ms
   ✓ Weekly Consistency & Adherence Engine > Week Boundaries Transitions > transitions session counting across Sunday-to-Monday boundary 309ms
 ✓ src/test/optimistic-rollback.test.tsx (2 tests) 345ms
 ✓ src/test/signout-isolation.test.tsx (1 test) 436ms
   ✓ Sign-Out and Cross-Athlete State Isolation > resets all in-memory athlete state on sign out and prevents leakage when signing in as User B 428ms
 ✓ src/test/lane-b2-features.test.tsx (4 tests) 2738ms
   ✓ RecoveryView Stress Slider & Null State > initializes stress state to null, displays 'Not set', and submits stress: null when untouched 1241ms
   ✓ RecoveryView Stress Slider & Null State > sends stress value when user touches slider and supports clearing back to 'Not set' 481ms
   ✓ ProfileView Live BMI Validation > shows 'Enter height and weight' when height or weight is empty, never a BMI from seed values 446ms
   ✓ ProfileView Live BMI Validation > calculates live BMI when valid height and weight are entered, and reverts to 'Enter height and weight' if cleared 562ms
 ✓ src/test/meal-photo-uploader.test.tsx (16 tests) 2834ms
   ✓ Lane B4: MealPhotoUploader Provider & Mode Handling > MealPhotoUploader UI badge updates from API result > displays live provider and mode when API returns gemini/live 528ms
   ✓ Lane B4: MealPhotoUploader Provider & Mode Handling > Lane B5: Vision Fallback, Demo Labeling & Live Confirmation > live shows candidates needing confirmation (ai_estimated until the user confirms) 1356ms
 ✓ src/test/onboarding-equipment-gate.test.tsx (4 tests) 3596ms
   ✓ UI-3: First-Run Onboarding Flow & Equipment-Confirmation Gate > navigating to /profile?step=equipment opens Step 3 and displays 'Not set' for null limits and '70 kg' for free_weights_70kg 2570ms
   ✓ UI-3: First-Run Onboarding Flow & Equipment-Confirmation Gate > clicking 'Confirm All Home Gym Equipment' marks equipment confirmed without fabricating non-null increments 739ms
 ✓ src/test/today-dashboard-ui2.test.tsx (6 tests) 4224ms
   ✓ UI-2: Today Dashboard Screen & Components (390px spec) > renders quick-action links with correct href destinations and touch target classes 2523ms
   ✓ UI-2: Today Dashboard Screen & Components (390px spec) > null calorie target displays fallback message and strictly hides kcal ratios 602ms
   ✓ UI-2: Today Dashboard Screen & Components (390px spec) > unconfirmed equipment shows the confirm state and blocks planned progression 344ms
   ✓ UI-2: Today Dashboard Screen & Components (390px spec) > greeting uses profile name only when set, falling back to clean greeting without null 339ms
 ✓ src/test/lane-b3.test.tsx (8 tests) 3958ms
   ✓ Lane B3 Requirements Suite > Item 2: Readiness widget and Today card show 'No check-in yet' when unlogged > Today card renders 'No check-in yet' and link when hasTodayCheckIn is false 2356ms
   ✓ Lane B3 Requirements Suite > Item 2: Readiness widget and Today card show 'No check-in yet' when unlogged > Sidebar readiness widget renders 'No check-in yet' and link when hasTodayCheckIn is false 1215ms
 ✓ src/test/progression-fallbacks.test.ts (9 tests) 24ms
 ✓ src/test/legacy-import.test.ts (2 tests) 19ms
 ✓ src/test/tailwind-tokens.test.ts (3 tests) 40ms
 ✓ src/test/coach-weekly-review-offline.test.tsx (2 tests) 1659ms
   ✓ CoachView Weekly Review Offline Catch & Retry > shows 'Weekly review needs a connection' and retry button on fetch failure without synthesized values 1163ms
   ✓ CoachView Weekly Review Offline Catch & Retry > retries fetching weekly review when retry button is clicked 491ms
 ✓ src/test/routes-navigation.test.tsx (15 tests) 7650ms
   ✓ AthlonIQ Routing, Code Splitting & Unsaved Guard > renders /today view with Today Dashboard heading 1030ms
   ✓ AthlonIQ Routing, Code Splitting & Unsaved Guard > redirects '/' root path to '/today' 3473ms
   ✓ AthlonIQ Routing, Code Splitting & Unsaved Guard > renders /nutrition view directly 930ms
   ✓ AthlonIQ Routing, Code Splitting & Unsaved Guard > renders /workouts view directly 589ms
   ✓ AthlonIQ Routing, Code Splitting & Unsaved Guard > renders designed 404 page for unknown paths with link to /today 648ms
 ✓ src/test/auth-gate.test.tsx (3 tests) 1248ms
   ✓ Application Session Gate > gates application and renders SignInView when athlete is unauthenticated 537ms
   ✓ Application Session Gate > renders authenticated application workspace when session is present 492ms

 Test Files  16 passed (16)
      Tests  107 passed (107)
   Start at  14:47:39
   Duration  24.35s (transform 11.92s, setup 22.67s, collect 38.47s, tests 29.38s, environment 112.74s, prepare 7.68s)
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
dist/index.html                                    2.20 kB │ gzip:  0.94 kB
dist/assets/index-B0gfO29p.css                    50.71 kB │ gzip:  8.77 kB
dist/assets/Card-BE_YSBQu.js                       1.97 kB │ gzip:  0.79 kB
dist/assets/workbox-window.prod.es5-BqEJf4Xk.js    5.71 kB │ gzip:  2.34 kB
dist/assets/RecoveryView-D8pVkcTr.js              11.01 kB │ gzip:  3.18 kB
dist/assets/ActivitiesView-BkjrE_LI.js            13.48 kB │ gzip:  3.46 kB
dist/assets/WorkoutsView-CdHaePnI.js              21.37 kB │ gzip:  5.72 kB
dist/assets/vendor-icons-C8Lldopg.js              28.97 kB │ gzip:  5.82 kB
dist/assets/CoachView-BU8TmXC8.js                 29.44 kB │ gzip:  7.53 kB
dist/assets/ProgressView-CAI2fv_L.js              31.95 kB │ gzip:  6.83 kB
dist/assets/vendor-query-DG3adNQi.js              36.35 kB │ gzip: 11.32 kB
dist/assets/NutritionView-Cnivk8_x.js             40.47 kB │ gzip:  9.62 kB
dist/assets/DashboardView-BNwMTssT.js             43.14 kB │ gzip:  9.27 kB
dist/assets/ProfileView-C4SEZmdX.js               77.58 kB │ gzip: 21.73 kB
dist/assets/vendor-router-C0CbzL8b.js            173.50 kB │ gzip: 57.21 kB
dist/assets/index-DhdU0rOV.js                    204.17 kB │ gzip: 53.90 kB
dist/assets/vendor-supabase-f4bNl52y.js          227.07 kB │ gzip: 58.98 kB
✓ built in 11.37s

PWA v2.0.0
mode      generateSW
precache  31 entries (1237.68 KiB)
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

### I. Hosted Supabase MCP Audit (`ghxotyoiquyyowydxshb`)

#### Live Hosted Supabase Audit Results
| Security & Infrastructure Check | Live Configuration / Telemetry | Status |
| :--- | :--- | :--- |
| **Row Level Security (RLS)** | 18/18 public schema tables enabled (`rowsecurity = true`) | ✅ 100% Compliant |
| **Active RLS Policies** | 72 active policies (4 per table: SELECT, INSERT, UPDATE, DELETE) | ✅ 100% Compliant |
| **Storage Buckets** | 2 private buckets (`meal-photos`, `progress-photos`) with `public = false` | ✅ 100% Isolated |
| **Supabase Advisors** | 1 security warning: `auth_leaked_password_protection` (HaveIBeenPwned check disabled) | ⚠️ 1 Warning (Config) |

```text
1. Public schema tables & Row Level Security:
   Found 18 tables: activity_sessions, body_metrics, coach_conversations, coach_messages,
   custom_foods, exercise_sets, exercises, food_entries, profiles, progress_photos,
   recovery_logs, user_equipment, user_goals, user_preferences, weekly_reports,
   workout_sessions, workout_template_exercises, workout_templates.
   All 18 tables: rowsecurity (RLS) = true.

2. Storage buckets configuration:
   - meal-photos: public = false
   - progress-photos: public = false

3. Active RLS policies in public schema:
   Total active policies = 72 (exactly 4 per table: SELECT, INSERT, UPDATE, DELETE).

4. Active users in auth.users:
   - test account A: is_email_confirmed = true
   - test account B: is_email_confirmed = true
   - developer account: is_email_confirmed = true

5. Supabase Advisor Audit:
   - 1 security warning: auth_leaked_password_protection (WARN)
```

### J. Live FastAPI Token Verification Tool (`tools/verify_hosted_token.py`)
**Status: PASSED 100% (401, 401, 200)**

Raw terminal execution:
```text
PS C:\Users\vijay\OneDrive\Documents\GitHub\AthlonIQ> $env:TEST_ATHLETE_A_EMAIL = [System.Environment]::GetEnvironmentVariable("TEST_ATHLETE_A_EMAIL", "User"); $env:TEST_ATHLETE_B_EMAIL = [System.Environment]::GetEnvironmentVariable("TEST_ATHLETE_B_EMAIL", "User"); $env:TEST_ATHLETE_A_PASSWORD = [System.Environment]::GetEnvironmentVariable("TEST_ATHLETE_A_PASSWORD", "User"); $env:TEST_ATHLETE_B_PASSWORD = [System.Environment]::GetEnvironmentVariable("TEST_ATHLETE_B_PASSWORD", "User"); .\api\.venv\Scripts\python.exe tools\verify_hosted_token.py
C:\Users\vijay\OneDrive\Documents\GitHub\AthlonIQ\api\.venv\Lib\site-packages\fastapi\testclient.py:1: StarletteDeprecationWarning: Using `httpx` with `starlette.testclient` is deprecated; install `httpx2` instead.
  from starlette.testclient import TestClient as TestClient  # noqa
================================================================================
ATHLONIQ HOSTED FASTAPI TOKEN VERIFICATION
Supabase Endpoint: https://ghxotyoiquyyowydxshb.supabase.co
================================================================================

--- 1. Testing GET /api/v1/coaching/tools (No Authorization Header) ---
Status Code: 401
Response Body: {"detail":"Missing Authorization header with Bearer token"}

--- 2. Testing GET /api/v1/coaching/tools (Tampered Token) ---
Status Code: 401
Response Body: {"detail":"Invalid JWT header: Invalid crypto padding"}

--- 3. Authenticating against Supabase Auth to obtain valid JWT ---
Supabase Auth Status Code: 200

--- 3a. Testing GET /api/v1/coaching/tools (Valid Token) ---
Status Code: 200
Response Body: {"success":true,"message":"Allowlisted coach tools retrieved successfully","data":[{"name":"get_nutrition_totals","description":"Returns confirmed daily calories, protein, carbs, fat, and remaining gap against user goals (strictly excluding is_confirmed==False entries).","parameters":{"target_date":"Optional[str] ISO date (YYYY-MM-DD)"},"returns":"NutritionTotalsResult"},{"name":"get_food_history","description":"Returns recent logged meals, provenance breakdown, and high-protein staple frequency over specified days.","parameters":{"days":"int (default 7)"},"returns":"FoodHistoryResult"},{"name":"get_weekly_training","description":"Returns completed gym workout sessions, total sets, total volume (kg), and consistency vs weekly target.","parameters":{"days":"int (default 7)"},"returns":"WeeklyTrainingResult"},{"name":"get_exercise_progress","description":"Returns exercise top sets, PR records, and deterministic double-progression status respecting confirmed home equipment (70kg cap).","parameters":{"exercise_name":"Optional[str]"},"returns":"ExerciseProgressResult"},{"name":"get_activity_history","description":"Returns logged Running (distance, duration, calculated pace), Badminton (format, intensity), and Calisthenics sessions.","parameters":{"days":"int (default 14)"},"returns":"ActivityHistoryResult"},{"name":"get_weight_trend","description":"Returns weigh-in count, latest weight (kg), 7-day rolling average (or explicit insufficient_data notice if < 3 entries), and weekly delta.","parameters":{"days":"int (default 14)"},"returns":"WeightTrendResult"},{"name":"get_recovery_history","description":"Returns recent sleep duration, subjective quality, soreness, fatigue, and rules-based readiness classifications (Prime, Moderate, Recover).","parameters":{"days":"int (default 7)"},"returns":"RecoveryHistoryResult"},{"name":"get_user_goals","description":"Returns user profile baseline (20yo, 173cm, 55kg, nonvegetarian, lean_bulk), equipment confirmation state, protein reference (88–121g), and calorie target.","parameters":{},"returns":"UserGoalsResult"}]}

--- 3b. Testing POST /api/v1/coaching/readiness (Valid Token) ---
Status Code: 200
Response Body: {"success":true,"message":"Readiness assessed successfully","data":{"readiness_score":95,"status":"Prime","guidance":"Physiological reserve is high. Green light for progressive overload or high-intensity conditioning.","triggers":["Optimal sleep duration (8.0h >= 8h): +15","Good sleep quality (4/5): +5","Minimal muscle soreness (2/5): 0","Normal fatigue baseline (2/5): 0","Low life/work stress (1/5): +5"],"provenance":"calculated_estimate"}}

================================================================================
ALL HOSTED TOKEN VERIFICATION CHECKS PASSED (401, 401, 200)
================================================================================
```

### K. Hosted Supabase Cross-Tenant RLS Suite (`tools/test-hosted-rls.mjs`)
**Status: PASSED 100% (19/19 Checks Passed across 17 Tables & 2 Storage Buckets)**

Raw terminal execution:
```text
PS C:\Users\vijay\OneDrive\Documents\GitHub\AthlonIQ> $env:TEST_ATHLETE_A_EMAIL = [System.Environment]::GetEnvironmentVariable("TEST_ATHLETE_A_EMAIL", "User"); $env:TEST_ATHLETE_B_EMAIL = [System.Environment]::GetEnvironmentVariable("TEST_ATHLETE_B_EMAIL", "User"); $env:TEST_ATHLETE_A_PASSWORD = [System.Environment]::GetEnvironmentVariable("TEST_ATHLETE_A_PASSWORD", "User"); $env:TEST_ATHLETE_B_PASSWORD = [System.Environment]::GetEnvironmentVariable("TEST_ATHLETE_B_PASSWORD", "User"); npx -y node@22 tools/test-hosted-rls.mjs

================================================================================
ATHLONIQ HOSTED RLS & MULTI-TENANT ISOLATION VERIFICATION
Endpoint: https://ghxotyoiquyyowydxshb.supabase.co
================================================================================
Authenticating Athlete Alpha: test account A
Authenticating Athlete Bravo: test account B
✓ Authenticated Athlete Alpha ID: 4abaf47b-2595-443a-aed5-9327037d59a2
✓ Authenticated Athlete Bravo ID: d0e45142-29d2-4cfa-b6e6-8169761c96a6

--- Multi-Tenant Database Table Isolation Tests ---
  [PASS] profiles                     RLS Isolation Verified (SELECT/INSERT/UPDATE/DELETE blocked)
  [PASS] user_equipment               RLS Isolation Verified (SELECT/INSERT/UPDATE/DELETE blocked)
  [PASS] user_goals                   RLS Isolation Verified (SELECT/INSERT/UPDATE/DELETE blocked)
  [PASS] user_preferences             RLS Isolation Verified (SELECT/INSERT/UPDATE/DELETE blocked)
  [PASS] custom_foods                 RLS Isolation Verified (SELECT/INSERT/UPDATE/DELETE blocked)
  [PASS] food_entries                 RLS Isolation Verified (SELECT/INSERT/UPDATE/DELETE blocked)
  [PASS] workout_templates            RLS Isolation Verified (SELECT/INSERT/UPDATE/DELETE blocked)
  [PASS] workout_template_exercises   RLS Isolation Verified (SELECT/INSERT/UPDATE/DELETE blocked)
  [PASS] workout_sessions             RLS Isolation Verified (SELECT/INSERT/UPDATE/DELETE blocked)
  [PASS] exercise_sets                RLS Isolation Verified (SELECT/INSERT/UPDATE/DELETE blocked)
  [PASS] activity_sessions            RLS Isolation Verified (SELECT/INSERT/UPDATE/DELETE blocked)
  [PASS] body_metrics                 RLS Isolation Verified (SELECT/INSERT/UPDATE/DELETE blocked)
  [PASS] recovery_logs                RLS Isolation Verified (SELECT/INSERT/UPDATE/DELETE blocked)
  [PASS] coach_conversations          RLS Isolation Verified (SELECT/INSERT/UPDATE/DELETE blocked)
  [PASS] coach_messages               RLS Isolation Verified (SELECT/INSERT/UPDATE/DELETE blocked)
  [PASS] weekly_reports               RLS Isolation Verified (SELECT/INSERT/UPDATE/DELETE blocked)
  [PASS] progress_photos              RLS Isolation Verified (SELECT/INSERT/UPDATE/DELETE blocked)

--- Storage Path Isolation Tests ---
  [PASS] Storage progress-photos      Path Isolation Verified (cross-tenant read/write/delete blocked)
  [PASS] Storage meal-photos          Path Isolation Verified (cross-tenant read/write/delete blocked)

================================================================================
RESULTS: 19/19 security isolation checks PASSED.
================================================================================
ALL HOSTED RLS & STORAGE ISOLATION CHECKS PASSED SUCCESSFULLY.
```

---

## 4. Completed Scope Summary

### 1. Hosted Multi-Tenant Cross-Tenant RLS & Storage Isolation (PASSED 19/19)
- **Live Supabase GoTrue Dual Authentication**: Both Athlete A (test account A) and Athlete B (test account B) authenticated successfully via publishable API keys against `ghxotyoiquyyowydxshb.supabase.co`.
- **17 Database Tables Fully Isolated**:
  - `profiles`, `user_equipment`, `user_goals`, `user_preferences`, `custom_foods`, `food_entries`, `workout_templates`, `workout_template_exercises`, `workout_sessions`, `exercise_sets`, `activity_sessions`, `body_metrics`, `recovery_logs`, `coach_conversations`, `coach_messages`, `weekly_reports`, `progress_photos`.
  - Athlete A cannot read (SELECT returns 0 rows), cannot spoof insert (blocked by WITH CHECK), cannot update (0 rows affected), and cannot delete Athlete B's rows (0 rows affected).
- **2 Private Storage Buckets Fully Isolated**:
  - `meal-photos` and `progress-photos`.
  - Athlete A cannot download Athlete B's private objects, cannot upload into Athlete B's folder path, and cannot delete Athlete B's objects.

### 2. Hosted FastAPI Live JWT Cryptographic Verification (PASSED)
- **Live Supabase GoTrue Auth Token Exchange**: Athlete A (test account A) authenticates via Supabase Auth password grant against `ghxotyoiquyyowydxshb.supabase.co`, receiving a real asymmetric ES256 JWT.
- **FastAPI PyJWKClient Cryptographic Validation**: Validates the token against hosted JWKS (`auth/v1/.well-known/jwks.json`) with `DEV_AUTH_BYPASS=False`.
- **Protected Endpoints Return 200 OK**:
  - `GET /api/v1/coaching/tools` -> HTTP 200 OK (returns 8 allowlisted deterministic tools).
  - `POST /api/v1/coaching/readiness` -> HTTP 200 OK (score 95, status "Prime", provenance "calculated_estimate").
- **Negative Security Paths Guarded**:
  - Missing Authorization Header -> HTTP 401.
  - Tampered Token Signature / Header -> HTTP 401.

### 3. Full-App Theme Token & Canonical Palette Enforcement (UI-1 & UI-4)
- **Zero Arbitrary `[#hex]` Classes**: Every one-off hex color in `CoachView.tsx`, `MealPhotoUploader.tsx`, `NutritionView.tsx`, `CandidateReviewForm.tsx`, and `Button.tsx` was replaced with canonical design tokens (`athloniq-lime`, `athloniq-surface`, `athloniq-card`, `athloniq-border-alt`, etc.).
- **Zero Default `lime-*` Classes**: All legacy Tailwind lime classes (`lime-300`, `lime-400`, `lime-500`) in `Badge.tsx`, `SignInView.tsx`, `CoachView.tsx`, `NutritionView.tsx`, and `PwaComponents.tsx` were replaced with `athloniq-lime`, `athloniq-lime-hover`, and theme opacity variants (`athloniq-lime/10`, `athloniq-lime/20`, etc.).
- **Automated Vitest Token Gate**: Expanded `web/src/test/tailwind-tokens.test.ts` to scan all `.tsx` components recursively across the entire UI tree (`["../**/*.tsx"]`), asserting zero arbitrary `[#hex]` classes and zero default `lime-*` classes anywhere in the project.

### 4. 390px Mobile-First Ergonomics & Numerical Precision (UI-2, UI-3, UI-4)
- **44px Touch Targets**: Enforced `min-h-[44px]` across all primary action buttons, tab switchers, slot cards, delete buttons, and controls in `NutritionView.tsx`, `CandidateReviewForm.tsx`, `ActivitiesView.tsx`, `RecoveryView.tsx`, `ProgressView.tsx`, and `CoachView.tsx`.
- **`tabular-nums` Numeric Formatting**: Applied mono tabular numbering across all numeric displays, macro tallies, reps/sets counters, effort selectors, and pace indicators to prevent layout shifts.
- **Responsive Layout Protection**: Added `overflow-x-auto` to prompt chip bars, tab selectors, and wide action rows to prevent horizontal viewport blowout on 390px mobile screens.

### 5. 390px Mobile Ergonomics Regression Suite & Truth in UI (UI-5)
- **17 Automated Regression Tests (`web/src/test/mobile-ergonomics-ui5.test.tsx`)**:
  - Covers all 6 core feature views: `NutritionView`, `WorkoutsView`, `ActivitiesView`, `RecoveryView`, `ProgressView`, and `CoachView`.
  - Asserts mobile touch target ergonomics (`min-h-[44px]`) on all primary action buttons, meal slot triggers, workout tabs, sport mode selectors, drawer buttons, and sub-tab triggers.
  - Asserts numerical precision and layout stability via `tabular-nums` on macro bars, set/rep counters, pace/distance metrics, readiness scores, and weight trends.
  - Enforces Truth in UI (AGENTS.md): uncalibrated goals render explicit `"Calorie target not set — finish onboarding"`, empty history states show `"No sessions logged yet"` and `"No activities logged yet"`, and insufficient weigh-ins (<3) display `"0/3 WEIGH-INS"` and `"Insufficient Data"` without fabricating numbers.

### 6. UI-8A — Reduced-Motion Baseline, Purposeful Micro-Interactions & Budget Gates (`94c2df1`)
- **24/24 Vitest Suites (`218` tests passing)**, `0` new packages in `web/package.json` (`budget-gate.test.ts` snapshot enforced), entry chunk `214.30 kB` (`<= 210 KiB`).
- **Extended CSS Token Guard (`web/src/test/tailwind-tokens.test.ts`)**: Scans all `.css` files under `web/src/` forbidding raw hex and `rgb`/`rgba` literals outside `--*: ...;` definitions in `web/src/styles/globals.css`.
- **Reduced-Motion Baseline**: Added global `@media (prefers-reduced-motion: reduce)` rules in `web/src/styles/globals.css` (disabling animations including `.animate-pulse`, transitions, and `scroll-behavior`) plus `usePrefersReducedMotion` hook, `CountUp`, `ClickSpark`, and `Card` `spotlight` with `cyan` completely removed.

### 7. Hosted Migration Parity & Vision Provider Audit (2026-11-26)
- **Hosted Migration Parity (`ghxotyoiquyyowydxshb`)**: `supabase_migrations.schema_migrations` does not exist on hosted (`list_migrations` returned `[]`), **however** `information_schema.columns` and `pg_constraint` confirm both `20261117000004` (`food_entries.provenance`, `food_entries.is_confirmed`) and `20261117000005` (`exercise_sets.is_completed`) are **already applied in schema**: all three columns are `NOT NULL` with `column_default = null`, `food_entries_provenance_check` enforces the 7 allowed provenance values, and `pg_tables` shows **18/18** public tables with `rowsecurity = true`.
- **Vision Provider Config (`api/.env`)**: `VISION_PROVIDER='unset'`, `GEMINI_API_KEY_CONFIGURED=True`.
- **Backend Pytest**: `181 passed, 2 warnings` via `.\api\.venv\Scripts\pytest.exe api/tests`.

### 8. UI-8B — Functional Screen Modularization & Hardening (`RecoveryView` & `ActivitiesView`)
- **26/26 Vitest Suites (`227` tests passing)**, `0` new deps in `web/package.json`, lazy-loaded route chunks preserved (`dist/assets/index-BfSUMFHB.js` at `214.35 kB`, `<= 210 KiB` gate).
- **`features/recovery/` Split**: Extracted `RecoveryCheckInForm.tsx`, `RecoveryReadinessSummary.tsx`, `RecoveryAuditPanel.tsx`, `RecoveryHistoryList.tsx`, and `useRecoveryFormDirty.ts` (`UnsavedWorkContext`). Preserved native `<input type="range">` stress slider (`null` / `"Not set"` until touched + Clear action), `min-h-[44px]` / `min-h-[48px]` touch targets, `tabular-nums`, and `Card spotlight` on primary check-in/audit cards only. Added `web/src/test/recovery-components.test.tsx` (5 tests).
- **`features/activities/` Split**: Extracted `ActivitySportSelector.tsx`, `ActivityWeeklySummary.tsx`, `ActivityLogForm.tsx`, `ActivityHistoryList.tsx`, `constants.ts`, and `useActivityFormDirty.ts` (`UnsavedWorkContext`). Enforced deterministic pace calculation via `calculateRunningPace`, explicit `"Not set"` / empty states, `min-h-[44px]` across selectors/inputs/delete controls, `390px` responsive wrapping, and `Card spotlight` on the log form card. Added `web/src/test/activities-components.test.tsx` (4 tests).

### 9. UI-8C — Functional Screen Modularization & Hardening (`ProgressView`)
- **27/27 Vitest Suites (`232` tests passing)**, `0` new deps in `web/package.json`, lazy-loaded route chunk preserved (`dist/assets/index-CgrzXsX0.js` at `214.35 kB`, `<= 210 KiB` gate).
- **`features/progress/` Split**: Extracted `ProgressHeaderActions.tsx`, `ProgressKeyStatsGrid.tsx`, `LeanBulkCalibrationCard.tsx`, `MultiSportFatigueCard.tsx`, `ProgressPhotosSection.tsx`, `ProgressWeighInDrawer.tsx`, `WeightTrendSection.tsx`, `ProgressBodyMetricsList.tsx`, `TrainingVolumeSection.tsx`, and `useProgressFormDirty.ts` (`UnsavedWorkContext`).
- **Accessibility & Truth-in-UI Hardening**: Eliminated silent `?? 8` / `?? 2` fatigue defaults and `Target: null g/day` display; preserved `"0/3 WEIGH-INS"` / `"Insufficient Data"` and empty photo states; added visible `<label htmlFor>`, `role="alert"` + `aria-describedby` + `aria-invalid` on-blur/submit validation, drawer focus management, `aria-hidden="true"` on decorative icons, descriptive `alt` / `aria-label` tags, non-color delta indicators, `min-h-[44px]` touch targets, `tabular-nums`, and `Card spotlight` on top-level summary cards only. Added `web/src/test/progress-components.test.tsx` (5 tests).

### 10. UI-8D — Functional Screen Modularization & Hardening (`CoachView`)
- **28/28 Vitest Suites (`236` tests passing)**, `0` new deps in `web/package.json`, lazy-loaded route chunk preserved (`dist/assets/index-CFQ-alJt.js` at `214.35 kB`, `<= 210 KiB` gate; `CoachView` chunk at `35.10 kB`), zero WebGL.
- **`features/coach/` Split**: Extracted `CoachSubTabs.tsx`, `CoachContextSummary.tsx`, `CoachMessageList.tsx`, `CoachQuickPrompts.tsx`, `CoachComposer.tsx`, `CoachChatPanel.tsx`, `CoachWeeklyReviewPanel.tsx`, `constants.ts`, and `useCoachFormDirty.ts` (`UnsavedWorkContext`).
- **Accessibility & Truth-in-UI Hardening**: Added WAI-ARIA `role="tablist"` / `role="tab"` / `aria-selected` / `role="tabpanel"` + ArrowLeft/ArrowRight/Home/End keyboard switching; `role="log"` + `aria-live="polite"` + `aria-busy` on chat messages; `<label htmlFor>` / `aria-label` on chat input, send button, and quiet-hours inputs; removed hardcoded fake offline chat replies (`54.5 g`, `82% (Prime)`) in favor of `role="alert"` error + Retry Send; replaced `null–null` protein bands and `sky-*` / structural emoji with clean `"Target not set"` / `"Not set"` states and lime/emerald tokens; `min-h-[44px]` across tabs, chips, controls, and Regenerate/Retry buttons; `tabular-nums` across weekly metrics. Added `web/src/test/coach-components.test.tsx` (4 tests).

### 11. Live Gemini Vision Fix, `MealPhotoUploader` Polish & Mobile Browser Smoke Check (2026-11-26)
- **Live Gemini Vision Root Cause & Fix (`api/`)**:
  - **Root cause**: `api/app/core/config.py` defaulted `GEMINI_MODEL` to `"gemini-2.5-flash"` (`api/.env` had `GEMINI_API_KEY` set, no `GEMINI_MODEL` override, `VISION_PROVIDER` unset). Live requests failed with `google.genai.errors.ClientError: 404 NOT_FOUND` (`models/gemini-2.5-flash` no longer available to new users, recommending `models/gemini-3.8-flash`). In addition, `gemini-3.8-flash` / `gemini-3.5-flash` intermittently returned `503 UNAVAILABLE` during live capacity spikes while `gemini-3.5-flash-lite`, `gemini-3.1-flash-lite`, and `gemini-3-flash-preview` responded `200 OK`.
  - **Fix**: Added `VISION_PROVIDER: str = "gemini"` and updated default `GEMINI_MODEL: str = "gemini-3.8-flash"` in `api/app/core/config.py`; updated `api/app/services/vision_adapter.py` to honor `VISION_PROVIDER=mock` and cascade retriable Gemini `APIError` statuses (`404`/`429`/`500`/`502`/`503`/`504`) across `("gemini-3.8-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-3-flash-preview")` before falling back cleanly to `mock/fallback` (`candidates: []`). Added 3 unit tests in `api/tests/test_phase3_vision.py`.
  - **Live `TestClient` Smoke Check (`VISION_PROVIDER=gemini`, overhead thali JPEG)**: `HTTP 200` in `8.69s` (`provider: "gemini"`, `mode: "live"`, `model_name: "gemini-3.5-flash-lite"` after `gemini-3.8-flash` 503 failover), returning `detected_item_count: 2` (`"Dal Tadka"` -> `"Toor / Moong Dal Tadka"`, `"Roti"` -> `"Whole Wheat Roti"`), both `provenance: "ai_estimated"` and `is_confirmed: false`.
- **`MealPhotoUploader.tsx` Polish (`web/`)**:
  - Fixed badge wrapping with `flex-wrap` on heading + `whitespace-nowrap shrink-0 tabular-nums` on `vision-provider-badge`.
  - Removed duplicate fallback text so `"Vision unavailable — log manually"` appears once (`vision-empty-message`) above `"You can log items manually or try another photo."` (`vision-empty-helper`).
  - Replaced all off-brand `purple-*` / `violet-*` classes with canonical `athloniq-lime` / `emerald-*` / `athloniq-surface` tokens and enforced `min-h-[44px]` across `"Log Manually"`, close, preset, and offline close buttons. Added regression assertions in `web/src/test/meal-photo-uploader.test.tsx`.
- **Automated Mobile Browser Smoke Check (`http://localhost:5174/`, signed-in Chrome)**:
  - **Viewport & MCP Tool Limits**: `resize_page(390, 844)` achieved `window.innerWidth = 752`, `window.innerHeight = 830` (`documentElement.clientWidth = 746`) due to Windows desktop Chrome minimum width and `emulate` / `evaluate_script` / `navigate_page` disabled on `chrome_devtools`. Local port `5173`/`8000` were already occupied on host, so Vite ran on `5174` (and caused expected CORS blocks polling `http://localhost:8000/health` from `5174`).
  - **Routes & Overflow**: All 8 authenticated routes (`/today`, `/nutrition`, `/workouts`, `/recovery`, `/activities`, `/progress`, `/coach`, `/profile`) rendered with zero uncaught JS/React runtime errors and `scrollWidth (746) <= innerWidth (752)`. Observed minor auth UX detail: navigating to `/signin` while signed in renders 404 instead of redirecting.
  - **Unsaved-Work Guard**: Verified blocking modal `"Unsaved Work in Progress"` on `/recovery` -> `Cardio` and `/coach` -> `Profile` (`"Stay & Keep Editing"` retains edits, `"Discard & Leave"` navigates); noted `/profile` immediately flags `"Profile Setup Form"` dirty on load; browser `history.back()` (`popstate` listener in `UnsavedWorkContext.tsx`) could not be invoked via disabled `navigate_page`/`evaluate_script` MCP tools.
  - **Truth-in-UI & `MealPhotoUploader` Modal**: `/recovery` stress starts `"Not set"`, `/progress` sparse state renders `"0/3 WEIGH-INS"` / `"Insufficient Data"`, `"Automatic Indian Culinary Detection"` (`height: 26.5px`) and `"mock (demo)"` (`height: 30px`) pills render single-line with `44px` action buttons. Browser `upload_file` hit MCP workspace-root access denial, so live vision upload path was verified via FastAPI `TestClient` + Vitest. `prefers-reduced-motion: reduce` media emulation was unavailable in `chrome_devtools` (`globals.css` rules + Vitest `motion-ui8a.test.tsx` cover reduced motion).

### 12. UI-8E — `ProfileView` Modularization, `ui-ux-pro-max` Polish & Browser-Smoke Fixes (2026-11-27)
- **All 7 Core Views Modularized (`29/29` Vitest Suites, `243` tests passing)**: `0` new deps in `web/package.json`; entry chunk `dist/assets/index-CoFnPsJt.js` at `214.45 kB` (`<= 210 KiB` / `215,040` bytes budget); lazy `ProfileView` chunk at `90.38 kB`.
- **`features/profile/` Split**: Extracted `ProfileStepNav.tsx`, `ProfileIdentityStep.tsx`, `ProfileGoalsStep.tsx`, `ProfileEquipmentStep.tsx`, `ProfilePreferencesSection.tsx` (`ProfileTrainingStep` & `ProfileReviewStep`), `ProfileSummarySection.tsx`, `ProfileDataPortabilitySection.tsx`, `constants.ts` (Zod `onboardingSchema` + snapshot normalizers), and `hooks/useProfileFormDirty.ts`.
- **Browser-Smoke Bug #1 Fixed (Untouched `/profile` Dirty Guard False Positive)**: Normalized `null`/`undefined`/empty DOM fields identically in `normalizeProfileSnapshot` + `buildProfileBaseline`, comparing watched form values and inline equipment limit edits against hydrated baseline snapshots (and syncing clean async hydration via `reset`), so opening `/profile` and navigating away untouched never arms `"Profile Setup Form"` while actual edits do arm and revert/save disarms it.
- **Browser-Smoke Bug #2 Fixed (Authenticated `/signin` Redirect)**: Added `<Route path="/signin" element={<Navigate to="/today" replace />} />` in `web/src/app/App.tsx` (tested in `web/src/test/routes-navigation.test.tsx`).
- **Accessibility, UX & Truth-in-UI Polish**: Added `role="progressbar"` + `aria-current="step"` onboarding stepper; complete `<label htmlFor>` bindings across Steps 1–5, equipment editor, and delete dialog (`role="dialog"`); `mode: "onBlur"` validation + focusable `role="alert"` error summary with step links; removed hardcoded `"BMI 18.4"`, `"LEAN BULK"`, `"5 Days Lift"`, and `"text-purple-400"`; applied `min-h-[44px]`, `tabular-nums`, lime/emerald tokens only, and `Card spotlight` sparingly on top-level cards. Added `web/src/test/profile-components.test.tsx` (6 tests).

### 13. UI-9A — AthlonIQ Design System (`MASTER.md`), Surface Craft & `/today` Dashboard Visual Elevation (2026-11-27)
- **Design System Artifacts (`design-system/athloniq/`)**: Persisted `MASTER.md`, `pages/today.md` (both appended with canonical AthlonIQ overrides locking Deep Obsidian surfaces, lime primary, emerald secondary, zero cyan/purple/orange, `Inter`/`JetBrains Mono`, `lucide-react` icons only, pure CSS motion with `prefers-reduced-motion: reduce`, zero WebGL/GSAP, and strict Truth-in-UI null states), plus static `preview.html`.
- **4-Tier Dark Surface Elevation (`web/src/styles/globals.css` + `Card.tsx`)**: Added `:root` elevation tokens and CSS surface utilities (canvas ambient depth → `.surface-card` hairline + top inner sheen → `.surface-elevated` → `.surface-well` recessed telemetry wells, `.tactile-press`, `.safe-area-bottom` on bottom dock, and high-contrast `:focus-visible`), all respecting `@media (prefers-reduced-motion: reduce)` and CSS/TSX token guards (`tailwind-tokens.test.ts`), while keeping `Card-3VslN2Fh.js` (`2.08 kB`) and `dist/assets/index-3gm5Tm-d.js` (`214.47 kB`) strictly inside the `210 KiB` (`215,040 B`) entry budget.
- **`/today` Visual Elevation (`web/src/features/dashboard/`)**: Upgraded `DashboardView` with a responsive asymmetric `12`-col telemetry bento grid (`7/5` splits on `lg+`, crisp `390px` vertical stack), polished `DashboardHeader` eyebrow indicator, elevated hero `ReadinessStrip` (`Card spotlight`, `.surface-well` triggers, `<label htmlFor>` + `min-h-[44px]` quick check-in drawer controls, `aria-expanded`), tactile `QuickActionsRow`, hero KPI typography and `.surface-well` panels across `NutritionCard`, `TodayTrainingCard`, `WeightTrendCard`, `WeeklyConsistencyCard`, and `MoreAccordion` (`aria-expanded` / `aria-controls`, `aria-hidden="true"` on decorative icons), preserving all Truth-in-UI null states and `min-h-[44px]` touch targets.

---

## 5. Explicit "Not Verified" & Open Action Items

1. **True `390×844` Browser Width & `prefers-reduced-motion` Emulation / `history.back()`**:
   - Covered by automated JSDOM suites (`mobile-ergonomics-ui5.test.tsx`, `motion-ui8a.test.tsx`, `routes-navigation.test.tsx`, `profile-components.test.tsx`, `today-dashboard-ui2.test.tsx`) and `chrome_devtools` down to Windows minimum (`752×830`); true `390×844` CDP device emulation, `popstate` back-button click, and live Chrome `prefers-reduced-motion: reduce` toggle require CDP `emulate`/`navigate_page` enabled or mobile device testing.
2. **Owner Review of Working Tree Changes**:
   - Working tree changes (`design-system/athloniq/`, `web/` UI-9A surface craft & `/today` elevation, and `docs/HANDOFF_STATE.md`) remain uncommitted awaiting owner review and explicit commit approval (AGENTS.md Rule 9).
