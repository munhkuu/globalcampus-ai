-- ─── Extensions ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ─── Custom Enums ─────────────────────────────────────────────────────────────
CREATE TYPE application_status AS ENUM (
  'applied',
  'online_assessment',
  'interview',
  'rejected',
  'accepted'
);

CREATE TYPE experience_level AS ENUM (
  'beginner',
  'intermediate',
  'advanced'
);

CREATE TYPE ai_feature AS ENUM (
  'explainer',
  'roadmap',
  'summarizer'
);

-- ─── Updated-at trigger function ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── Profiles ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id                   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  email                TEXT NOT NULL,
  full_name            TEXT,
  avatar_url           TEXT,
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  -- Collected during onboarding
  target_role          TEXT,
  university           TEXT,
  graduation_year      SMALLINT CHECK (graduation_year BETWEEN 2020 AND 2040),
  experience_level     experience_level
);

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create a profile row whenever a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── Internship Applications ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.internship_applications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  company_name    TEXT NOT NULL,
  role_title      TEXT NOT NULL,
  status          application_status NOT NULL DEFAULT 'applied',
  applied_date    DATE,
  deadline        DATE,
  job_url         TEXT,
  recruiter_name  TEXT,
  recruiter_email TEXT,
  notes           TEXT,
  resume_version  TEXT,
  is_priority     BOOLEAN NOT NULL DEFAULT FALSE,
  location        TEXT,
  salary_range    TEXT
);

CREATE TRIGGER update_internship_applications_updated_at
  BEFORE UPDATE ON public.internship_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_internship_applications_user_id
  ON public.internship_applications(user_id);
CREATE INDEX idx_internship_applications_user_status
  ON public.internship_applications(user_id, status);
CREATE INDEX idx_internship_applications_deadline
  ON public.internship_applications(user_id, deadline)
  WHERE deadline IS NOT NULL;

-- ─── Vault Notes ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.vault_notes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  title      TEXT NOT NULL,
  content    TEXT NOT NULL DEFAULT '',
  tags       TEXT[] NOT NULL DEFAULT '{}',
  source     TEXT NOT NULL DEFAULT 'manual',
  is_pinned  BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TRIGGER update_vault_notes_updated_at
  BEFORE UPDATE ON public.vault_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_vault_notes_user_id ON public.vault_notes(user_id);
CREATE INDEX idx_vault_notes_tags ON public.vault_notes USING gin(tags);
CREATE INDEX idx_vault_notes_title_search
  ON public.vault_notes USING gin(title gin_trgm_ops);

-- ─── Study Goals ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.study_goals (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  title        TEXT NOT NULL,
  description  TEXT,
  target_date  DATE,
  completed    BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ
);

CREATE TRIGGER update_study_goals_updated_at
  BEFORE UPDATE ON public.study_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_study_goals_user_id ON public.study_goals(user_id);

-- ─── Roadmap Sessions ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.roadmap_sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  session_name     TEXT NOT NULL DEFAULT 'Untitled Roadmap',
  target_role      TEXT NOT NULL,
  current_skills   TEXT[] NOT NULL DEFAULT '{}',
  experience_level experience_level NOT NULL DEFAULT 'beginner',
  timeline_months  SMALLINT NOT NULL DEFAULT 6
    CHECK (timeline_months BETWEEN 1 AND 24),
  roadmap_data     JSONB NOT NULL DEFAULT '{}'
);

CREATE TRIGGER update_roadmap_sessions_updated_at
  BEFORE UPDATE ON public.roadmap_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_roadmap_sessions_user_id ON public.roadmap_sessions(user_id);

-- ─── AI Interactions ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_interactions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  feature           ai_feature NOT NULL,
  model_used        TEXT NOT NULL,
  input_hash        TEXT NOT NULL,
  prompt_tokens     INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_ai_interactions_user_id ON public.ai_interactions(user_id);
CREATE INDEX idx_ai_interactions_user_feature
  ON public.ai_interactions(user_id, feature);

-- ─── Row Level Security ───────────────────────────────────────────────────────
ALTER TABLE public.profiles                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internship_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_notes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_goals             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_sessions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_interactions         ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "profiles: select own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles: update own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- internship_applications
CREATE POLICY "internships: select own"
  ON public.internship_applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "internships: insert own"
  ON public.internship_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "internships: update own"
  ON public.internship_applications FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "internships: delete own"
  ON public.internship_applications FOR DELETE
  USING (auth.uid() = user_id);

-- vault_notes
CREATE POLICY "vault: select own"
  ON public.vault_notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "vault: insert own"
  ON public.vault_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "vault: update own"
  ON public.vault_notes FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "vault: delete own"
  ON public.vault_notes FOR DELETE
  USING (auth.uid() = user_id);

-- study_goals
CREATE POLICY "goals: select own"
  ON public.study_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "goals: insert own"
  ON public.study_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "goals: update own"
  ON public.study_goals FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "goals: delete own"
  ON public.study_goals FOR DELETE
  USING (auth.uid() = user_id);

-- roadmap_sessions
CREATE POLICY "roadmap: select own"
  ON public.roadmap_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "roadmap: insert own"
  ON public.roadmap_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "roadmap: update own"
  ON public.roadmap_sessions FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "roadmap: delete own"
  ON public.roadmap_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- ai_interactions
CREATE POLICY "ai: select own"
  ON public.ai_interactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "ai: insert own"
  ON public.ai_interactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
