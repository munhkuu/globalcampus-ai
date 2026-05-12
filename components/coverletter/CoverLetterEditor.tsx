'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  Save,
  Trash2,
  Check,
  Info,
  Wand2,
  GitBranch,
  Link2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils/cn'
import {
  updateCoverLetterContent,
  deleteCoverLetterAndRedirect,
  createSnapshot,
} from '@/lib/actions/coverletter'
import type { CoverLetterCritique } from '@/lib/ai/prompts/coverletter'
import { VersionHistorySheet } from './VersionHistorySheet'

type DraftProps = {
  id: string
  company: string
  question: string
  content: string
  word_count: number
  ai_feedback: CoverLetterCritique | null
  ai_score: number | null
  updated_at: string
  version: number
  application_id?: string | null
}

type Version = {
  id: string
  version: number
  content: string
  word_count: number
  ai_score: number | null
  is_current: boolean
  created_at: string
}

type LinkedApplication = {
  id: string
  company_name: string
  role_title: string
  deadline: string | null
}

// Typical Korean tech 자소서 character limit (most companies cap each question at
// 1500–2000 chars). 1500 is a safe default that warns before the hard cap.
const CHAR_TARGET = 1500
const CHAR_HARD_CAP = 2000

export function CoverLetterEditor({
  draft,
  companyNotes,
  versions,
  linkedApplication,
}: {
  draft: DraftProps
  companyNotes: string | null
  versions: Version[]
  linkedApplication: LinkedApplication | null
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [content, setContent] = useState(draft.content)
  const [critique, setCritique] = useState<CoverLetterCritique | null>(draft.ai_feedback)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [critiqueLoading, setCritiqueLoading] = useState(false)
  const [critiqueError, setCritiqueError] = useState<string>()
  const [isDeleting, startDelete] = useTransition()
  const [isSnapshotting, startSnapshot] = useTransition()
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0
  const charCount = content.length
  const charProgress = Math.min(charCount / CHAR_TARGET, 1)
  const charState: 'low' | 'good' | 'warn' | 'over' =
    charCount === 0
      ? 'low'
      : charCount < CHAR_TARGET * 0.4
      ? 'low'
      : charCount <= CHAR_TARGET
      ? 'good'
      : charCount <= CHAR_HARD_CAP
      ? 'warn'
      : 'over'

  function applyRevision(excerpt: string, suggestion: string) {
    const idx = content.indexOf(excerpt)
    if (idx === -1) {
      toast({
        title: 'Cannot apply automatically',
        description: 'You’ve edited that section since the critique. Copy the suggestion manually.',
      })
      return
    }
    setContent(content.slice(0, idx) + suggestion + content.slice(idx + excerpt.length))
    toast({ title: 'Revision applied', description: 'Draft updated. Auto-save in 1.5s.' })
  }

  // Auto-save debounce: 1.5s after last keystroke.
  useEffect(() => {
    if (content === draft.content) return
    setSaving(true)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      const result = await updateCoverLetterContent(draft.id, { content })
      setSaving(false)
      if (result.ok) {
        setSavedAt(new Date())
      } else {
        toast({ title: 'Save failed', description: result.error })
      }
    }, 1500)
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content])

  async function requestCritique() {
    setCritiqueError(undefined)
    if (content.trim().length < 50) {
      setCritiqueError('Write at least 50 characters before requesting feedback.')
      return
    }
    setCritiqueLoading(true)
    try {
      // Save first so the server has the latest draft.
      await updateCoverLetterContent(draft.id, { content })

      const res = await fetch('/api/ai/coverletter/critique', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: draft.company,
          question: draft.question,
          draft: content,
          coverLetterId: draft.id,
        }),
      })
      const json = (await res.json()) as { data?: CoverLetterCritique; error?: string }
      if (!res.ok) {
        setCritiqueError(json.error ?? 'Critique failed.')
        return
      }
      if (json.data) {
        setCritique(json.data)
        router.refresh()
      }
    } catch {
      setCritiqueError('Network error — try again.')
    } finally {
      setCritiqueLoading(false)
    }
  }

  function onDelete() {
    if (!confirm('Delete this draft permanently?')) return
    startDelete(async () => {
      await deleteCoverLetterAndRedirect(draft.id)
    })
  }

  function onSnapshot() {
    startSnapshot(async () => {
      // Save pending changes first so the snapshot captures the latest text.
      if (content !== draft.content) {
        await updateCoverLetterContent(draft.id, { content })
      }
      const result = await createSnapshot(draft.id)
      if (!result.ok) {
        toast({ title: 'Snapshot failed', description: result.error })
        return
      }
      toast({
        title: `Saved as v${draft.version + 1}`,
        description: 'Previous state is now in your history.',
      })
      router.replace(`/coverletter/${result.newId}`)
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/coverletter"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> All drafts
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground">
            {saving ? (
              <span className="inline-flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" /> Saving…
              </span>
            ) : savedAt ? (
              <span className="inline-flex items-center gap-1">
                <Check className="h-3 w-3 text-emerald-500" />
                Saved {savedAt.toLocaleTimeString()}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1">
                <Save className="h-3 w-3" /> Auto-save on
              </span>
            )}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={onSnapshot}
            disabled={isSnapshotting}
            className="gap-1.5"
          >
            {isSnapshotting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                <GitBranch className="h-3.5 w-3.5" /> Snapshot
              </>
            )}
          </Button>
          <VersionHistorySheet currentId={draft.id} versions={versions} />
          <Button variant="outline" size="sm" onClick={onDelete} disabled={isDeleting}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-border bg-card px-2.5 py-0.5 text-xs font-medium">
            {draft.company}
          </span>
          <span className="rounded-full border border-border bg-card px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            v{draft.version}
          </span>
          {draft.ai_score != null && (
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-medium',
                draft.ai_score >= 7
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : draft.ai_score >= 4
                  ? 'bg-amber-500/10 text-amber-400'
                  : 'bg-destructive/10 text-destructive'
              )}
            >
              {draft.ai_score}/10
            </span>
          )}
          {linkedApplication && (
            <Link
              href={`/internships`}
              className="ml-auto inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-xs text-blue-300 transition-colors hover:bg-blue-500/15"
              title="View in tracker"
            >
              <Link2 className="h-3 w-3" />
              {linkedApplication.company_name} · {linkedApplication.role_title}
            </Link>
          )}
        </div>
        <p className="mt-2 text-sm leading-relaxed">{draft.question}</p>
        {companyNotes && (
          <div className="mt-3 flex items-start gap-2 rounded-md border border-border/60 bg-muted/30 p-2.5 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-3 w-3 shrink-0 text-amber-400" />
            <span>{companyNotes}</span>
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        {/* Editor */}
        <div className="space-y-2">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start writing your 자소서 here…"
            className="min-h-[500px] resize-none text-sm leading-relaxed"
            maxLength={8000}
          />

          {/* Character count progress + status */}
          <div className="space-y-1.5">
            <div className="h-1 w-full overflow-hidden rounded-full bg-border/60">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  charState === 'low' && 'bg-muted-foreground/30',
                  charState === 'good' && 'bg-emerald-500',
                  charState === 'warn' && 'bg-amber-500',
                  charState === 'over' && 'bg-destructive'
                )}
                style={{ width: `${charProgress * 100}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">
                {wordCount} words · <span
                  className={cn(
                    charState === 'good' && 'text-emerald-400',
                    charState === 'warn' && 'text-amber-400',
                    charState === 'over' && 'text-destructive'
                  )}
                >{charCount.toLocaleString()}</span> / {CHAR_TARGET.toLocaleString()} chars
                {charState === 'over' && (
                  <span className="ml-1 text-destructive">
                    (over hard cap of {CHAR_HARD_CAP.toLocaleString()})
                  </span>
                )}
                {charState === 'warn' && (
                  <span className="ml-1 text-amber-400">
                    (most Korean tech forms cap around {CHAR_TARGET.toLocaleString()})
                  </span>
                )}
              </span>
              <Button
                onClick={requestCritique}
                disabled={critiqueLoading || content.trim().length < 50}
                size="sm"
                className="gap-1.5"
              >
                {critiqueLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Analyzing…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" /> {critique ? 'Re-critique' : 'Get AI critique'}
                  </>
                )}
              </Button>
            </div>
          </div>
          {critiqueError && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {critiqueError}
            </p>
          )}
        </div>

        {/* Feedback panel */}
        <CritiquePanel critique={critique} onApply={applyRevision} />
      </div>
    </div>
  )
}

function CritiquePanel({
  critique,
  onApply,
}: {
  critique: CoverLetterCritique | null
  onApply: (excerpt: string, suggestion: string) => void
}) {
  if (!critique) {
    return (
      <Card className="border-dashed border-border/60">
        <CardContent className="space-y-3 p-5 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
            <Sparkles className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-medium">No feedback yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Write 50+ characters, then click <span className="text-foreground">Get AI critique</span>.
              You&apos;ll see scores, Korean-style notes, and line-level suggestions.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/60">
      <CardContent className="space-y-4 p-5">
        {/* Overall score */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Overall
            </p>
            <p className="mt-1 text-sm">{critique.one_line_summary}</p>
          </div>
          <div
            className={cn(
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-semibold',
              critique.overall_score >= 7
                ? 'bg-emerald-500/10 text-emerald-400'
                : critique.overall_score >= 4
                ? 'bg-amber-500/10 text-amber-400'
                : 'bg-destructive/10 text-destructive'
            )}
          >
            {critique.overall_score}
          </div>
        </div>

        <Separator />

        <FeedbackList title="Strengths" items={critique.strengths} tone="emerald" />
        <FeedbackList title="Weaknesses" items={critique.weaknesses} tone="destructive" />
        <FeedbackList
          title="Korean style notes"
          items={critique.korean_style_notes}
          tone="amber"
        />
        <FeedbackList
          title="Common foreigner pitfalls"
          items={critique.international_student_pitfalls}
          tone="amber"
        />

        <Separator />

        {/* Company fit */}
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Company fit ({critique.company_fit.score}/10)
          </p>
          <p className="mt-1.5 text-sm leading-relaxed">{critique.company_fit.notes}</p>
        </div>

        {/* Suggested revisions */}
        {critique.suggested_revisions.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Suggested revisions ({critique.suggested_revisions.length})
              </p>
              {critique.suggested_revisions.map((r, i) => (
                <RevisionCard
                  key={i}
                  excerpt={r.excerpt}
                  suggestion={r.suggestion}
                  reason={r.reason}
                  onApply={() => onApply(r.excerpt, r.suggestion)}
                />
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function RevisionCard({
  excerpt,
  suggestion,
  reason,
  onApply,
}: {
  excerpt: string
  suggestion: string
  reason: string
  onApply: () => void
}) {
  const [applied, setApplied] = useState(false)
  function handle() {
    onApply()
    setApplied(true)
  }
  return (
    <div className="space-y-1.5 rounded-md border border-border/60 bg-muted/20 p-2.5">
      <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Original</p>
      <p className="text-xs italic text-muted-foreground">&ldquo;{excerpt}&rdquo;</p>
      <p className="text-[11px] uppercase tracking-widest text-emerald-400">Suggested</p>
      <p className="text-xs">{suggestion}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{reason}</p>
      <div className="flex justify-end pt-1">
        <button
          type="button"
          onClick={handle}
          disabled={applied}
          className={cn(
            'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors',
            applied
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
              : 'border-border hover:border-foreground/30 hover:bg-accent'
          )}
        >
          {applied ? (
            <>
              <Check className="h-3 w-3" /> Applied
            </>
          ) : (
            <>
              <Wand2 className="h-3 w-3" /> Apply
            </>
          )}
        </button>
      </div>
    </div>
  )
}

function FeedbackList({
  title,
  items,
  tone,
}: {
  title: string
  items: string[]
  tone: 'emerald' | 'destructive' | 'amber'
}) {
  if (!items || items.length === 0) return null
  const dotClass =
    tone === 'emerald'
      ? 'bg-emerald-500'
      : tone === 'destructive'
      ? 'bg-destructive'
      : 'bg-amber-500'
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{title}</p>
      <ul className="mt-1.5 space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-xs leading-relaxed">
            <span className={cn('mt-1 h-1 w-1 shrink-0 rounded-full', dotClass)} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
