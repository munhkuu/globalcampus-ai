# System Architecture
## GlobalCampus AI

**Version:** 1.0.0  
**Status:** Active — Pre-Development  
**Last Updated:** 2026-05-08  

---

## Table of Contents

1. [Architectural Overview](#1-architectural-overview)
2. [Technology Decisions](#2-technology-decisions)
3. [Application Layer Architecture](#3-application-layer-architecture)
4. [Folder Structure](#4-folder-structure)
5. [AI Integration Architecture](#5-ai-integration-architecture)
6. [Data Flow Diagrams](#6-data-flow-diagrams)
7. [Authentication Architecture](#7-authentication-architecture)
8. [Caching Strategy](#8-caching-strategy)
9. [Error Handling Strategy](#9-error-handling-strategy)
10. [Scalability Design](#10-scalability-design)
11. [Security Architecture](#11-security-architecture)
12. [Deployment Architecture](#12-deployment-architecture)

---

## 1. Architectural Overview

GlobalCampus AI is a server-rendered web application built on Next.js App Router. The architecture follows a clear separation between the client (React components, UI state), the server layer (Next.js server components, API routes), and the data layer (Supabase + external AI APIs).

The design philosophy is **simplicity with intentional escape hatches.** The MVP runs on three services — Vercel, Supabase, and an AI provider — with no additional infrastructure. When the product scales, the architecture supports moving to dedicated services without a rewrite.

```
┌────────────────────────────────────────────────────────────────────┐
│                          CLIENT BROWSER                            │
│  React Client Components (interactions, forms, optimistic UI)      │
└────────────────────────────────┬───────────────────────────────────┘
                                 │ HTTPS
┌────────────────────────────────▼───────────────────────────────────┐
│                        VERCEL EDGE / CDN                           │
│  Next.js App Router (Server Components + API Routes)               │
│  Middleware (auth check, route protection)                         │
└───────┬──────────────────────────────────────┬─────────────────────┘
        │                                      │
┌───────▼──────────┐                 ┌─────────▼──────────────────────┐
│    SUPABASE      │                 │     AI PROVIDER LAYER          │
│  PostgreSQL DB   │                 │  OpenRouter / Groq API         │
│  Auth (JWT)      │                 │  (abstracted behind            │
│  Storage         │                 │   /lib/ai/provider.ts)         │
│  Row Level Sec   │                 └────────────────────────────────┘
└──────────────────┘
```

---

## 2. Technology Decisions

Each technology choice carries a specific rationale. The following explains not just what was chosen, but why.

### 2.1 Next.js App Router (not Pages Router)

**Why:** App Router's React Server Components (RSC) allow data fetching to happen on the server, which means the initial page load delivers rendered HTML rather than a client-shell + loading spinner. For a productivity dashboard, this matters: users see real data on first paint, not skeleton screens.

The server-side data fetching also means API keys (Supabase service key, AI API key) never touch the browser. They exist only in the Node.js server environment.

**Trade-off acknowledged:** App Router is newer and has some rough edges (caching behavior, streaming). The team must stay current on Next.js release notes. For this use case, the benefits outweigh the stability risk.

### 2.2 TypeScript (strict mode)

**Why:** The application manages multiple data entities (users, applications, notes, roadmaps) that flow through multiple layers. Without types, shape mismatches between the database schema, API responses, and UI components become runtime errors discovered in production. Strict TypeScript catches these at compile time.

All database types are generated directly from the Supabase schema using `supabase gen types typescript`, which means the TypeScript types and the actual database schema are never out of sync.

### 2.3 Supabase (not a custom backend)

**Why:** The alternative is a custom Express/Fastify API server with a PostgreSQL instance, managed on Railway or Render. That adds infrastructure management overhead, custom auth implementation, and storage setup — none of which is the product's core value. Supabase provides all four required services (auth, database, storage, realtime) with a Postgres-native interface that doesn't lock into a proprietary query language.

**Row-Level Security (RLS) is the critical Supabase feature:** it means a misbehaving API route cannot accidentally return another user's data. The security boundary is enforced at the database layer, not just the application layer.

**Exit strategy:** If Supabase ever needs to be replaced (vendor risk, pricing, performance), the underlying PostgreSQL schema is portable. Migration to a self-hosted Postgres instance is feasible.

### 2.4 Tailwind CSS + shadcn/ui

**Why:** Tailwind prevents the common failure mode of a growing CSS codebase — specificity conflicts, dead styles, and inconsistent spacing. Every style decision is made at the component level, co-located with the component code.

shadcn/ui is chosen over a component library like MUI or Ant Design because its components are **copied into the project**, not imported as a package. This means full control over component internals. When a component needs to behave differently, the code is edited directly — no fighting a library's prop API.

**Design token discipline:** All color, spacing, and typography values in Tailwind config reference CSS custom properties (design tokens). This makes the dark mode implementation mechanical, not a case-by-case override.

### 2.5 OpenRouter as AI Provider Gateway

**Why:** Tying the application directly to a single AI provider (e.g., Anthropic's Claude API, OpenAI's API) creates switching risk. If a provider changes pricing, rate limits, or terms of service, migrating requires touching every AI call in the codebase.

OpenRouter provides a unified API endpoint that routes to multiple underlying providers. The application sends requests to one endpoint with a standard message format and specifies a model. Changing from `anthropic/claude-3-haiku` to `meta-llama/llama-3` requires changing one environment variable.

Additionally, Groq's inference API (for Llama models) provides very fast response times at low cost for the Lecture Explainer feature, where latency matters most. OpenRouter's routing can be configured to prefer Groq for specific use cases.

### 2.6 Vercel Deployment

**Why:** Vercel is Next.js's native deployment target. Edge functions, ISR, environment variable management, preview deployments, and analytics work without configuration. For a Next.js MVP, Vercel is the correct default — the operational overhead is near zero.

---

## 3. Application Layer Architecture

### 3.1 Next.js App Router Layout

The application uses a route group structure to separate authenticated and unauthenticated areas:

```
app/
├── (auth)/               # Public routes — no auth required
│   ├── login/
│   └── register/
├── (dashboard)/          # Protected routes — auth middleware runs
│   ├── layout.tsx        # Dashboard shell (sidebar, header)
│   ├── page.tsx          # Dashboard home
│   ├── internships/
│   ├── explainer/
│   ├── roadmap/
│   └── vault/
└── api/                  # API routes (server-only)
    ├── ai/
    │   ├── explain/
    │   └── roadmap/
    └── internships/
```

### 3.2 Server vs. Client Component Strategy

**Default to Server Components.** Client Components are used only when a component requires:
- Browser APIs (`useState`, `useEffect`, `useRef`)
- Event listeners (onClick, onChange)
- Third-party libraries that are not SSR-compatible

**Pattern:** Server Components fetch data and render the static structure. Client Components handle interactivity within that structure. A `"use client"` directive at the boundary keeps the interactivity island small.

Example split for Internship Tracker:
```
InternshipsPage (Server) → fetches all applications from DB
  └── ApplicationList (Server) → renders list structure
        └── StatusDropdown (Client) → handles optimistic status update
        └── DeleteButton (Client) → handles delete confirmation modal
```

### 3.3 Data Fetching Patterns

**Server Components:** Use the Supabase server client (`createServerClient`) directly inside the component. Data is fetched at request time. No `useEffect` data fetching.

**Client Components that need data:** Use SWR for client-side fetching after initial render. SWR provides caching, revalidation, and optimistic mutation out of the box.

**Mutations:** All state mutations go through Next.js Server Actions. This keeps mutation logic server-side (where the service role key is), eliminates the need for explicit API routes for simple CRUD, and allows progressive enhancement.

**Optimistic UI:** For status updates (internship status change, note save), the UI updates immediately via SWR's `mutate` with optimistic data, then confirms once the server responds.

---

## 4. Folder Structure

```
globalcampus-ai/
│
├── app/                              # Next.js App Router
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx               # Dashboard shell with sidebar
│   │   ├── page.tsx                 # Dashboard overview
│   │   ├── internships/
│   │   │   ├── page.tsx             # Application list
│   │   │   └── [id]/
│   │   │       └── page.tsx         # Single application detail
│   │   ├── explainer/
│   │   │   └── page.tsx             # AI Lecture Explainer
│   │   ├── roadmap/
│   │   │   ├── page.tsx             # Roadmap generator + history
│   │   │   └── [id]/
│   │   │       └── page.tsx         # Saved roadmap view
│   │   └── vault/
│   │       ├── page.tsx             # Note list + search
│   │       └── [id]/
│   │           └── page.tsx         # Single note view/edit
│   ├── api/
│   │   ├── ai/
│   │   │   ├── explain/
│   │   │   │   └── route.ts         # POST /api/ai/explain
│   │   │   └── roadmap/
│   │   │       └── route.ts         # POST /api/ai/roadmap
│   │   └── health/
│   │       └── route.ts             # GET /api/health
│   ├── globals.css
│   └── layout.tsx                   # Root layout (fonts, theme provider)
│
├── components/
│   ├── ui/                          # shadcn/ui base components (auto-generated)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── textarea.tsx
│   │   └── badge.tsx
│   ├── layout/                      # App shell components
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── MobileNav.tsx
│   ├── dashboard/                   # Dashboard-specific components
│   │   ├── DeadlineCard.tsx
│   │   ├── PipelineStats.tsx
│   │   ├── GoalProgress.tsx
│   │   └── QuickNote.tsx
│   ├── internships/                 # Internship feature components
│   │   ├── ApplicationTable.tsx
│   │   ├── ApplicationForm.tsx
│   │   ├── StatusBadge.tsx
│   │   └── StatusFilter.tsx
│   ├── explainer/                   # Lecture Explainer components
│   │   ├── ExplainerInput.tsx
│   │   ├── ExplanationOutput.tsx
│   │   └── SaveToVaultButton.tsx
│   ├── roadmap/                     # Roadmap components
│   │   ├── RoadmapForm.tsx
│   │   ├── RoadmapView.tsx
│   │   └── PhaseCard.tsx
│   └── vault/                       # Study Vault components
│       ├── NoteCard.tsx
│       ├── NoteEditor.tsx
│       ├── VaultSearch.tsx
│       └── TagFilter.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                # Browser Supabase client
│   │   ├── server.ts                # Server-side Supabase client
│   │   └── middleware.ts            # Auth middleware helper
│   ├── ai/
│   │   ├── provider.ts              # AI provider abstraction layer
│   │   ├── prompts/
│   │   │   ├── explainer.ts         # Lecture Explainer system prompt
│   │   │   └── roadmap.ts           # Roadmap Generator system prompt
│   │   └── validators.ts            # Input validation before AI submission
│   ├── hooks/
│   │   ├── useInternships.ts        # SWR hook for internship data
│   │   ├── useVault.ts              # SWR hook for vault notes
│   │   └── useRoadmap.ts            # SWR hook for roadmap data
│   ├── utils/
│   │   ├── dates.ts                 # Date formatting utilities
│   │   ├── cn.ts                    # clsx + tailwind-merge helper
│   │   └── validators.ts            # Zod schemas for form validation
│   └── types/
│       ├── database.types.ts        # Generated Supabase types
│       └── app.types.ts             # Application-level types
│
├── middleware.ts                    # Next.js middleware (auth protection)
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── .env.local.example
└── package.json
```

---

## 5. AI Integration Architecture

### 5.1 Provider Abstraction Layer

The AI integration lives entirely in `/lib/ai/provider.ts`. No component or API route imports from an AI provider's SDK directly. This is the anti-coupling guarantee.

```typescript
// lib/ai/provider.ts

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIRequestOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface AIResponse {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
  };
}

export async function callAI(
  messages: AIMessage[],
  options?: AIRequestOptions
): Promise<AIResponse> {
  // Implementation targets OpenRouter-compatible endpoint
  // Model defaults to env var OPENROUTER_DEFAULT_MODEL
  // Switching providers = changing this function's internals only
}
```

**What this means in practice:** If OpenRouter changes its pricing model and Groq becomes preferable, the migration is:
1. Update `OPENROUTER_BASE_URL` env var
2. Update `OPENROUTER_DEFAULT_MODEL` env var
3. Possibly adjust headers in `provider.ts`
4. Zero changes to any component or API route

### 5.2 Prompt System

Prompts are stored as TypeScript functions in `/lib/ai/prompts/`. They are functions, not string literals, because they take runtime parameters:

```typescript
// lib/ai/prompts/explainer.ts

export function buildExplainerPrompt(params: {
  depth: 'beginner' | 'intermediate' | 'advanced';
  codeLanguage: string;
  bilingual: boolean;
}): string {
  return `You are a CS teaching assistant helping an international computer science student studying in South Korea. Your role is strictly educational — you explain CS concepts clearly and do not respond to non-CS questions.

Explanation depth: ${params.depth}
Preferred code examples: ${params.codeLanguage}
${params.bilingual ? 'Provide the Korean CS term alongside the English equivalent when applicable.' : ''}

When responding:
1. Identify the core CS concept being asked about
2. Provide a clear explanation at the requested depth
3. Include a concise code example if the concept is implementable
4. If Korean technical terminology is present, translate and contextualize it

Do not:
- Act as a general-purpose assistant
- Answer questions unrelated to computer science
- Provide overly academic or textbook-style responses`
}
```

### 5.3 AI Input Validation

Before any AI API call, inputs are validated in `/lib/ai/validators.ts`. This serves two purposes:
1. Prevents abuse (empty inputs, excessively long inputs that inflate token costs)
2. Provides a scoping gate for the Lecture Explainer (rejects clearly non-CS input before paying for an API call)

```typescript
// lib/ai/validators.ts

export function validateExplainerInput(input: string): {
  valid: boolean;
  reason?: string;
} {
  if (input.trim().length < 10) {
    return { valid: false, reason: 'Input too short' };
  }
  if (input.length > 2000) {
    return { valid: false, reason: 'Input exceeds 2000 character limit' };
  }
  // Additional heuristic CS relevance check can be added here
  return { valid: true };
}
```

### 5.4 AI Interaction History

Every AI API call is logged to the `ai_interactions` table (user_id, feature, input_hash, model_used, tokens_used, created_at). The input itself is not stored — only a hash, for de-duplication without PII risk. This enables:
- Per-user usage rate limiting
- Cost tracking by feature
- Model performance analysis across features

---

## 6. Data Flow Diagrams

### 6.1 Internship Status Update (Optimistic UI)

```
User clicks status dropdown
        ↓
StatusDropdown (Client Component)
        ↓
SWR mutate (optimistic update — UI changes immediately)
        ↓
Server Action: updateInternshipStatus(id, status)
        ↓
Supabase UPDATE with RLS check
        ↓
Return: updated record
        ↓
SWR revalidates with confirmed data
        ↓ (on error)
SWR rolls back optimistic update + shows error toast
```

### 6.2 AI Lecture Explanation

```
User pastes text + selects options
        ↓
ExplainerInput (Client Component)
        ↓
Client-side validation (length, not empty)
        ↓
POST /api/ai/explain (fetch from client)
        ↓
API Route (server):
  1. Verify auth (Supabase session)
  2. Server-side input validation
  3. Build prompt with buildExplainerPrompt()
  4. callAI() → OpenRouter endpoint
  5. Log to ai_interactions table
  6. Return explanation JSON
        ↓
ExplanationOutput (Client Component) renders result
        ↓
User clicks "Save to Vault" (optional)
        ↓
Server Action: createVaultNote(content, source='AI-Generated')
```

---

## 7. Authentication Architecture

### 7.1 Auth Flow

Supabase Auth manages the full authentication lifecycle. The application uses server-side session validation via the `@supabase/ssr` package.

**Login flow:**
1. User submits credentials on `/login`
2. Server Action calls `supabase.auth.signInWithPassword()`
3. Supabase validates credentials, returns session (access token + refresh token)
4. Tokens stored in HttpOnly cookies via the SSR package
5. Middleware reads cookies on every subsequent request to validate session
6. On session expiry, middleware triggers automatic token refresh

**Route protection:**
```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const { supabase, response } = createMiddlewareClient(request);
  const { data: { session } } = await supabase.auth.getSession();

  if (!session && request.nextUrl.pathname.startsWith('/(dashboard)')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return response;
}
```

### 7.2 Auth in Server Components

Server Components access the current user via:
```typescript
const supabase = createServerClient();
const { data: { user } } = await supabase.auth.getUser();
```

The user's ID is used in all database queries as the RLS filter. The application never constructs WHERE clauses with `user_id` manually — RLS policies handle this at the database layer automatically.

---

## 8. Caching Strategy

### 8.1 What Gets Cached

| Data | Cache Location | Strategy | Invalidation |
|---|---|---|---|
| Dashboard stats | SWR (client) | 60s revalidation | On mutation |
| Application list | SWR (client) | 30s revalidation | On CRUD |
| Vault notes | SWR (client) | 60s revalidation | On CRUD |
| AI explanations | None | Not cached | Per-request |
| Static assets | Vercel CDN | Immutable | Build hash |
| Route segments | Next.js cache | Per-request | `revalidatePath` |

### 8.2 What Is NOT Cached

AI responses are never cached. Each explanation request represents a unique input context. Caching AI responses would require storing user inputs as cache keys, which is a PII risk, and would produce stale results if the underlying model improves.

---

## 9. Error Handling Strategy

### 9.1 Error Categories

**Client-side validation errors:** Caught by Zod schemas before any network request. Displayed inline in forms.

**Server Action errors:** Return a typed `{ error: string }` response (never throw to the client). The calling component displays this in a toast or inline message.

**AI API errors:** Failures in the AI provider are caught in the API route and return a structured error response. The UI shows a retry option, not a blank screen.

**Database errors:** Supabase errors are logged server-side. User sees a generic "Something went wrong" message. Sensitive error details never reach the client.

**Network errors:** SWR handles these automatically — retries with exponential backoff, shows stale data during retry.

### 9.2 Error Boundary

A root error boundary in `app/layout.tsx` catches uncaught React errors. It renders a minimal fallback UI with a "Reload" action rather than a white screen.

---

## 10. Scalability Design

### 10.1 Current Architecture Limits

The MVP architecture handles approximately:
- **Concurrent users:** ~500 (Vercel Hobby/Pro limits)
- **Database connections:** Supabase connection pooler handles up to 200 concurrent
- **AI requests:** Limited by OpenRouter rate limits (configurable per-account)

### 10.2 Scaling Paths

When user count grows beyond MVP limits:

**Database:** Enable Supabase pgBouncer connection pooling (already supported). If query volume demands it, add read replicas for vault search queries.

**AI rate limiting:** Implement a per-user request queue in Redis (Upstash) with rate limit of N AI requests per hour. This prevents cost overruns during viral growth.

**Background jobs:** Move AI roadmap generation to a background job (Vercel Queue or Inngest) once synchronous 15-second responses create UX problems at scale.

**Caching:** Add Redis caching layer for frequently-accessed public data (if community features are added).

---

## 11. Security Architecture

### 11.1 Defense in Depth

The application has three security layers:

**Layer 1 — Next.js Middleware:** Validates session token on every request. Unauthenticated requests to protected routes are redirected.

**Layer 2 — API Route Auth:** Every API route independently validates the session before processing. Middleware is not the only gate.

**Layer 3 — Supabase RLS:** Every database query is filtered by the authenticated user's ID at the database layer. Even a compromised API route cannot access another user's records.

### 11.2 API Key Security

- `SUPABASE_SERVICE_ROLE_KEY` and `OPENROUTER_API_KEY` exist only in server environment
- Next.js environment variables prefixed with `NEXT_PUBLIC_` are client-safe; all others are server-only
- The anon Supabase key (used client-side) is safe to expose — RLS policies enforce access control

### 11.3 Input Security

- All user inputs validated with Zod before processing
- AI inputs have length limits and content validation before reaching the API call
- Markdown rendering uses a sanitized library to prevent XSS
- No `dangerouslySetInnerHTML` without explicit sanitization

---

## 12. Deployment Architecture

### 12.1 Environments

| Environment | Purpose | Data |
|---|---|---|
| Production | Live user traffic | Production Supabase project |
| Preview | PR review deployments | Staging Supabase project |
| Local | Development | Local `.env.local` |

### 12.2 Deployment Pipeline

```
Developer pushes to feature branch
        ↓
Vercel creates preview deployment (automatic)
        ↓
Preview URL shared in PR for review
        ↓
PR merged to main
        ↓
Vercel deploys to production (automatic)
        ↓
Supabase migrations run via CI step (GitHub Actions)
```

### 12.3 Supabase Migrations

Database schema changes are managed as migration files in `/supabase/migrations/`. The Supabase CLI is used to generate and apply migrations. No manual schema edits in the Supabase UI — all changes go through migration files committed to the repository.

This ensures:
- Schema changes are code-reviewed
- Preview environments have the same schema as production
- Rollbacks are possible by reverting migration files
