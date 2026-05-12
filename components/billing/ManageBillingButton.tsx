'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ManageBillingButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onClick() {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const json = (await res.json()) as { url?: string; error?: string }
      if (!res.ok || !json.url) {
        setError(json.error ?? 'Could not open billing portal.')
        setLoading(false)
        return
      }
      window.location.href = json.url
    } catch {
      setError('Network error. Try again.')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button onClick={onClick} disabled={loading} variant="outline" size="sm">
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Opening…
          </>
        ) : (
          'Manage subscription'
        )}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
