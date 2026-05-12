import Link from 'next/link'
import type { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { CaptureSource } from '@/components/marketing/CaptureSource'
import { createClient } from '@/lib/supabase/server'
import { getUserTier } from '@/lib/billing/quota'
import type { Tier } from '@/lib/stripe/config'
import {
  ArrowRight,
  Lightbulb,
  Briefcase,
  Map,
  BookOpen,
  Sparkles,
  Check,
  PenLine,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Write the 자소서 that lands the Samsung / Naver / Kakao offer',
  description:
    'AI critique of your Korean 자기소개서 — catches Korean-style mistakes, foreigner pitfalls, and company-fit misses that ChatGPT will not flag. Plus a Korean lecture explainer, internship tracker, and study vault. Built for international CS students at Korean universities.',
  openGraph: {
    title: 'GlobalCampus AI — Write the 자소서 that lands the offer',
    description:
      'AI critique of your 자소서 for Samsung, Naver, Kakao, Toss, and more. Built for international CS students in Korea. Free during beta.',
    type: 'website',
  },
}

export default async function LandingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const loggedIn = Boolean(user)
  const tier: Tier = user ? await getUserTier(supabase, user.id) : 'free'

  return (
    <div className="min-h-screen bg-background text-foreground">
      <CaptureSource />
      <MarketingNav loggedIn={loggedIn} tier={tier} />
      <Hero loggedIn={loggedIn} />
      <TrustStrip />
      <Features />
      <HowItWorks />
      <PricingTeaser loggedIn={loggedIn} tier={tier} />
      <FinalCTA loggedIn={loggedIn} />
      <Footer />
    </div>
  )
}

