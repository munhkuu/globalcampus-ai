import { requireAuth, apiSuccess, API_ERRORS } from '@/lib/utils/api'

export async function GET() {
  const { user, supabase, unauthorized } = await requireAuth()
  if (unauthorized) return API_ERRORS.UNAUTHORIZED()

  const { data, error } = await supabase
    .from('internship_applications')
    .select('status, deadline, is_priority')
    .eq('user_id', user!.id)

  if (error) return API_ERRORS.SERVER_ERROR()

  const byStatus = {
    applied: 0,
    online_assessment: 0,
    interview: 0,
    rejected: 0,
    accepted: 0,
  }

  let upcomingDeadlines = 0
  const now = new Date()
  const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)

  for (const row of data ?? []) {
    byStatus[row.status as keyof typeof byStatus]++
    if (row.deadline) {
      const d = new Date(row.deadline)
      if (d >= now && d <= in14Days) upcomingDeadlines++
    }
  }

  return apiSuccess({
    total: data?.length ?? 0,
    by_status: byStatus,
    upcoming_deadlines: upcomingDeadlines,
  })
}
