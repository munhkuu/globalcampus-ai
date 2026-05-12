import { requireAuth, apiSuccess, apiError, API_ERRORS } from '@/lib/utils/api'
import { callGemini } from '@/lib/ai/gemini'
import { parseAIJson, hashInput, type RoadmapResponse } from '@/lib/ai/provider'
import { buildRoadmapSystemPrompt } from '@/lib/ai/prompts/roadmap'
import { validateRoadmapInput } from '@/lib/ai/validators'
import { checkAIQuota } from '@/lib/billing/quota'

const RATE_LIMIT = 5
const RATE_WINDOW_MS = 60 * 60 * 1000

export async function POST(request: Request) {
  const { user, supabase, unauthorized } = await requireAuth()
  if (unauthorized) return API_ERRORS.UNAUTHORIZED()

  const body = await request.json() as {
    targetRole?: string
    focusArea?: string
    targetCompanies?: string[]
    experienceLevel?: string
    timelineMonths?: number
    hoursPerWeek?: string
    currentSkills?: string[]
    blocker?: string
  }

  const {
    targetRole = '',
    focusArea,
    targetCompanies = [],
    experienceLevel = 'beginner',
    timelineMonths = 6,
    hoursPerWeek,
    currentSkills = [],
    blocker,
  } = body

  const validation = validateRoadmapInput({ targetRole, timelineMonths })
  if (!validation.valid) return apiError(validation.reason!, 400)

  // Pull profile context so the AI knows the student's university + graduation year
  // without making them re-type it.
  const { data: profile } = await supabase
    .from('profiles')
    .select('university, graduation_year')
    .eq('id', user!.id)
    .maybeSingle<{ university: string | null; graduation_year: number | null }>()

  const quota = await checkAIQuota(supabase, user!.id)
  if (!quota.ok) {
    return apiError(
      `Daily free limit reached (${quota.limit} AI calls). Upgrade to Pro for unlimited.`,
      402
    )
  }

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
      focusArea,
      targetCompanies,
      experienceLevel: (experienceLevel as 'beginner' | 'intermediate' | 'advanced'),
      timelineMonths,
      hoursPerWeek,
      currentSkills,
      blocker,
      university: profile?.university ?? null,
      graduationYear: profile?.graduation_year ?? null,
    })

    const aiResponse = await callGemini(
      `Generate a ${timelineMonths}-month roadmap to become a ${targetRole}. Current skills: ${currentSkills.length ? currentSkills.join(', ') : 'none specified'}.`,
      {
        systemPrompt,
        jsonMode: true,
        maxTokens: 6000,
      }
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
    if (msg.includes('GOOGLE_API_KEY')) return apiError(msg, 503)
    if (process.env.NODE_ENV !== 'production') return apiError(`Roadmap failed: ${msg}`, 500)
    return apiError('Could not generate roadmap. Please try again.', 500)
  }
}
