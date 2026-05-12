import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, FileText, ArrowRight } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: '자소서 Workshop' }

type DraftRow = {
  id: string
  company: string
  question: string
  content: string
  word_count: number
  ai_score: number | null
  updated_at: string
}

export default async function CoverLetterListPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: drafts } = (await supabase
    .from('cover_letters')
    .select('id, company, question, content, word_count, ai_score, updated_at')
    .eq('user_id', user!.id)
    .eq('is_current', true)
    .order('updated_at', { ascending: false })) as { data: DraftRow[] | null }

  const items = drafts ?? []
  const byCompany = items.reduce<Record<string, DraftRow[]>>((acc, d) => {
    ;(acc[d.company] ??= []).push(d)
    return acc
  }, {})

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">자소서 Workshop</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Draft, critique, revise. The 자기소개서 is what gets you through 서류 review.
            Real questions from Samsung, Naver, Kakao, Coupang, Toss, LINE, Krafton, LG CNS.
          </p>
        </div>
        <Button asChild>
          <Link href="/coverletter/new" className="gap-1.5">
            <Plus className="h-4 w-4" /> New draft
          </Link>
        </Button>
      </div>

      {items.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-6">
          {Object.entries(byCompany).map(([company, drafts]) => (
            <section key={company}>
              <h2 className="mb-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                {company} ({drafts.length})
              </h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {drafts.map((d) => (
                  <DraftCard key={d.id} draft={d} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

function DraftCard({ draft }: { draft: DraftRow }) {
  const preview = draft.content.trim().slice(0, 140) || 'Empty draft — open to start writing.'
  const updated = new Date(draft.updated_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  return (
    <Link href={`/coverletter/${draft.id}`}>
      <Card className="group h-full border-border/60 transition-colors hover:border-foreground/20">
        <CardContent className="space-y-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <p className="line-clamp-2 text-xs font-medium text-muted-foreground">
              {draft.question}
            </p>
            {draft.ai_score != null && (
              <span
                className={
                  draft.ai_score >= 7
                    ? 'shrink-0 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400'
                    : draft.ai_score >= 4
                    ? 'shrink-0 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-400'
                    : 'shrink-0 rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium text-destructive'
                }
              >
                {draft.ai_score}/10
              </span>
            )}
          </div>
          <p className="line-clamp-3 text-sm leading-relaxed">{preview}</p>
          <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground">
            <span>{draft.word_count} words</span>
            <span className="inline-flex items-center gap-1">
              {updated}
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function EmptyState() {
  return (
    <Card className="border-dashed border-border/60">
      <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
          <FileText className="h-6 w-6 text-amber-400" />
        </div>
        <div className="max-w-md space-y-1.5">
          <p className="text-base font-medium">No drafts yet.</p>
          <p className="text-sm text-muted-foreground">
            Pick a target company → answer one of their real 자소서 questions → get instant feedback on Korean style, structure, and culture fit.
          </p>
        </div>
        <Button asChild>
          <Link href="/coverletter/new" className="gap-1.5">
            <Plus className="h-4 w-4" /> Start your first draft
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
