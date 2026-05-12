'use client'

import { useState, useTransition } from 'react'
import { usePathname } from 'next/navigation'
import { MessageCircle, ThumbsUp, ThumbsDown, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils/cn'
import { submitFeedback } from '@/lib/actions/feedback'

type Rating = 'positive' | 'negative' | null

export function FeedbackWidget() {
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState<Rating>(null)
  const [comment, setComment] = useState('')
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()
  const pathname = usePathname()

  function reset() {
    setRating(null)
    setComment('')
  }

  function close() {
    setOpen(false)
    reset()
  }

  function onSubmit() {
    if (!rating) return
    startTransition(async () => {
      const result = await submitFeedback({
        rating,
        comment: comment.trim() || null,
        path: pathname,
        feature: pathname.split('/')[1] || null,
        source: 'widget',
      })
      if (!result.ok) {
        toast({
          title: 'Could not save',
          description: result.error,
        })
        return
      }
      toast({
        title: 'Thanks — got it.',
        description: 'Real feedback shapes what we build next.',
      })
      close()
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Send feedback"
        className="fixed bottom-5 right-5 z-40 inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card px-3.5 text-xs font-medium shadow-lg shadow-black/30 transition-colors hover:border-foreground/30 hover:bg-accent"
      >
        <MessageCircle className="h-3.5 w-3.5" />
        Feedback
      </button>

      {open && (
        <div
          className="fixed bottom-20 right-5 z-40 w-[320px] rounded-xl border border-border bg-card p-4 shadow-2xl shadow-black/40 animate-fade-in"
          role="dialog"
          aria-label="Feedback"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold">Tell me what you think.</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                One click. Optional comment. Read by the founder.
              </p>
            </div>
            <button
              type="button"
              onClick={close}
              className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setRating('positive')}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 rounded-md border p-3 text-xs transition-colors',
                rating === 'positive'
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                  : 'border-border hover:border-foreground/20'
              )}
            >
              <ThumbsUp className="h-4 w-4" />
              Useful
            </button>
            <button
              type="button"
              onClick={() => setRating('negative')}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 rounded-md border p-3 text-xs transition-colors',
                rating === 'negative'
                  ? 'border-destructive/40 bg-destructive/10 text-destructive'
                  : 'border-border hover:border-foreground/20'
              )}
            >
              <ThumbsDown className="h-4 w-4" />
              Not useful
            </button>
          </div>

          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What would make this 10× better?"
            className="mt-3 min-h-[80px] resize-none text-sm"
            maxLength={2000}
          />

          <div className="mt-3 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={close} disabled={isPending}>
              Cancel
            </Button>
            <Button size="sm" onClick={onSubmit} disabled={!rating || isPending}>
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Send'}
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
