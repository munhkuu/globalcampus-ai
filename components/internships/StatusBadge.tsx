import { cn } from '@/lib/utils/cn'
import type { ApplicationStatus } from '@/lib/types/database.types'

const STATUS_CONFIG: Record<
  ApplicationStatus,
  { label: string; className: string }
> = {
  applied: {
    label: 'Applied',
    className:
      'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  },
  online_assessment: {
    label: 'Online Assessment',
    className:
      'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  },
  interview: {
    label: 'Interview',
    className:
      'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  },
  rejected: {
    label: 'Rejected',
    className:
      'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  },
  accepted: {
    label: 'Accepted',
    className:
      'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  },
}

interface StatusBadgeProps {
  status: ApplicationStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}

export { STATUS_CONFIG }
export type { ApplicationStatus }
