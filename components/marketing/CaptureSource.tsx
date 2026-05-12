'use client'

import { useEffect } from 'react'

// Reads ?utm_source / ?ref from the current URL on mount and writes a 30-day
// `gc_source` cookie. The register server action and OAuth callback read this
// cookie at signup to attribute users to a distribution channel.
export function CaptureSource() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const source = params.get('utm_source') || params.get('ref')
    if (!source) return
    const clean = source.slice(0, 64).replace(/[^a-zA-Z0-9_\-.]/g, '')
    if (!clean) return
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString()
    document.cookie = `gc_source=${encodeURIComponent(clean)}; expires=${expires}; path=/; SameSite=Lax`
  }, [])
  return null
}
