import { NextResponse } from 'next/server'
import { requireAuth, apiError, API_ERRORS } from '@/lib/utils/api'
import { stripe } from '@/lib/stripe/client'
import { APP_URL, isStripeConfigured } from '@/lib/stripe/config'

export async function POST() {
  if (!isStripeConfigured()) {
    return apiError('Billing is not configured yet.', 503)
  }

  const { user, supabase, unauthorized } = await requireAuth()
  if (unauthorized) return API_ERRORS.UNAUTHORIZED()

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user!.id)
    .single<{ stripe_customer_id: string | null }>()

  if (!profile?.stripe_customer_id) {
    return apiError('No billing account found. Subscribe first.', 400)
  }

  const session = await stripe().billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${APP_URL}/settings`,
  })

  return NextResponse.json({ url: session.url })
}
