'use client'

import { useState } from 'react'
import { Map, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { RoadmapView } from './RoadmapView'
import { cn } from '@/lib/utils/cn'
import type { RoadmapResponse } from '@/lib/ai/provider'
import type { ExperienceLevel } from '@/lib/types/database.types'

type Timeline = 3 | 6 | 9 | 12

const TIMELINES: Timeline[] = [3, 6, 9, 12]
const LEVELS: ExperienceLevel[] = ['beginner', 'intermediate', 'advanced']

export function RoadmapClient() {
  const [targetRole, setTargetRole] = useState('')
  const [level, setLevel] = useState<ExperienceLevel>('beginner')
  const [timeline, setTimeline] = useState<Timeline>(6)
  const [skillsRaw, setSkillsRaw] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<RoadmapResponse | null>(null)
  const [error, setError] = useState<string>()

  const currentSkills = skillsRaw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    if (!targetRole.trim() || loading) return

    setLoading(true)
    setError(undefined)
    setResult(null)

    try {
      const res = await fetch('/api/ai/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetRole,
          experienceLevel: level,
          timelineMonths: timeline,
          currentSkills,
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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Career Roadmap</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Describe your target role and get a personalised, phase-by-phase learning plan.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleGenerate} className="space-y-5">
        {/* Target role */}
        <div className="space-y-1.5">
          <Label htmlFor="role">Target role *</Label>
          <Input
            id="role"
            placeholder="e.g. Backend Engineer, ML Engineer, iOS Developer"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
          />
        </div>

        {/* Experience level */}
        <div className="space-y-1.5">
          <Label>Experience level</Label>
          <div className="flex rounded-md border overflow-hidden w-fit">
            {LEVELS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLevel(l)}
                className={cn(
                  'px-4 py-2 text-sm capitalize transition-colors',
                  level === l
                    ? 'bg-foreground text-background'
                    : 'bg-background text-muted-foreground hover:text-foreground'
                )}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-1.5">
          <Label>Timeline</Label>
          <div className="flex gap-2">
            {TIMELINES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTimeline(t)}
                className={cn(
                  'rounded-md border px-4 py-2 text-sm transition-colors',
                  timeline === t
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                )}
              >
                {t} mo
              </button>
            ))}
          </div>
        </div>

        {/* Current skills */}
        <div className="space-y-1.5">
          <Label htmlFor="skills">
            Current skills
            <span className="ml-1.5 text-xs text-muted-foreground">(comma-separated)</span>
          </Label>
          <Input
            id="skills"
            placeholder="e.g. Python, JavaScript, SQL, Git"
            value={skillsRaw}
            onChange={(e) => setSkillsRaw(e.target.value)}
          />
        </div>

        <Button
          type="submit"
          disabled={!targetRole.trim() || loading}
          className="w-full sm:w-auto"
        >
          {loading ? (
            <>
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              Generating roadmap…
            </>
          ) : (
            <>
              <Map className="mr-1.5 h-4 w-4" />
              Generate Roadmap
            </>
          )}
        </Button>
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
          <RoadmapView
            roadmap={result}
            meta={{ experienceLevel: level, currentSkills }}
          />
        </>
      )}
    </div>
  )
}
