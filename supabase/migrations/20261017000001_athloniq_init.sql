-- ==============================================================================
-- AthlonIQ — Initial Database Schema Migration
-- Migration: 20261017000001_athloniq_init.sql
-- Description: Core identity, equipment, goals, preferences, and exercises.
-- ==============================================================================

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
    height_cm NUMERIC(5, 2) DEFAULT 173.0 NOT NULL CHECK (height_cm > 0 AND height_cm < 300),
    weight_kg NUMERIC(5, 2) DEFAULT 55.0 NOT NULL CHECK (weight_kg >= 25 AND weight_kg <= 250),
    dietary_pattern TEXT DEFAULT 'nonvegetarian' NOT NULL CHECK (dietary_pattern IN ('nonvegetarian', 'vegetarian', 'vegan', 'pescatarian', 'eggetarian', 'keto', 'other')),
    primary_goal TEXT DEFAULT 'lean_bulk' NOT NULL CHECK (primary_goal IN ('lean_bulk', 'hypertrophy', 'strength', 'fat_loss', 'recomposition', 'endurance', 'maintenance')),
    training_scope TEXT[] DEFAULT ARRAY['gym', 'calisthenics', 'badminton', 'running'] NOT NULL,
    training_days_per_week INTEGER DEFAULT 5 NOT NULL CHECK (training_days_per_week BETWEEN 1 AND 7),
    training_environment TEXT DEFAULT 'home_gym' NOT NULL CHECK (training_environment IN ('home_gym', 'commercial_gym', 'calisthenics_park', 'hybrid')),
    calorie_tracking_habit TEXT DEFAULT 'rough_estimates' NOT NULL CHECK (calorie_tracking_habit IN ('weighing_foods', 'rough_estimates', 'visual_portions', 'mindful_eating', 'none')),

    -- Known unknowns MUST default to NULL
    sex TEXT CHECK (sex IS NULL OR sex IN ('male', 'female', 'other')),
    waist_cm NUMERIC(5, 2) CHECK (waist_cm IS NULL OR (waist_cm > 30 AND waist_cm < 250)),
    experience_level TEXT CHECK (experience_level IS NULL OR experience_level IN ('beginner', 'intermediate', 'advanced', 'elite')),
    current_split TEXT CHECK (current_split IS NULL OR current_split IN ('ppl', 'upper_lower', 'full_body', 'bro_split', 'custom', 'need_recommendation')),
    weekly_badminton_sessions INTEGER CHECK (weekly_badminton_sessions IS NULL OR weekly_badminton_sessions >= 0),
    weekly_running_sessions INTEGER CHECK (weekly_running_sessions IS NULL OR weekly_running_sessions >= 0),
    sleep_baseline_hours NUMERIC(3, 1) CHECK (sleep_baseline_hours IS NULL OR (sleep_baseline_hours > 0 AND sleep_baseline_hours <= 24)),
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

CREATE POLICY "profiles_select_own"
    ON public.profiles FOR SELECT TO authenticated
    USING ((SELECT auth.uid()) = id);

CREATE POLICY "profiles_insert_own"
    ON public.profiles FOR INSERT TO authenticated
    WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "profiles_update_own"
    ON public.profiles FOR UPDATE TO authenticated
    USING ((SELECT auth.uid()) = id)
    WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "profiles_delete_own"
    ON public.profiles FOR DELETE TO authenticated
    USING ((SELECT auth.uid()) = id);

-- ------------------------------------------------------------------------------
-- 2. User Equipment (Home Gym & Gear Verification)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    item_key TEXT NOT NULL,
    item_name TEXT NOT NULL,
    max_load_kg NUMERIC(6, 2) CHECK (max_load_kg IS NULL OR max_load_kg > 0),
    min_increment_kg NUMERIC(4, 2) DEFAULT 1.25 CHECK (min_increment_kg IS NULL OR min_increment_kg > 0),
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

CREATE POLICY "user_equipment_select_own"
    ON public.user_equipment FOR SELECT TO authenticated
    USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "user_equipment_insert_own"
    ON public.user_equipment FOR INSERT TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "user_equipment_update_own"
    ON public.user_equipment FOR UPDATE TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "user_equipment_delete_own"
    ON public.user_equipment FOR DELETE TO authenticated
    USING ((SELECT auth.uid()) = user_id);

