import { Wrench, Target } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { RoadmapPhase } from '@/lib/ai/provider'

interface PhaseCardProps {
  phase: RoadmapPhase
  index: number
}

export function PhaseCard({ phase, index }: PhaseCardProps) {
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-foreground text-[11px] font-bold text-background">
              {index + 1}
            </div>
            <h3 className="font-semibold leading-tight">{phase.name}</h3>
          </div>
          <Badge variant="secondary" className="shrink-0 text-xs">
            {phase.duration}
          </Badge>
        </div>
        <p className="pl-8 text-sm text-muted-foreground">{phase.focus}</p>
      </CardHeader>

      <CardContent className="space-y-4 pl-8">
        {/* Topics */}
        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Topics
          </p>
          <div className="flex flex-wrap gap-1.5">
            {phase.topics.map((topic, i) => (
              <span
                key={i}
                className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>

        {/* Project */}
        <div className="flex items-start gap-2 rounded-lg border bg-muted/30 px-3 py-2.5">
          <Wrench className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <div>
            <p className="text-xs font-medium text-muted-foreground">Build</p>
            <p className="text-sm">{phase.project}</p>
          </div>
        </div>

        {/* Milestone */}
        <div className="flex items-start gap-2">
          <Target className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
          <p className="text-sm text-muted-foreground">{phase.milestone}</p>
        </div>
      </CardContent>
    </Card>
  )
}
