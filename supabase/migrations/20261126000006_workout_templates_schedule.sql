-- =============================================================================
-- Migration: 20261126000006_workout_templates_schedule.sql
-- Description: Add explicit weekday schedule array and starter template
--              metadata to public.workout_templates (idempotent).
-- =============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'workout_templates'
          AND column_name = 'scheduled_weekdays'
    ) THEN
        ALTER TABLE public.workout_templates
            ADD COLUMN scheduled_weekdays TEXT[] NOT NULL DEFAULT '{}'::TEXT[];
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'workout_templates'
          AND column_name = 'is_starter'
    ) THEN
        ALTER TABLE public.workout_templates
            ADD COLUMN is_starter BOOLEAN NOT NULL DEFAULT false;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'workout_templates'
          AND column_name = 'starter_key'
    ) THEN
        ALTER TABLE public.workout_templates
            ADD COLUMN starter_key TEXT;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'workout_templates_scheduled_weekdays_check'
    ) THEN
        ALTER TABLE public.workout_templates
            ADD CONSTRAINT workout_templates_scheduled_weekdays_check
            CHECK (scheduled_weekdays <@ ARRAY['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']::TEXT[]);
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_workout_templates_user_starter_key
    ON public.workout_templates (user_id, starter_key)
    WHERE starter_key IS NOT NULL;
