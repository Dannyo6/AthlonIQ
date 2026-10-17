-- ==============================================================================
-- AthlonIQ — Initial Database Schema Migration
-- Migration: 20261017000001_athloniq_init.sql
-- Description: Core tables, RLS policies, indexes, and triggers for AthlonIQ OS (Phase 1)
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
-- 1. Profiles (Athlete Identity, Biometrics & Onboarding Baselines)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    
    -- Deterministic initial defaults
    age INTEGER DEFAULT 20 NOT NULL CHECK (age > 0 AND age < 130),
    height_cm NUMERIC(5, 2) DEFAULT 173.0 NOT NULL CHECK (height_cm > 0),
    weight_kg NUMERIC(5, 2) DEFAULT 55.0 NOT NULL CHECK (weight_kg > 0),
    dietary_pattern TEXT DEFAULT 'nonvegetarian' NOT NULL CHECK (dietary_pattern IN ('nonvegetarian', 'vegetarian', 'vegan', 'pescatarian', 'eggetarian', 'keto', 'other')),
    primary_goal TEXT DEFAULT 'lean_bulk' NOT NULL CHECK (primary_goal IN ('lean_bulk', 'hypertrophy', 'strength', 'fat_loss', 'recomposition', 'endurance', 'maintenance')),
    training_scope TEXT[] DEFAULT ARRAY['gym', 'calisthenics', 'badminton', 'running'] NOT NULL,
    training_days_per_week INTEGER DEFAULT 5 NOT NULL CHECK (training_days_per_week BETWEEN 1 AND 7),
    training_environment TEXT DEFAULT 'home_gym' NOT NULL CHECK (training_environment IN ('home_gym', 'commercial_gym', 'calisthenics_park', 'hybrid')),
    calorie_tracking_habit TEXT DEFAULT 'rough_estimates' NOT NULL CHECK (calorie_tracking_habit IN ('weighing_foods', 'rough_estimates', 'visual_portions', 'mindful_eating', 'none')),

    -- Known unknowns MUST default to NULL
    sex TEXT CHECK (sex IN ('male', 'female', 'other')),
    waist_cm NUMERIC(5, 2) CHECK (waist_cm > 0),
    experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'elite')),
    current_split TEXT CHECK (current_split IN ('ppl', 'upper_lower', 'full_body', 'bro_split', 'custom', 'need_recommendation')),
    weekly_badminton_sessions INTEGER CHECK (weekly_badminton_sessions >= 0),
    weekly_running_sessions INTEGER CHECK (weekly_running_sessions >= 0),
    sleep_baseline_hours NUMERIC(3, 1) CHECK (sleep_baseline_hours > 0 AND sleep_baseline_hours <= 16),
    exercise_limitations TEXT,

    -- Onboarding flags & state
    onboarding_step INTEGER DEFAULT 1 NOT NULL CHECK (onboarding_step BETWEEN 1 AND 5),
    onboarding_completed BOOLEAN DEFAULT FALSE NOT NULL,
    equipment_confirmed BOOLEAN DEFAULT FALSE NOT NULL,

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

CREATE POLICY "Athletes can delete their own profile"
    ON public.profiles FOR DELETE
    USING (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- 2. User Equipment (Home Gym & Gear Verification)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    item_key TEXT NOT NULL,
    item_name TEXT NOT NULL,
    max_load_kg NUMERIC(6, 2),
    min_increment_kg NUMERIC(4, 2) DEFAULT 1.25,
    is_available BOOLEAN DEFAULT TRUE NOT NULL,
    is_confirmed BOOLEAN DEFAULT FALSE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE (user_id, item_key)
);

CREATE INDEX IF NOT EXISTS idx_user_equipment_user ON public.user_equipment(user_id);

CREATE TRIGGER trg_user_equipment_updated_at
    BEFORE UPDATE ON public.user_equipment
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.user_equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athletes can view their equipment"
    ON public.user_equipment FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Athletes can insert their equipment"
    ON public.user_equipment FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Athletes can update their equipment"
    ON public.user_equipment FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Athletes can delete their equipment"
    ON public.user_equipment FOR DELETE
    USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 3. User Goals & Macro Targets (Deterministic & Provenance-Tracked)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    protein_min_g INTEGER DEFAULT 88 NOT NULL CHECK (protein_min_g > 0),
    protein_max_g INTEGER DEFAULT 121 NOT NULL CHECK (protein_max_g >= protein_min_g),
    protein_target_g INTEGER DEFAULT 110 NOT NULL CHECK (protein_target_g >= protein_min_g AND protein_target_g <= protein_max_g),
    protein_provenance TEXT DEFAULT 'provisional_default' NOT NULL,
    
    -- Calorie targets remain NULL until onboarding energy inputs are complete
    calorie_target_kcal INTEGER CHECK (calorie_target_kcal > 500 AND calorie_target_kcal < 8000),
    calorie_provenance TEXT DEFAULT 'awaiting_onboarding' NOT NULL,
    
    carbs_target_g INTEGER CHECK (carbs_target_g >= 0),
    fat_target_g INTEGER CHECK (fat_target_g >= 0),
    water_target_ml INTEGER DEFAULT 3500 NOT NULL CHECK (water_target_ml > 0),
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER trg_user_goals_updated_at
    BEFORE UPDATE ON public.user_goals
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athletes can view their goals"
    ON public.user_goals FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Athletes can insert their goals"
    ON public.user_goals FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Athletes can update their goals"
    ON public.user_goals FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Athletes can delete their goals"
    ON public.user_goals FOR DELETE
    USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 4. User Preferences (Units, Timezone, Notification Windows)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    weight_unit TEXT DEFAULT 'kg' NOT NULL CHECK (weight_unit IN ('kg', 'lbs')),
    distance_unit TEXT DEFAULT 'km' NOT NULL CHECK (distance_unit IN ('km', 'miles')),
    timezone TEXT DEFAULT 'Asia/Kolkata' NOT NULL,
    notifications_enabled BOOLEAN DEFAULT FALSE NOT NULL,
    quiet_hours_start TIME DEFAULT '22:30' NOT NULL,
    quiet_hours_end TIME DEFAULT '07:00' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER trg_user_preferences_updated_at
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athletes can view their preferences"
    ON public.user_preferences FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Athletes can insert their preferences"
    ON public.user_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Athletes can update their preferences"
    ON public.user_preferences FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Athletes can delete their preferences"
    ON public.user_preferences FOR DELETE
    USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 5. Athlete Physique & Biometrics (Time-series)
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

