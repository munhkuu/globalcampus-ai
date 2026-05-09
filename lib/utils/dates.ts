/** Format a date string or Date object. */
export function formatDate(
  date: string | Date,
  style: 'short' | 'long' | 'month-year' = 'short'
): string {
  const d = new Date(date)
  if (isNaN(d.getTime())) return '—'

  if (style === 'long') {
    return d.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (style === 'month-year') {
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/** Number of calendar days from today to date (negative = past). */
export function daysUntil(date: string | Date): number {
  const d = new Date(date)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - now.getTime()) / 86_400_000)
}

/** True if the date is in the past. */
export function isPast(date: string | Date): boolean {
  return daysUntil(date) < 0
}

/** Human-readable relative label: "In 3 days", "2 days ago", "Today". */
export function relativeDate(date: string | Date): string {
  const days = daysUntil(date)
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days === -1) return 'Yesterday'
  if (days > 0) return `In ${days} days`
  return `${Math.abs(days)} days ago`
}

/** ISO date string → YYYY-MM-DD (safe for <input type="date"> value). */
export function toInputDate(date: string | Date | null | undefined): string {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  return d.toISOString().split('T')[0]
}
