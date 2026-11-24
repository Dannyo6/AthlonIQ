-- =============================================================================
-- Migration: 20261117000005_exercise_sets_explicit_is_completed.sql
-- Description: Drop column default on exercise_sets.is_completed to enforce
--              explicit caller assignment.
-- Deterministic Rule: Zero implicit database fallbacks; every exercise set must
--                      provide an explicit is_completed boolean.
-- =============================================================================

DO $$
BEGIN
    -- Drop default on public.exercise_sets.is_completed if present (idempotent)
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'exercise_sets'
          AND column_name = 'is_completed'
          AND column_default IS NOT NULL
    ) THEN
        ALTER TABLE public.exercise_sets ALTER COLUMN is_completed DROP DEFAULT;
    END IF;
END $$;
