-- =============================================================================
-- AthlonIQ Phase 4: Personal AI Coach, Conversations & Weekly Review Migration
-- File:    20261019000003_phase4_coach_and_reviews.sql
-- Author:  AthlonIQ Engineering
-- Purpose: Schema for AI coach conversations, messages with epistemic breakdown,
--          weekly progress review reports, and private photo metadata assets.
-- Idempotent: Uses IF NOT EXISTS, DROP IF EXISTS (for old placeholders), and strict RLS.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. coach_conversations — Threaded coaching sessions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coach_conversations (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title           TEXT        NOT NULL DEFAULT 'Coaching Session',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coach_conversations_user
    ON public.coach_conversations (user_id, created_at DESC);

ALTER TABLE public.coach_conversations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'coach_conversations' AND policyname = 'coach_conversations_owner_all'
    ) THEN
        CREATE POLICY coach_conversations_owner_all ON public.coach_conversations
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2. coach_messages — Thread messages with epistemic breakdown
-- ---------------------------------------------------------------------------
-- Safely drop legacy placeholder coach_messages if it referenced obsolete coach_sessions
DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'coach_messages' AND column_name = 'session_id'
    ) THEN
        DROP TABLE public.coach_messages CASCADE;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.coach_messages (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id     UUID        NOT NULL REFERENCES public.coach_conversations(id) ON DELETE CASCADE,
    user_id             UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role                TEXT        NOT NULL CHECK (role IN ('user', 'assistant')),
    content             TEXT        NOT NULL,
    tools_invoked       TEXT[]      NOT NULL DEFAULT '{}',
    epistemic_breakdown JSONB       NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coach_messages_conversation
    ON public.coach_messages (conversation_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_coach_messages_user
    ON public.coach_messages (user_id, created_at DESC);

ALTER TABLE public.coach_messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'coach_messages' AND policyname = 'coach_messages_owner_all'
    ) THEN
        CREATE POLICY coach_messages_owner_all ON public.coach_messages
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3. weekly_reports — Deterministic weekly review snapshots
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.weekly_reports (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    week_start_date DATE        NOT NULL,
    week_end_date   DATE        NOT NULL,
    summary_payload JSONB       NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_weekly_reports_user_dates
    ON public.weekly_reports (user_id, week_start_date DESC);

ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'weekly_reports' AND policyname = 'weekly_reports_owner_all'
    ) THEN
        CREATE POLICY weekly_reports_owner_all ON public.weekly_reports
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 4. photo_assets — Private meal & physique progress photo metadata
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.photo_assets (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category        TEXT        NOT NULL CHECK (category IN ('meal', 'progress')),
    storage_path    TEXT        NOT NULL,
    logged_date     DATE        NOT NULL DEFAULT CURRENT_DATE,
    notes           TEXT        NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_photo_assets_user_date
    ON public.photo_assets (user_id, category, logged_date DESC);

ALTER TABLE public.photo_assets ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'photo_assets' AND policyname = 'photo_assets_owner_all'
    ) THEN
        CREATE POLICY photo_assets_owner_all ON public.photo_assets
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;
