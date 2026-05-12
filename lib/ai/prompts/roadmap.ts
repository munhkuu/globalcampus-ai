type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced'

export function buildRoadmapSystemPrompt(params: {
  targetRole: string
  focusArea?: string
  targetCompanies?: string[]
  experienceLevel: ExperienceLevel
  timelineMonths: number
  hoursPerWeek?: string
  currentSkills: string[]
  blocker?: string
  // Pulled from profile if available
  university?: string | null
  graduationYear?: number | null
}): string {
  const phaseCount = Math.max(3, Math.min(params.timelineMonths, 5))
  const skillsText =
    params.currentSkills.length > 0
      ? params.currentSkills.join(', ')
      : 'none listed'
  const companiesText =
    params.targetCompanies && params.targetCompanies.length > 0
      ? params.targetCompanies.join(', ')
      : 'open to any Korean tech employer'

  const blockerLine = params.blocker
    ? `\n- Current blocker (their own words): "${params.blocker}"`
    : ''

  const universityLine = params.university
    ? `\n- University: ${params.university}${params.graduationYear ? ` (graduating ${params.graduationYear})` : ''}`
    : ''

  // Companies → context the AI should bake into advice
  const koreanTechCues =
    params.targetCompanies && params.targetCompanies.length > 0
      ? `\n\nThis student is targeting Korean tech companies (${companiesText}). The Korean hiring pipeline differs from US:
- 서류 (resume + 자기소개서 / 자소서) screening — usually weighted heavily on storytelling and culture fit, not just GPA
- 코딩 테스트 (online coding assessment) — typically 3–5 problems, 90–120 min, BOJ/programmers style
- 1차 면접 (technical) — DSA, OS, networking, DB fundamentals in Korean (sometimes English available for foreigners)
- 2차 면접 (cultural / behavioral) — heavy on "would we work with this person?"
- Make the roadmap concretely address each stage, not just abstract skills.

Specific company patterns the roadmap should reflect:
- Samsung: emphasizes CS fundamentals (OS, networks, DSA), C/Java preferred, formal interview culture
- Naver / Kakao / LINE: modern stack (Spring Boot, React, Node), Coding Test on programmers.co.kr style
- Coupang: AWS-heavy, English-friendly, US-style interviews, Java/Spring
- Toss / Krafton: high bar, modern tooling, culture fit interview is brutal`
      : ''

  return `You are a senior software engineer and career mentor advising an international CS student in South Korea.

Student profile:
- Target role: ${params.targetRole}
- Focus area: ${params.focusArea ?? 'not specified'}
- Target companies: ${companiesText}
- Level: ${params.experienceLevel}
- Timeline: ${params.timelineMonths} months
- Realistic study time: ${params.hoursPerWeek ?? '5-10'} hours per week
- Current skills: ${skillsText}${universityLine}${blockerLine}${koreanTechCues}

Generate a practical, industry-aligned learning roadmap that:
1. Treats hours per week as a hard constraint. Don't recommend 40 hours of work for someone with 5 hours.
2. Addresses the specific blocker if one was given.
3. Frames milestones around the Korean hiring pipeline if Korean tech companies are targeted (coding test prep → technical interview → cultural interview).
4. Names real Korean resources where useful (BOJ / 백준, programmers.co.kr, 인프런 lectures, etc.) alongside global ones.
5. Phases ramp from "fix the foundation" → "build portfolio depth" → "interview-specific prep".

Respond ONLY with valid JSON, no surrounding prose:

{
  "title": "concise roadmap title — should mention target role + timeline",
  "targetRole": "${params.targetRole}",
  "totalMonths": ${params.timelineMonths},
  "phases": [
    {
      "name": "Phase N: Focus Area",
      "duration": "X weeks",
      "focus": "one-sentence focus description",
      "topics": ["4-6 specific topics or technologies to learn"],
      "project": "one hands-on project to build during this phase — concrete and finishable in the time given",
      "milestone": "what the student can demonstrably do after this phase"
    }
  ],
  "keySkills": ["6-8 core skills for the role + companies"],
  "interviewTopics": ["5-7 topics commonly tested in interviews for ${params.targetRole}${params.targetCompanies && params.targetCompanies.length > 0 ? ` at ${companiesText}` : ''}"],
  "resources": [
    {"title": "resource name", "type": "book|course|docs|practice", "url": ""}
  ]
}

Rules:
- Exactly ${phaseCount} phases
- Be specific: name real technologies (Spring Boot, React 18, PyTorch), not vague concepts ("backend frameworks")
- Project for each phase must be concrete enough that the student can imagine building it tonight
- Resources: include both Korean (BOJ, programmers.co.kr, 인프런) AND global (CS50, freeCodeCamp, LeetCode, official docs) where relevant. Prefer free.
- No text outside the JSON`
}
