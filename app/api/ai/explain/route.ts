import { requireAuth, apiSuccess, apiError, API_ERRORS } from '@/lib/utils/api'
import { callGemini } from '@/lib/ai/gemini'
import { parseAIJson, hashInput } from '@/lib/ai/provider'
import { buildExplainerSystemPrompt } from '@/lib/ai/prompts/explainer'
import { validateExplainerInput } from '@/lib/ai/validators'
import type { ExplainerResponse } from '@/lib/ai/provider'
import { checkAIQuota } from '@/lib/billing/quota'

const RATE_LIMIT = 15
const RATE_WINDOW_MS = 60 * 60 * 1000

export async function POST(request: Request) {
  const { user, supabase, unauthorized } = await requireAuth()
  if (unauthorized) return API_ERRORS.UNAUTHORIZED()

  const body = await request.json() as {
    input?: string
    depth?: string
    codeLanguage?: string
    bilingual?: boolean
  }

  const { input = '', depth = 'beginner', codeLanguage = 'Python', bilingual = false } = body

  const validation = validateExplainerInput(input)
  if (!validation.valid) return apiError(validation.reason!, 400)

  const quota = await checkAIQuota(supabase, user!.id)
  if (!quota.ok) {
    return apiError(
      `Daily free limit reached (${quota.limit} AI calls). Upgrade to Pro for unlimited.`,
      402
    )
  }

  // Rate limit check
  const windowStart = new Date(Date.now() - RATE_WINDOW_MS).toISOString()
  const { count } = await supabase
    .from('ai_interactions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user!.id)
    .eq('feature', 'explainer')
    .gte('created_at', windowStart)

  if ((count ?? 0) >= RATE_LIMIT) {
    return apiError('Rate limit reached — maximum 15 explain requests per hour.', 429)
  }

  try {
    const systemPrompt = buildExplainerSystemPrompt({
      depth: (depth as 'beginner' | 'intermediate' | 'advanced'),
      codeLanguage,
      bilingual,
    })

    const aiResponse = await callGemini(input, {
      systemPrompt,
      jsonMode: true,
      maxTokens: 6000,
    })

    const result = parseAIJson<ExplainerResponse>(aiResponse.content)

    // Log interaction (non-blocking)
    supabase.from('ai_interactions').insert({
      user_id: user!.id,
      feature: 'explainer',
      model_used: aiResponse.model,
      input_hash: hashInput(input),
      prompt_tokens: aiResponse.usage.promptTokens,
      completion_tokens: aiResponse.usage.completionTokens,
    }).then(() => {})

    return apiSuccess(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'AI request failed'
    if (msg.includes('GOOGLE_API_KEY')) return apiError(msg, 503)
    if (process.env.NODE_ENV !== 'production') return apiError(`Explainer failed: ${msg}`, 500)
    return apiError('Could not generate explanation. Please try again.', 500)
  }
}
