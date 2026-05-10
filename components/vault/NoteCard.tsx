'use client'

import { useTransition } from 'react'
import { Pin, Pencil, Trash2, Cpu } from 'lucide-react'
import { togglePinNote } from '@/lib/actions/vault'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils/dates'
import { cn } from '@/lib/utils/cn'
import type { VaultNote } from '@/lib/types/app.types'

interface NoteCardProps {
  note: VaultNote
  onEdit: (note: VaultNote) => void
  onDelete: (id: string) => void
}

export function NoteCard({ note, onEdit, onDelete }: NoteCardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const preview = note.content.replace(/[#*`>\-]/g, '').slice(0, 140).trim()
  const isAI = note.source === 'AI-Generated'

  function handleTogglePin() {
    startTransition(async () => {
      await togglePinNote(note.id, !note.is_pinned)
      router.refresh()
    })
  }

  return (
    <div className="group relative flex flex-col rounded-xl border bg-card p-4 transition-colors hover:border-foreground/20">
      {/* Pin + AI badge row */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {isAI && (
            <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-medium text-purple-500">
              <Cpu className="h-2.5 w-2.5" />
              AI
            </span>
          )}
          {note.is_pinned && (
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
              <Pin className="h-2.5 w-2.5" />
              Pinned
            </span>
          )}
        </div>

        {/* Actions — show on hover */}
        <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={handleTogglePin}
            disabled={isPending}
            className={cn(
              'inline-flex h-6 w-6 items-center justify-center rounded-md transition-colors',
              note.is_pinned
                ? 'text-amber-500 hover:bg-amber-500/10'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
            aria-label={note.is_pinned ? 'Unpin note' : 'Pin note'}
          >
            <Pin className="h-3 w-3" />
          </button>
          <button
            onClick={() => onEdit(note)}
            className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            onClick={() => onDelete(note.id)}
            className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Title */}
      <h3 className="mb-1.5 line-clamp-2 text-sm font-medium leading-snug">{note.title}</h3>

      {/* Preview */}
      {preview && (
        <p className="mb-3 line-clamp-3 flex-1 text-xs leading-relaxed text-muted-foreground">
          {preview}
        </p>
      )}

      {/* Tags */}
      {note.tags.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1">
          {note.tags.slice(0, 4).map((tag) => (
            <Badge key={tag} variant="secondary" className="px-1.5 py-0 text-[10px]">
              {tag}
            </Badge>
          ))}
          {note.tags.length > 4 && (
            <span className="text-[10px] text-muted-foreground">+{note.tags.length - 4}</span>
          )}
        </div>
      )}

      {/* Date */}
      <p className="text-[10px] text-muted-foreground/60">
        {formatDate(note.updated_at, 'short')}
      </p>
    </div>
  )
}
