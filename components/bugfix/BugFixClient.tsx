'use client'

import { useState } from 'react'
import { Bug, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { BugFixOutput } from './BugFixOutput'
import { cn } from '@/lib/utils/cn'
import type { BugFixResponse } from '@/lib/ai/provider'

type CodeLang = 'Python' | 'Java' | 'C++' | 'JavaScript' | 'TypeScript' | 'Go'

const LANGUAGES: CodeLang[] = ['Python', 'Java', 'C++', 'JavaScript', 'TypeScript', 'Go']

export function BugFixClient() {
  const [code, setCode] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [lang, setLang] = useState<CodeLang>('Python')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<BugFixResponse | null>(null)
  const [error, setError] = useState<string>()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim() || loading) return

    setLoading(true)
    setError(undefined)
    setResult(null)

    try {
      const res = await fetch('/api/ai/bugfix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language: lang, errorMessage }),
      })

      const json = await res.json()

      if (!res.ok) {
        setError(json.error ?? 'Something went wrong')
      } else {
        setResult(json.data)
      }
    } catch {
      setError('Network error — please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Bug Fixer</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Paste your broken code. Opus 4.7 will reason through the bugs and return a fully fixed version.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Textarea
          placeholder="Paste your broken code here…"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="min-h-[200px] resize-none font-mono text-sm"
        />

        <Textarea
          placeholder="Error message (optional) — e.g. TypeError: unsupported operand type(s) for +: 'int' and 'str'"
          value={errorMessage}
          onChange={(e) => setErrorMessage(e.target.value)}
          className="min-h-[60px] resize-none font-mono text-xs"
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Language</span>
            <div className="flex rounded-md border overflow-hidden">
              {LANGUAGES.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  className={cn(
                    'px-2.5 py-1 text-xs transition-colors',
                    lang === l
                      ? 'bg-foreground text-background'
                      : 'bg-background text-muted-foreground hover:text-foreground'
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <Button type="submit" disabled={!code.trim() || loading} className="shrink-0">
            {loading ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                Reasoning…
              </>
            ) : (
              <>
                <Bug className="mr-1.5 h-4 w-4" />
                Fix Bugs
              </>
            )}
          </Button>
        </div>
      </form>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {result && (
        <>
          <Separator />
          <BugFixOutput result={result} />
        </>
      )}
    </div>
  )
}
