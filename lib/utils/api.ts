import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** Authenticate the current request and return the user + supabase client. */
export async function requireAuth() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return { user: null, supabase, unauthorized: true as const }
  }

  return { user, supabase, unauthorized: false as const }
}

/** Standard JSON success response. */
export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status })
}

/** Standard JSON error response. */
export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export const API_ERRORS = {
  UNAUTHORIZED: () => apiError('Not authenticated', 401),
  FORBIDDEN:    () => apiError('Access denied', 403),
  NOT_FOUND:    () => apiError('Resource not found', 404),
  BAD_REQUEST:  (msg: string) => apiError(msg, 400),
  SERVER_ERROR: () => apiError('Internal server error', 500),
} as const
