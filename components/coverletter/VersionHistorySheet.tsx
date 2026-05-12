'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { GitBranch, Loader2, RotateCcw, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils/cn'
import { restoreFromSnapshot } from '@/lib/actions/coverletter'

type Version = {
  id: string
  version: number
  content: string
  word_count: number
  ai_score: number | null
  is_current: boolean
  created_at: string
}

export function VersionHistorySheet({
  currentId,
  versions,
}: {
  currentId: string
  versions: Version[]
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const { toast } = useToast()

  function onRestore(snapshotId: string) {
    if (!confirm('Replace your current draft with this version? Your current text will be overwritten.')) return
    startTransition(async () => {
      const result = await restoreFromSnapshot(currentId, snapshotId)
      if (!result.ok) {
        toast({ title: 'Restore failed', description: result.error })
        return
      }
      toast({ title: 'Restored', description: 'Current draft replaced with selected version.' })
      setOpen(false)
      router.refresh()
    })
  }

  const historicCount = versions.length - 1

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-1.5"
      >
        <GitBranch className="h-3.5 w-3.5" />
        History
        {historicCount > 0 && (
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium">
            {historicCount}
          </span>
        )}
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          <SheetHeader className="px-6 pt-6">
            <SheetTitle>Version history</SheetTitle>
            <SheetDescription>
              Every snapshot you saved. Click Restore to replace your current draft with an older version.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-3 px-6 pb-6 pt-4">
            {versions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No versions yet.</p>
            ) : (
              versions.map((v) => (
                <VersionItem
                  key={v.id}
                  v={v}
                  onRestore={() => onRestore(v.id)}
                  isPending={isPending}
                />
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

function VersionItem({
  v,
  onRestore,
  isPending,
}: {
  v: Version
  onRestore: () => void
  isPending: boolean
}) {
  const when = new Date(v.created_at).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
  const preview = v.content.trim().slice(0, 180) || '(empty)'

  return (
    <div
      className={cn(
        'rounded-lg border p-3',
        v.is_current ? 'border-amber-500/40 bg-amber-500/5' : 'border-border/60 bg-card/40'
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">v{v.version}</span>
          {v.is_current && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
              <Check className="h-2.5 w-2.5" /> Current
            </span>
          )}
          {v.ai_score != null && (
            <span
              className={cn(
                'rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                v.ai_score >= 7
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : v.ai_score >= 4
                  ? 'bg-amber-500/10 text-amber-400'
                  : 'bg-destructive/10 text-destructive'
              )}
            >
              {v.ai_score}/10
            </span>
          )}
        </div>
        <span className="text-[11px] text-muted-foreground">{when}</span>
      </div>
      <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{preview}</p>
      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{v.word_count} words</span>
        {!v.is_current && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRestore}
            disabled={isPending}
            className="h-6 gap-1 px-2 text-[11px]"
          >
            {isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <>
                <RotateCcw className="h-3 w-3" /> Restore
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
