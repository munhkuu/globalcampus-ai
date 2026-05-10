import { requireAuth, apiSuccess, apiError, API_ERRORS } from '@/lib/utils/api'
import { callOpusExtended, parseAIJson, hashInput } from '@/lib/ai/anthropic'
import { buildProjectSystemPrompt } from '@/lib/ai/prompts/project'
import { validateProjectInput } from '@/lib/ai/validators'
import type { ProjectResponse } from '@/lib/ai/provider'

const RATE_LIMIT = 5
const RATE_WINDOW_MS = 60 * 60 * 1000

export async function POST(request: Request) {
  const { user, supabase, unauthorized } = await requireAuth()
  if (unauthorized) return API_ERRORS.UNAUTHORIZED()

  const body = await request.json() as {
    description?: string
    complexity?: string
    preferredLanguage?: string
  }

  const { description = '', complexity = 'simple', preferredLanguage = 'Python' } = body

  const validation = validateProjectInput(description)
  if (!validation.valid) return apiError(validation.reason!, 400)

  const windowStart = new Date(Date.now() - RATE_WINDOW_MS).toISOString()
  const { count } = await supabase
    .from('ai_interactions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user!.id)
    .eq('feature', 'project')
    .gte('created_at', windowStart)

  if ((count ?? 0) >= RATE_LIMIT) {
    return apiError('Rate limit reached — maximum 5 project requests per hour.', 429)
  }

  try {
    const systemPrompt = buildProjectSystemPrompt(complexity as 'simple' | 'medium' | 'advanced')
    const userMessage = `Build a ${complexity} ${preferredLanguage} project: ${description}`

    const aiResponse = await callOpusExtended(userMessage, {
      systemPrompt,
      budgetTokens: 10000,
      maxTokens: 20000,
    })

    const result = parseAIJson<ProjectResponse>(aiResponse.content)

    supabase.from('ai_interactions').insert({
      user_id: user!.id,
      feature: 'project',
      model_used: aiResponse.model,
      input_hash: hashInput(description),
      prompt_tokens: aiResponse.usage.promptTokens,
      completion_tokens: aiResponse.usage.completionTokens,
    }).then(() => {})

    return apiSuccess(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'AI request failed'
    if (msg.includes('ANTHROPIC_API_KEY')) return apiError(msg, 503)
    return apiError('Could not generate the project. Please try again.', 500)
  }
}
