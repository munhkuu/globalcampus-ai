'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const draftSchema = z.object({
  company: z.string().trim().min(1).max(80),
  question: z.string().trim().min(1).max(1000),
  content: z.string().max(8000).default(''),
  application_id: z.string().uuid().nullable().optional(),
})

export type DraftInput = z.infer<typeof draftSchema>

function wordCount(s: string): number {
  return s.trim() ? s.trim().split(/\s+/).length : 0
}

export async function createCoverLetter(
  input: DraftInput
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const parsed = draftSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('cover_letters')
    .insert({
      user_id: user.id,
      company: parsed.data.company,
      question: parsed.data.question,
      content: parsed.data.content,
      application_id: parsed.data.application_id ?? null,
      word_count: wordCount(parsed.data.content),
    })
    .select('id')
    .single<{ id: string }>()

  if (error || !data) {
    return { ok: false, error: error?.message ?? 'Could not create draft.' }
  }

  revalidatePath('/coverletter')
  return { ok: true, id: data.id }
}

const updateSchema = z.object({
  content: z.string().max(8000),
})

export async function updateCoverLetterContent(
  id: string,
  input: { content: string }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = updateSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('cover_letters')
    .update({
      content: parsed.data.content,
      word_count: wordCount(parsed.data.content),
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/coverletter')
  revalidatePath(`/coverletter/${id}`)
  return { ok: true }
}

export async function deleteCoverLetter(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('cover_letters')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/coverletter')
  return { ok: true }
}

export async function deleteCoverLetterAndRedirect(id: string) {
  const result = await deleteCoverLetter(id)
  if (result.ok) redirect('/coverletter')
  return result
}

// ─── Version history ─────────────────────────────────────────────────────────
// A "draft" is a chain of cover_letter rows linked by parent_version_id.
// is_current=true marks the active row (the one auto-save writes to).
// createSnapshot freezes the current state and starts a new row that the user
// keeps editing — so the snapshot becomes immutable history, the new row is
// the live one.

type DraftFamilyRow = {
  id: string
  parent_version_id: string | null
  company: string
  question: string
  application_id: string | null
  content: string
  version: number
  ai_feedback: unknown
  ai_score: number | null
}

export async function createSnapshot(
  id: string
): Promise<{ ok: true; newId: string } | { ok: false; error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const { data: current } = (await supabase
    .from('cover_letters')
    .select('id, parent_version_id, company, question, application_id, content, version, ai_feedback, ai_score')
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('is_current', true)
    .maybeSingle()) as { data: DraftFamilyRow | null }

  if (!current) return { ok: false, error: 'Draft not found or already archived.' }

  // Step 1: freeze the current row.
  const { error: freezeError } = await supabase
    .from('cover_letters')
    .update({ is_current: false })
    .eq('id', id)
    .eq('user_id', user.id)
  if (freezeError) return { ok: false, error: freezeError.message }

  // Step 2: clone into a new live row pointing back at the snapshot.
  const { data: newRow, error: insertError } = await supabase
    .from('cover_letters')
    .insert({
      user_id: user.id,
      company: current.company,
      question: current.question,
      application_id: current.application_id,
      content: current.content,
      word_count: wordCount(current.content),
      version: current.version + 1,
      is_current: true,
      parent_version_id: current.id,
      ai_feedback: current.ai_feedback,
      ai_score: current.ai_score,
    })
    .select('id')
    .single<{ id: string }>()

  if (insertError || !newRow) {
    // Roll back the freeze if we couldn't insert.
    await supabase.from('cover_letters').update({ is_current: true }).eq('id', id)
    return { ok: false, error: insertError?.message ?? 'Could not snapshot.' }
  }

  revalidatePath('/coverletter')
  revalidatePath(`/coverletter/${newRow.id}`)
  return { ok: true, newId: newRow.id }
}

// Walks parent_version_id back from the given id, returning newest → oldest.
export async function getLineage(id: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  type VersionRow = {
    id: string
    version: number
    content: string
    word_count: number
    ai_score: number | null
    is_current: boolean
    parent_version_id: string | null
    created_at: string
  }

  const versions: VersionRow[] = []
  let cursor: string | null = id
  while (cursor) {
    const { data } = (await supabase
      .from('cover_letters')
      .select('id, version, content, word_count, ai_score, is_current, parent_version_id, created_at')
      .eq('id', cursor)
      .eq('user_id', user.id)
      .maybeSingle()) as { data: VersionRow | null }
    if (!data) break
    versions.push(data)
    cursor = data.parent_version_id
  }
  return versions
}

export async function restoreFromSnapshot(
  currentId: string,
  snapshotId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (currentId === snapshotId) return { ok: false, error: 'Already on this version.' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const { data: snapshot } = (await supabase
    .from('cover_letters')
    .select('content, ai_feedback, ai_score')
    .eq('id', snapshotId)
    .eq('user_id', user.id)
    .maybeSingle()) as {
    data: { content: string; ai_feedback: unknown; ai_score: number | null } | null
  }

  if (!snapshot) return { ok: false, error: 'Snapshot not found.' }

  const { error } = await supabase
    .from('cover_letters')
    .update({
      content: snapshot.content,
      word_count: wordCount(snapshot.content),
      ai_feedback: snapshot.ai_feedback,
      ai_score: snapshot.ai_score,
    })
    .eq('id', currentId)
    .eq('user_id', user.id)
    .eq('is_current', true)

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/coverletter/${currentId}`)
  return { ok: true }
}
