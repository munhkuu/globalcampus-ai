export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AIRequestOptions {
  model?: string
  temperature?: number
  maxTokens?: number
}

export interface AIResponse {
  content: string
  model: string
  usage: {
    promptTokens: number
    completionTokens: number
  }
}

// ─── Response shapes ──────────────────────────────────────────────────────────

export interface ExplainerResponse {
  concept: string
  explanation: string
  keyPoints: string[]
  codeExample: string
  koreanTerms: Array<{ korean: string; english: string }>
  relatedConcepts: string[]
}

export interface RoadmapPhase {
  name: string
  duration: string
  focus: string
  topics: string[]
  project: string
  milestone: string
}

export interface RoadmapResponse {
  title: string
  targetRole: string
  totalMonths: number
  phases: RoadmapPhase[]
  keySkills: string[]
  interviewTopics: string[]
  resources: Array<{ title: string; type: string; url: string }>
}

// ─── Core fetch wrapper ────────────────────────────────────────────────────────

export async function callAI(
  messages: AIMessage[],
  options: AIRequestOptions = {}
): Promise<AIResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY
  const baseUrl =
    process.env.OPENROUTER_BASE_URL ?? 'https://openrouter.ai/api/v1'
  const model =
    options.model ??
    process.env.OPENROUTER_DEFAULT_MODEL ??
    'anthropic/claude-3-haiku'

  if (!apiKey) {
    throw new Error(
      'OPENROUTER_API_KEY is not set. Add it to .env.local to use AI features.'
    )
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer':
        process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
      'X-Title': 'GlobalCampus AI',
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: options.maxTokens ?? 2000,
      temperature: options.temperature ?? 0.7,
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`AI API error ${res.status}: ${body}`)
  }

  const data = (await res.json()) as {
    choices: Array<{ message: { content: string } }>
    model: string
    usage?: { prompt_tokens: number; completion_tokens: number }
  }

  return {
    content: data.choices[0]?.message?.content ?? '',
    model: data.model,
    usage: {
      promptTokens: data.usage?.prompt_tokens ?? 0,
      completionTokens: data.usage?.completion_tokens ?? 0,
    },
  }
}

/** Parse JSON from AI response, tolerating markdown code fences. */
export function parseAIJson<T>(content: string): T {
  // Strip optional ```json ... ``` wrapper
  const cleaned = content
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()

  const jsonStr = cleaned.startsWith('{') ? cleaned : (cleaned.match(/\{[\s\S]*\}/) ?? [''])[0]

  return JSON.parse(jsonStr) as T
}

/** Simple hash for deduplication — not cryptographic. */
export function hashInput(input: string): string {
  let h = 0
  const s = input.slice(0, 300)
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(31, h) + s.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h).toString(36)
}
