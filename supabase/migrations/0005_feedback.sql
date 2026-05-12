-- ─── Feedback ────────────────────────────────────────────────────────────────
-- User reactions, captured in two places: a floating widget on every dashboard
-- page, and a post-action prompt after a successful AI call. The whole point
-- is to make leaving feedback frictionless so the founder hears from more
-- than just the 1% who would email unprompted.

CREATE TYPE feedback_rating AS ENUM ('positive', 'negative', 'neutral');
CREATE TYPE feedback_source AS ENUM ('widget', 'post_action', 'survey');

CREATE TABLE IF NOT EXISTS public.feedback (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email       TEXT,                              -- duplicated for offline read
  rating      feedback_rating NOT NULL,
  comment     TEXT,
  feature     TEXT,                              -- 'explainer', 'tracker', 'roadmap', etc.
  path        TEXT,                              -- e.g., '/explainer'
  source      feedback_source NOT NULL DEFAULT 'widget'
);

CREATE INDEX IF NOT EXISTS feedback_created_at_idx ON public.feedback (created_at DESC);
CREATE INDEX IF NOT EXISTS feedback_user_id_idx    ON public.feedback (user_id);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Users can insert their own feedback (user_id must match their auth.uid()).
CREATE POLICY feedback_insert_self
  ON public.feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can read their own feedback (useful for confirming submission).
CREATE POLICY feedback_select_self
  ON public.feedback
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- The admin dashboard reads via the service role client, which bypasses RLS,
-- so no admin SELECT policy is required.
