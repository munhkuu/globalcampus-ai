'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/lib/types/app.types'

const REVALIDATE = () => revalidatePath('/vault')

export async function createVaultNote(data: {
  title: string
  content: string
  tags?: string[]
  source?: string
}): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: note, error } = await supabase
    .from('vault_notes')
    .insert({
      user_id: user.id,
      title: data.title,
      content: data.content,
      tags: data.tags ?? [],
      source: data.source ?? 'manual',
    })
    .select('id')
    .single()

  if (error) return { error: 'Failed to save note' }

  REVALIDATE()
  return { data: { id: note.id } }
}

export async function updateVaultNote(
  id: string,
  data: { title: string; content: string; tags: string[] }
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('vault_notes')
    .update({ title: data.title, content: data.content, tags: data.tags })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: 'Failed to update note' }

  REVALIDATE()
  return { data: undefined }
}

export async function deleteVaultNote(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('vault_notes')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: 'Failed to delete note' }

  REVALIDATE()
  return { data: undefined }
}

export async function togglePinNote(
  id: string,
  isPinned: boolean
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('vault_notes')
    .update({ is_pinned: isPinned })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: 'Failed to update note' }

  REVALIDATE()
  return { data: undefined }
}
