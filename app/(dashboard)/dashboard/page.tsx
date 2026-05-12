import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Briefcase, BookOpen, Map, Lightbulb, ArrowRight, Clock, PenLine } from 'lucide-react'
import Link from 'next/link'
import { StatusBadge } from '@/components/internships/StatusBadge'
import { relativeDate } from '@/lib/utils/dates'
import type { Metadata } from 'next'
import type { ApplicationStatus } from '@/lib/types/database.types'

export const metadata: Metadata = { title: 'Dashboard' }

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const firstName =
    (user?.user_metadata?.full_name as string | undefined)?.split(' ')[0] ?? 'there'

  // Parallel data fetching
  const [{ data: applications }, { data: vaultNotes }, { count: roadmapCount }] =
    await Promise.all([
      supabase
        .from('internship_applications')
        .select('id, company_name, role_title, status, deadline, created_at')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('vault_notes')
        .select('id')
        .eq('user_id', user!.id),
      supabase
        .from('roadmap_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id),
    ])

  const apps = applications ?? []
  const statusCounts = apps.reduce((acc, a) => {
    acc[a.status as ApplicationStatus] = (acc[a.status as ApplicationStatus] ?? 0) + 1
    return acc
  }, {} as Record<ApplicationStatus, number>)

  const upcoming = apps
    .filter((a) => a.deadline && new Date(a.deadline) >= new Date())
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    .slice(0, 3)

  const stats = [
    { label: 'Applications', value: apps.length, icon: Briefcase, href: '/internships' },
    { label: 'Interviews', value: statusCounts['interview'] ?? 0, icon: Briefcase, href: '/internships' },
    { label: 'Study Notes', value: vaultNotes?.length ?? 0, icon: BookOpen, href: '/vault' },
    { label: 'Roadmaps', value: roadmapCount ?? 0, icon: Map, href: '/roadmap' },
  ]

  const secondaryLinks = [
    { href: '/explainer', icon: Lightbulb, label: 'Explain a lecture', color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { href: '/internships', icon: Briefcase, label: 'Track an application', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { href: '/vault', icon: BookOpen, label: 'Open Study Vault', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { href: '/roadmap', icon: Map, label: 'Generate a roadmap', color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {getGreeting()}, {firstName}
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Here&apos;s your career snapshot.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="border-border/60 transition-colors hover:border-foreground/20">
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
          </Link>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent applications */}
        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium">Recent Applications</CardTitle>
            <Link href="/internships" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-0">
            {apps.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-sm text-muted-foreground">No applications yet</p>
                <Link href="/internships" className="mt-2 text-xs text-foreground underline-offset-4 hover:underline">
                  Add your first application
                </Link>
              </div>
            ) : (
              apps.slice(0, 5).map((app, i) => (
                <div
                  key={app.id}
                  className={`flex items-center justify-between py-2.5 ${i < Math.min(apps.length - 1, 4) ? 'border-b' : ''}`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{app.company_name}</p>
                    <p className="truncate text-xs text-muted-foreground">{app.role_title}</p>
                  </div>
                  <StatusBadge status={app.status} className="ml-3 shrink-0" />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Upcoming deadlines */}
        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium">Upcoming Deadlines</CardTitle>
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-0">
            {upcoming.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-sm text-muted-foreground">No upcoming deadlines</p>
                <p className="mt-1 text-xs text-muted-foreground">Deadlines you set will appear here</p>
              </div>
            ) : (
              upcoming.map((app, i) => (
                <div
                  key={app.id}
                  className={`flex items-center justify-between py-2.5 ${i < upcoming.length - 1 ? 'border-b' : ''}`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{app.company_name}</p>
                    <p className="truncate text-xs text-muted-foreground">{app.role_title}</p>
                  </div>
                  <span className="ml-3 shrink-0 text-xs font-medium text-amber-600 dark:text-amber-400">
                    {relativeDate(app.deadline!)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick links */}
      <div>
        <h2 className="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Quick Actions
        </h2>

        {/* Featured: 자소서 Workshop */}
        <Link href="/coverletter">
          <Card className="group relative overflow-hidden border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent transition-all hover:border-amber-500/50 hover:shadow-lg cursor-pointer">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/15">
                <PenLine className="h-6 w-6 text-amber-500" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">Write your Samsung 자소서</p>
                  <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-widest text-amber-400">
                    Featured
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Real 자소서 questions from Samsung, Naver, Kakao, Toss. AI critique catches what foreigners always miss.
                </p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
            </CardContent>
          </Card>
        </Link>

        {/* Secondary actions */}
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {secondaryLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Card className="border-border/60 transition-all hover:border-foreground/20 hover:shadow-sm cursor-pointer">
                <CardContent className="flex flex-col items-start gap-2.5 p-4">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${link.bg}`}>
                    <link.icon className={`h-4 w-4 ${link.color}`} />
                  </div>
                  <p className="text-xs font-medium leading-snug">{link.label}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
