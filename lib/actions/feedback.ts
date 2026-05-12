'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const feedbackSchema = z.object({
  rating: z.enum(['positive', 'negative', 'neutral']),
  comment: z.string().trim().max(2000).optional().nullable(),
  feature: z.string().trim().max(50).optional().nullable(),
  path: z.string().trim().max(200).optional().nullable(),
  source: z.enum(['widget', 'post_action', 'survey']).default('widget'),
})

export type FeedbackInput = z.infer<typeof feedbackSchema>

export type FeedbackResult = { ok: true } | { ok: false; error: string }

export async function submitFeedback(input: FeedbackInput): Promise<FeedbackResult> {
  const parsed = feedbackSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, error: 'You need to be signed in to leave feedback.' }
  }

  const { error } = await supabase.from('feedback').insert({
    user_id: user.id,
    email: user.email ?? null,
    rating: parsed.data.rating,
    comment: parsed.data.comment ?? null,
    feature: parsed.data.feature ?? null,
    path: parsed.data.path ?? null,
    source: parsed.data.source,
  })

  if (error) {
    return { ok: false, error: 'Could not save feedback. Please try again.' }
  }

  return { ok: true }
}
