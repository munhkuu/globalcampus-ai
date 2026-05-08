# GlobalCampus AI

An AI-powered productivity and career platform for international computer science students studying in South Korea.

---

## What This Is

GlobalCampus AI solves a specific problem: international CS students in Korea are simultaneously managing academics in a foreign language, competing for internships in an unfamiliar recruiting ecosystem, and building technical skills for a global career — with no single tool designed for this situation.

This platform centralizes four workflows:

**Internship Tracker** — Log applications, track status through the Korean tech recruiting pipeline (Applied → OA → Interview), store recruiter notes, and never miss a deadline.

**AI Lecture Explainer** — Paste lecture text or Korean CS terminology and receive a pedagogically calibrated explanation with code examples. This is a CS teaching assistant, not a general chatbot.

**CS Career Roadmap Generator** — Input your target role, current skills, and available study hours. Receive a structured, phased learning roadmap calibrated to Korean vs. global company recruiting expectations. Track completion on the dashboard.

**Study Vault** — A searchable, tagged knowledge base for algorithms, CS concepts, Korean CS terminology, interview prep, and lecture notes. AI-generated explanations save directly here.

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Framework | Next.js 15 (App Router) | Server Components = auth-gated data never touches the client; better initial load |
| Language | TypeScript (strict) | Types generated from Supabase schema — DB and app are never out of sync |
| Styling | Tailwind CSS + shadcn/ui | Design token-based system; shadcn components are owned, not imported |
| Database | Supabase (PostgreSQL 15) | Auth + DB + Storage + RLS in one service; SQL-native, not locked in |
| AI | OpenRouter API | Provider abstraction; switch models without touching feature code |
| Deployment | Vercel | Native Next.js deployment; zero-config preview deployments on PRs |

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+ (or pnpm)
- Supabase account
- OpenRouter account (or compatible AI provider)
- Vercel account (for deployment)

### Local Development

**1. Clone and install:**
```bash
git clone https://github.com/your-org/globalcampus-ai.git
cd globalcampus-ai
npm install
```

**2. Set up environment variables:**
```bash
cp .env.local.example .env.local
```
Fill in the values — see `ENVIRONMENT_SETUP.md` for complete instructions.

**3. Set up the database:**
```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your Supabase project
supabase link --project-ref YOUR_PROJECT_REF

# Apply migrations
supabase db push

# Generate TypeScript types from schema
supabase gen types typescript --linked > lib/types/database.types.ts
```

**4. Run the development server:**
```bash
npm run dev
```

Open `http://localhost:3000`.

---

## Project Structure

```
globalcampus-ai/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Public routes (login, register)
│   ├── (dashboard)/        # Protected routes
│   │   ├── page.tsx        # Dashboard overview
│   │   ├── internships/    # Internship tracker
│   │   ├── explainer/      # AI Lecture Explainer
│   │   ├── roadmap/        # Career Roadmap
│   │   └── vault/          # Study Vault
│   └── api/                # API routes (AI endpoints)
├── components/
│   ├── ui/                 # shadcn/ui base components
│   ├── layout/             # Sidebar, Header
│   ├── dashboard/          # Dashboard widgets
│   ├── internships/        # Internship feature components
│   ├── explainer/          # Lecture Explainer components
│   ├── roadmap/            # Roadmap components
│   └── vault/              # Vault components
├── lib/
│   ├── supabase/           # Supabase client (server + browser)
│   ├── ai/                 # AI provider abstraction + prompts
│   ├── actions/            # Next.js Server Actions (CRUD)
│   ├── hooks/              # SWR data fetching hooks
│   ├── utils/              # Date formatting, cn helper, validators
│   └── types/              # Database types + app types
├── supabase/
│   └── migrations/         # SQL migration files
└── middleware.ts            # Auth route protection
```

Full architecture documentation: `SYSTEM_ARCHITECTURE.md`

---

## Documentation

| Document | Contents |
|---|---|
| `PRODUCT_REQUIREMENTS_DOCUMENT.md` | Problem statement, user research, feature specs, success metrics |
| `SYSTEM_ARCHITECTURE.md` | Technical architecture, component design, AI abstraction, security |
| `DATABASE_SCHEMA.md` | Complete PostgreSQL schema, RLS policies, full SQL migration |
| `API_SPECIFICATION.md` | All API routes, request/response shapes, Server Actions |
| `UI_UX_GUIDELINES.md` | Design system, color tokens, typography, component patterns |
| `DEVELOPMENT_ROADMAP.md` | Phase-by-phase build plan, task breakdown, success criteria |
| `ENVIRONMENT_SETUP.md` | Environment variables, Supabase setup, deployment guide |

---

## Key Engineering Decisions

**Server Actions over API routes for CRUD:** Mutations go through Next.js Server Actions. This keeps business logic server-side, enables cache invalidation via `revalidatePath`, and eliminates the need for a dedicated mutation API layer for simple operations.

**AI provider abstraction:** All AI calls go through `lib/ai/provider.ts`. No component or route imports directly from an AI provider SDK. Switching providers is a 3-line change.

**RLS as the security boundary:** Row-Level Security policies on every user-content table mean a misbehaving API route cannot leak another user's data. The database enforces user isolation, not just application code.

**Prompts as functions:** System prompts are TypeScript functions in `lib/ai/prompts/` that accept runtime parameters. They are version-controlled, testable, and produce consistent output.

**No soft deletes:** Hard deletes with `ON DELETE CASCADE` at the database layer. No `is_deleted` columns creating query complexity at MVP scale.

---

## Development Status

| Feature | Status |
|---|---|
| Authentication | Planned |
| Dashboard | Planned |
| Internship Tracker | Planned |
| AI Lecture Explainer | Planned |
| Career Roadmap | Planned |
| Study Vault | Planned |
| Study Goals | Planned |

See `DEVELOPMENT_ROADMAP.md` for the full 12-week build plan.

---

## Environment Variables

See `ENVIRONMENT_SETUP.md` for complete documentation. Required variables:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
OPENROUTER_API_KEY
OPENROUTER_DEFAULT_MODEL
OPENROUTER_FAST_MODEL
```

---

## Deployment

The application is Vercel-ready. Connect the repository to a Vercel project, configure environment variables, and every push to `main` deploys automatically.

See `ENVIRONMENT_SETUP.md` → Deployment section for the complete deployment checklist.

---

## License

Private repository. All rights reserved.
