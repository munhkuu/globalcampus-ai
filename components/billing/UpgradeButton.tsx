'use client'

import { useState } from 'react'
import { ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function UpgradeButton({
  size = 'lg',
  label = 'Upgrade to Pro',
  variant = 'default',
}: {
  size?: 'sm' | 'default' | 'lg'
  label?: string
  variant?: 'default' | 'outline'
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onClick() {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const json = (await res.json()) as { url?: string; error?: string }
      if (!res.ok || !json.url) {
        setError(json.error ?? 'Could not start checkout.')
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
    <div className="flex flex-col items-center gap-2">
      <Button onClick={onClick} disabled={loading} size={size} variant={variant}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Redirecting…
          </>
        ) : (
          <>
            {label} <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
