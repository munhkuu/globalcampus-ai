'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
      <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
        Error
      </p>
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="text-sm text-muted-foreground max-w-sm">
        An unexpected error occurred in the dashboard. Your data is safe.
      </p>
      <Button onClick={reset} size="sm">
        Try again
      </Button>
    </div>
  )
}
