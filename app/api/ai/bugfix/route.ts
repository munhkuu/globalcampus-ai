import { requireAuth, apiSuccess, apiError, API_ERRORS } from '@/lib/utils/api'
import { callOpusExtended, parseAIJson, hashInput } from '@/lib/ai/anthropic'
import { buildBugFixSystemPrompt } from '@/lib/ai/prompts/bugfix'
import { validateBugFixInput } from '@/lib/ai/validators'
import type { BugFixResponse } from '@/lib/ai/provider'

const RATE_LIMIT = 10
const RATE_WINDOW_MS = 60 * 60 * 1000

export async function POST(request: Request) {
  const { user, supabase, unauthorized } = await requireAuth()
  if (unauthorized) return API_ERRORS.UNAUTHORIZED()

  const body = await request.json() as {
    code?: string
    language?: string
    errorMessage?: string
  }

  const { code = '', language = 'Python', errorMessage = '' } = body

  const validation = validateBugFixInput(code)
  if (!validation.valid) return apiError(validation.reason!, 400)

  const windowStart = new Date(Date.now() - RATE_WINDOW_MS).toISOString()
  const { count } = await supabase
    .from('ai_interactions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user!.id)
    .eq('feature', 'bugfix')
    .gte('created_at', windowStart)

  if ((count ?? 0) >= RATE_LIMIT) {
    return apiError('Rate limit reached — maximum 10 bug fix requests per hour.', 429)
  }

  try {
    const systemPrompt = buildBugFixSystemPrompt(language)
    const userMessage = errorMessage
      ? `${code}\n\nError message: ${errorMessage}`
      : code

    const aiResponse = await callOpusExtended(userMessage, {
      systemPrompt,
      budgetTokens: 6000,
      maxTokens: 12000,
    })

    const result = parseAIJson<BugFixResponse>(aiResponse.content)

    supabase.from('ai_interactions').insert({
      user_id: user!.id,
      feature: 'bugfix',
      model_used: aiResponse.model,
      input_hash: hashInput(code),
      prompt_tokens: aiResponse.usage.promptTokens,
      completion_tokens: aiResponse.usage.completionTokens,
    }).then(() => {})

    return apiSuccess(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'AI request failed'
    if (msg.includes('ANTHROPIC_API_KEY')) return apiError(msg, 503)
    return apiError('Could not fix the code. Please try again.', 500)
  }
}
