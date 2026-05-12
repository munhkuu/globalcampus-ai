'use client'

import { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Plus,
  Star,
  Pencil,
  Trash2,
  ExternalLink,
  ArrowUpDown,
  Search,
  PenLine,
} from 'lucide-react'
import { deleteApplication, togglePriority } from '@/lib/actions/internships'
import { formatDate, relativeDate, isPast } from '@/lib/utils/dates'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ApplicationForm } from './ApplicationForm'
import { StatusBadge } from './StatusBadge'
import { StatusFilter, type FilterStatus } from './StatusFilter'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils/cn'
import type { InternshipApplication } from '@/lib/types/app.types'
import type { ApplicationStatus } from '@/lib/types/database.types'

type SortField = 'company_name' | 'deadline' | 'applied_date' | 'created_at'
type SortOrder = 'asc' | 'desc'

interface ApplicationTableProps {
  initialApplications: InternshipApplication[]
  draftCounts?: Record<string, number>
}

function computeCounts(
  apps: InternshipApplication[]
): Record<FilterStatus, number> {
  const counts = {
    all: apps.length,
    applied: 0,
    online_assessment: 0,
    interview: 0,
    rejected: 0,
    accepted: 0,
  }
  for (const a of apps) {
    counts[a.status as ApplicationStatus]++
  }
  return counts
}

export function ApplicationTable({
  initialApplications,
  draftCounts = {},
}: ApplicationTableProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  const [applications] = useState(initialApplications)
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all')
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  const [formOpen, setFormOpen] = useState(false)
  const [editingApp, setEditingApp] = useState<InternshipApplication | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const counts = useMemo(() => computeCounts(applications), [applications])

  const filtered = useMemo(() => {
    let list = applications

    if (activeFilter !== 'all') {
      list = list.filter((a) => a.status === activeFilter)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (a) =>
          a.company_name.toLowerCase().includes(q) ||
          a.role_title.toLowerCase().includes(q) ||
          (a.location ?? '').toLowerCase().includes(q)
      )
    }

    return [...list].sort((a, b) => {
      let av: string | null = null
      let bv: string | null = null

      if (sortField === 'company_name') {
        av = a.company_name
        bv = b.company_name
      } else {
        av = a[sortField] ?? null
        bv = b[sortField] ?? null
      }

      if (!av && !bv) return 0
      if (!av) return sortOrder === 'asc' ? 1 : -1
      if (!bv) return sortOrder === 'asc' ? -1 : 1
      return sortOrder === 'asc'
        ? av.localeCompare(bv)
        : bv.localeCompare(av)
    })
  }, [applications, activeFilter, search, sortField, sortOrder])

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  function handleEdit(app: InternshipApplication) {
    setEditingApp(app)
    setFormOpen(true)
  }

  function handleFormClose() {
    setFormOpen(false)
    setEditingApp(null)
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteApplication(id)
      if (result?.error) {
        toast({ title: 'Delete failed', description: result.error, variant: 'destructive' })
      } else {
        toast({ title: 'Application deleted' })
        router.refresh()
      }
      setDeletingId(null)
    })
  }

  function handleTogglePriority(app: InternshipApplication) {
    startTransition(async () => {
      await togglePriority(app.id, !app.is_priority)
      router.refresh()
    })
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Internships</h1>
          <p className="text-sm text-muted-foreground">
            {counts.all === 0
              ? 'No applications yet'
              : `${counts.all} application${counts.all !== 1 ? 's' : ''} tracked`}
          </p>
        </div>
        <Button onClick={() => { setEditingApp(null); setFormOpen(true) }}>
          <Plus className="mr-1.5 h-4 w-4" />
          New Application
        </Button>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <StatusFilter
          active={activeFilter}
          counts={counts}
          onChange={setActiveFilter}
        />
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search company or role…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center">
          <p className="text-sm font-medium">
            {search || activeFilter !== 'all'
              ? 'No applications match your filter'
              : 'No applications yet'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {search || activeFilter !== 'all'
              ? 'Try a different search or status filter'
              : 'Click "New Application" to start tracking'}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-8" />
                <TableHead>
                  <button
                    className="inline-flex items-center gap-1 text-xs font-medium hover:text-foreground"
                    onClick={() => toggleSort('company_name')}
                  >
                    Company
                    <ArrowUpDown className="h-3 w-3 opacity-50" />
                  </button>
                </TableHead>
                <TableHead className="hidden sm:table-cell">Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">
                  <button
                    className="inline-flex items-center gap-1 text-xs font-medium hover:text-foreground"
                    onClick={() => toggleSort('deadline')}
                  >
                    Deadline
                    <ArrowUpDown className="h-3 w-3 opacity-50" />
                  </button>
                </TableHead>
                <TableHead className="hidden lg:table-cell">Location</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((app) => {
                const deadlineLabel = app.deadline
                  ? relativeDate(app.deadline)
                  : '—'
                const deadlinePast =
                  app.deadline ? isPast(app.deadline) : false

                return (
                  <TableRow key={app.id} className="group">
                    {/* Priority star */}
                    <TableCell className="py-2 pl-4 pr-0">
                      <button
                        onClick={() => handleTogglePriority(app)}
                        disabled={isPending}
                        className="opacity-0 transition-opacity group-hover:opacity-100"
                        aria-label={app.is_priority ? 'Remove priority' : 'Mark priority'}
                      >
                        <Star
                          className={cn(
                            'h-3.5 w-3.5',
                            app.is_priority
                              ? 'fill-amber-400 text-amber-400 opacity-100 group-hover:opacity-100'
                              : 'text-muted-foreground'
                          )}
                          style={app.is_priority ? { opacity: 1 } : {}}
                        />
                      </button>
                      {app.is_priority && (
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 group-hover:hidden" />
                      )}
                    </TableCell>

                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span>{app.company_name}</span>
                          {draftCounts[app.id] > 0 && (
                            <Link
                              href={`/coverletter`}
                              className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-400 transition-colors hover:bg-amber-500/15"
                              title={`${draftCounts[app.id]} 자소서 draft${draftCounts[app.id] !== 1 ? 's' : ''}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <PenLine className="h-2.5 w-2.5" />
                              {draftCounts[app.id]}
                            </Link>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground sm:hidden">
                          {app.role_title}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {app.role_title}
                    </TableCell>

                    <TableCell>
                      <StatusBadge status={app.status} />
                    </TableCell>

                    <TableCell className="hidden md:table-cell">
                      {app.deadline ? (
                        <span
                          className={cn(
                            'text-sm',
                            deadlinePast
                              ? 'text-muted-foreground line-through'
                              : deadlineLabel.startsWith('In')
                              ? 'text-foreground'
                              : 'text-muted-foreground'
                          )}
                          title={formatDate(app.deadline)}
                        >
                          {deadlineLabel}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                      {app.location ?? '—'}
                    </TableCell>

                    <TableCell className="py-2 pr-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        {app.job_url && (
                          <a
                            href={app.job_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                        <button
                          onClick={() => handleEdit(app)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingId(app.id)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Application form sheet */}
      <ApplicationForm
        open={formOpen}
        onClose={handleFormClose}
        initialData={editingApp}
      />

      {/* Delete confirmation */}
      <Dialog
        open={!!deletingId}
        onOpenChange={(o) => !o && setDeletingId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete application?</DialogTitle>
            <DialogDescription>
              This will permanently remove the application. This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingId(null)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletingId && handleDelete(deletingId)}
              disabled={isPending}
            >
              {isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
