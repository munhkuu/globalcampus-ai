'use client'

import { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search } from 'lucide-react'
import { deleteVaultNote } from '@/lib/actions/vault'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { NoteCard } from './NoteCard'
import { NoteForm } from './NoteForm'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils/cn'
import type { VaultNote } from '@/lib/types/app.types'

type Filter = 'all' | 'pinned' | 'ai' | 'manual'

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pinned', label: 'Pinned' },
  { value: 'ai', label: 'AI-Generated' },
  { value: 'manual', label: 'Manual' },
]

interface VaultClientProps {
  initialNotes: VaultNote[]
}

export function VaultClient({ initialNotes }: VaultClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  const [notes] = useState(initialNotes)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<VaultNote | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let list = notes

    if (filter === 'pinned') list = list.filter((n) => n.is_pinned)
    else if (filter === 'ai') list = list.filter((n) => n.source === 'AI-Generated')
    else if (filter === 'manual') list = list.filter((n) => n.source !== 'AI-Generated')

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q))
      )
    }

    return list
  }, [notes, filter, search])

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteVaultNote(id)
      if (result?.error) {
        toast({ title: 'Delete failed', description: result.error, variant: 'destructive' })
      } else {
        toast({ title: 'Note deleted' })
        router.refresh()
      }
      setDeletingId(null)
    })
  }

  function handleEdit(note: VaultNote) {
    setEditingNote(note)
    setFormOpen(true)
  }

  function handleFormClose() {
    setFormOpen(false)
    setEditingNote(null)
  }

  const counts = useMemo(() => ({
    all: notes.length,
    pinned: notes.filter((n) => n.is_pinned).length,
    ai: notes.filter((n) => n.source === 'AI-Generated').length,
    manual: notes.filter((n) => n.source !== 'AI-Generated').length,
  }), [notes])

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Study Vault</h1>
          <p className="text-sm text-muted-foreground">
            {notes.length === 0 ? 'No notes yet' : `${notes.length} note${notes.length !== 1 ? 's' : ''} saved`}
          </p>
        </div>
        <Button onClick={() => { setEditingNote(null); setFormOpen(true) }}>
          <Plus className="mr-1.5 h-4 w-4" />
          New Note
        </Button>
      </div>

      {/* Filter + Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md border px-3 py-1 text-xs font-medium transition-colors',
                filter === value
                  ? 'border-foreground/30 bg-foreground/10 text-foreground'
                  : 'border-border bg-background text-muted-foreground hover:border-foreground/20 hover:text-foreground'
              )}
            >
              {label}
              <span className={cn('rounded px-1 tabular-nums', filter === value ? 'bg-foreground/10' : 'bg-muted')}>
                {counts[value]}
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center">
          <p className="text-sm font-medium">
            {search || filter !== 'all' ? 'No notes match your filter' : 'Your vault is empty'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {search || filter !== 'all'
              ? 'Try a different search or filter'
              : 'Add a note or save an AI explanation to get started'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onEdit={handleEdit}
              onDelete={setDeletingId}
            />
          ))}
        </div>
      )}

      {/* Note form */}
      <NoteForm open={formOpen} onClose={handleFormClose} initialData={editingNote} />

      {/* Delete confirmation */}
      <Dialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete note?</DialogTitle>
            <DialogDescription>This will permanently remove the note and cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingId(null)} disabled={isPending}>Cancel</Button>
            <Button variant="destructive" onClick={() => deletingId && handleDelete(deletingId)} disabled={isPending}>
              {isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
