import Stripe from 'stripe'

let cached: Stripe | null = null

export function stripe(): Stripe {
  if (cached) return cached
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error(
      'STRIPE_SECRET_KEY is not set. See STRIPE_SETUP.md for setup instructions.'
    )
  }
  cached = new Stripe(key, {
    appInfo: { name: 'GlobalCampus AI' },
  })
  return cached
}
