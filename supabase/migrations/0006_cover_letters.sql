-- ─── Cover letters (자소서) ───────────────────────────────────────────────────
-- Korean 자기소개서 drafts. One row per draft VERSION — when a user revises,
-- a new row is inserted with the prior id chained via parent_version_id and
-- is_current flipped. This lets users compare drafts and roll back.
--
-- application_id is optional — drafts can exist without being tied to a
-- specific tracked application (e.g., practicing before adding the app).

CREATE TABLE IF NOT EXISTS public.cover_letters (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id     UUID REFERENCES public.internship_applications(id) ON DELETE SET NULL,
  parent_version_id  UUID REFERENCES public.cover_letters(id) ON DELETE SET NULL,

  company            TEXT NOT NULL,        -- e.g., 'Samsung', 'Naver', or user-typed
  question           TEXT NOT NULL,        -- the 자소서 prompt being answered
  content            TEXT NOT NULL DEFAULT '',
  word_count         INTEGER NOT NULL DEFAULT 0,
  version            INTEGER NOT NULL DEFAULT 1,
  is_current         BOOLEAN NOT NULL DEFAULT TRUE,

  ai_feedback        JSONB,                -- structured critique result
  ai_score           SMALLINT,             -- 1-10 overall, denormalized for sorting/filtering

  CHECK (char_length(content) <= 8000),
  CHECK (ai_score IS NULL OR (ai_score BETWEEN 1 AND 10))
);

CREATE INDEX IF NOT EXISTS cover_letters_user_id_idx
  ON public.cover_letters (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS cover_letters_application_id_idx
  ON public.cover_letters (application_id) WHERE application_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS cover_letters_user_current_idx
  ON public.cover_letters (user_id) WHERE is_current = TRUE;

CREATE TRIGGER update_cover_letters_updated_at
  BEFORE UPDATE ON public.cover_letters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.cover_letters ENABLE ROW LEVEL SECURITY;

CREATE POLICY cover_letters_select_self
  ON public.cover_letters FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY cover_letters_insert_self
  ON public.cover_letters FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY cover_letters_update_self
  ON public.cover_letters FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY cover_letters_delete_self
  ON public.cover_letters FOR DELETE TO authenticated
  USING (user_id = auth.uid());