CREATE POLICY "Athletes can manage their biometric metrics"
    ON public.athlete_metrics FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 6. Exercise Library (Reference Catalog)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL CHECK (category IN ('barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'cardio')),
    primary_muscle TEXT NOT NULL,
    secondary_muscles TEXT[] DEFAULT '{}',
    instructions TEXT,
    is_custom BOOLEAN DEFAULT FALSE NOT NULL,
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

CREATE POLICY "Users can update their custom exercises"
    ON public.exercises FOR UPDATE
    USING (auth.uid() = user_id AND is_custom = TRUE);

CREATE POLICY "Users can delete their custom exercises"
    ON public.exercises FOR DELETE
    USING (auth.uid() = user_id AND is_custom = TRUE);

-- ------------------------------------------------------------------------------
-- 7. Workouts & Sessions
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
-- 8. Nutrition Logs & Meals
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.nutrition_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    target_calories INTEGER,
    target_protein_g INTEGER NOT NULL DEFAULT 110,
    target_carbs_g INTEGER,
    target_fat_g INTEGER,
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
-- 9. Recovery & Subjective Check-in Logs (Deterministic Rules Engine)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recovery_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    sleep_duration_hours NUMERIC(3, 1) NOT NULL CHECK (sleep_duration_hours >= 0 AND sleep_duration_hours <= 24),
    sleep_quality INTEGER NOT NULL CHECK (sleep_quality BETWEEN 1 AND 5),
    soreness INTEGER NOT NULL CHECK (soreness BETWEEN 1 AND 5),
    fatigue INTEGER NOT NULL CHECK (fatigue BETWEEN 1 AND 5),
    stress INTEGER CHECK (stress BETWEEN 1 AND 5),
    readiness_score INTEGER NOT NULL CHECK (readiness_score BETWEEN 0 AND 100),
    readiness_status TEXT NOT NULL CHECK (readiness_status IN ('Prime', 'Moderate', 'Recover')),
    triggers JSONB DEFAULT '[]'::jsonb,
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
-- 10. AI Performance Coach Sessions & Messages
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

-- ------------------------------------------------------------------------------
-- 11. Automated Athlete Provisioning Trigger (On Signup)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_athlete_signup()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. Initialize Profile with deterministic Phase 1 baselines
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        age,
        height_cm,
        weight_kg,
        dietary_pattern,
        primary_goal,
        training_scope,
        training_days_per_week,
        training_environment,
        calorie_tracking_habit,
        onboarding_step,
        onboarding_completed,
        equipment_confirmed,
        sex,
        waist_cm,
        experience_level,
        current_split,
        weekly_badminton_sessions,
        weekly_running_sessions,
        sleep_baseline_hours,
        exercise_limitations
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Athlete'),
        20,
        173.0,
        55.0,
        'nonvegetarian',
        'lean_bulk',
        ARRAY['gym', 'calisthenics', 'badminton', 'running'],
        5,
        'home_gym',
        'rough_estimates',
        1,
        FALSE,
        FALSE,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL
    );

    -- 2. Seed unconfirmed historical home gym items
    INSERT INTO public.user_equipment (user_id, item_key, item_name, max_load_kg, min_increment_kg, is_available, is_confirmed)
    VALUES
        (NEW.id, 'bench', 'Bench', 150.0, 2.5, TRUE, FALSE),
        (NEW.id, 'squat_rack', 'Squat/Power Rack', 200.0, 2.5, TRUE, FALSE),
        (NEW.id, 'dips_station', 'Dips Station', NULL, NULL, TRUE, FALSE),
        (NEW.id, 'lat_pulldown_station', 'Lat Pulldown Station', 100.0, 5.0, TRUE, FALSE),
        (NEW.id, 'free_weights_70kg', 'Free Weights up to 70 kg', 70.0, 1.25, TRUE, FALSE);

    -- 3. Seed provisional goals (protein 88-121g, calories awaiting onboarding)
    INSERT INTO public.user_goals (
        user_id,
        protein_min_g,
        protein_max_g,
        protein_target_g,
        protein_provenance,
        calorie_target_kcal,
        calorie_provenance,
        carbs_target_g,
        fat_target_g
    ) VALUES (
        NEW.id,
        88,
        121,
        110,
        'provisional_default',
        NULL,
        'awaiting_onboarding',
        NULL,
        NULL
    );

    -- 4. Seed user preferences
    INSERT INTO public.user_preferences (
        user_id,
        weight_unit,
        distance_unit,
        timezone,
        notifications_enabled,
        quiet_hours_start,
        quiet_hours_end
    ) VALUES (
        NEW.id,
        'kg',
        'km',
        'Asia/Kolkata',
        FALSE,
        '22:30',
        '07:00'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger to auth.users table
DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_athlete_signup();
