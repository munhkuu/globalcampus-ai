import { requireAuth, apiSuccess, apiError, API_ERRORS } from '@/lib/utils/api'
import { callAI, parseAIJson, hashInput, type RoadmapResponse } from '@/lib/ai/provider'
import { buildRoadmapSystemPrompt } from '@/lib/ai/prompts/roadmap'
import { validateRoadmapInput } from '@/lib/ai/validators'

const RATE_LIMIT = 5
const RATE_WINDOW_MS = 60 * 60 * 1000

export async function POST(request: Request) {
  const { user, supabase, unauthorized } = await requireAuth()
  if (unauthorized) return API_ERRORS.UNAUTHORIZED()

  const body = await request.json() as {
    targetRole?: string
    experienceLevel?: string
    timelineMonths?: number
    currentSkills?: string[]
  }

  const {
    targetRole = '',
    experienceLevel = 'beginner',
    timelineMonths = 6,
    currentSkills = [],
  } = body

  const validation = validateRoadmapInput({ targetRole, timelineMonths })
  if (!validation.valid) return apiError(validation.reason!, 400)

  // Rate limit: roadmap is expensive — 5/hour
  const windowStart = new Date(Date.now() - RATE_WINDOW_MS).toISOString()
  const { count } = await supabase
    .from('ai_interactions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user!.id)
    .eq('feature', 'roadmap')
    .gte('created_at', windowStart)

  if ((count ?? 0) >= RATE_LIMIT) {
    return apiError('Rate limit reached — maximum 5 roadmaps per hour.', 429)
  }

  try {
    const systemPrompt = buildRoadmapSystemPrompt({
      targetRole,
      experienceLevel: (experienceLevel as 'beginner' | 'intermediate' | 'advanced'),
      timelineMonths,
      currentSkills,
    })

    const aiResponse = await callAI(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate a ${timelineMonths}-month roadmap to become a ${targetRole}.` },
      ],
      { maxTokens: 3000, temperature: 0.6 }
    )

    const result = parseAIJson<RoadmapResponse>(aiResponse.content)

    supabase.from('ai_interactions').insert({
      user_id: user!.id,
      feature: 'roadmap',
      model_used: aiResponse.model,
      input_hash: hashInput(targetRole + timelineMonths),
      prompt_tokens: aiResponse.usage.promptTokens,
      completion_tokens: aiResponse.usage.completionTokens,
    }).then(() => {})

    return apiSuccess(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'AI request failed'
    if (msg.includes('OPENROUTER_API_KEY')) return apiError(msg, 503)
    return apiError('Could not generate roadmap. Please try again.', 500)
  }
}
