'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/lib/types/app.types'

export async function createVaultNote(data: {
  title: string
  content: string
  tags?: string[]
  source?: string
}): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
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

  revalidatePath('/vault')
  return { data: { id: note.id } }
}