function MarketingNav({ loggedIn, tier }: { loggedIn: boolean; tier: Tier }) {
  // Hide the Pricing link for Pro users — they already pay, no need to surface
  // it on every page. Free + logged-out users keep it.
  const showPricing = !loggedIn || tier === 'free'

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-foreground">
            <span className="text-[10px] font-bold leading-none text-background">GC</span>
          </div>
          <span className="text-sm font-semibold tracking-tight">GlobalCampus AI</span>
          {loggedIn && tier === 'pro' && (
            <span className="ml-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-widest text-amber-400">
              Pro
            </span>
          )}
        </Link>
        <nav className="flex items-center gap-3">
          {showPricing && (
            <Link
              href="/pricing"
              className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline-block"
            >
              Pricing
            </Link>
          )}
          {loggedIn ? (
            <Button asChild size="sm">
              <Link href="/dashboard" className="gap-1.5">
                Go to dashboard <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline-block"
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

function Hero({ loggedIn }: { loggedIn: boolean }) {
  return (
    <section className="relative overflow-hidden border-b border-border/60">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-amber-500/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl px-6 pb-16 pt-20 sm:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/50 px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3 text-amber-500" />
            For CS students hunting Korean tech internships
          </div>

          <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
            Write the 자소서
            <br />
            <span className="bg-gradient-to-r from-amber-400 via-amber-200 to-foreground bg-clip-text text-transparent">
              that lands the offer.
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
            Real 자기소개서 questions from Samsung, Naver, Kakao, Toss, LINE.
            AI critique catches Korean-style mistakes and foreigner pitfalls
            that ChatGPT will not flag. Plus a Korean lecture explainer,
            internship tracker, and study vault — all in one app.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {loggedIn ? (
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/dashboard" className="gap-2">
                  Go to dashboard <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link href="/register" className="gap-2">
                    Start free <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                  <Link href="/login">Sign in</Link>
                </Button>
              </>
            )}
          </div>

          {!loggedIn && (
            <p className="mt-4 text-xs text-muted-foreground">
              Free during beta · No credit card required
            </p>
          )}
        </div>

        {/* Product preview */}
        <div className="mx-auto mt-14 max-w-4xl">
          <CoverLetterPreview />
        </div>
      </div>
    </section>
  )
}

function CoverLetterPreview() {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-2xl shadow-black/40">
      {/* Mock window chrome */}
      <div className="flex items-center gap-1.5 border-b border-border/60 bg-muted/30 px-4 py-2.5">
        <div className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
        <div className="h-2.5 w-2.5 rounded-full bg-amber-500/60" />
        <div className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
        <span className="ml-3 text-xs text-muted-foreground">
          자소서 Workshop · Samsung — Q1: 본인의 강점과 보완할 점
        </span>
      </div>

      <div className="grid gap-0 md:grid-cols-[1.1fr_1fr]">
        {/* Draft side */}
        <div className="border-b border-border/60 p-5 md:border-b-0 md:border-r">
          <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
            <PenLine className="h-3 w-3" />
            Your draft
          </div>
          <div className="space-y-2.5 text-[13px] leading-relaxed">
            <p>
              저의 가장 큰 강점은 <span className="text-foreground font-medium">끈기</span>입니다. 작년 알고리즘 수업에서…
            </p>
            <p className="rounded-md bg-destructive/10 px-2 py-1 text-destructive">
              저는 매우 열정적이고 항상 최선을 다합니다.
            </p>
            <p className="rounded-md bg-amber-500/10 px-2 py-1 text-amber-300">
              팀 프로젝트에서 백엔드 API 응답 시간을 개선했습니다.
            </p>
            <p className="text-muted-foreground/70">
              앞으로 입사하게 된다면 회사에 기여하는 인재가 되겠습니다…
            </p>
          </div>
        </div>

        {/* Critique side */}
        <div className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
              <Sparkles className="h-3 w-3 text-amber-500" />
              AI critique
            </div>
            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-400">
              6 / 10
            </span>
          </div>

          <div className="space-y-3 text-[12px] leading-relaxed">
            <div>
              <p className="mb-1 text-[10px] font-medium uppercase tracking-widest text-destructive/80">
                Weakness
              </p>
              <p>&ldquo;매우 열정적&rdquo; reads as English-to-Korean translation. Samsung wants evidence, not adjectives.</p>
            </div>

            <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-2.5">
              <p className="mb-1 text-[10px] font-medium uppercase tracking-widest text-amber-400">
                Foreigner pitfall
              </p>
              <p className="text-muted-foreground">
                Generic <span className="text-foreground">끈기</span> claim with no metric. Add: how long, what improved, by what %.
              </p>
            </div>

            <div>
              <p className="mb-1 text-[10px] font-medium uppercase tracking-widest text-emerald-400">
                Strength
              </p>
              <p className="text-muted-foreground">
                Highlighted line shows a concrete project result — keep this pattern through the rest of the essay.
              </p>
            </div>

            <div className="rounded-md border border-border/60 bg-muted/30 p-2.5 text-[11px]">
              <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Suggested revision
              </p>
              <p className="mt-1 italic text-muted-foreground/80">
                응답 시간을 <span className="text-amber-300">340ms → 90ms</span>로 개선한 경험을 통해…
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TrustStrip() {
  return (
    <section className="border-b border-border/60 bg-muted/20 py-8">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-center text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Built for students applying to
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-medium text-muted-foreground">
          <span>Samsung</span>
          <span className="text-border">·</span>
          <span>Naver</span>
          <span className="text-border">·</span>
          <span>Kakao</span>
          <span className="text-border">·</span>
          <span>Coupang</span>
          <span className="text-border">·</span>
          <span>Toss</span>
          <span className="text-border">·</span>
          <span>LINE</span>
          <span className="text-border">·</span>
          <span>Krafton</span>
        </div>
      </div>
    </section>
  )
}

const features = [
  {
    icon: PenLine,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    title: '자소서 Workshop',
    desc: 'Real 자기소개서 questions from Samsung, Naver, Kakao, Coupang, Toss, LINE, Krafton. AI critique catches Korean-style mistakes, foreigner pitfalls, and company-fit misses that ChatGPT will not flag.',
    badge: 'Lead feature',
  },
  {
    icon: Lightbulb,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    title: 'Korean Lecture Explainer',
    desc: 'Paste any 자료구조, 알고리즘, or 운영체제 lecture. Get a clear English breakdown, code examples in your language, and a Korean ↔ English term map you can actually study from.',
  },
  {
    icon: Briefcase,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    title: 'Korean Internship Tracker',
    desc: 'One-click add for Samsung, Naver, Kakao, Coupang, Toss, LINE. Track the Korean hiring pipeline — 서류 → 코딩 테스트 → 1차 면접 → 2차 → 합격. Never miss a deadline.',
  },
  {
    icon: Map,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
    title: 'AI Career Roadmap',
    desc: 'Tell us your target — Samsung SWE intern? Naver backend? Toss frontend? — and we generate a phase-by-phase prep plan with milestones and resources.',
  },
  {
    icon: BookOpen,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    title: 'Study Vault',
    desc: 'Save AI explanations, lecture notes, and recruiter contacts. Tagged, searchable, one click from the explainer. Your personal study database.',
  },
]

function Features() {
  return (
    <section className="border-b border-border/60 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Built around the Korean tech recruiting pipeline.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Four tools that match how Korean tech hiring actually works — and how studying CS in your second language actually feels.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {features.map((f) => (
            <div
              key={f.title}
              className="group relative rounded-xl border border-border/60 bg-card p-6 transition-colors hover:border-foreground/20"
            >
              {f.badge && (
                <span className="absolute right-4 top-4 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest text-amber-400">
                  {f.badge}
                </span>
              )}
              <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg ${f.bg}`}>
                <f.icon className={`h-5 w-5 ${f.color}`} />
              </div>
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const steps = [
  {
    n: '01',
    title: 'Sign up free',
    desc: 'Email or Google. 30 seconds. No credit card.',
  },
  {
    n: '02',
    title: 'Paste your first 강의 or 자료',
    desc: 'Lecture slides, assignment PDFs, textbook chapters — anything in Korean you need to actually understand by tomorrow’s 시험.',
  },
  {
    n: '03',
    title: 'Track your apps. Study smarter.',
    desc: 'Add Samsung, Naver, Kakao to your tracker in one click. Save AI explanations to your Vault. Walk into the coding test ready.',
  },
]

function HowItWorks() {
  return (
    <section className="border-b border-border/60 bg-muted/20 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            From lost in lecture to ready for the coding test.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Three steps. About five minutes.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="rounded-xl border border-border/60 bg-card p-6">
              <div className="font-mono text-xs text-muted-foreground">{s.n}</div>
              <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const promises = [
  'Free during beta',
  'Cancel anytime, no questions',
  'Your notes stay yours',
]

function PricingTeaser({
  loggedIn,
  tier,
}: {
  loggedIn: boolean
  tier: Tier
}) {
  // Pro users don't need a pricing nudge on every visit.
  if (loggedIn && tier === 'pro') {
    return (
      <section className="border-b border-border/60 py-16">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
            <Sparkles className="h-3 w-3" />
            You&apos;re on Pro
          </div>
          <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground">
            Unlimited AI is unlocked. Thanks for backing this — it&apos;s what keeps the lights on.
          </p>
        </div>
      </section>
    )
  }

  // Free users get a direct upgrade prompt; logged-out users get the standard teaser.
  return (
    <section className="border-b border-border/60 py-20">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {loggedIn ? 'Hit the daily limit?' : 'Simple pricing. One plan.'}
        </h2>
        <p className="mt-4 text-muted-foreground">
          {loggedIn ? (
            <>
              You&apos;re on Free — 5 AI calls a day. Pro is{' '}
              <span className="font-medium text-foreground">$10/month</span> for unlimited.
              Cancel any time.
            </>
          ) : (
            <>
              Start free with 5 AI calls a day. Upgrade to{' '}
              <span className="font-medium text-foreground">$10/month</span> for unlimited.
              Cancel any time.
            </>
          )}
        </p>
        <div className="mt-7 flex justify-center">
          <Button asChild variant={loggedIn ? 'default' : 'outline'} size="lg">
            <Link href="/pricing" className="gap-2">
              {loggedIn ? 'Upgrade to Pro' : 'See pricing'} <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

function FinalCTA({ loggedIn }: { loggedIn: boolean }) {
  return (
    <section className="border-b border-border/60 py-24">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          The internship at Samsung
          <br />
          isn&apos;t going to apply for itself.
        </h2>
        <p className="mt-4 text-muted-foreground">
          {loggedIn
            ? 'Jump back in. Decode a lecture, log an application, move one step closer.'
            : 'Join the international CS students using GlobalCampus AI to ace their Korean lectures and land their first Korean tech internship.'}
        </p>
        <div className="mt-8 flex justify-center">
          <Button asChild size="lg">
            {loggedIn ? (
              <Link href="/dashboard" className="gap-2">
                Go to dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <Link href="/register" className="gap-2">
                Start free <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </Button>
        </div>
        {!loggedIn && (
          <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
            {promises.map((p) => (
              <li key={p} className="inline-flex items-center gap-1.5">
                <Check className="h-3 w-3 text-emerald-500" />
                {p}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

function Footer() {
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
          <Link href="/login" className="transition-colors hover:text-foreground">
            Sign in
          </Link>
          <Link href="/register" className="transition-colors hover:text-foreground">
            Start free
          </Link>
        </div>
      </div>
    </footer>
  )
}
