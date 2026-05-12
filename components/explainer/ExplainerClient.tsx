'use client'

import { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { ExplanationOutput } from './ExplanationOutput'
import { PostActionFeedback } from '@/components/feedback/PostActionFeedback'
import { cn } from '@/lib/utils/cn'
import type { ExplainerResponse } from '@/lib/ai/provider'

type Depth = 'beginner' | 'intermediate' | 'advanced'
type CodeLang = 'Python' | 'Java' | 'C++' | 'JavaScript' | 'TypeScript' | 'Go'

const DEPTHS: Depth[] = ['beginner', 'intermediate', 'advanced']
const LANGUAGES: CodeLang[] = ['Python', 'Java', 'C++', 'JavaScript', 'TypeScript', 'Go']

export function ExplainerClient() {
  const [input, setInput] = useState('')
  const [depth, setDepth] = useState<Depth>('beginner')
  const [lang, setLang] = useState<CodeLang>('Python')
  const [bilingual, setBilingual] = useState(true)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ExplainerResponse | null>(null)
  const [error, setError] = useState<string>()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || loading) return

    setLoading(true)
    setError(undefined)
    setResult(null)

    try {
      const res = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, depth, codeLanguage: lang, bilingual }),
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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Lecture Explainer</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Paste a CS concept, lecture excerpt, or question. Get a clear explanation with Korean term support.
        </p>
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Textarea
          placeholder="Paste your lecture text, concept, or question here…

e.g. &quot;What is a red-black tree and how does it differ from an AVL tree?&quot;
e.g. 교수님이 말씀하신 dynamic programming이 뭔가요?"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="min-h-[160px] resize-none font-sans text-sm"
        />

        {/* Options */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-4">
            {/* Depth */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Depth</span>
              <div className="flex rounded-md border overflow-hidden">
                {DEPTHS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDepth(d)}
                    className={cn(
                      'px-2.5 py-1 text-xs capitalize transition-colors',
                      depth === d
                        ? 'bg-foreground text-background'
                        : 'bg-background text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Language */}
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

            {/* Korean mode */}
            <button
              type="button"
              onClick={() => setBilingual(!bilingual)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors',
                bilingual
                  ? 'border-foreground/30 bg-foreground/10 text-foreground'
                  : 'border-border text-muted-foreground hover:text-foreground'
              )}
            >
              <span className="text-sm">🇰🇷</span>
              Korean terms
            </button>
          </div>

          <Button type="submit" disabled={!input.trim() || loading} className="shrink-0">
            {loading ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                Thinking…
              </>
            ) : (
              <>
                <Sparkles className="mr-1.5 h-4 w-4" />
                Explain
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <>
          <Separator />
          <ExplanationOutput result={result} codeLanguage={lang} />
          <PostActionFeedback feature="explainer" storageKey="gc_pa_explainer" />
        </>
      )}
    </div>
  )
}
