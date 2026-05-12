import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { stripe } from '@/lib/stripe/client'
import { STRIPE_WEBHOOK_SECRET, isStripeConfigured } from '@/lib/stripe/config'
import { createServiceClient } from '@/lib/supabase/service'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  if (!isStripeConfigured() || !STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'webhook not configured' }, { status: 503 })
  }

  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'missing signature' }, { status: 400 })
  }

  const rawBody = await request.text()

  let event: Stripe.Event
  try {
    event = stripe().webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'invalid signature'
    return NextResponse.json({ error: `webhook verification failed: ${msg}` }, { status: 400 })
  }

  // Only subscription.* events change billing state. Checkout completion is
  // implied by subscription.created, which fires immediately after.
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      await syncSubscription(event.data.object as Stripe.Subscription)
      break
    default:
      // Acknowledge other events without acting on them.
      break
  }

  return NextResponse.json({ received: true })
}

async function syncSubscription(sub: Stripe.Subscription) {
  const customerId =
    typeof sub.customer === 'string' ? sub.customer : sub.customer.id

  const periodEndUnix =
    (sub as unknown as { current_period_end?: number }).current_period_end
  const periodEnd = periodEndUnix ? new Date(periodEndUnix * 1000).toISOString() : null

  // Pro access is granted while the subscription is active or trialing, OR
  // canceled-but-not-yet-expired. Anything else (canceled+expired, unpaid,
  // incomplete_expired) downgrades to free.
  const hasAccess =
    sub.status === 'active' ||
    sub.status === 'trialing' ||
    ((sub.status === 'canceled' || sub.status === 'past_due') &&
      periodEndUnix !== undefined &&
      periodEndUnix * 1000 > Date.now())

  const supabase = createServiceClient()
  await supabase
    .from('profiles')
    .update({
      stripe_subscription_id: sub.id,
      subscription_tier: hasAccess ? 'pro' : 'free',
      subscription_status: sub.status,
      subscription_current_period_end: periodEnd,
    })
    .eq('stripe_customer_id', customerId)
}
