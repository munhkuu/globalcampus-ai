-- ─── Signup source attribution ───────────────────────────────────────────────
-- Captured client-side from ?utm_source / ?ref on the landing page, stored
-- in the `gc_source` cookie, then persisted at signup. Used to measure which
-- distribution channels (Reddit, KakaoTalk, YouTube, etc.) drive real users.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS signup_source TEXT;

-- Update the auto-create trigger to also pull signup_source out of the user
-- metadata that the register server action sets via options.data.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, signup_source)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'signup_source'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
