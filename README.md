# GlobalCampus AI

A workspace for international CS students at Korean universities applying to Samsung, Naver, Kakao, Coupang, Toss, LINE, Krafton, and LG CNS. Drafts your 자기소개서 with company-specific critique, decodes Korean lectures into English, and tracks every application through the Korean hiring pipeline (서류 → 코딩 테스트 → 1차/2차 면접 → 합격).

---

## Features

| Feature | Description |
|---|---|
| **자소서 Workshop** | Real 자기소개서 questions per company. Inline critique on Korean writing style, structural issues, and common foreigner pitfalls. Versioned drafts with snapshot/restore. |
| **Internship Tracker** | Application pipeline (Applied → OA → Interview → Offer). Quick-add for major Korean tech employers. Deadline tracking. |
| **Lecture Explainer** | Paste Korean CS lecture material, get a structured English explanation with Korean ↔ English term mapping. |
| **Career Roadmap** | Generates a phase-by-phase prep plan for a target role + company. |
| **Study Vault** | Save explanations and notes, tagged + searchable. |
| **Authentication** | Email/password + Google OAuth, RLS-protected routes. |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Server Components, Server Actions) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS + shadcn/ui |
| Database | Supabase (PostgreSQL + Row Level Security + Auth) |
| Payments | Stripe Checkout + Customer Portal |
| Deployment | Vercel |

---

## Local Setup

```bash
git clone https://github.com/munhkuu/globalcampus-ai.git
cd globalcampus-ai
npm install
cp .env.local.example .env.local
# Fill in .env.local with your own keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
globalcampus-ai/
├── app/
│   ├── (auth)/             # /login, /register
│   ├── (dashboard)/        # /dashboard, /coverletter, /internships, /explainer, /roadmap, /vault, /settings
│   ├── admin/feedback/     # Founder feedback dashboard
│   ├── api/                # AI routes, Stripe routes
│   ├── auth/callback/      # OAuth redirect handler
│   ├── onboarding/         # First-run onboarding
│   ├── pricing/            # Public pricing page
│   └── page.tsx            # Landing page
├── components/
│   ├── ui/                 # shadcn/ui primitives
│   ├── layout/             # Sidebar, Header, MobileNav
│   ├── coverletter/        # Editor, critique panel, version history
│   ├── internships/        # ApplicationTable, ApplicationForm
│   ├── explainer/          # Lecture explainer UI
│   ├── roadmap/            # Roadmap generator
│   ├── vault/              # Study notes
│   ├── feedback/           # Floating feedback widget
│   └── billing/            # Upgrade + manage subscription buttons
├── lib/
│   ├── ai/                 # Model wrappers + prompt builders
│   ├── actions/            # Server Actions
│   ├── billing/            # Quota + tier checks
│   ├── stripe/             # Stripe client + config
│   ├── supabase/           # SSR server + browser clients
│   ├── coverletter/        # Curated company question database
│   ├── utils/              # cn, dates, validators, api helpers
│   └── types/              # Database + app types
├── supabase/migrations/    # 0001..0007 schema migrations
└── proxy.ts                # Session refresh + route protection
```

---

## Database

Supabase project on ap-northeast-1. All tables RLS-protected.

| Table | Purpose |
|---|---|
| `profiles` | User profile, subscription tier, signup source |
| `internship_applications` | Tracked applications |
| `cover_letters` | 자소서 drafts with versioning |
| `vault_notes` | Tagged study notes |
| `roadmap_sessions` | Saved roadmap output |
| `ai_interactions` | Per-feature usage log (powers quota) |
| `feedback` | In-app feedback submissions |

Regenerate TypeScript types from live schema:
```bash
npx supabase gen types typescript --project-id <project-id> > lib/types/database.types.ts
```

---

## Architectural Notes

- **Server Actions for mutations.** CRUD goes through Next.js Server Actions, not API routes. Secrets stay server-side; `revalidatePath` handles cache invalidation.
- **RLS as the security boundary.** Every table has `auth.uid() = user_id` policies. A compromised route cannot leak other users' data.
- **Quota gating at the API layer.** Free tier capped at 5 AI calls/day across all features. Pro tier (Stripe subscription) unlimited, subject to per-feature hourly caps.
- **Prompts as typed functions.** `lib/ai/prompts/*.ts` accept runtime parameters and return system prompt strings.

---

## License

Private repository. All rights reserved.
