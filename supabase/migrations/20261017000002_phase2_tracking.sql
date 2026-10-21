-- =============================================================================
-- AthlonIQ Phase 2: Athlete Daily Tracking, Workouts, Nutrition & Recovery
-- File:        20261017000002_phase2_tracking.sql
-- Description: Canonical tracking schema with strict RLS, child user_id FKs,
--              numeric ranges, provenance checks, and compound date indexes.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. custom_foods — User-created food catalog extensions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.custom_foods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'custom',
    serving_label TEXT NOT NULL,
    serving_weight_g NUMERIC(6, 1) CHECK (serving_weight_g IS NULL OR serving_weight_g > 0),
    calories_kcal NUMERIC(6, 1) NOT NULL CHECK (calories_kcal >= 0),
    protein_g NUMERIC(5, 1) NOT NULL CHECK (protein_g >= 0),
    carbs_g NUMERIC(5, 1) NOT NULL CHECK (carbs_g >= 0),
    fat_g NUMERIC(5, 1) NOT NULL CHECK (fat_g >= 0),
    provenance TEXT NOT NULL DEFAULT 'manual_entry'
        CHECK (provenance IN ('user_confirmed', 'calculated_estimate', 'provisional_default', 'verified_reference', 'manual_entry', 'user_corrected', 'ai_estimated')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_custom_foods_user ON public.custom_foods(user_id);

DROP TRIGGER IF EXISTS trg_custom_foods_updated_at ON public.custom_foods;
CREATE TRIGGER trg_custom_foods_updated_at
    BEFORE UPDATE ON public.custom_foods
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.custom_foods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "custom_foods_select_own"
    ON public.custom_foods FOR SELECT TO authenticated
    USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "custom_foods_insert_own"
    ON public.custom_foods FOR INSERT TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "custom_foods_update_own"
    ON public.custom_foods FOR UPDATE TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "custom_foods_delete_own"
    ON public.custom_foods FOR DELETE TO authenticated
    USING ((SELECT auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- 2. food_entries — Daily meal logs with confirmed guardrails
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.food_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
    meal_slot TEXT NOT NULL CHECK (meal_slot IN ('breakfast', 'lunch', 'dinner', 'snack')),
    food_name TEXT NOT NULL,
    quantity NUMERIC(5, 2) NOT NULL DEFAULT 1.0 CHECK (quantity > 0),
    serving_label TEXT NOT NULL,
    calories_kcal NUMERIC(6, 1) NOT NULL CHECK (calories_kcal >= 0),
    protein_g NUMERIC(5, 1) NOT NULL CHECK (protein_g >= 0),
    carbs_g NUMERIC(5, 1) NOT NULL CHECK (carbs_g >= 0),
    fat_g NUMERIC(5, 1) NOT NULL CHECK (fat_g >= 0),
    provenance TEXT NOT NULL DEFAULT 'verified_reference'
        CHECK (provenance IN ('user_confirmed', 'calculated_estimate', 'provisional_default', 'verified_reference', 'manual_entry', 'user_corrected', 'ai_estimated')),
    is_confirmed BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_food_entries_user_date ON public.food_entries(user_id, logged_date DESC);

DROP TRIGGER IF EXISTS trg_food_entries_updated_at ON public.food_entries;
CREATE TRIGGER trg_food_entries_updated_at
    BEFORE UPDATE ON public.food_entries
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.food_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "food_entries_select_own"
    ON public.food_entries FOR SELECT TO authenticated
    USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "food_entries_insert_own"
    ON public.food_entries FOR INSERT TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "food_entries_update_own"
    ON public.food_entries FOR UPDATE TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "food_entries_delete_own"
    ON public.food_entries FOR DELETE TO authenticated
    USING ((SELECT auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- 3. workout_templates — Blueprint training programs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.workout_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    focus TEXT NOT NULL,
    estimated_duration_min INTEGER CHECK (estimated_duration_min IS NULL OR estimated_duration_min > 0),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_workout_templates_user ON public.workout_templates(user_id);

DROP TRIGGER IF EXISTS trg_workout_templates_updated_at ON public.workout_templates;
CREATE TRIGGER trg_workout_templates_updated_at
    BEFORE UPDATE ON public.workout_templates
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.workout_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workout_templates_select_own"
    ON public.workout_templates FOR SELECT TO authenticated
    USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "workout_templates_insert_own"
    ON public.workout_templates FOR INSERT TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "workout_templates_update_own"
    ON public.workout_templates FOR UPDATE TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "workout_templates_delete_own"
    ON public.workout_templates FOR DELETE TO authenticated
    USING ((SELECT auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- 4. workout_template_exercises — Exercises inside templates (child table)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.workout_template_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES public.workout_templates(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    exercise_name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'compound',
    equipment_key TEXT,
    target_sets INTEGER NOT NULL DEFAULT 3 CHECK (target_sets > 0),
    target_reps_min INTEGER NOT NULL DEFAULT 6 CHECK (target_reps_min > 0),
    target_reps_max INTEGER NOT NULL DEFAULT 12 CHECK (target_reps_max >= target_reps_min),
    rest_seconds INTEGER NOT NULL DEFAULT 90 CHECK (rest_seconds >= 0),
    sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_wte_template ON public.workout_template_exercises(template_id);
CREATE INDEX IF NOT EXISTS idx_wte_user ON public.workout_template_exercises(user_id);

DROP TRIGGER IF EXISTS trg_workout_template_exercises_updated_at ON public.workout_template_exercises;
CREATE TRIGGER trg_workout_template_exercises_updated_at
    BEFORE UPDATE ON public.workout_template_exercises
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.workout_template_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workout_template_exercises_select_own"
    ON public.workout_template_exercises FOR SELECT TO authenticated
    USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "workout_template_exercises_insert_own"
    ON public.workout_template_exercises FOR INSERT TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "workout_template_exercises_update_own"
    ON public.workout_template_exercises FOR UPDATE TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "workout_template_exercises_delete_own"
    ON public.workout_template_exercises FOR DELETE TO authenticated
    USING ((SELECT auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- 5. workout_sessions — Executed training sessions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.workout_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
    title TEXT NOT NULL,
    template_id UUID REFERENCES public.workout_templates(id) ON DELETE SET NULL,
    duration_minutes INTEGER CHECK (duration_minutes IS NULL OR duration_minutes >= 0),
    session_rpe NUMERIC(3, 1) CHECK (session_rpe IS NULL OR (session_rpe >= 1.0 AND session_rpe <= 10.0)),
    completed BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_date ON public.workout_sessions(user_id, logged_date DESC);

DROP TRIGGER IF EXISTS trg_workout_sessions_updated_at ON public.workout_sessions;
CREATE TRIGGER trg_workout_sessions_updated_at
    BEFORE UPDATE ON public.workout_sessions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workout_sessions_select_own"
    ON public.workout_sessions FOR SELECT TO authenticated
    USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "workout_sessions_insert_own"
    ON public.workout_sessions FOR INSERT TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "workout_sessions_update_own"
    ON public.workout_sessions FOR UPDATE TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "workout_sessions_delete_own"
    ON public.workout_sessions FOR DELETE TO authenticated
    USING ((SELECT auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- 6. exercise_sets — Individual sets within workout sessions (child table)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.exercise_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    exercise_name TEXT NOT NULL,
    equipment_key TEXT,
    set_order INTEGER NOT NULL CHECK (set_order >= 0),
    reps INTEGER NOT NULL CHECK (reps >= 0),
    load_kg NUMERIC(6, 2) NOT NULL DEFAULT 0 CHECK (load_kg >= 0),
    is_bodyweight BOOLEAN NOT NULL DEFAULT FALSE,
    rpe NUMERIC(3, 1) CHECK (rpe IS NULL OR (rpe >= 1.0 AND rpe <= 10.0)),
    rir INTEGER CHECK (rir IS NULL OR (rir >= 0 AND rir <= 10)),
    is_completed BOOLEAN NOT NULL DEFAULT TRUE,
    is_pr BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_exercise_sets_session ON public.exercise_sets(session_id);
CREATE INDEX IF NOT EXISTS idx_exercise_sets_user ON public.exercise_sets(user_id);

DROP TRIGGER IF EXISTS trg_exercise_sets_updated_at ON public.exercise_sets;
CREATE TRIGGER trg_exercise_sets_updated_at
    BEFORE UPDATE ON public.exercise_sets
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.exercise_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "exercise_sets_select_own"
    ON public.exercise_sets FOR SELECT TO authenticated
    USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "exercise_sets_insert_own"
    ON public.exercise_sets FOR INSERT TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "exercise_sets_update_own"
    ON public.exercise_sets FOR UPDATE TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "exercise_sets_delete_own"
    ON public.exercise_sets FOR DELETE TO authenticated
    USING ((SELECT auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- 7. activity_sessions — Non-gym sports: Running, Badminton, Calisthenics
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.activity_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('running', 'badminton', 'calisthenics', 'other')),
    duration_minutes NUMERIC(5, 1) NOT NULL CHECK (duration_minutes > 0),
    distance_km NUMERIC(5, 2) CHECK (distance_km IS NULL OR distance_km > 0),
    pace_min_per_km NUMERIC(5, 2) CHECK (pace_min_per_km IS NULL OR pace_min_per_km > 0),
    match_format TEXT CHECK (match_format IS NULL OR match_format IN ('singles', 'doubles', 'free_play', 'drills')),
    skill_name TEXT,
    progression_level TEXT,
    sets_count INTEGER CHECK (sets_count IS NULL OR sets_count >= 0),
    reps_or_hold_sec INTEGER CHECK (reps_or_hold_sec IS NULL OR reps_or_hold_sec >= 0),
    perceived_effort INTEGER CHECK (perceived_effort IS NULL OR (perceived_effort BETWEEN 1 AND 10)),
    route_or_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_activity_sessions_user_date ON public.activity_sessions(user_id, logged_date DESC);

DROP TRIGGER IF EXISTS trg_activity_sessions_updated_at ON public.activity_sessions;
CREATE TRIGGER trg_activity_sessions_updated_at
    BEFORE UPDATE ON public.activity_sessions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.activity_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_sessions_select_own"
    ON public.activity_sessions FOR SELECT TO authenticated
    USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "activity_sessions_insert_own"
    ON public.activity_sessions FOR INSERT TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "activity_sessions_update_own"
    ON public.activity_sessions FOR UPDATE TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "activity_sessions_delete_own"
    ON public.activity_sessions FOR DELETE TO authenticated
    USING ((SELECT auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- 8. body_metrics — Athlete physique & scale measurements
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.body_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
    weight_kg NUMERIC(5, 2) NOT NULL CHECK (weight_kg >= 25 AND weight_kg <= 250),
    waist_cm NUMERIC(5, 2) CHECK (waist_cm IS NULL OR (waist_cm > 30 AND waist_cm < 250)),
    chest_cm NUMERIC(5, 2) CHECK (chest_cm IS NULL OR (chest_cm > 30 AND chest_cm < 250)),
    arm_cm NUMERIC(5, 2) CHECK (arm_cm IS NULL OR (arm_cm > 10 AND arm_cm < 100)),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_body_metrics_user_date ON public.body_metrics(user_id, logged_date DESC);

DROP TRIGGER IF EXISTS trg_body_metrics_updated_at ON public.body_metrics;
CREATE TRIGGER trg_body_metrics_updated_at
    BEFORE UPDATE ON public.body_metrics
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.body_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "body_metrics_select_own"
    ON public.body_metrics FOR SELECT TO authenticated
    USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "body_metrics_insert_own"
    ON public.body_metrics FOR INSERT TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "body_metrics_update_own"
    ON public.body_metrics FOR UPDATE TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "body_metrics_delete_own"
    ON public.body_metrics FOR DELETE TO authenticated
    USING ((SELECT auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- 9. recovery_logs — Daily subjective check-in & readiness engine
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recovery_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
    sleep_hours NUMERIC(3, 1) NOT NULL CHECK (sleep_hours >= 0 AND sleep_hours <= 24),
    sleep_quality INTEGER NOT NULL CHECK (sleep_quality BETWEEN 1 AND 5),
    soreness INTEGER NOT NULL CHECK (soreness BETWEEN 1 AND 5),
    fatigue INTEGER NOT NULL CHECK (fatigue BETWEEN 1 AND 5),
    stress INTEGER CHECK (stress IS NULL OR (stress BETWEEN 1 AND 5)),
    readiness_score INTEGER NOT NULL CHECK (readiness_score BETWEEN 0 AND 100),
    readiness_status TEXT NOT NULL CHECK (readiness_status IN ('Prime', 'Moderate', 'Recover')),
    triggers JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE (user_id, logged_date)
);

CREATE INDEX IF NOT EXISTS idx_recovery_logs_user_date ON public.recovery_logs(user_id, logged_date DESC);

DROP TRIGGER IF EXISTS trg_recovery_logs_updated_at ON public.recovery_logs;
CREATE TRIGGER trg_recovery_logs_updated_at
    BEFORE UPDATE ON public.recovery_logs
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.recovery_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recovery_logs_select_own"
    ON public.recovery_logs FOR SELECT TO authenticated
    USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "recovery_logs_insert_own"
    ON public.recovery_logs FOR INSERT TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "recovery_logs_update_own"
    ON public.recovery_logs FOR UPDATE TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "recovery_logs_delete_own"
    ON public.recovery_logs FOR DELETE TO authenticated
    USING ((SELECT auth.uid()) = user_id);
