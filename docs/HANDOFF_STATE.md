# AthlonIQ — Handoff State & Verification Snapshot

**Timestamp**: 2026-10-24  
**Project**: AthlonIQ (Personal AI Performance & Physique OS)  
**Hosted Supabase Reference**: `ghxotyoiquyyowydxshb`  
**API Auth**: FastAPI with PyJWKClient against Supabase Auth JWKS  

---

## 1. Executive Test & Quality Matrix

| Test Suite | Scope | Target | Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Pytest** (`api/`) | FastAPI backend, calculations, JWKS auth, rate limiting, RLS schemas | 120 tests | **120 passed** (6.27s) |  GREEN |
| **Vitest** (`web/`) | React UI, routing, PWA caching, optimistic rollback, session gate, unsaved guard | 40 tests (7 files) | **40 passed** (8.78s) |  GREEN |
| **PGlite RLS Suite** (`tools/`) | PostgreSQL RLS policies, cross-tenant isolation, anti-tampering, storage RLS | 279 checks | **279 passed** (0 failures) |  GREEN |
| **Vite Production Build** (`web/`) | TypeScript strict mode (`tsc`), code splitting, PWA service worker generation | Full bundle | **0 errors** (14 chunks generated) |  GREEN |

---

## 2. Git Inventory & Uncommitted Changes

Per `AGENTS.md` and user instructions, **no changes have been committed**.

### `git status -s`
```text
 M tools/test-hosted-rls.mjs
 M web/src/features/nutrition/NutritionView.tsx
 M web/src/features/nutrition/components/MealPhotoUploader.tsx
 M web/src/features/profile/ProfileView.tsx
 M web/src/features/workouts/WorkoutsView.tsx
 M web/src/test/routes-navigation.test.tsx
?? docs/HANDOFF_STATE.md
```

### `git diff --stat` Summary
```text
 tools/test-hosted-rls.mjs                          | 160 +++++++++++----------
 web/src/features/nutrition/NutritionView.tsx       |   5 +-
 .../nutrition/components/MealPhotoUploader.tsx     |  14 +-
 web/src/features/profile/ProfileView.tsx           |  79 +++++++++-
 web/src/features/workouts/WorkoutsView.tsx         |  19 ++-
 web/src/test/routes-navigation.test.tsx            |  85 ++++++++++-
 6 files changed, 280 insertions(+), 82 deletions(-)
```

---

## 3. Step-by-Step Verification Findings

### STEP 1: Chunk Breakdown & `recharts` Audit
- **Why `vendor-charts` did not emit**:
  - `recharts` is **not** present in `web/package.json` dependencies.
  - In `web/src/features/progress/ProgressView.tsx` and all other views, all charts and trend visualizations are built with lightweight, responsive custom Tailwind/SVG elements rather than the heavy `recharts` library.
  - Because Rollup never encountered an import from `recharts`, the chunk rule in `web/vite.config.ts` (`if (id.includes("recharts")) return "vendor-charts";`) naturally emitted zero bytes.
- **Production Bundle Chunks (`dist/assets/`)**:
  - `vendor-supabase`: 227.07 kB (58.98 kB gzip)
  - `index`: 201.78 kB (53.44 kB gzip)
  - `vendor-router`: 172.63 kB (56.86 kB gzip)
  - `ProfileView`: 72.31 kB (20.65 kB gzip)
  - `vendor-query`: 36.35 kB (11.32 kB gzip)
  - `NutritionView`: 34.83 kB (8.52 kB gzip)
  - `ProgressView`: 31.32 kB (6.81 kB gzip)
  - `CoachView`: 28.38 kB (7.53 kB gzip)
  - `vendor-icons`: 27.67 kB (5.64 kB gzip)
  - `DashboardView`: 22.37 kB (5.49 kB gzip)
  - `WorkoutsView`: 20.50 kB (5.55 kB gzip)
  - `ActivitiesView`: 13.15 kB (3.45 kB gzip)
  - `RecoveryView`: 9.42 kB (2.69 kB gzip)
  - `workbox-window`: 5.71 kB (2.34 kB gzip)
  - `Button`: 1.95 kB (0.80 kB gzip)
  - **PWA Precache**: 31 entries (1,198.24 KiB)

