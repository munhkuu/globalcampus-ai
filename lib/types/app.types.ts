import type { User } from '@supabase/supabase-js'
import type { Tables } from './database.types'

export type Profile = Tables<'profiles'>
export type InternshipApplication = Tables<'internship_applications'>
export type VaultNote = Tables<'vault_notes'>
export type StudyGoal = Tables<'study_goals'>
export type RoadmapSession = Tables<'roadmap_sessions'>
export type AiInteraction = Tables<'ai_interactions'>

export type UserWithProfile = User & {
  profile?: Profile | null
}

/** Standard typed return for all Server Actions */
export type ActionResult<T = void> =
  | { data: T; error?: never }
  | { data?: never; error: string }

/** Navigation item used in the sidebar */
export type NavItem = {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number
  disabled?: boolean
}
