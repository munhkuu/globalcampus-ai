import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ThumbsUp, ThumbsDown, MinusCircle } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Feedback', robots: { index: false } }

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? ''

type FeedbackRow = {
  id: string
  created_at: string
  user_id: string | null
  email: string | null
  rating: 'positive' | 'negative' | 'neutral'
  comment: string | null
  feature: string | null
  path: string | null
  source: 'widget' | 'post_action' | 'survey'
}

type SourceRow = { signup_source: string | null }

export default async function AdminFeedbackPage() {
  if (!ADMIN_EMAIL) notFound()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')
  if (user.email !== ADMIN_EMAIL) notFound()

  // Service role to bypass RLS — we want to see every user's feedback.
  const svc = createServiceClient()

  const [feedbackRes, sourceRes] = await Promise.all([
    svc
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200) as unknown as Promise<{ data: FeedbackRow[] | null }>,
    svc
      .from('profiles')
      .select('signup_source')
      .not('signup_source', 'is', null) as unknown as Promise<{ data: SourceRow[] | null }>,
  ])

  const feedback = feedbackRes.data ?? []
  const sources = sourceRes.data ?? []

  const sourceCounts = sources.reduce<Record<string, number>>((acc, row) => {
    const k = row.signup_source ?? 'unknown'
    acc[k] = (acc[k] ?? 0) + 1
    return acc
  }, {})

  const positive = feedback.filter((f) => f.rating === 'positive').length
  const negative = feedback.filter((f) => f.rating === 'negative').length
  const netScore = feedback.length === 0 ? 0 : Math.round((positive / feedback.length) * 100)

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Founder dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every reaction. Every signup channel. The truth, not the vanity metrics.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Total feedback" value={feedback.length} />
        <StatCard label="Positive" value={positive} tone="emerald" />
        <StatCard label="Useful rate" value={`${netScore}%`} />
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Signup sources</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(sourceCounts).length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No attributed signups yet. Send users with <code>?utm_source=foo</code> or <code>?ref=foo</code> in the URL.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {Object.entries(sourceCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([source, count]) => (
                  <li key={source} className="flex items-center justify-between text-sm">
                    <span className="font-mono text-xs">{source}</span>
                    <span className="font-medium tabular-nums">{count}</span>
                  </li>
                ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Recent feedback</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {feedback.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No feedback yet. Once users start engaging, every reaction lands here.
            </p>
          ) : (
            feedback.map((f) => <FeedbackItem key={f.id} item={f} />)
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string
  value: number | string
  tone?: 'emerald'
}) {
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={
            tone === 'emerald'
              ? 'text-2xl font-semibold tabular-nums text-emerald-400'
              : 'text-2xl font-semibold tabular-nums'
          }
        >
          {value}
        </div>
      </CardContent>
    </Card>
  )
}

function FeedbackItem({ item }: { item: FeedbackRow }) {
  const icon =
    item.rating === 'positive' ? (
      <ThumbsUp className="h-3.5 w-3.5 text-emerald-400" />
    ) : item.rating === 'negative' ? (
      <ThumbsDown className="h-3.5 w-3.5 text-destructive" />
    ) : (
      <MinusCircle className="h-3.5 w-3.5 text-muted-foreground" />
    )

  const when = new Date(item.created_at).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <div className="rounded-lg border border-border/60 bg-card/40 p-3">
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          {icon}
          <span>{item.email ?? 'anonymous'}</span>
          {item.feature && (
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-widest">
              {item.feature}
            </span>
          )}
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium">
            {item.source}
          </span>
        </div>
        <span>{when}</span>
      </div>
      {item.comment && (
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{item.comment}</p>
      )}
      {item.path && (
        <p className="mt-1.5 font-mono text-[11px] text-muted-foreground">{item.path}</p>
      )}
    </div>
  )
}
