# GlobalCampus AI

AI-powered productivity platform for international CS students studying in South Korea — track internships, generate career roadmaps, and master your lectures.

---

## Features

| Feature | Description |
|---|---|
| **Internship Tracker** | CRUD application tracking — status pipeline (Applied → OA → Interview → Accepted), recruiter notes, deadlines, priority flags |
| **Lecture Explainer** | Paste any CS lecture text and get a structured explanation with code examples and Korean ↔ English term mapping |
| **Career Roadmap** | AI generates a personalised, phase-by-phase learning plan for your target role |
| **Study Vault** | Save, search, and tag notes. AI explanations save directly here with one click |
| **Authentication** | Email/password + Google OAuth, protected routes, session persistence |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, Server Components, Server Actions) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS + shadcn/ui |
| Database | Supabase (PostgreSQL + Row Level Security + Auth) |
| AI | OpenRouter API (provider-agnostic — swap models via env var) |
| Deployment | Vercel |

---

## Local Setup

**1. Clone and install**
```bash
git clone https://github.com/munhkuu/globalcampus-ai.git
cd globalcampus-ai
npm install
```

**2. Configure environment variables**
```bash
cp .env.local.example .env.local
```

Fill in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://vfiiztyzynmsaftctlnf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional — required for AI features
OPENROUTER_API_KEY=sk-or-...
```

**3. Run**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
globalcampus-ai/
├── app/
│   ├── (auth)/             # /login, /register
│   ├── (dashboard)/        # /, /internships, /explainer, /roadmap, /vault, /settings
│   ├── api/                # /api/ai/explain, /api/ai/roadmap, /api/internships/stats
│   ├── auth/callback/      # OAuth redirect handler
│   └── onboarding/         # First-run onboarding flow
├── components/
│   ├── ui/                 # shadcn/ui primitives (owned, not imported)
│   ├── layout/             # Sidebar, Header, MobileNav
│   ├── internships/        # ApplicationTable, ApplicationForm, StatusBadge
│   ├── explainer/          # ExplainerClient, ExplanationOutput
│   ├── roadmap/            # RoadmapClient, RoadmapView, PhaseCard
│   └── vault/              # VaultClient, NoteCard, NoteForm
├── lib/
│   ├── ai/                 # callAI(), prompts, input validators
│   ├── actions/            # Server Actions (auth, internships, vault, roadmap)
│   ├── supabase/           # SSR server + browser clients
│   ├── utils/              # cn, dates, validators, api helpers
│   └── types/              # Database types + app types
├── supabase/migrations/    # 0001_initial_schema.sql
└── middleware.ts            # Session refresh + route protection
```

---

## Database

Supabase project: `vfiiztyzynmsaftctlnf` (ap-northeast-1)

Tables (all with RLS):
- `profiles` — user data + onboarding fields; auto-created on signup via trigger
- `internship_applications` — full application tracking
- `vault_notes` — study notes with tags + pin
- `study_goals` — learning goal tracking
- `roadmap_sessions` — saved AI-generated roadmaps
- `ai_interactions` — token usage log per feature

To regenerate TypeScript types from the live schema:
```bash
npx supabase gen types typescript --project-id vfiiztyzynmsaftctlnf > lib/types/database.types.ts
```

---

## Key Architectural Decisions

**AI provider abstraction** — `lib/ai/provider.ts` is the only file that talks to OpenRouter. Switching AI providers requires changing one file and one env var.

**Server Actions for mutations** — CRUD goes through Next.js Server Actions, not custom API routes. This keeps secrets server-side and enables `revalidatePath` cache invalidation.

**RLS as the security boundary** — Every table has `WHERE auth.uid() = user_id` policies enforced at the database layer. A compromised API route cannot leak another user's data.

**Prompts as typed functions** — `lib/ai/prompts/*.ts` are TypeScript functions that accept runtime parameters and return system prompt strings. Version-controlled, readable, testable.

---

## Development Status

| Feature | Status |
|---|---|
| Authentication (email + Google OAuth) | ✅ Complete |
| User onboarding flow | ✅ Complete |
| Dashboard | ✅ Complete |
| Internship Tracker (full CRUD) | ✅ Complete |
| AI Lecture Explainer | ✅ Complete |
| AI Career Roadmap Generator | ✅ Complete |
| Study Vault (full CRUD) | ✅ Complete |
| Mobile navigation | ✅ Complete |
| Study Goals UI | 🔲 DB schema ready, UI planned |

---

## License

Private repository. All rights reserved.
