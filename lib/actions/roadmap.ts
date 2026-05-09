'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/lib/types/app.types'
import type { ExperienceLevel, Json } from '@/lib/types/database.types'

export async function saveRoadmapSession(data: {
  sessionName: string
  targetRole: string
  experienceLevel: ExperienceLevel
  timelineMonths: number
  currentSkills: string[]
  roadmapData: Json
}): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: session, error } = await supabase
    .from('roadmap_sessions')
    .insert({
      user_id: user.id,
      session_name: data.sessionName,
      target_role: data.targetRole,
      experience_level: data.experienceLevel,
      timeline_months: data.timelineMonths,
      current_skills: data.currentSkills,
      roadmap_data: data.roadmapData,
    })
    .select('id')
    .single()

  if (error) return { error: 'Failed to save roadmap' }

  revalidatePath('/roadmap')
  return { data: { id: session.id } }
}
