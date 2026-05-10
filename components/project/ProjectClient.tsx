'use client'

import { useState } from 'react'
import { FolderCode, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { ProjectOutput } from './ProjectOutput'
import { cn } from '@/lib/utils/cn'
import type { ProjectResponse } from '@/lib/ai/provider'

type Complexity = 'simple' | 'medium' | 'advanced'
type CodeLang = 'Python' | 'JavaScript' | 'TypeScript' | 'Java' | 'Go' | 'C++'

const COMPLEXITIES: Complexity[] = ['simple', 'medium', 'advanced']
const LANGUAGES: CodeLang[] = ['Python', 'JavaScript', 'TypeScript', 'Java', 'Go', 'C++']

export function ProjectClient() {
  const [description, setDescription] = useState('')
  const [complexity, setComplexity] = useState<Complexity>('simple')
  const [lang, setLang] = useState<CodeLang>('Python')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ProjectResponse | null>(null)
  const [error, setError] = useState<string>()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!description.trim() || loading) return

    setLoading(true)
    setError(undefined)
    setResult(null)

    try {
      const res = await fetch('/api/ai/project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          complexity,
          preferredLanguage: lang,
        }),
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
        <h1 className="text-2xl font-semibold tracking-tight">Project Generator</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Describe what you want to build. Opus 4.7 will plan and generate a complete, runnable project.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Textarea
          placeholder="Describe your project idea…

e.g. A CLI todo app with file-based storage and priority levels
e.g. A web scraper that collects job listings and exports to CSV
e.g. A simple REST API for a student grade tracker"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-[140px] resize-none font-sans text-sm"
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-4">
            {/* Complexity */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Complexity</span>
              <div className="flex rounded-md border overflow-hidden">
                {COMPLEXITIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setComplexity(c)}
                    className={cn(
                      'px-2.5 py-1 text-xs capitalize transition-colors',
                      complexity === c
                        ? 'bg-foreground text-background'
                        : 'bg-background text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {c}
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
          </div>

          <Button type="submit" disabled={!description.trim() || loading} className="shrink-0">
            {loading ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                Building…
              </>
            ) : (
              <>
                <FolderCode className="mr-1.5 h-4 w-4" />
                Generate
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
          <ProjectOutput result={result} />
        </>
      )}
    </div>
  )
}
