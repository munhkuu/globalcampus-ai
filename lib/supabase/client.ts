import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Phase 2: add `Database` generic once Supabase types are generated.
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
