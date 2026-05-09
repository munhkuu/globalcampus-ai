'use client'

import { cn } from '@/lib/utils/cn'
import type { ApplicationStatus } from '@/lib/types/database.types'

type FilterStatus = ApplicationStatus | 'all'

const FILTERS: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'applied', label: 'Applied' },
  { value: 'online_assessment', label: 'OA' },
  { value: 'interview', label: 'Interview' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'accepted', label: 'Accepted' },
]

interface StatusFilterProps {
  active: FilterStatus
  counts: Record<FilterStatus, number>
  onChange: (status: FilterStatus) => void
}

export function StatusFilter({ active, counts, onChange }: StatusFilterProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {FILTERS.map(({ value, label }) => {
        const count = counts[value] ?? 0
        const isActive = active === value
        return (
          <button
            key={value}
            onClick={() => onChange(value)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md border px-3 py-1 text-xs font-medium transition-colors',
              isActive
                ? 'border-foreground/30 bg-foreground/10 text-foreground'
                : 'border-border bg-background text-muted-foreground hover:border-foreground/20 hover:text-foreground'
            )}
          >
            {label}
            <span
              className={cn(
                'rounded px-1 tabular-nums',
                isActive ? 'bg-foreground/10' : 'bg-muted'
              )}
            >
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export type { FilterStatus }
