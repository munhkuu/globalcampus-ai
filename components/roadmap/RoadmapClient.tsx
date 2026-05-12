'use client'

import { useState } from 'react'
import { Map, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { RoadmapView } from './RoadmapView'
import { cn } from '@/lib/utils/cn'
import type { RoadmapResponse } from '@/lib/ai/provider'
import type { ExperienceLevel } from '@/lib/types/database.types'

type Timeline = 3 | 6 | 9 | 12
type HoursPerWeek = '<5' | '5-10' | '10-20' | '20+'

const TIMELINES: Timeline[] = [3, 6, 9, 12]
const LEVELS: ExperienceLevel[] = ['beginner', 'intermediate', 'advanced']
const HOURS: HoursPerWeek[] = ['<5', '5-10', '10-20', '20+']

const FOCUS_AREAS = [
  'Backend',
  'Frontend',
  'Full-Stack',
  'Mobile',
  'ML / AI',
  'Data',
  'DevOps',
  'Game Dev',
] as const
type FocusArea = (typeof FOCUS_AREAS)[number]

const KOREAN_TECH_COMPANIES = [
  'Samsung',
  'Naver',
  'Kakao',
  'Coupang',
  'Toss',
  'LINE',
  'Krafton',
  'LG CNS',
  'Other Korean Tech',
  'Global / FAANG',
] as const

export function RoadmapClient() {
  const [targetRole, setTargetRole] = useState('')
  const [focusArea, setFocusArea] = useState<FocusArea>('Backend')
  const [targetCompanies, setTargetCompanies] = useState<string[]>([])
  const [level, setLevel] = useState<ExperienceLevel>('beginner')
  const [timeline, setTimeline] = useState<Timeline>(6)
  const [hoursPerWeek, setHoursPerWeek] = useState<HoursPerWeek>('5-10')
  const [skillsRaw, setSkillsRaw] = useState('')
  const [blocker, setBlocker] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<RoadmapResponse | null>(null)
  const [error, setError] = useState<string>()

  const currentSkills = skillsRaw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  function toggleCompany(name: string) {
    setTargetCompanies((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    )
  }

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
          focusArea,
          targetCompanies,
          experienceLevel: level,
          timelineMonths: timeline,
          hoursPerWeek,
          currentSkills,
          blocker: blocker.trim() || undefined,
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
          The more specific you are, the more useful the plan. All fields except target role are optional but shape the output.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleGenerate} className="space-y-6">
        {/* Target role */}
        <div className="space-y-1.5">
          <Label htmlFor="role">Target role *</Label>
          <Input
            id="role"
            placeholder="e.g. Samsung SWE Intern, Naver Backend, Toss Frontend"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
          />
        </div>

        {/* Focus area */}
        <div className="space-y-1.5">
          <Label>Focus area</Label>
          <div className="flex flex-wrap gap-1.5">
            {FOCUS_AREAS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFocusArea(f)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs transition-colors',
                  focusArea === f
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Target companies */}
        <div className="space-y-1.5">
          <Label>
            Target companies
            <span className="ml-1.5 text-xs text-muted-foreground">(pick any)</span>
          </Label>
          <div className="flex flex-wrap gap-1.5">
            {KOREAN_TECH_COMPANIES.map((c) => {
              const selected = targetCompanies.includes(c)
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleCompany(c)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs transition-colors',
                    selected
                      ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                      : 'border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                  )}
                >
                  {c}
                </button>
              )
            })}
          </div>
        </div>

        {/* Experience level + Timeline + Hours */}
        <div className="grid gap-5 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Experience level</Label>
            <div className="flex flex-col rounded-md border overflow-hidden">
              {LEVELS.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLevel(l)}
                  className={cn(
                    'px-3 py-1.5 text-xs capitalize transition-colors',
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

          <div className="space-y-1.5">
            <Label>Timeline</Label>
            <div className="flex flex-col gap-1">
              {TIMELINES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTimeline(t)}
                  className={cn(
                    'rounded-md border px-3 py-1.5 text-xs transition-colors',
                    timeline === t
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                  )}
                >
                  {t} months
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Hours / week</Label>
            <div className="flex flex-col gap-1">
              {HOURS.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setHoursPerWeek(h)}
                  className={cn(
                    'rounded-md border px-3 py-1.5 text-xs transition-colors',
                    hoursPerWeek === h
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                  )}
                >
                  {h} hrs
                </button>
              ))}
            </div>
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
            placeholder="e.g. Python, JavaScript, SQL, Git, basic DSA"
            value={skillsRaw}
            onChange={(e) => setSkillsRaw(e.target.value)}
          />
        </div>

        {/* Blocker */}
        <div className="space-y-1.5">
          <Label htmlFor="blocker">
            What&apos;s blocking you right now?
            <span className="ml-1.5 text-xs text-muted-foreground">(optional)</span>
          </Label>
          <Textarea
            id="blocker"
            placeholder="e.g. I keep failing 코딩 테스트, I don't know what algorithms to study first, my Korean isn't strong enough to follow OS lectures"
            value={blocker}
            onChange={(e) => setBlocker(e.target.value)}
            className="min-h-[80px] resize-none text-sm"
            maxLength={500}
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
