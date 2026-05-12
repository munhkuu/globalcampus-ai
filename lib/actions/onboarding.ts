'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { onboardingSchema } from '@/lib/utils/validators'
import type { ActionResult } from '@/lib/types/app.types'

export async function completeOnboarding(
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const raw = {
    targetRole: formData.get('targetRole') as string,
    university: formData.get('university') as string,
    graduationYear: Number(formData.get('graduationYear')),
    experienceLevel: formData.get('experienceLevel') as string,
  }

  const result = onboardingSchema.safeParse(raw)
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? 'Invalid input' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      target_role: result.data.targetRole,
      university: result.data.university,
      graduation_year: result.data.graduationYear,
      experience_level: result.data.experienceLevel,
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) {
    return { error: 'Failed to save profile. Please try again.' }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}
