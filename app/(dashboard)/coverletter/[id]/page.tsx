import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CoverLetterEditor } from '@/components/coverletter/CoverLetterEditor'
import { findCompany } from '@/lib/coverletter/company-questions'
import { getLineage } from '@/lib/actions/coverletter'
import type { Metadata } from 'next'
import type { CoverLetterCritique } from '@/lib/ai/prompts/coverletter'

export const metadata: Metadata = { title: '자소서 editor' }

type DraftRow = {
  id: string
  company: string
  question: string
  content: string
  word_count: number
  ai_feedback: CoverLetterCritique | null
  ai_score: number | null
  updated_at: string
  version: number
  application_id: string | null
}

type LinkedApplication = {
  id: string
  company_name: string
  role_title: string
  deadline: string | null
}

export default async function CoverLetterEditorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: draft } = (await supabase
    .from('cover_letters')
    .select('id, company, question, content, word_count, ai_feedback, ai_score, updated_at, version, application_id')
    .eq('id', id)
    .eq('user_id', user!.id)
    .maybeSingle()) as { data: DraftRow | null }

  if (!draft) notFound()

  const companyPreset = findCompany(draft.company)

  // Pull linked application if any.
  let linkedApp: LinkedApplication | null = null
  if (draft.application_id) {
    const { data } = (await supabase
      .from('internship_applications')
      .select('id, company_name, role_title, deadline')
      .eq('id', draft.application_id)
      .eq('user_id', user!.id)
      .maybeSingle()) as { data: LinkedApplication | null }
    linkedApp = data
  }

  // Fetch all versions in this lineage for the history sheet.
  const versions = await getLineage(id)

  return (
    <CoverLetterEditor
      draft={draft}
      companyNotes={companyPreset?.notes ?? null}
      versions={versions}
      linkedApplication={linkedApp}
    />
  )
}
