import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ApplicationTable } from '@/components/internships/ApplicationTable'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Internships',
}

export default async function InternshipsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: applications }, { data: draftRows }] = await Promise.all([
    supabase
      .from('internship_applications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('cover_letters')
      .select('application_id')
      .eq('user_id', user.id)
      .eq('is_current', true)
      .not('application_id', 'is', null),
  ])

  const draftCounts = ((draftRows ?? []) as { application_id: string | null }[]).reduce<
    Record<string, number>
  >((acc, row) => {
    if (row.application_id) acc[row.application_id] = (acc[row.application_id] ?? 0) + 1
    return acc
  }, {})

  return (
    <ApplicationTable
      initialApplications={applications ?? []}
      draftCounts={draftCounts}
    />
  )
}
