'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { profileUpdateSchema } from '@/lib/utils/validators'
import type { ActionResult } from '@/lib/types/app.types'

export async function updateProfile(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const raw = {
    fullName: (formData.get('fullName') as string) || undefined,
    avatarUrl: (formData.get('avatarUrl') as string) || undefined,
  }

  const result = profileUpdateSchema.safeParse(raw)
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? 'Invalid input' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: result.data.fullName ?? null,
      avatar_url: result.data.avatarUrl ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) {
    return { error: 'Failed to update profile' }
  }

  revalidatePath('/settings')
  return { data: undefined }
}

export async function completeOnboarding(): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) {
    return { error: 'Failed to update onboarding status' }
  }

  revalidatePath('/', 'layout')
  return { data: undefined }
}
