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

  const { data: applications } = await supabase
    .from('internship_applications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return <ApplicationTable initialApplications={applications ?? []} />
}
