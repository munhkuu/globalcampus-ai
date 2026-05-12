import { createClient } from '@supabase/supabase-js'

// Server-only Supabase client that bypasses RLS. Use for trusted server-side
// operations like Stripe webhook handlers where no user session is available
// but we need to update another user's row by foreign id (stripe_customer_id).
// NEVER import this from client components.
export function createServiceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set. Required for Stripe webhooks. See STRIPE_SETUP.md.'
    )
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
