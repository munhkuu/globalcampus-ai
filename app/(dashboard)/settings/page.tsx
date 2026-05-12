import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { UpgradeButton } from '@/components/billing/UpgradeButton'
import { ManageBillingButton } from '@/components/billing/ManageBillingButton'
import { getUserTier } from '@/lib/billing/quota'
import {
  isStripeConfigured,
  PRO_PRICE_USD,
  FREE_TIER_DAILY_AI_LIMIT,
} from '@/lib/stripe/config'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Settings',
}

type BillingProfile = {
  subscription_status: string | null
  subscription_current_period_end: string | null
  stripe_customer_id: string | null
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ upgraded?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { upgraded } = await searchParams

  const displayName: string =
    user.user_metadata?.full_name ?? user.email ?? 'User'
  const email: string = user.email ?? ''
  const avatarUrl: string | null = user.user_metadata?.avatar_url ?? null
  const initials: string = displayName
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  const memberSince = new Date(user.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  const tier = await getUserTier(supabase, user.id)
  const stripeReady = isStripeConfigured()

  const { data: billing } = await supabase
    .from('profiles')
    .select('subscription_status, subscription_current_period_end, stripe_customer_id')
    .eq('id', user.id)
    .maybeSingle<BillingProfile>()

  const periodEnd = billing?.subscription_current_period_end
    ? new Date(billing.subscription_current_period_end).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  return (
    <div className="space-y-6 max-w-2xl animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account and preferences.
        </p>
      </div>

      <Separator />

      {upgraded === '1' && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm">
          <p className="font-medium text-emerald-400">You&apos;re on Pro.</p>
          <p className="mt-1 text-emerald-200/80">
            Thank you. Unlimited AI calls are unlocked.
          </p>
        </div>
      )}

      {/* Billing */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Billing</CardTitle>
          <CardDescription>
            {tier === 'pro'
              ? 'You have unlimited AI access.'
              : `You're on the free plan — ${FREE_TIER_DAILY_AI_LIMIT} AI calls per day.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Current plan</span>
            <span className="font-medium capitalize">{tier}</span>
          </div>
          {tier === 'pro' && (
            <>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <span className="capitalize">
                  {billing?.subscription_status ?? 'active'}
                </span>
              </div>
              {periodEnd && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Renews</span>
                    <span>{periodEnd}</span>
                  </div>
                </>
              )}
            </>
          )}

          <div className="space-y-2 pt-2">
            {tier === 'pro' && billing?.stripe_customer_id ? (
              <ManageBillingButton />
            ) : !stripeReady ? (
              <>
                <Button disabled size="sm">
                  Upgrade — Coming soon
                </Button>
                <p className="text-xs text-muted-foreground">
                  Billing is being set up — finishing the Stripe Dashboard wiring (see STRIPE_SETUP.md).
                </p>
              </>
            ) : (
              <UpgradeButton size="sm" label={`Upgrade — $${PRO_PRICE_USD}/mo`} />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Profile section */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
          <CardDescription>
            Your public profile information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarImage src={avatarUrl ?? undefined} alt={displayName} />
              <AvatarFallback className="text-base">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{displayName}</p>
              <p className="text-sm text-muted-foreground">{email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account section */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
          <CardDescription>Account details and metadata.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">User ID</span>
            <span className="font-mono text-xs text-muted-foreground truncate max-w-[200px]">
              {user.id}
            </span>
          </div>
          <Separator />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Member since</span>
            <span>{memberSince}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Auth provider</span>
            <span className="capitalize">
              {user.app_metadata?.provider ?? 'email'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
