'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { internshipApplicationSchema } from '@/lib/utils/validators'
import type { ActionResult } from '@/lib/types/app.types'
import type { ApplicationStatus } from '@/lib/types/database.types'

const REVALIDATE = () => revalidatePath('/internships')

export async function createApplication(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const raw = Object.fromEntries(
    [
      'company_name', 'role_title', 'status', 'applied_date', 'deadline',
      'job_url', 'location', 'salary_range', 'recruiter_name', 'recruiter_email',
      'notes', 'resume_version',
    ].map((k) => [k, formData.get(k) as string])
  )
  raw.is_priority = formData.get('is_priority') === 'true' ? 'true' : 'false'

  const parsed = internshipApplicationSchema.safeParse({
    ...raw,
    is_priority: raw.is_priority === 'true',
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const { data, error } = await supabase
    .from('internship_applications')
    .insert({ ...parsed.data, user_id: user.id })
    .select('id')
    .single()

  if (error) return { error: 'Failed to create application' }

  REVALIDATE()
  return { data: { id: data.id } }
}

export async function updateApplication(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const raw = Object.fromEntries(
    [
      'company_name', 'role_title', 'status', 'applied_date', 'deadline',
      'job_url', 'location', 'salary_range', 'recruiter_name', 'recruiter_email',
      'notes', 'resume_version',
    ].map((k) => [k, formData.get(k) as string])
  )

  const parsed = internshipApplicationSchema.safeParse({
    ...raw,
    is_priority: formData.get('is_priority') === 'true',
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const { error } = await supabase
    .from('internship_applications')
    .update(parsed.data)
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: 'Failed to update application' }

  REVALIDATE()
  return { data: undefined }
}

export async function updateApplicationStatus(
  id: string,
  status: ApplicationStatus
): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('internship_applications')
    .update({ status })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: 'Failed to update status' }

  REVALIDATE()
  return { data: undefined }
}

export async function togglePriority(
  id: string,
  isPriority: boolean
): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('internship_applications')
    .update({ is_priority: isPriority })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: 'Failed to update priority' }

  REVALIDATE()
  return { data: undefined }
}

export async function deleteApplication(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('internship_applications')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: 'Failed to delete application' }

  REVALIDATE()
  return { data: undefined }
}
