-- ─── Subscription columns on profiles ────────────────────────────────────────
-- Stores Stripe customer/subscription state for billing.
-- tier is the canonical source of truth for quota checks; status reflects the
-- Stripe subscription lifecycle (active, past_due, canceled, trialing, etc.)
-- and period_end is used to grant access through the end of a paid period
-- even after cancellation.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id              TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id          TEXT,
  ADD COLUMN IF NOT EXISTS subscription_tier               TEXT NOT NULL DEFAULT 'free'
    CHECK (subscription_tier IN ('free', 'pro')),
  ADD COLUMN IF NOT EXISTS subscription_status             TEXT,
  ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_stripe_customer_id_key
  ON public.profiles (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

-- ─── Quota lookup index ──────────────────────────────────────────────────────
-- checkAIQuota counts ai_interactions per user since midnight UTC; this index
-- keeps that query fast as the table grows.
CREATE INDEX IF NOT EXISTS ai_interactions_user_id_created_at_idx
  ON public.ai_interactions (user_id, created_at DESC);