-- ------------------------------------------------------------------------------
-- 3. User Goals & Macro Targets (Deterministic & Provenance-Tracked)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    protein_min_g INTEGER DEFAULT 88 NOT NULL CHECK (protein_min_g > 0),
    protein_max_g INTEGER DEFAULT 121 NOT NULL CHECK (protein_max_g >= protein_min_g),
    protein_target_g INTEGER DEFAULT 110 NOT NULL CHECK (protein_target_g >= protein_min_g AND protein_target_g <= protein_max_g),
    protein_provenance TEXT DEFAULT 'provisional_default' NOT NULL CHECK (protein_provenance IN ('user_confirmed', 'calculated_estimate', 'provisional_default', 'verified_reference', 'manual_entry', 'user_corrected', 'ai_estimated')),
    
    -- Calorie targets remain NULL until onboarding energy inputs are complete
    calorie_target_kcal INTEGER CHECK (calorie_target_kcal IS NULL OR (calorie_target_kcal > 500 AND calorie_target_kcal < 8000)),
    calorie_provenance TEXT DEFAULT 'provisional_default' NOT NULL CHECK (calorie_provenance IN ('user_confirmed', 'calculated_estimate', 'provisional_default', 'verified_reference', 'manual_entry', 'user_corrected', 'ai_estimated')),
    
    carbs_target_g INTEGER CHECK (carbs_target_g IS NULL OR carbs_target_g >= 0),
    fat_target_g INTEGER CHECK (fat_target_g IS NULL OR fat_target_g >= 0),
    water_target_ml INTEGER DEFAULT 3500 NOT NULL CHECK (water_target_ml > 0),
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER trg_user_goals_updated_at
    BEFORE UPDATE ON public.user_goals
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_goals_select_own"
    ON public.user_goals FOR SELECT TO authenticated
    USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "user_goals_insert_own"
    ON public.user_goals FOR INSERT TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "user_goals_update_own"
    ON public.user_goals FOR UPDATE TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "user_goals_delete_own"
    ON public.user_goals FOR DELETE TO authenticated
    USING ((SELECT auth.uid()) = user_id);

-- ------------------------------------------------------------------------------
-- 4. User Preferences (Units, Timezone, Notification Windows)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
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

CREATE POLICY "user_preferences_select_own"
    ON public.user_preferences FOR SELECT TO authenticated
    USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "user_preferences_insert_own"
    ON public.user_preferences FOR INSERT TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "user_preferences_update_own"
    ON public.user_preferences FOR UPDATE TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "user_preferences_delete_own"
    ON public.user_preferences FOR DELETE TO authenticated
    USING ((SELECT auth.uid()) = user_id);

-- ------------------------------------------------------------------------------
-- 5. Exercise Library (Reference Catalog + Custom Athlete Exercises)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL CHECK (category IN ('barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'cardio')),
    primary_muscle TEXT NOT NULL,
    secondary_muscles TEXT[] DEFAULT '{}',
    instructions TEXT,
    is_custom BOOLEAN DEFAULT FALSE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_exercises_user ON public.exercises(user_id);

CREATE TRIGGER trg_exercises_updated_at
    BEFORE UPDATE ON public.exercises
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "exercises_select"
    ON public.exercises FOR SELECT TO authenticated
    USING (is_custom = FALSE OR (SELECT auth.uid()) = user_id);

CREATE POLICY "exercises_insert_own"
    ON public.exercises FOR INSERT TO authenticated
    WITH CHECK (is_custom = TRUE AND (SELECT auth.uid()) = user_id);

CREATE POLICY "exercises_update_own"
    ON public.exercises FOR UPDATE TO authenticated
    USING (is_custom = TRUE AND (SELECT auth.uid()) = user_id)
    WITH CHECK (is_custom = TRUE AND (SELECT auth.uid()) = user_id);

CREATE POLICY "exercises_delete_own"
    ON public.exercises FOR DELETE TO authenticated
    USING (is_custom = TRUE AND (SELECT auth.uid()) = user_id);

-- ------------------------------------------------------------------------------
-- 6. Automated Athlete Provisioning Trigger (On Signup)
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

    -- 2. Seed unconfirmed historical home gym items (RULE: is_confirmed = false by default)
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
        'provisional_default',
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

DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_athlete_signup();
