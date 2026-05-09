'use client'

import { useState, useTransition } from 'react'
import { BookOpen, Code2, MessageSquare, Save, Check, ExternalLink } from 'lucide-react'
import { saveRoadmapSession } from '@/lib/actions/roadmap'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { PhaseCard } from './PhaseCard'
import { useToast } from '@/components/ui/use-toast'
import type { RoadmapResponse } from '@/lib/ai/provider'
import type { ExperienceLevel } from '@/lib/types/database.types'

interface RoadmapViewProps {
  roadmap: RoadmapResponse
  meta: {
    experienceLevel: ExperienceLevel
    currentSkills: string[]
  }
}

const RESOURCE_ICONS: Record<string, React.ReactNode> = {
  book: <BookOpen className="h-3.5 w-3.5" />,
  course: <Code2 className="h-3.5 w-3.5" />,
  practice: <MessageSquare className="h-3.5 w-3.5" />,
  docs: <BookOpen className="h-3.5 w-3.5" />,
}

export function RoadmapView({ roadmap, meta }: RoadmapViewProps) {
  const { toast } = useToast()
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    startTransition(async () => {
      const res = await saveRoadmapSession({
        sessionName: roadmap.title,
        targetRole: roadmap.targetRole,
        experienceLevel: meta.experienceLevel,
        timelineMonths: roadmap.totalMonths,
        currentSkills: meta.currentSkills,
        roadmapData: roadmap as unknown as import('@/lib/types/database.types').Json,
      })
      if (res?.error) {
        toast({ title: 'Save failed', description: res.error, variant: 'destructive' })
      } else {
        setSaved(true)
        toast({ title: 'Roadmap saved', description: roadmap.title })
      }
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{roadmap.title}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {roadmap.totalMonths}-month plan · {roadmap.phases.length} phases
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSave}
          disabled={isPending || saved}
          className="shrink-0"
        >
          {saved ? (
            <><Check className="mr-1.5 h-3.5 w-3.5 text-emerald-500" />Saved</>
          ) : (
            <><Save className="mr-1.5 h-3.5 w-3.5" />Save roadmap</>
          )}
        </Button>
      </div>

      {/* Phases */}
      <div className="space-y-3">
        {roadmap.phases.map((phase, i) => (
          <PhaseCard key={i} phase={phase} index={i} />
        ))}
      </div>

      <Separator />

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Key Skills */}
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Key Skills to Master
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {roadmap.keySkills.map((skill, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {skill}
              </Badge>
            ))}
          </div>
        </div>

        {/* Interview Topics */}
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Interview Focus Areas
          </h3>
          <ul className="space-y-1">
            {roadmap.interviewTopics.map((topic, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-foreground/30 shrink-0" />
                {topic}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Resources */}
      {roadmap.resources.length > 0 && (
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Recommended Resources
          </h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {roadmap.resources.map((res, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 rounded-lg border px-3 py-2.5"
              >
                <span className="text-muted-foreground">
                  {RESOURCE_ICONS[res.type] ?? <BookOpen className="h-3.5 w-3.5" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{res.title}</p>
                  <p className="text-xs capitalize text-muted-foreground">{res.type}</p>
                </div>
                {res.url && (
                  <a
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
