-- =============================================================================
-- AthlonIQ Phase 2: Working Tracking System Migration
-- File:    20261017000002_phase2_tracking.sql
-- Author:  AthlonIQ Engineering
-- Purpose: Create all Phase 2 tracking tables with UUID PKs, FK cascades,
--          composite indexes, and strict Row-Level Security.
-- Idempotent: Uses IF NOT EXISTS throughout.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. custom_foods — User-owned food entries with provenance tracking
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.custom_foods (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT        NOT NULL,
  category        TEXT        NOT NULL DEFAULT 'custom',
  serving_label   TEXT        NOT NULL,           -- e.g. '1 katori (150g)', '100g'
  serving_weight_g NUMERIC(6,1) NULL,
  calories_kcal   NUMERIC(6,1) NOT NULL,
  protein_g       NUMERIC(5,1) NOT NULL,
  carbs_g         NUMERIC(5,1) NOT NULL,
  fat_g           NUMERIC(5,1) NOT NULL,
  provenance      TEXT        NOT NULL DEFAULT 'manual_entry'
                    CHECK (provenance IN ('verified_reference','manual_entry','user_corrected','ai_estimated')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custom_foods_user
  ON public.custom_foods (user_id);

ALTER TABLE public.custom_foods ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'custom_foods' AND policyname = 'custom_foods_owner_all'
  ) THEN
    CREATE POLICY custom_foods_owner_all ON public.custom_foods
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2. food_entries — Daily meal log with confirmed / unconfirmed guardrail
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.food_entries (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logged_date     DATE        NOT NULL DEFAULT CURRENT_DATE,
  meal_slot       TEXT        NOT NULL
                    CHECK (meal_slot IN ('breakfast','lunch','dinner','snack')),
  food_name       TEXT        NOT NULL,
  quantity        NUMERIC(5,2) NOT NULL DEFAULT 1.0 CHECK (quantity > 0),
  serving_label   TEXT        NOT NULL,
  calories_kcal   NUMERIC(6,1) NOT NULL,
  protein_g       NUMERIC(5,1) NOT NULL,
  carbs_g         NUMERIC(5,1) NOT NULL,
  fat_g           NUMERIC(5,1) NOT NULL,
  provenance      TEXT        NOT NULL DEFAULT 'verified_reference'
                    CHECK (provenance IN ('verified_reference','manual_entry','user_corrected','ai_estimated')),
  -- CRITICAL: Unconfirmed photo estimates (Phase 3) MUST default FALSE
  -- and MUST NEVER pollute confirmed daily totals.
  is_confirmed    BOOLEAN     NOT NULL DEFAULT TRUE,
  notes           TEXT        NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_food_entries_user_date
  ON public.food_entries (user_id, logged_date);

ALTER TABLE public.food_entries ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'food_entries' AND policyname = 'food_entries_owner_all'
  ) THEN
    CREATE POLICY food_entries_owner_all ON public.food_entries
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3. workout_templates — User-scoped training program blueprints
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.workout_templates (
  id                      UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name                    TEXT    NOT NULL,
  focus                   TEXT    NOT NULL,
  estimated_duration_min  INTEGER NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workout_templates_user
  ON public.workout_templates (user_id);

ALTER TABLE public.workout_templates ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'workout_templates' AND policyname = 'workout_templates_owner_all'
  ) THEN
    CREATE POLICY workout_templates_owner_all ON public.workout_templates
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 4. workout_template_exercises — Exercise prescriptions inside templates
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.workout_template_exercises (
  id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id     UUID    NOT NULL REFERENCES public.workout_templates(id) ON DELETE CASCADE,
  exercise_name   TEXT    NOT NULL,
  category        TEXT    NOT NULL DEFAULT 'compound',
  equipment_key   TEXT    NULL,
  target_sets     INTEGER NOT NULL DEFAULT 3,
  target_reps_min INTEGER NOT NULL DEFAULT 6,
  target_reps_max INTEGER NOT NULL DEFAULT 12,
  rest_seconds    INTEGER NOT NULL DEFAULT 90,
  sort_order      INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_wte_template
  ON public.workout_template_exercises (template_id);

-- No separate RLS needed — access gated through workout_templates parent

-- ---------------------------------------------------------------------------
-- 5. workout_sessions — Completed or in-progress gym sessions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.workout_sessions (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logged_date       DATE        NOT NULL,
  title             TEXT        NOT NULL,
  template_id       UUID        NULL REFERENCES public.workout_templates(id) ON DELETE SET NULL,
  duration_minutes  INTEGER     NULL,
  session_rpe       NUMERIC(3,1) NULL CHECK (session_rpe IS NULL OR (session_rpe BETWEEN 1 AND 10)),
  completed         BOOLEAN     NOT NULL DEFAULT TRUE,
  notes             TEXT        NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_date
  ON public.workout_sessions (user_id, logged_date);

ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'workout_sessions' AND policyname = 'workout_sessions_owner_all'
  ) THEN
    CREATE POLICY workout_sessions_owner_all ON public.workout_sessions
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 6. exercise_sets — Individual sets within a workout session
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.exercise_sets (
  id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID    NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  user_id         UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_name   TEXT    NOT NULL,
  equipment_key   TEXT    NULL,
  set_order       INTEGER NOT NULL,
  reps            INTEGER NOT NULL CHECK (reps >= 0),
  load_kg         NUMERIC(5,2) NOT NULL DEFAULT 0,
  is_bodyweight   BOOLEAN NOT NULL DEFAULT FALSE,
  rpe             NUMERIC(3,1) NULL CHECK (rpe IS NULL OR (rpe BETWEEN 1 AND 10)),
  rir             INTEGER NULL CHECK (rir IS NULL OR (rir BETWEEN 0 AND 6)),
  is_completed    BOOLEAN NOT NULL DEFAULT TRUE,
  is_pr           BOOLEAN NOT NULL DEFAULT FALSE,
  notes           TEXT    NULL
);

CREATE INDEX IF NOT EXISTS idx_exercise_sets_session
  ON public.exercise_sets (session_id);
CREATE INDEX IF NOT EXISTS idx_exercise_sets_user
  ON public.exercise_sets (user_id);

ALTER TABLE public.exercise_sets ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'exercise_sets' AND policyname = 'exercise_sets_owner_all'
  ) THEN
    CREATE POLICY exercise_sets_owner_all ON public.exercise_sets
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 7. activity_sessions — Non-gym sports: Running, Badminton, Calisthenics
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.activity_sessions (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logged_date         DATE        NOT NULL DEFAULT CURRENT_DATE,
  activity_type       TEXT        NOT NULL
                        CHECK (activity_type IN ('running','badminton','calisthenics','other')),
  duration_minutes    NUMERIC(5,1) NOT NULL CHECK (duration_minutes > 0),
  -- Running fields
  distance_km         NUMERIC(5,2) NULL CHECK (distance_km IS NULL OR distance_km > 0),
  pace_min_per_km     NUMERIC(5,2) NULL,           -- Deterministically calculated; never fabricated
  -- Badminton fields
  match_format        TEXT        NULL
                        CHECK (match_format IS NULL OR match_format IN ('singles','doubles','free_play','drills')),
  -- Calisthenics fields
  skill_name          TEXT        NULL,
  progression_level   TEXT        NULL,
  sets_count          INTEGER     NULL,
  reps_or_hold_sec    INTEGER     NULL,
  -- Shared
  perceived_effort    INTEGER     NULL CHECK (perceived_effort IS NULL OR (perceived_effort BETWEEN 1 AND 10)),
  route_or_notes      TEXT        NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_sessions_user_date
  ON public.activity_sessions (user_id, logged_date);

ALTER TABLE public.activity_sessions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'activity_sessions' AND policyname = 'activity_sessions_owner_all'
  ) THEN
    CREATE POLICY activity_sessions_owner_all ON public.activity_sessions
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 8. body_metrics — Scale weight and optional girth measurements
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.body_metrics (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logged_date DATE        NOT NULL DEFAULT CURRENT_DATE,
  weight_kg   NUMERIC(5,2) NOT NULL CHECK (weight_kg BETWEEN 25 AND 250),
  waist_cm    NUMERIC(5,2) NULL,
  chest_cm    NUMERIC(5,2) NULL,
  arm_cm      NUMERIC(5,2) NULL,
  notes       TEXT        NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_body_metrics_user_date
  ON public.body_metrics (user_id, logged_date);

ALTER TABLE public.body_metrics ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'body_metrics' AND policyname = 'body_metrics_owner_all'
  ) THEN
    CREATE POLICY body_metrics_owner_all ON public.body_metrics
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 9. recovery_logs — Daily subjective check-in with readiness output
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recovery_logs (
  id               UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logged_date      DATE    NOT NULL DEFAULT CURRENT_DATE,
  sleep_hours      NUMERIC(3,1) NOT NULL,
  sleep_quality    INTEGER NOT NULL CHECK (sleep_quality BETWEEN 1 AND 5),
  soreness         INTEGER NOT NULL CHECK (soreness BETWEEN 1 AND 5),
  fatigue          INTEGER NOT NULL CHECK (fatigue BETWEEN 1 AND 5),
  stress           INTEGER NULL CHECK (stress IS NULL OR (stress BETWEEN 1 AND 5)),
  readiness_score  INTEGER NOT NULL,
  readiness_status TEXT    NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recovery_logs_user_date
  ON public.recovery_logs (user_id, logged_date);

ALTER TABLE public.recovery_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'recovery_logs' AND policyname = 'recovery_logs_owner_all'
  ) THEN
    CREATE POLICY recovery_logs_owner_all ON public.recovery_logs
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
