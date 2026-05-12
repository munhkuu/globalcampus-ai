import Anthropic from '@anthropic-ai/sdk'
import { parseAIJson, hashInput } from './provider'

export interface OpusOptions {
  systemPrompt?: string
  budgetTokens?: number
  maxTokens?: number
}

export interface OpusResponse {
  content: string
  model: string
  usage: {
    promptTokens: number
    completionTokens: number
  }
}

export async function callOpusExtended(
  userMessage: string,
  options: OpusOptions = {}
): Promise<OpusResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set. Add it to .env.local to use extended AI features.')
  }

  const client = new Anthropic({ apiKey })
  const budgetTokens = options.budgetTokens ?? 8000
  const maxTokens = options.maxTokens ?? 16000

  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: maxTokens,
    thinking: { type: 'enabled', budget_tokens: budgetTokens },
    ...(options.systemPrompt ? { system: options.systemPrompt } : {}),
    messages: [{ role: 'user', content: userMessage }],
  })

  let textContent = ''
  for (const block of response.content) {
    if (block.type === 'text') {
      textContent = block.text
      break
    }
  }

  return {
    content: textContent,
    model: response.model,
    usage: {
      promptTokens: response.usage.input_tokens,
      completionTokens: response.usage.output_tokens,
    },
  }
}

export async function callSonnetExtended(
  userMessage: string,
  options: OpusOptions = {}
): Promise<OpusResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set. Add it to .env.local to use extended AI features.')
  }

  const client = new Anthropic({ apiKey })
  const budgetTokens = options.budgetTokens ?? 4000
  const maxTokens = options.maxTokens ?? 8000

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: maxTokens,
    thinking: { type: 'enabled', budget_tokens: budgetTokens },
    ...(options.systemPrompt ? { system: options.systemPrompt } : {}),
    messages: [{ role: 'user', content: userMessage }],
  })

  let textContent = ''
  for (const block of response.content) {
    if (block.type === 'text') {
      textContent = block.text
      break
    }
  }

  return {
    content: textContent,
    model: response.model,
    usage: {
      promptTokens: response.usage.input_tokens,
      completionTokens: response.usage.output_tokens,
    },
  }
}

export { parseAIJson, hashInput }
