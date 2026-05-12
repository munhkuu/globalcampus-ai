import { requireAuth, apiSuccess, apiError, API_ERRORS } from '@/lib/utils/api'
import { callSonnetExtended } from '@/lib/ai/anthropic'
import { parseAIJson, hashInput } from '@/lib/ai/provider'
import { buildCoverLetterCritiquePrompt, type CoverLetterCritique } from '@/lib/ai/prompts/coverletter'
import { checkAIQuota } from '@/lib/billing/quota'

const RATE_LIMIT = 10
const RATE_WINDOW_MS = 60 * 60 * 1000

export async function POST(request: Request) {
  const { user, supabase, unauthorized } = await requireAuth()
  if (unauthorized) return API_ERRORS.UNAUTHORIZED()

  const body = (await request.json()) as {
    company?: string
    question?: string
    draft?: string
    coverLetterId?: string
  }

  const { company = '', question = '', draft = '', coverLetterId } = body

  if (!company.trim() || company.length > 80) return apiError('Pick a company.', 400)
  if (!question.trim() || question.length > 1000) return apiError('Missing or oversized question.', 400)
  if (!draft.trim() || draft.length < 50) {
    return apiError('Write at least 50 characters before requesting feedback.', 400)
  }
  if (draft.length > 8000) {
    return apiError('Draft exceeds 8000 characters. Trim it before requesting feedback.', 400)
  }

  const quota = await checkAIQuota(supabase, user!.id)
  if (!quota.ok) {
    return apiError(
      `Daily free limit reached (${quota.limit} AI calls). Upgrade to Pro for unlimited.`,
      402
    )
  }

  // Per-feature hourly cap (separate from daily quota).
  const windowStart = new Date(Date.now() - RATE_WINDOW_MS).toISOString()
  const { count } = await supabase
    .from('ai_interactions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user!.id)
    .eq('feature', 'coverletter')
    .gte('created_at', windowStart)

  if ((count ?? 0) >= RATE_LIMIT) {
    return apiError(`Rate limit reached — maximum ${RATE_LIMIT} critiques per hour.`, 429)
  }

  // Pull profile context so the AI knows uni + grad year + experience level.
  const { data: profile } = await supabase
    .from('profiles')
    .select('university, graduation_year, experience_level')
    .eq('id', user!.id)
    .maybeSingle<{
      university: string | null
      graduation_year: number | null
      experience_level: string | null
    }>()

  try {
    const systemPrompt = buildCoverLetterCritiquePrompt({
      company,
      question,
      draft,
      university: profile?.university ?? null,
      graduationYear: profile?.graduation_year ?? null,
      experienceLevel: profile?.experience_level ?? null,
    })

    const aiResponse = await callSonnetExtended('Please return the JSON critique.', {
      systemPrompt,
      budgetTokens: 3000,
      maxTokens: 6000,
    })

    const result = parseAIJson<CoverLetterCritique>(aiResponse.content)

    // Log AI interaction. Note: 'coverletter' is a new feature value — relies on
    // ai_feature enum or this column being TEXT. If enum, run a migration to add it.
    supabase
      .from('ai_interactions')
      .insert({
        user_id: user!.id,
        feature: 'coverletter',
        model_used: aiResponse.model,
        input_hash: hashInput(draft),
        prompt_tokens: aiResponse.usage.promptTokens,
        completion_tokens: aiResponse.usage.completionTokens,
      })
      .then(() => {})

    // Persist the critique back onto the cover letter row if an id was provided.
    if (coverLetterId) {
      await supabase
        .from('cover_letters')
        .update({
          ai_feedback: result,
          ai_score: result.overall_score,
        })
        .eq('id', coverLetterId)
        .eq('user_id', user!.id)
    }

    return apiSuccess(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'AI request failed'
    if (msg.includes('ANTHROPIC_API_KEY')) return apiError(msg, 503)
    if (process.env.NODE_ENV !== 'production') return apiError(`Critique failed: ${msg}`, 500)
    return apiError('Could not generate critique. Please try again.', 500)
  }
}
