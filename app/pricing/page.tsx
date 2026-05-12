import Link from 'next/link'
import type { Metadata } from 'next'
import { Check, ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { getUserTier } from '@/lib/billing/quota'
import {
  isStripeConfigured,
  PRO_PRICE_USD,
  FREE_TIER_DAILY_AI_LIMIT,
} from '@/lib/stripe/config'
import { UpgradeButton } from '@/components/billing/UpgradeButton'

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'Simple pricing for international CS students at Korean universities. Free tier with 5 AI calls/day, or $10/month for unlimited.',
}

export default async function PricingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const tier = user ? await getUserTier(supabase, user.id) : 'free'
  const stripeReady = isStripeConfigured()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PricingNav loggedIn={Boolean(user)} />

      <section className="border-b border-border/60 px-6 pb-16 pt-20 sm:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/50 px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3 text-amber-500" />
            Simple, honest pricing
          </div>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
            One plan. One price.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Start free. Upgrade when you need more AI. Cancel anytime — no questions, no email-back-to-undo.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-2">
          {/* Free tier */}
          <div className="rounded-2xl border border-border/60 bg-card p-7">
            <div className="text-sm font-medium text-muted-foreground">Free</div>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-4xl font-semibold">$0</span>
              <span className="text-sm text-muted-foreground">/ forever</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Taste the product. Track your internships. Try the AI features.
            </p>

            <ul className="mt-6 space-y-2.5 text-sm">
              <Feature>{FREE_TIER_DAILY_AI_LIMIT} AI calls per day</Feature>
              <Feature>Unlimited internship tracking</Feature>
              <Feature>Unlimited Study Vault notes</Feature>
              <Feature>Korean ↔ English term mapping</Feature>
              <Feature>Email + Google sign-in</Feature>
            </ul>

            <div className="mt-7">
              {tier === 'free' && user ? (
                <Button asChild variant="outline" className="w-full" disabled>
                  <span>Your current plan</span>
                </Button>
              ) : user ? (
                <Button asChild variant="outline" className="w-full">
                  <Link href="/dashboard">Go to dashboard</Link>
                </Button>
              ) : (
                <Button asChild variant="outline" className="w-full">
                  <Link href="/register" className="gap-2">
                    Start free <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* Pro tier */}
          <div className="relative rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-7">
            <div className="absolute right-5 top-5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest text-amber-400">
              Recommended
            </div>
            <div className="text-sm font-medium text-amber-400">Pro</div>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-4xl font-semibold">${PRO_PRICE_USD}</span>
              <span className="text-sm text-muted-foreground">/ month</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              For students who want to use AI as a daily study tool. Cancel anytime.
            </p>

            <ul className="mt-6 space-y-2.5 text-sm">
              <Feature highlighted>Unlimited AI calls per day</Feature>
              <Feature>Everything in Free</Feature>
              <Feature>Priority on new features</Feature>
              <Feature>Direct line to feedback / requests</Feature>
              <Feature>Cancel anytime, full self-serve</Feature>
            </ul>

            <div className="mt-7">
              {tier === 'pro' ? (
                <Button asChild variant="default" className="w-full" disabled>
                  <span>You&apos;re on Pro</span>
                </Button>
              ) : !user ? (
                <Button asChild className="w-full">
                  <Link href="/register?next=/pricing" className="gap-2">
                    Sign up to upgrade <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              ) : !stripeReady ? (
                <Button disabled className="w-full">
                  Coming soon
                </Button>
              ) : (
                <UpgradeButton size="default" label={`Upgrade — $${PRO_PRICE_USD}/mo`} />
              )}
            </div>

            {!stripeReady && user && (
              <p className="mt-3 text-center text-[11px] text-muted-foreground">
                Billing is being set up. Check back soon.
              </p>
            )}
          </div>
        </div>

        {/* FAQ-lite */}
        <div className="mx-auto mt-16 grid max-w-4xl gap-6 sm:grid-cols-2">
          <Faq q="What counts as an AI call?">
            Any request to Lecture Explainer, Roadmap, Bug Fixer, or Project Generator.
            Tracking internships and saving notes do not count.
          </Faq>
          <Faq q="When does the free limit reset?">
            Every day at midnight UTC.
          </Faq>
          <Faq q="Can I cancel anytime?">
            Yes — one click in the billing portal. You keep Pro until the end of the period you paid for.
          </Faq>
          <Faq q="Is there a student discount?">
            The whole product is built for students. Pro at $10/month is the student price.
          </Faq>
        </div>
      </section>

      <PricingFooter />
    </div>
  )
}

function PricingNav({ loggedIn }: { loggedIn: boolean }) {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-foreground">
            <span className="text-[10px] font-bold leading-none text-background">GC</span>
          </div>
          <span className="text-sm font-semibold tracking-tight">GlobalCampus AI</span>
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link
            href="/pricing"
            className="hidden text-foreground sm:inline-block"
            aria-current="page"
          >
            Pricing
          </Link>
          {loggedIn ? (
            <Button asChild size="sm">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden text-muted-foreground transition-colors hover:text-foreground sm:inline-block"
              >
                Sign in
              </Link>
              <Button asChild size="sm">
                <Link href="/register">Start free</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}

function Feature({
  children,
  highlighted,
}: {
  children: React.ReactNode
  highlighted?: boolean
}) {
  return (
    <li className="flex items-start gap-2">
      <Check
        className={`mt-0.5 h-4 w-4 shrink-0 ${
          highlighted ? 'text-amber-400' : 'text-emerald-500'
        }`}
      />
      <span className={highlighted ? 'font-medium' : ''}>{children}</span>
    </li>
  )
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm font-medium">{q}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{children}</p>
    </div>
  )
}

function PricingFooter() {
  return (
    <footer className="py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
        <div className="flex items-center gap-2.5">
          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-foreground">
            <span className="text-[9px] font-bold leading-none text-background">GC</span>
          </div>
          <span className="text-xs text-muted-foreground">
            GlobalCampus AI · © {new Date().getFullYear()}
          </span>
        </div>
        <div className="flex items-center gap-5 text-xs text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-foreground">
            Home
          </Link>
          <Link href="/login" className="transition-colors hover:text-foreground">
            Sign in
          </Link>
        </div>
      </div>
    </footer>
  )
}