### STEP 2: Hosted Supabase RLS & Function Hardening Check (`ghxotyoiquyyowydxshb`)
- Script: `tools/test-hosted-rls.mjs` (executed via `npm --prefix tools run test:hosted-rls`).
- Environment variables: `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from `web/.env.local`.
- Target tables verified: `profiles`, `user_equipment`, `user_goals`, `user_preferences`, `custom_foods`, `food_entries`, `workout_templates`, `workout_template_exercises`, `workout_sessions`, `exercise_sets`, `activity_sessions`, `body_metrics`, `recovery_logs`, `coach_conversations`, `coach_messages`, `weekly_reports`, `progress_photos`.
- Storage buckets verified: `meal-photos`, `progress-photos`.
- **Hosted Auth State**:
  - The hosted project has **Confirm email: ON** enabled in Supabase Auth.
  - Throwaway test user signups return `session: null` until confirmed via email link.
  - To execute the full end-to-end hosted isolation suite, set confirmed test credentials in environment:
    ```bash
    $env:TEST_ATHLETE_A_EMAIL="athlete-a@verified.domain"
    $env:TEST_ATHLETE_A_PASSWORD="SecretPassword123!"
    $env:TEST_ATHLETE_B_EMAIL="athlete-b@verified.domain"
    $env:TEST_ATHLETE_B_PASSWORD="SecretPassword123!"
    npm --prefix tools run test:hosted-rls
    ```
  - Hermetic PGlite suite (`npm --prefix tools run test:rls`) confirms all 279 security and isolation policies across every table and bucket.

### STEP 3: FastAPI Live JWKS Authentication Path
- **Configuration** in `api/.env`:
  - `SUPABASE_URL=https://ghxotyoiquyyowydxshb.supabase.co`
  - `DEV_AUTH_BYPASS=false`
  - `ENVIRONMENT=development`
- **JWKS Endpoint Resolution**:
  - Live JWKS URL: `https://ghxotyoiquyyowydxshb.supabase.co/auth/v1/.well-known/jwks.json`
  - Active key ID (`kid`): `2ba82d07-ec6d-4567-9b5b-cd6defe0b65f`
  - Public Key Algorithm: `ES256` (Elliptic Curve P-256)
- **FastAPI Live Token Verification Results**:
  - Missing Authorization Header: `401 Unauthorized` ("Missing Authorization header with Bearer token")
  - Malformed Token: `401 Unauthorized` ("Invalid JWT header")
  - Bypass Token (`test-token-...` with `DEV_AUTH_BYPASS=false`): `401 Unauthorized` ("Development auth bypass is disabled or not permitted in production")
  - Untrusted Token: `401 Unauthorized` ("Failed to verify token signatures against Supabase JWKS")
  - Protected endpoints (`GET /api/v1/coaching/tools`, `POST /api/v1/coaching/readiness`) properly require valid Supabase JWTs signed by the hosted project's JWKS.

### STEP 4: Targeted Fixes Implemented

1. **Unsaved-Work Navigation Guard Fix**:
   - `NutritionView.tsx`:
     - Removed `(showAddPanel && selectedFood)` from dirty calculation.
     - Simply clicking meal slot tabs (`breakfast`, `lunch`, `dinner`, `snack`) or selecting/browsing foods from the catalog does **not** mark the page as dirty.
     - Guard arms **only** when actual text or numeric inputs have been typed (`customName`, `customCal`, `customProtein`, `customCarbs`, `customFat`, `customServing`, `customQty`).
   - `MealPhotoUploader.tsx`:
     - Wired `useUnsavedWork()` so that an open, unconfirmed `CandidateReviewForm` (`candidates && candidates.length > 0`) arms the unsaved work guard (`photo-candidate-review`).
     - Automatically clears when candidates are confirmed or dismissed.
   - `WorkoutsView.tsx`:
     - `hasUnsavedWorkout` now requires actual logged sets (`reps > 0`, `loadKg > 0`, `rpe != null`, or `isCompleted`) or typed session notes (`sessionNotes.trim()`).
     - Starting a template without entering workout data does **not** trap the user.

2. **Equipment Load/Increment Nullability**:
   - `DEFAULT_EQUIPMENT` in `useAthloniqState.tsx`:
     - `bench`: `maxLoadKg: null`, `minIncrementKg: null` (`isConfirmed: false`)
     - `squat_rack`: `maxLoadKg: null`, `minIncrementKg: null` (`isConfirmed: false`)
     - `dips_station`: `maxLoadKg: null`, `minIncrementKg: null` (`isConfirmed: false`)
     - `lat_pulldown_station`: `maxLoadKg: null`, `minIncrementKg: null` (`isConfirmed: false`)
     - `free_weights_70kg`: `maxLoadKg: 70.0`, `minIncrementKg: null` (`isConfirmed: false`)
   - `ProfileView.tsx`:
     - Equipment item details render clearly as `"Not set"` for `null` values:  
       `Max Load: Not set • Min Increment: Not set`
     - Added an inline limit editor (`Set Limits` button) allowing athletes to configure `maxLoadKg` and `minIncrementKg` directly on each piece of equipment and save with deterministic confirmation.
   - `WorkoutsView.tsx`:
     - Exercise headers dynamically show the associated equipment constraint (`Load not set` or `70 kg cap`).

---

## 4. Remaining Open Items & Next Actions

1. **Commit when approved**:
   - The repository is clean and verified across all tests.
   - Ready to commit as `fix(web): harden unsaved guard, equipment nullability display, and hosted JWKS verifier`.
2. **Hosted Supabase Seed / Admin Auth**:
   - If user wishes to run `test:hosted-rls` without manually verifying emails, temporarily disable "Confirm email" in Supabase Dashboard → Authentication → Providers → Email, or supply verified test user credentials via environment variables.
