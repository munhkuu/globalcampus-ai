type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced'

export function buildRoadmapSystemPrompt(params: {
  targetRole: string
  experienceLevel: ExperienceLevel
  timelineMonths: number
  currentSkills: string[]
}): string {
  const phaseCount = Math.max(3, Math.min(params.timelineMonths, 5))
  const skillsText =
    params.currentSkills.length > 0
      ? params.currentSkills.join(', ')
      : 'none listed'

  return `You are a senior software engineer and career mentor advising an international CS student in South Korea.

Student profile:
- Target: ${params.targetRole}
- Level: ${params.experienceLevel}
- Timeline: ${params.timelineMonths} months
- Current skills: ${skillsText}

Generate a practical, industry-aligned learning roadmap. Respond ONLY with valid JSON:

{
  "title": "concise roadmap title",
  "targetRole": "${params.targetRole}",
  "totalMonths": ${params.timelineMonths},
  "phases": [
    {
      "name": "Phase N: Focus Area",
      "duration": "X weeks",
      "focus": "one-sentence focus description",
      "topics": ["4-6 specific topics to learn"],
      "project": "one hands-on project to build during this phase",
      "milestone": "what you will be able to do after this phase"
    }
  ],
  "keySkills": ["6-8 core skills for the role"],
  "interviewTopics": ["5-7 topics commonly tested in ${params.targetRole} interviews"],
  "resources": [
    {"title": "resource name", "type": "book|course|docs|practice", "url": ""}
  ]
}

Rules:
- Create exactly ${phaseCount} phases
- Be specific: name real technologies, not vague concepts
- Project for each phase must be concrete and buildable alone
- Resources: prefer free (CS50, freeCodeCamp, official docs, LeetCode)
- No text outside the JSON`
}
