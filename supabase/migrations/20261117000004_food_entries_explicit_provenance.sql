-- =============================================================================
-- Migration: 20261117000004_food_entries_explicit_provenance.sql
-- Description: Drop column defaults on food_entries.provenance and
--              food_entries.is_confirmed to enforce explicit caller assignment.
-- Deterministic Rule: Zero implicit database fallbacks; every food entry must
--                      provide an explicit provenance tag and confirmation flag.
-- =============================================================================

DO $$
BEGIN
    -- 1. Drop default on public.food_entries.provenance if present (idempotent)
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'food_entries'
          AND column_name = 'provenance'
          AND column_default IS NOT NULL
    ) THEN
        ALTER TABLE public.food_entries ALTER COLUMN provenance DROP DEFAULT;
    END IF;

    -- 2. Drop default on public.food_entries.is_confirmed if present (idempotent)
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'food_entries'
          AND column_name = 'is_confirmed'
          AND column_default IS NOT NULL
    ) THEN
        ALTER TABLE public.food_entries ALTER COLUMN is_confirmed DROP DEFAULT;
    END IF;
END $$;
