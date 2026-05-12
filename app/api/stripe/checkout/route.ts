import { NextResponse } from 'next/server'
import { requireAuth, apiError, API_ERRORS } from '@/lib/utils/api'
import { stripe } from '@/lib/stripe/client'
import {
  APP_URL,
  STRIPE_PRICE_ID_PRO_MONTHLY,
  isStripeConfigured,
} from '@/lib/stripe/config'

export async function POST() {
  if (!isStripeConfigured()) {
    return apiError('Billing is not configured yet. Try again soon.', 503)
  }

  const { user, supabase, unauthorized } = await requireAuth()
  if (unauthorized) return API_ERRORS.UNAUTHORIZED()

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id, email')
    .eq('id', user!.id)
    .single<{ stripe_customer_id: string | null; email: string }>()

  let customerId = profile?.stripe_customer_id ?? null

  // Create the Stripe customer up front so the webhook can always resolve
  // a profile by stripe_customer_id, regardless of which event arrives first.
  if (!customerId) {
    const customer = await stripe().customers.create({
      email: profile?.email ?? user!.email ?? undefined,
      metadata: { user_id: user!.id },
    })
    customerId = customer.id
    await supabase
      .from('profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', user!.id)
  }

  const session = await stripe().checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    client_reference_id: user!.id,
    line_items: [{ price: STRIPE_PRICE_ID_PRO_MONTHLY, quantity: 1 }],
    allow_promotion_codes: true,
    success_url: `${APP_URL}/settings?upgraded=1`,
    cancel_url: `${APP_URL}/pricing`,
  })

  if (!session.url) {
    return apiError('Could not create checkout session.', 500)
  }

  return NextResponse.json({ url: session.url })
}
