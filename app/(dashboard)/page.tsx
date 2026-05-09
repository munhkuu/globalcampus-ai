import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Briefcase, BookOpen, Map, Lightbulb, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard',
}

const features = [
  {
    icon: Briefcase,
    title: 'Internship Tracker',
    description:
      'Track every application, deadline, and interview. Never lose sight of an opportunity.',
    href: '/internships',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    status: 'Coming in Phase 3',
  },
  {
    icon: Map,
    title: 'Career Roadmap',
    description:
      'Generate a personalised learning path toward your target role with AI-powered guidance.',
    href: '/roadmap',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
    status: 'Coming in Phase 4',
  },
  {
    icon: Lightbulb,
    title: 'Lecture Explainer',
    description:
      'Paste any CS lecture or textbook excerpt and get a clear, student-friendly explanation.',
    href: '/explainer',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    status: 'Coming in Phase 4',
  },
  {
    icon: BookOpen,
    title: 'Study Vault',
    description:
      'Store, search, and review your notes. Save AI explanations directly for later.',
    href: '/vault',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    status: 'Coming in Phase 3',
  },
]

const stats = [
  { label: 'Applications', value: '—', icon: Briefcase },
  { label: 'Study Notes', value: '—', icon: BookOpen },
  { label: 'Roadmaps', value: '—', icon: Map },
  { label: 'AI Queries', value: '—', icon: Lightbulb },
]

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const firstName =
    (user?.user_metadata?.full_name as string | undefined)?.split(' ')[0] ??
    'there'

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page heading */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Good to have you, {firstName}
        </h1>
        <p className="text-sm text-muted-foreground">
          Your AI-powered career dashboard. Features roll out phase by phase.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-border/60">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className="h-3.5 w-3.5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Feature cards */}
      <div>
        <h2 className="mb-4 text-sm font-medium text-muted-foreground uppercase tracking-widest">
          Features
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {features.map((feature) => (
            <Link key={feature.title} href={feature.href}>
              <Card className="group border-border/60 transition-all duration-200 hover:border-foreground/20 hover:shadow-md cursor-pointer h-full">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${feature.bg}`}
                    >
                      <feature.icon className={`h-4 w-4 ${feature.color}`} />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{feature.title}</p>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                      <p className="text-[11px] text-muted-foreground/60">
                        {feature.status}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
