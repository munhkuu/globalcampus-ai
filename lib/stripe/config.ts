export const FREE_TIER_DAILY_AI_LIMIT = 5

export const PRO_PRICE_USD = 10

export type Tier = 'free' | 'pro'

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'unpaid'
  | 'paused'

// Stripe is "configured" only when both keys are present. The pricing page,
// checkout endpoint, and portal endpoint use this to gracefully fall back to
// "Coming soon" instead of crashing during local dev or staging where keys
// might not be set yet.
export function isStripeConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
      process.env.STRIPE_PRICE_ID_PRO_MONTHLY
  )
}

export const STRIPE_PRICE_ID_PRO_MONTHLY =
  process.env.STRIPE_PRICE_ID_PRO_MONTHLY ?? ''

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? ''

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
