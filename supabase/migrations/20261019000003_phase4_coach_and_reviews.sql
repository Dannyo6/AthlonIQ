-- =============================================================================
-- AthlonIQ Phase 4: AI Coach, Weekly Reviews, Progress Photos & Secure Storage
-- File:        20261019000003_phase4_coach_and_reviews.sql
-- Description: AI Coach conversations, messages with epistemic breakdowns,
--              weekly reviews, progress photo metadata, and private storage policies.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. coach_conversations — Threaded coaching sessions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coach_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Coaching Session',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_coach_conversations_user ON public.coach_conversations(user_id, created_at DESC);

DROP TRIGGER IF EXISTS trg_coach_conversations_updated_at ON public.coach_conversations;
CREATE TRIGGER trg_coach_conversations_updated_at
    BEFORE UPDATE ON public.coach_conversations
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.coach_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coach_conversations_select_own"
    ON public.coach_conversations FOR SELECT TO authenticated
    USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "coach_conversations_insert_own"
    ON public.coach_conversations FOR INSERT TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "coach_conversations_update_own"
    ON public.coach_conversations FOR UPDATE TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "coach_conversations_delete_own"
    ON public.coach_conversations FOR DELETE TO authenticated
    USING ((SELECT auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- 2. coach_messages — Messages with epistemic breakdowns (child table)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coach_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.coach_conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    tools_invoked TEXT[] NOT NULL DEFAULT '{}',
    epistemic_breakdown JSONB NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_coach_messages_conversation ON public.coach_messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_coach_messages_user ON public.coach_messages(user_id, created_at DESC);

DROP TRIGGER IF EXISTS trg_coach_messages_updated_at ON public.coach_messages;
CREATE TRIGGER trg_coach_messages_updated_at
    BEFORE UPDATE ON public.coach_messages
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.coach_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coach_messages_select_own"
    ON public.coach_messages FOR SELECT TO authenticated
    USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "coach_messages_insert_own"
    ON public.coach_messages FOR INSERT TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "coach_messages_update_own"
    ON public.coach_messages FOR UPDATE TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "coach_messages_delete_own"
    ON public.coach_messages FOR DELETE TO authenticated
    USING ((SELECT auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- 3. weekly_reports — Deterministic weekly review snapshots
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.weekly_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    week_end_date DATE NOT NULL CHECK (week_end_date >= week_start_date),
    summary_payload JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_weekly_reports_user_date ON public.weekly_reports(user_id, week_start_date DESC);

DROP TRIGGER IF EXISTS trg_weekly_reports_updated_at ON public.weekly_reports;
CREATE TRIGGER trg_weekly_reports_updated_at
    BEFORE UPDATE ON public.weekly_reports
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "weekly_reports_select_own"
    ON public.weekly_reports FOR SELECT TO authenticated
    USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "weekly_reports_insert_own"
    ON public.weekly_reports FOR INSERT TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "weekly_reports_update_own"
    ON public.weekly_reports FOR UPDATE TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "weekly_reports_delete_own"
    ON public.weekly_reports FOR DELETE TO authenticated
    USING ((SELECT auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- 4. progress_photos — Athlete physique & meal progress photo metadata
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.progress_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
    weight_kg NUMERIC(5, 2) CHECK (weight_kg IS NULL OR (weight_kg >= 25 AND weight_kg <= 250)),
    image_url TEXT NOT NULL,
    storage_path TEXT,
    category TEXT NOT NULL DEFAULT 'progress' CHECK (category IN ('meal', 'progress')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_progress_photos_user_date ON public.progress_photos(user_id, logged_date DESC);

DROP TRIGGER IF EXISTS trg_progress_photos_updated_at ON public.progress_photos;
CREATE TRIGGER trg_progress_photos_updated_at
    BEFORE UPDATE ON public.progress_photos
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.progress_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "progress_photos_select_own"
    ON public.progress_photos FOR SELECT TO authenticated
    USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "progress_photos_insert_own"
    ON public.progress_photos FOR INSERT TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "progress_photos_update_own"
    ON public.progress_photos FOR UPDATE TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "progress_photos_delete_own"
    ON public.progress_photos FOR DELETE TO authenticated
    USING ((SELECT auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- 5. Private Storage Buckets & Policies
-- ---------------------------------------------------------------------------
-- Buckets: meal-photos and progress-photos (both private)
INSERT INTO storage.buckets (id, name, public)
VALUES
    ('meal-photos', 'meal-photos', FALSE),
    ('progress-photos', 'progress-photos', FALSE)
ON CONFLICT (id) DO UPDATE SET public = FALSE;

DROP POLICY IF EXISTS "storage_meal_progress_select_own" ON storage.objects;
CREATE POLICY "storage_meal_progress_select_own"
    ON storage.objects FOR SELECT TO authenticated
    USING (
        bucket_id IN ('meal-photos', 'progress-photos')
        AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
    );

DROP POLICY IF EXISTS "storage_meal_progress_insert_own" ON storage.objects;
CREATE POLICY "storage_meal_progress_insert_own"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id IN ('meal-photos', 'progress-photos')
        AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
    );

DROP POLICY IF EXISTS "storage_meal_progress_update_own" ON storage.objects;
CREATE POLICY "storage_meal_progress_update_own"
    ON storage.objects FOR UPDATE TO authenticated
    USING (
        bucket_id IN ('meal-photos', 'progress-photos')
        AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
    )
    WITH CHECK (
        bucket_id IN ('meal-photos', 'progress-photos')
        AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
    );

DROP POLICY IF EXISTS "storage_meal_progress_delete_own" ON storage.objects;
CREATE POLICY "storage_meal_progress_delete_own"
    ON storage.objects FOR DELETE TO authenticated
    USING (
        bucket_id IN ('meal-photos', 'progress-photos')
        AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
    );
