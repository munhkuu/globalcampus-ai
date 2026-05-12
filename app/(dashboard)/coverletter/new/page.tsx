import { createClient } from '@/lib/supabase/server'
import { NewCoverLetterClient } from '@/components/coverletter/NewCoverLetterClient'
import { COMPANY_PRESETS } from '@/lib/coverletter/company-questions'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'New 자소서 draft' }

type AppRow = {
  id: string
  company_name: string
  role_title: string
  deadline: string | null
  status: string
}

export default async function NewCoverLetterPage({
  searchParams,
}: {
  searchParams: Promise<{ app?: string }>
}) {
  const { app: prefilledAppId } = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Pull user's active applications so the picker has options. Filter out
  // rejected and accepted since those are done — no reason to draft for them.
  const { data: apps } = (await supabase
    .from('internship_applications')
    .select('id, company_name, role_title, deadline, status')
    .eq('user_id', user!.id)
    .in('status', ['applied', 'online_assessment', 'interview'])
    .order('created_at', { ascending: false })) as { data: AppRow[] | null }

  return (
    <NewCoverLetterClient
      companies={COMPANY_PRESETS}
      applications={apps ?? []}
      prefilledAppId={prefilledAppId ?? null}
    />
  )
}
