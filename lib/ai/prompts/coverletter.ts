import { findCompany } from '@/lib/coverletter/company-questions'

// The shape the AI must return. Keep in sync with the editor's feedback panel.
export interface CoverLetterCritique {
  overall_score: number // 1-10
  one_line_summary: string
  strengths: string[]
  weaknesses: string[]
  korean_style_notes: string[]
  international_student_pitfalls: string[]
  company_fit: {
    score: number
    notes: string
  }
  suggested_revisions: {
    excerpt: string
    suggestion: string
    reason: string
  }[]
}

export function buildCoverLetterCritiquePrompt(params: {
  company: string
  question: string
  draft: string
  university?: string | null
  graduationYear?: number | null
  experienceLevel?: string | null
}): string {
  const preset = findCompany(params.company)
  const companyContext = preset
    ? `

Company-specific context for ${params.company}:
${preset.notes}`
    : `\n\nCompany: ${params.company} (no curated profile available — apply general Korean tech 자소서 conventions).`

  const studentContext =
    params.university || params.graduationYear || params.experienceLevel
      ? `

About the student:
${[
  params.university ? `- University: ${params.university}` : '',
  params.graduationYear ? `- Expected graduation: ${params.graduationYear}` : '',
  params.experienceLevel ? `- Experience level: ${params.experienceLevel}` : '',
]
  .filter(Boolean)
  .join('\n')}`
      : ''

  return `You are a senior recruiter at a major Korean tech company and a veteran career mentor for international CS students. You have read hundreds of 자기소개서 from foreign applicants — you know exactly where they lose points: literal translation from English, weak hooks, mushy storytelling without numbers, claiming "passion" without evidence, ignoring the company-specific question.

You critique HARSHLY but constructively. Your goal is to get this student to an offer, not to be polite.${companyContext}${studentContext}

The 자소서 question being answered:
"""
${params.question}
"""

The student's draft:
"""
${params.draft}
"""

Analyze the draft and return ONLY valid JSON with this exact structure:

{
  "overall_score": <integer 1-10>,
  "one_line_summary": "<one sentence verdict — would this make it past 서류 review?>",
  "strengths": ["<2-4 things this draft does well>"],
  "weaknesses": ["<3-5 specific things hurting this draft — be concrete, quote specific lines if needed>"],
  "korean_style_notes": ["<2-4 issues with Korean professional writing style — e.g., unnatural translation phrasing, wrong honorific level, mismatched tone, English sentence structure leaking through>"],
  "international_student_pitfalls": ["<2-4 things this student is doing that foreigners commonly get wrong on Korean 자소서 — be specific>"],
  "company_fit": {
    "score": <integer 1-10>,
    "notes": "<one paragraph: does this answer match what ${params.company} specifically wants? Reference the company culture notes given above.>"
  },
  "suggested_revisions": [
    {
      "excerpt": "<exact line or short passage from the draft>",
      "suggestion": "<the revised version in Korean (or English if the draft is in English)>",
      "reason": "<why this revision is stronger>"
    }
  ]
}

Rules:
- Give 2-5 suggested_revisions — focused on the highest-impact lines, not a full rewrite.
- If the draft is too short or empty (< 50 words), set overall_score ≤ 3 and weaknesses should call this out first.
- If the draft is in Korean, write revisions in Korean. If in English, write revisions in English. Don't switch languages mid-revision.
- DO NOT pad with generic advice. Every weakness must point at something specific in THIS draft.
- DO NOT use the word "passionate" or "passion" in your output. It's a banned word.
- No text outside the JSON.`
}
