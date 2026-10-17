-- ==============================================================================
-- AthlonIQ — Initial Database Schema Migration
-- Migration: 20261017000001_athloniq_init.sql
-- Description: Core tables, RLS policies, indexes, and triggers for AthlonIQ OS
-- ==============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Helper function for auto-updating timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 1. Profiles (Athlete Identity & Baselines)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    height_cm NUMERIC(5, 2) CHECK (height_cm > 0),
    experience_level TEXT DEFAULT 'intermediate' CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'elite')),
    primary_goal TEXT DEFAULT 'hypertrophy' CHECK (primary_goal IN ('hypertrophy', 'strength', 'fat_loss', 'recomposition', 'endurance')),
    target_weight_kg NUMERIC(5, 2) CHECK (target_weight_kg > 0),
    activity_multiplier NUMERIC(3, 2) DEFAULT 1.375 CHECK (activity_multiplier >= 1.0 AND activity_multiplier <= 2.5),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athletes can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Athletes can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Athletes can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- 2. Athlete Physique & Biometric Metrics (Time-series)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.athlete_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    recorded_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    weight_kg NUMERIC(5, 2) NOT NULL CHECK (weight_kg > 0),
    body_fat_pct NUMERIC(4, 2) CHECK (body_fat_pct >= 0 AND body_fat_pct <= 60),
    muscle_mass_kg NUMERIC(5, 2) CHECK (muscle_mass_kg > 0),
    chest_cm NUMERIC(5, 2),
    waist_cm NUMERIC(5, 2),
    hips_cm NUMERIC(5, 2),
    arms_cm NUMERIC(5, 2),
    thighs_cm NUMERIC(5, 2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_athlete_metrics_user_time 
    ON public.athlete_metrics(user_id, recorded_at DESC);

ALTER TABLE public.athlete_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athletes can manage their own biometric metrics"
    ON public.athlete_metrics FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 3. Exercise Library (Reference Catalog)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL CHECK (category IN ('barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'cardio')),
    primary_muscle TEXT NOT NULL,
    secondary_muscles TEXT[] DEFAULT '{}',
    instructions TEXT,
    is_custom BOOLEAN DEFAULT FALSE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Global or user-owned exercises are visible"
    ON public.exercises FOR SELECT
    USING (is_custom = FALSE OR auth.uid() = user_id);

CREATE POLICY "Users can create custom exercises"
    ON public.exercises FOR INSERT
    WITH CHECK (auth.uid() = user_id AND is_custom = TRUE);

-- ------------------------------------------------------------------------------
-- 4. Workouts & Sessions
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.workouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMPTZ,
    duration_minutes INTEGER CHECK (duration_minutes >= 0),
    total_volume_kg NUMERIC(10, 2) DEFAULT 0,
    perceived_rpe NUMERIC(3, 1) CHECK (perceived_rpe >= 1.0 AND perceived_rpe <= 10.0),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_workouts_user_date ON public.workouts(user_id, started_at DESC);

ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athletes can manage their workouts"
    ON public.workouts FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.workout_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE RESTRICT,
    order_index INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout ON public.workout_exercises(workout_id);

ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athletes can manage workout exercises"
    ON public.workout_exercises FOR ALL
    USING (EXISTS (SELECT 1 FROM public.workouts w WHERE w.id = workout_id AND w.user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.workouts w WHERE w.id = workout_id AND w.user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.exercise_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_exercise_id UUID NOT NULL REFERENCES public.workout_exercises(id) ON DELETE CASCADE,
    set_number INTEGER NOT NULL,
    weight_kg NUMERIC(6, 2) NOT NULL DEFAULT 0,
    reps INTEGER NOT NULL DEFAULT 0,
    rpe NUMERIC(3, 1) CHECK (rpe >= 1.0 AND rpe <= 10.0),
    is_warmup BOOLEAN DEFAULT FALSE,
    is_failure BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.exercise_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athletes can manage exercise sets"
    ON public.exercise_sets FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.workout_exercises we
        JOIN public.workouts w ON we.workout_id = w.id
        WHERE we.id = workout_exercise_id AND w.user_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.workout_exercises we
        JOIN public.workouts w ON we.workout_id = w.id
        WHERE we.id = workout_exercise_id AND w.user_id = auth.uid()
    ));

-- ------------------------------------------------------------------------------
-- 5. Nutrition Logs & Meals
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.nutrition_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    target_calories INTEGER NOT NULL DEFAULT 2500,
    target_protein_g INTEGER NOT NULL DEFAULT 180,
    target_carbs_g INTEGER NOT NULL DEFAULT 275,
    target_fat_g INTEGER NOT NULL DEFAULT 70,
    total_calories INTEGER DEFAULT 0,
    total_protein_g INTEGER DEFAULT 0,
    total_carbs_g INTEGER DEFAULT 0,
    total_fat_g INTEGER DEFAULT 0,
    water_intake_ml INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE (user_id, log_date)
);

CREATE INDEX IF NOT EXISTS idx_nutrition_user_date ON public.nutrition_logs(user_id, log_date DESC);

ALTER TABLE public.nutrition_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athletes can manage their nutrition logs"
    ON public.nutrition_logs FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nutrition_log_id UUID NOT NULL REFERENCES public.nutrition_logs(id) ON DELETE CASCADE,
    meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout')),
    name TEXT NOT NULL,
    calories INTEGER NOT NULL DEFAULT 0,
    protein_g NUMERIC(5, 1) DEFAULT 0,
    carbs_g NUMERIC(5, 1) DEFAULT 0,
    fat_g NUMERIC(5, 1) DEFAULT 0,
    logged_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athletes can manage their meals"
    ON public.meals FOR ALL
    USING (EXISTS (SELECT 1 FROM public.nutrition_logs nl WHERE nl.id = nutrition_log_id AND nl.user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.nutrition_logs nl WHERE nl.id = nutrition_log_id AND nl.user_id = auth.uid()));

-- ------------------------------------------------------------------------------
-- 6. Recovery & Biometrics
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recovery_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    sleep_duration_minutes INTEGER CHECK (sleep_duration_minutes >= 0),
    sleep_quality_score INTEGER CHECK (sleep_quality_score BETWEEN 0 AND 100),
    resting_heart_rate INTEGER CHECK (resting_heart_rate > 30 AND resting_heart_rate < 200),
    hrv_rmssd_ms NUMERIC(5, 1) CHECK (hrv_rmssd_ms >= 0),
    soreness_score INTEGER CHECK (soreness_score BETWEEN 1 AND 10),
    readiness_score INTEGER CHECK (readiness_score BETWEEN 0 AND 100),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE (user_id, log_date)
);

CREATE INDEX IF NOT EXISTS idx_recovery_user_date ON public.recovery_logs(user_id, log_date DESC);

ALTER TABLE public.recovery_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athletes can manage their recovery logs"
    ON public.recovery_logs FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 7. AI Performance Coach Sessions & Messages
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coach_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT DEFAULT 'Performance Coaching',
    context_snapshot JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.coach_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athletes can manage their coach sessions"
    ON public.coach_sessions FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.coach_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.coach_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    action_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_coach_messages_session ON public.coach_messages(session_id, created_at ASC);

ALTER TABLE public.coach_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athletes can manage their coach messages"
    ON public.coach_messages FOR ALL
    USING (EXISTS (SELECT 1 FROM public.coach_sessions cs WHERE cs.id = session_id AND cs.user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.coach_sessions cs WHERE cs.id = session_id AND cs.user_id = auth.uid()));
