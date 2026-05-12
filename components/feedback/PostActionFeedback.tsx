'use client'

import { useState, useTransition, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { ThumbsUp, ThumbsDown, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { submitFeedback } from '@/lib/actions/feedback'

// Inline "Was this useful?" prompt shown after a successful AI action.
// One-shot per session-storage key — won't repeat itself once the user has
// engaged (positive, negative, or dismiss).
export function PostActionFeedback({
  feature,
  storageKey,
}: {
  feature: string
  storageKey: string
}) {
  const [shown, setShown] = useState(false)
  const [done, setDone] = useState(false)
  const [showComment, setShowComment] = useState(false)
  const [comment, setComment] = useState('')
  const [chosen, setChosen] = useState<'positive' | 'negative' | null>(null)
  const [, startTransition] = useTransition()
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (sessionStorage.getItem(storageKey)) return
    setShown(true)
  }, [storageKey])

  function record(rating: 'positive' | 'negative') {
    setChosen(rating)
    setShowComment(true)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(storageKey, '1')
    }
    startTransition(async () => {
      await submitFeedback({
        rating,
        comment: null,
        feature,
        path: pathname,
        source: 'post_action',
      })
    })
  }

  function submitWithComment() {
    if (!chosen) return
    startTransition(async () => {
      await submitFeedback({
        rating: chosen,
        comment: comment.trim() || null,
        feature,
        path: pathname,
        source: 'post_action',
      })
      setDone(true)
    })
  }

  function dismiss() {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(storageKey, '1')
    }
    setShown(false)
  }

  if (!shown) return null

  if (done) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-300">
        <Check className="h-3.5 w-3.5" />
        Got it — thanks. Real feedback shapes what we build next.
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border/60 bg-card/60 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Was this explanation useful?
        </p>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => record('positive')}
            className={cn(
              'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors',
              chosen === 'positive'
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                : 'border-border hover:border-foreground/20'
            )}
          >
            <ThumbsUp className="h-3 w-3" />
            Yes
          </button>
          <button
            type="button"
            onClick={() => record('negative')}
            className={cn(
              'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors',
              chosen === 'negative'
                ? 'border-destructive/40 bg-destructive/10 text-destructive'
                : 'border-border hover:border-foreground/20'
            )}
          >
            <ThumbsDown className="h-3 w-3" />
            No
          </button>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss"
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      {showComment && (
        <div className="mt-3 space-y-2">
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={
              chosen === 'positive'
                ? 'What worked? (optional)'
                : 'What was wrong? (optional)'
            }
            className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            maxLength={500}
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDone(true)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={submitWithComment}
              className="rounded-md bg-foreground px-2.5 py-1 text-xs font-medium text-background hover:bg-foreground/90"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
