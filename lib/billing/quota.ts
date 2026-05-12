import type { SupabaseClient } from '@supabase/supabase-js'
import { FREE_TIER_DAILY_AI_LIMIT, type Tier } from '@/lib/stripe/config'

export type QuotaResult =
  | { ok: true; tier: 'pro' }
  | { ok: true; tier: 'free'; used: number; limit: number }
  | {
      ok: false
      tier: 'free'
      used: number
      limit: number
      reason: 'daily_quota_exceeded'
    }

type ProfileBillingFields = {
  subscription_tier: string | null
  subscription_status: string | null
  subscription_current_period_end: string | null
}

export async function getUserTier(
  supabase: SupabaseClient,
  userId: string
): Promise<Tier> {
  const { data } = await supabase
    .from('profiles')
    .select('subscription_tier, subscription_status, subscription_current_period_end')
    .eq('id', userId)
    .maybeSingle<ProfileBillingFields>()

  return isActivePro(data) ? 'pro' : 'free'
}

export async function checkAIQuota(
  supabase: SupabaseClient,
  userId: string
): Promise<QuotaResult> {
  const tier = await getUserTier(supabase, userId)
  if (tier === 'pro') return { ok: true, tier: 'pro' }

  // Daily reset at UTC midnight.
  const start = new Date()
  start.setUTCHours(0, 0, 0, 0)

  const { count } = await supabase
    .from('ai_interactions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', start.toISOString())

  const used = count ?? 0
  const limit = FREE_TIER_DAILY_AI_LIMIT

  if (used >= limit) {
    return { ok: false, tier: 'free', used, limit, reason: 'daily_quota_exceeded' }
  }
  return { ok: true, tier: 'free', used, limit }
}

// "Pro" access is granted when the subscription is active/trialing, OR when
// the subscription has been canceled but the paid period hasn't ended yet.
function isActivePro(p: ProfileBillingFields | null): boolean {
  if (!p) return false
  if (p.subscription_tier !== 'pro') return false
  if (p.subscription_status === 'active' || p.subscription_status === 'trialing') {
    return true
  }
  if (p.subscription_current_period_end) {
    return new Date(p.subscription_current_period_end).getTime() > Date.now()
  }
  return false
}
