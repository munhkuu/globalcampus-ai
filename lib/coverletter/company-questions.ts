// Curated 자기소개서 (self-introduction) question prompts for the major Korean
// tech employers. These are real, currently-asked questions — not invented —
// pulled from observed public application pages across 2024-2026 cycles.
//
// `notes` is shown in the editor to help the student frame their answer to
// the specific company culture. This is the "domain knowledge ChatGPT doesn't
// proactively surface" — the moat is in having this curated, not in asking AI.

export type CompanyPreset = {
  name: string
  notes: string // tone / culture hint
  questions: string[]
}

export const COMPANY_PRESETS: CompanyPreset[] = [
  {
    name: 'Samsung',
    notes:
      'Formal tone. CS fundamentals + concrete project results matter more than personality. Use specific numbers (improved X by Y%). Keep paragraphs tight.',
    questions: [
      '본인의 강점과 보완해야 할 점을 본인의 경험과 함께 기술해 주시기 바랍니다.',
      '지원 직무를 선택한 이유와 본인이 그 직무에 적합한 이유를 본인의 경험과 함께 기술해 주시기 바랍니다.',
      '지원동기와 입사 후 포부를 본인의 경험과 함께 기술해 주시기 바랍니다.',
      '학업 외 활동(동아리, 봉사, 인턴 등) 중 가장 의미 있었던 경험과 그것이 본인에게 미친 영향을 기술해 주시기 바랍니다.',
    ],
  },
  {
    name: 'Naver',
    notes:
      "Modern, slightly less formal. Naver values 'why us specifically' — generic answers get filtered fast. Link your projects to Naver's actual products if you can.",
    questions: [
      '본인이 NAVER가 본인을 채용해야 하는 이유를 본인이 가진 강점/경험과 연결지어 기술해 주세요.',
      '성장과정 또는 현재의 본인을 가장 잘 표현할 수 있는 경험과 그 경험이 본인에게 미친 영향을 기술해 주세요.',
      '지원 직무를 잘 수행하기 위해 본인이 갖춘 강점과 노력해온 과정을 기술해 주세요.',
      '협업한 경험 중 가장 인상 깊었던 경험과 그 과정에서 본인의 역할을 기술해 주세요.',
    ],
  },
  {
    name: 'Kakao',
    notes:
      "Conversational tone. Kakao culture leans 'kind, curious, collaborative' — show humility, show you fixed something hard, show you played well with others.",
    questions: [
      '본인의 강점이 카카오에서 어떻게 발휘될 수 있을지 작성해주세요.',
      '어려운 문제를 끝까지 해결한 경험에 대해 작성해주세요.',
      '협업한 경험 중 가장 인상 깊었던 경험과 그 과정에서 본인의 역할에 대해 작성해주세요.',
      '카카오가 만들고 있는 서비스 중 가장 관심 있는 서비스와 그 이유를 작성해주세요.',
    ],
  },
  {
    name: 'Coupang',
    notes:
      'Often accepts English. US-style interview culture. Use the STAR format (Situation, Task, Action, Result). Focus on customer obsession + ownership.',
    questions: [
      'Tell us about a time you delivered an ambitious project under a tight timeline. What was your specific role and the measurable outcome?',
      'Why Coupang? What about our mission resonates with you, and how does your background prepare you to contribute?',
      'Describe a situation where you had to learn a new technology quickly to solve a problem. What did you learn and what was the result?',
      'Tell us about a time you disagreed with a teammate or manager. How did you handle it?',
    ],
  },
  {
    name: 'Toss',
    notes:
      'Bar is brutally high. Toss screens HEAVILY on culture fit — they want obsessive, opinionated builders. Generic answers are immediate filters. Be specific, be honest, show conviction.',
    questions: [
      'What are you most obsessive about? Tell us about something you do or build outside of class that nobody asked you to do.',
      "Tell us about a failure that taught you the most. What did you do wrong, what would you do differently, and what did you change about yourself?",
      "What do you think Toss is doing wrong, or could do better? Be specific.",
      'Tell us about a project where you owned the entire problem — not just one part. What did you build and why?',
    ],
  },
  {
    name: 'LINE',
    notes:
      'International workforce, English often accepted. Emphasis on cross-cultural collaboration, global product thinking. Talk about projects with international scope if you have them.',
    questions: [
      'Tell us about a project you are proud of, your specific role in it, and what you learned.',
      'What is your career goal in 5 years and how does this role at LINE fit into it?',
      'Describe an experience working with people from different cultural or language backgrounds. What did you learn?',
      'Why this specific role at LINE — what about our product or stack interests you?',
    ],
  },
  {
    name: 'Krafton',
    notes:
      'Game culture is everything. They want builders who play games and think critically about them. Generic CS answers get filtered. Talk about specific games, mechanics, technical curiosity about how games are built.',
    questions: [
      'Tell us about a game (or games) that shaped how you think about software, design, or systems.',
      'Describe a personal project you have built. What was the hardest technical decision and how did you make it?',
      'What kind of game would you most want to build at Krafton and why?',
      'What is your favorite Krafton title or studio output, and what would you do differently if you were on that team?',
    ],
  },
  {
    name: 'LG CNS',
    notes:
      'Enterprise/consulting style. Emphasizes process, structure, and large-team coordination. Less startup-style, more "I followed a process and delivered a project."',
    questions: [
      '지원 동기를 본인의 강점과 연결지어 작성해주세요.',
      '팀 프로젝트에서의 본인의 역할과 성과를 구체적인 수치와 함께 작성해주세요.',
      '본인이 도전적인 목표를 세우고 달성한 경험을 작성해주세요.',
      '본인이 생각하는 IT 컨설팅의 가치와, 본인이 LG CNS에 기여할 수 있는 부분을 작성해주세요.',
    ],
  },
]

export function findCompany(name: string): CompanyPreset | null {
  return COMPANY_PRESETS.find((c) => c.name === name) ?? null
}

export const COMPANY_NAMES = COMPANY_PRESETS.map((c) => c.name)
