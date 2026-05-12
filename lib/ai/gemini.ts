import { GoogleGenAI } from '@google/genai'
import { parseAIJson, hashInput } from './provider'

export interface GeminiOptions {
  systemPrompt?: string
  maxTokens?: number
  // When true, asks Gemini to emit application/json directly — much more
  // reliable than relying on prompt instructions for JSON output.
  jsonMode?: boolean
}

export interface GeminiResponse {
  content: string
  model: string
  usage: {
    promptTokens: number
    completionTokens: number
  }
}

const DEFAULT_MODEL = 'gemini-2.5-flash'

let cached: GoogleGenAI | null = null

function client(): GoogleGenAI {
  if (cached) return cached
  const apiKey = process.env.GOOGLE_API_KEY
  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY is not set. Add it to .env.local — get one at https://aistudio.google.com/app/apikey')
  }
  cached = new GoogleGenAI({ apiKey })
  return cached
}

export async function callGemini(
  userMessage: string,
  options: GeminiOptions = {}
): Promise<GeminiResponse> {
  const ai = client()
  const maxOutputTokens = options.maxTokens ?? 6000

  const response = await ai.models.generateContent({
    model: DEFAULT_MODEL,
    contents: userMessage,
    config: {
      ...(options.systemPrompt ? { systemInstruction: options.systemPrompt } : {}),
      ...(options.jsonMode ? { responseMimeType: 'application/json' } : {}),
      maxOutputTokens,
      temperature: 0.4,
    },
  })

  const text = response.text ?? ''
  const usage = response.usageMetadata

  return {
    content: text,
    model: DEFAULT_MODEL,
    usage: {
      promptTokens: usage?.promptTokenCount ?? 0,
      completionTokens: usage?.candidatesTokenCount ?? 0,
    },
  }
}

export { parseAIJson, hashInput }
