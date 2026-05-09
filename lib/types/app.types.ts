import type { User } from '@supabase/supabase-js'
import type { Tables } from './database.types'

export type Profile = Tables<'profiles'>

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
