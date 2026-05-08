# Folder Structure
## GlobalCampus AI — File-by-File Directory Architecture

**Version:** 1.0.0  
**Status:** Active — Pre-Development  
**Last Updated:** 2026-05-08  

---

## Table of Contents

1. [Structure Philosophy](#1-structure-philosophy)
2. [Incremental Creation Order](#2-incremental-creation-order)
3. [Complete Final Structure](#3-complete-final-structure)
4. [File-by-File Annotations](#4-file-by-file-annotations)
5. [What NOT to Create Prematurely](#5-what-not-to-create-prematurely)
6. [Naming Conventions](#6-naming-conventions)
7. [Import Path Reference](#7-import-path-reference)

---

## 1. Structure Philosophy

**Create files when you write them, not when you plan them.**

An empty `components/roadmap/RoadmapForm.tsx` created in Week 1 is not progress — it is noise. Every file in the repository should contain working code. Stub files, placeholder components, and commented-out code all create cognitive overhead without value.

**Feature-based organization, not type-based.**

Type-based organization groups by what a file is:
```
components/forms/        ← All forms together
components/tables/       ← All tables together  
```

Feature-based organization groups by what a file does:
```
components/internships/  ← Everything for the internship feature
components/vault/        ← Everything for the vault feature
```

Feature-based is used here because it minimizes the blast radius of a feature change. When the internship feature changes, only `components/internships/` is touched — not scattered across type-based folders.

**The `lib/` directory is for pure logic, not UI.**

Files in `lib/` have no React, no JSX, no Tailwind. They contain: TypeScript types, utility functions, Supabase clients, Server Actions, and SWR hooks. They can be tested independently.

---

## 2. Incremental Creation Order

Create files in this order. Each phase block is sequential — complete Phase 0 before creating any Phase 1 files.

### Phase 0 Files (Weeks 1–2)

```
Week 1 — Day 1:
├── package.json                         (created by create-next-app)
├── tsconfig.json                        (created by create-next-app, edit for strict mode)
├── next.config.ts                       (created by create-next-app)
├── tailwind.config.ts                   (created by create-next-app, extend with tokens)
├── .env.local                           (create from template, never commit)
├── .env.local.example                   (commit this — safe template with no values)
├── .gitignore                           (add .env.local)
└── app/
    ├── globals.css                      (replace with design system CSS variables)
    └── layout.tsx                       (root layout — fonts, html lang, theme class)

Week 1 — Day 2-3:
└── lib/
    ├── supabase/
    │   ├── client.ts                    (browser Supabase client)
    │   └── server.ts                    (server Supabase client using cookies)
    └── types/
        └── database.types.ts            (generated — DO NOT hand-write)

Week 1 — Day 4-5:
└── supabase/
    └── migrations/
        └── 0001_initial_schema.sql      (full schema from DATABASE_SCHEMA.md)

Week 2 — Day 6-7 (Auth):
├── middleware.ts                        (root level — route protection)
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx                (login form page)
│   │   └── register/
│   │       └── page.tsx                (register form page)
│   └── auth/
│       └── callback/
│           └── route.ts                (OAuth callback handler)
└── lib/
    ├── actions/
    │   └── auth.ts                     (login, register, logout Server Actions)
    └── utils/
        ├── cn.ts                       (clsx + tailwind-merge helper)
        └── validators.ts               (Zod schemas — auth forms first)

Week 2 — Day 8-9 (Shell):
├── app/
│   └── (dashboard)/
│       ├── layout.tsx                  (dashboard shell — sidebar + header + main)
│       └── page.tsx                   (dashboard homepage — placeholder)
└── components/
    └── layout/
        ├── Sidebar.tsx                 (navigation sidebar)
        └── Header.tsx                  (page header with user menu)

Week 2 — Day 10 (Profile):
├── app/
│   └── (dashboard)/
│       └── settings/
│           └── page.tsx               (profile/settings page)
└── lib/
    └── actions/
        └── profile.ts                  (updateProfile, completeOnboarding)
```

### Phase 1 Files (Weeks 3–6)

```
Week 3 — Dashboard data + internship actions:
├── app/
│   └── api/
│       ├── internships/
│       │   ├── route.ts               (GET /api/internships list)
│       │   ├── [id]/
│       │   │   └── route.ts           (GET /api/internships/:id)
│       │   └── stats/
│       │       └── route.ts           (GET /api/internships/stats)
│       └── health/
│           └── route.ts               (GET /api/health — simple ping)
└── lib/
    ├── actions/
    │   └── internships.ts             (createApplication, updateApplicationStatus, 
    │                                   updateApplication, deleteApplication)
    └── utils/
        └── dates.ts                   (date formatting utilities)

Week 3 — Dashboard widgets:
└── components/
    └── dashboard/
        ├── PipelineStats.tsx          (status counts bar chart)
        ├── DeadlineCard.tsx           (upcoming deadlines list)
        └── QuickNote.tsx              (quick note widget)

Week 4 — Internship UI:
├── app/
│   └── (dashboard)/
│       ├── page.tsx                   (update: wire dashboard widgets to real data)
│       └── internships/
│           ├── page.tsx               (application list page)
│           └── [id]/
│               └── page.tsx           (application detail page)
└── components/
    └── internships/
        ├── ApplicationTable.tsx       (table with pagination + sort)
        ├── ApplicationForm.tsx        (create/edit form — used in Sheet)
        ├── StatusBadge.tsx            (5-variant status badge)
        └── StatusFilter.tsx           (tab bar for status filtering)

Week 5 — Vault:
├── app/
│   └── (dashboard)/
│       └── vault/
│           ├── page.tsx               (two-panel vault layout)
│           └── [id]/
│               └── page.tsx           (single note deep link — optional)
├── lib/
│   ├── actions/
│   │   └── vault.ts                   (createVaultNote, updateVaultNote, deleteVaultNote)
│   └── hooks/
│       └── useVault.ts                (SWR hook for vault data)
└── components/
    └── vault/
        ├── NoteCard.tsx               (note list item)
        ├── NoteEditor.tsx             (markdown editor + preview toggle)
        ├── VaultSearch.tsx            (search input with clear)
        └── TagFilter.tsx              (tag chips)

Week 6 — Goals + Integration:
├── app/
│   └── api/
│       └── vault/
│           └── route.ts               (GET /api/vault — search, filter, paginate)
└── lib/
    ├── actions/
    │   └── goals.ts                   (createStudyGoal, toggleGoalCompleted, 
    │                                   updateStudyGoal, deleteStudyGoal)
    └── hooks/
        └── useInternships.ts          (SWR hook for internship data)
```

### Phase 2 Files (Weeks 7–9)

```
Week 7 — AI Infrastructure:
├── app/
│   └── api/
│       └── ai/                        (directory created now — routes added next week)
└── lib/
    └── ai/
        ├── provider.ts                (callAI abstraction function)
        ├── validators.ts              (input validation before AI call)
        └── prompts/
            ├── explainer.ts           (buildExplainerPrompt function)
            └── roadmap.ts             (buildRoadmapPrompt function)

Week 8 — Lecture Explainer:
├── app/
│   ├── api/
│   │   └── ai/
│   │       └── explain/
│   │           └── route.ts          (POST /api/ai/explain)
│   └── (dashboard)/
│       └── explainer/
│           └── page.tsx              (explainer page)
└── components/
    └── explainer/
        ├── ExplainerInput.tsx         (textarea + options form)
        ├── ExplanationOutput.tsx      (structured result display)
        └── SaveToVaultButton.tsx      (triggers createVaultNote)

Week 9 — Career Roadmap:
├── app/
│   ├── api/
│   │   └── ai/
│   │       └── roadmap/
│   │           └── route.ts          (POST /api/ai/roadmap)
│   └── (dashboard)/
│       └── roadmap/
│           ├── page.tsx              (form + roadmap display)
│           └── [id]/
│               └── page.tsx          (historical roadmap view — read only)
├── lib/
│   ├── actions/
│   │   └── roadmap.ts                (toggleRoadmapItem, updateSessionName, 
│   │                                  deleteSession)
│   └── hooks/
│       └── useRoadmap.ts             (SWR hook for roadmap data)
└── components/
    └── roadmap/
        ├── RoadmapForm.tsx            (5-field generation form)
        ├── RoadmapView.tsx            (full roadmap display)
        └── PhaseCard.tsx             (single phase with items)
```

### Phase 3 Files (Weeks 10–12)

```
Week 11 — Error handling:
└── app/
    ├── error.tsx                      (root error boundary)
    ├── not-found.tsx                  (404 page)
    └── (dashboard)/
        ├── error.tsx                  (dashboard error boundary)
        └── loading.tsx                (dashboard loading skeleton)

Week 12 — Final additions:
└── app/
    └── api/
        └── webhooks/
            └── auth/
                └── route.ts           (Supabase auth webhook handler)
```

---

## 3. Complete Final Structure

This is the target state at end of Phase 3. Do not create files until you reach their phase.

```
globalcampus-ai/
│
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   │
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── error.tsx
│   │   ├── loading.tsx
│   │   │
│   │   ├── internships/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   │
│   │   ├── explainer/
│   │   │   └── page.tsx
│   │   │
│   │   ├── roadmap/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   │
│   │   ├── vault/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   │
│   │   └── settings/
│   │       └── page.tsx
│   │
│   ├── api/
│   │   ├── health/
│   │   │   └── route.ts
│   │   ├── internships/
│   │   │   ├── route.ts
│   │   │   ├── [id]/
│   │   │   │   └── route.ts
│   │   │   └── stats/
│   │   │       └── route.ts
│   │   ├── vault/
│   │   │   └── route.ts
│   │   ├── roadmap/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   ├── ai/
│   │   │   ├── explain/
│   │   │   │   └── route.ts
│   │   │   └── roadmap/
│   │   │       └── route.ts
│   │   └── webhooks/
│   │       └── auth/
│   │           └── route.ts
│   │
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts
│   │
│   ├── error.tsx
│   ├── not-found.tsx
│   ├── globals.css
│   └── layout.tsx
│
├── components/
│   ├── ui/                            ← shadcn/ui (auto-generated, do not edit)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── form.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── select.tsx
│   │   ├── separator.tsx
│   │   ├── sheet.tsx
│   │   ├── skeleton.tsx
│   │   ├── table.tsx
│   │   ├── textarea.tsx
│   │   ├── toast.tsx
│   │   ├── toaster.tsx
│   │   ├── badge.tsx
│   │   ├── avatar.tsx
│   │   ├── tabs.tsx
│   │   ├── command.tsx
│   │   └── popover.tsx
│   │
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── MobileNav.tsx              ← Phase 3 or post-MVP
│   │
│   ├── dashboard/
│   │   ├── PipelineStats.tsx
│   │   ├── DeadlineCard.tsx
│   │   ├── QuickNote.tsx
│   │   ├── GoalProgress.tsx
│   │   └── RecentVaultEntries.tsx
│   │
│   ├── internships/
│   │   ├── ApplicationTable.tsx
│   │   ├── ApplicationForm.tsx
│   │   ├── StatusBadge.tsx
│   │   └── StatusFilter.tsx
│   │
│   ├── explainer/
│   │   ├── ExplainerInput.tsx
│   │   ├── ExplanationOutput.tsx
│   │   └── SaveToVaultButton.tsx
│   │
│   ├── roadmap/
│   │   ├── RoadmapForm.tsx
│   │   ├── RoadmapView.tsx
│   │   └── PhaseCard.tsx
│   │
│   └── vault/
│       ├── NoteCard.tsx
│       ├── NoteEditor.tsx
│       ├── VaultSearch.tsx
│       └── TagFilter.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   │
│   ├── ai/
│   │   ├── provider.ts
│   │   ├── validators.ts
│   │   └── prompts/
│   │       ├── explainer.ts
│   │       └── roadmap.ts
│   │
│   ├── actions/
│   │   ├── auth.ts
│   │   ├── profile.ts
│   │   ├── internships.ts
│   │   ├── vault.ts
│   │   ├── goals.ts
│   │   └── roadmap.ts
│   │
│   ├── hooks/
│   │   ├── useInternships.ts
│   │   ├── useVault.ts
│   │   └── useRoadmap.ts
│   │
│   ├── utils/
│   │   ├── cn.ts
│   │   ├── dates.ts
│   │   └── validators.ts
│   │
│   └── types/
│       ├── database.types.ts          ← generated, never hand-written
│       └── app.types.ts               ← hand-written application types
│
├── supabase/
│   └── migrations/
│       └── 0001_initial_schema.sql
│
├── middleware.ts
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── .env.local                         ← never commit
├── .env.local.example                 ← commit this
├── .gitignore
└── package.json
```

**Total file count at MVP completion: ~65 files.**  
This is intentionally lean. A 65-file codebase is readable, debuggable, and maintainable by one person.

---

## 4. File-by-File Annotations

### Root Level

| File | Purpose | When to Create |
|---|---|---|
| `middleware.ts` | Auth check on every request to protected routes | Week 2, Day 6 |
| `next.config.ts` | Next.js configuration (images, redirects) | Week 1, Day 1 (auto) |
| `tailwind.config.ts` | Tailwind design token extensions | Week 1, Day 2 |
| `.env.local.example` | Template for environment variables | Week 1, Day 3 |
| `.gitignore` | Exclude `.env.local`, `.next`, `node_modules` | Week 1, Day 1 |

### `app/` Directory

| File | Purpose | When to Create |
|---|---|---|
| `app/layout.tsx` | Root HTML structure, fonts, dark mode class | Week 1, Day 1 |
| `app/globals.css` | CSS custom properties (design tokens) | Week 1, Day 2 |
| `app/error.tsx` | Root React error boundary | Week 11 |
| `app/not-found.tsx` | 404 page | Week 11 |
| `app/(auth)/login/page.tsx` | Login form | Week 2, Day 6 |
| `app/(auth)/register/page.tsx` | Registration form | Week 2, Day 6 |
| `app/auth/callback/route.ts` | OAuth redirect handler | Week 2, Day 6 |
| `app/(dashboard)/layout.tsx` | Sidebar + header shell | Week 2, Day 8 |
| `app/(dashboard)/page.tsx` | Dashboard overview | Week 3 (placeholder) → Week 6 (complete) |
| `app/(dashboard)/error.tsx` | Dashboard error boundary | Week 11 |
| `app/(dashboard)/loading.tsx` | Dashboard loading skeleton | Week 11 |
| `app/(dashboard)/settings/page.tsx` | Profile settings | Week 2, Day 10 |
| `app/(dashboard)/internships/page.tsx` | Application list | Week 4 |
| `app/(dashboard)/internships/[id]/page.tsx` | Application detail | Week 4 |
| `app/(dashboard)/explainer/page.tsx` | Lecture Explainer | Week 8 |
| `app/(dashboard)/roadmap/page.tsx` | Roadmap generator + view | Week 9 |
| `app/(dashboard)/roadmap/[id]/page.tsx` | Historical roadmap view | Week 9 |
| `app/(dashboard)/vault/page.tsx` | Two-panel vault | Week 5 |
| `app/api/health/route.ts` | Health check endpoint | Week 3 |
| `app/api/internships/route.ts` | GET internship list | Week 3 |
| `app/api/internships/[id]/route.ts` | GET single application | Week 3 |
| `app/api/internships/stats/route.ts` | GET dashboard stats | Week 3 |
| `app/api/vault/route.ts` | GET vault notes with search | Week 5 |
| `app/api/roadmap/route.ts` | GET roadmap sessions | Week 9 |
| `app/api/roadmap/[id]/route.ts` | GET single roadmap | Week 9 |
| `app/api/ai/explain/route.ts` | POST lecture explainer | Week 8 |
| `app/api/ai/roadmap/route.ts` | POST roadmap generator | Week 9 |
| `app/api/webhooks/auth/route.ts` | Supabase auth webhooks | Week 12 |

### `lib/` Directory

| File | Purpose | When to Create |
|---|---|---|
| `lib/supabase/client.ts` | Browser Supabase client | Week 1, Day 3 |
| `lib/supabase/server.ts` | Server Supabase client | Week 1, Day 3 |
| `lib/types/database.types.ts` | Generated DB types | Week 1, Day 5 (then regenerate on schema changes) |
| `lib/types/app.types.ts` | Hand-written app types | Week 3 (when first needed) |
| `lib/utils/cn.ts` | Tailwind className merger | Week 1, Day 1 (shadcn requires it) |
| `lib/utils/dates.ts` | Date formatting helpers | Week 3 |
| `lib/utils/validators.ts` | Zod schemas for forms | Week 2, Day 6 |
| `lib/actions/auth.ts` | Login, register, logout | Week 2, Day 6 |
| `lib/actions/profile.ts` | Profile update | Week 2, Day 10 |
| `lib/actions/internships.ts` | Application CRUD | Week 3 |
| `lib/actions/vault.ts` | Note CRUD | Week 5 |
| `lib/actions/goals.ts` | Goal CRUD | Week 6 |
| `lib/actions/roadmap.ts` | Roadmap mutations | Week 9 |
| `lib/hooks/useInternships.ts` | SWR hook for applications | Week 4 |
| `lib/hooks/useVault.ts` | SWR hook for vault | Week 5 |
| `lib/hooks/useRoadmap.ts` | SWR hook for roadmap | Week 9 |
| `lib/ai/provider.ts` | callAI() abstraction | Week 7 |
| `lib/ai/validators.ts` | AI input validation | Week 7 |
| `lib/ai/prompts/explainer.ts` | Explainer system prompt | Week 7 |
| `lib/ai/prompts/roadmap.ts` | Roadmap system prompt | Week 7 |

---

## 5. What NOT to Create Prematurely

These are common scaffolding mistakes. Creating these files before you need them is wasted effort that creates confusion later.

**Do NOT create in Week 1:**
- `components/internships/` — nothing to put in it yet
- `components/vault/` — nothing to put in it yet
- `lib/actions/internships.ts` — no schema exists to query yet
- `lib/hooks/useInternships.ts` — no actions to call yet
- `app/(dashboard)/internships/` — shell doesn't even exist yet

**Do NOT create until Phase 2:**
- `lib/ai/` directory — no AI features in Phase 1
- `app/api/ai/` directory — same reason
- `components/explainer/` — same reason
- `components/roadmap/` — same reason

**Do NOT create at all (for MVP):**
- `components/ui/calendar.tsx` — no date picker needed at MVP scale
- `app/(dashboard)/analytics/` — no analytics feature
- `lib/cache/` — no custom caching layer needed
- `lib/queue/` — no background job queue at MVP
- `tests/` — no unit tests at MVP (integration testing via browser is sufficient)
- `docs/` — documentation is in the root-level `.md` files

**Do NOT keep:**
- Test components used to verify a Server Action works — delete them immediately
- `console.log` statements left in committed code
- Commented-out old implementations — use git history instead

---

## 6. Naming Conventions

### Files

| Type | Convention | Example |
|---|---|---|
| React pages | lowercase, directory-based | `app/(dashboard)/internships/page.tsx` |
| React components | PascalCase `.tsx` | `ApplicationTable.tsx` |
| Utility functions | camelCase `.ts` | `dates.ts`, `validators.ts` |
| Server Actions files | camelCase `.ts` | `internships.ts`, `vault.ts` |
| API routes | always `route.ts` | `app/api/internships/route.ts` |
| Hooks | camelCase, `use` prefix | `useInternships.ts` |
| Supabase migration | `NNNN_description.sql` | `0001_initial_schema.sql` |

### Functions and Variables

| Type | Convention | Example |
|---|---|---|
| Server Actions | verb + noun | `createApplication`, `updateApplicationStatus` |
| API handlers | `GET`, `POST`, `PATCH`, `DELETE` | Named exports in route.ts |
| React components | PascalCase | `ApplicationTable`, `StatusBadge` |
| Hooks | `use` + noun | `useInternships`, `useVault` |
| Event handlers | `handle` + event | `handleStatusChange`, `handleDelete` |
| Boolean state | `is` or `has` prefix | `isLoading`, `isOpen`, `hasError` |
| Async functions | must be awaited — name clearly | `fetchApplicationStats`, `callAI` |

### Database ↔ TypeScript Naming

| Database column (snake_case) | TypeScript prop (camelCase) |
|---|---|
| `company_name` | `companyName` |
| `applied_date` | `appliedDate` |
| `is_priority` | `isPriority` |
| `created_at` | `createdAt` |

Supabase returns snake_case from the database. The generated TypeScript types use snake_case to match. Do not transform to camelCase in the API layer — keep the types consistent with the database throughout.

---

## 7. Import Path Reference

The `tsconfig.json` `paths` configuration maps `@/*` to the project root. Use these paths in all imports — never use relative paths that traverse directories:

```typescript
// ✅ Correct — absolute path alias
import { createServerClient } from '@/lib/supabase/server'
import { ApplicationTable } from '@/components/internships/ApplicationTable'
import { createApplication } from '@/lib/actions/internships'
import type { Database } from '@/lib/types/database.types'

// ❌ Wrong — relative path traversal
import { createServerClient } from '../../lib/supabase/server'
import { ApplicationTable } from '../../../components/internships/ApplicationTable'
```

### Common import patterns

```typescript
// Supabase clients
import { createServerClient } from '@/lib/supabase/server'    // In server components, API routes, Server Actions
import { createBrowserClient } from '@/lib/supabase/client'  // In client components (rare — prefer SWR hooks)

// Types
import type { Database } from '@/lib/types/database.types'
import type { Tables } from '@/lib/types/database.types'     // Shorthand for table row types

// Server Actions
import { createApplication } from '@/lib/actions/internships'

// Utilities
import { cn } from '@/lib/utils/cn'
import { formatDeadline, daysUntil } from '@/lib/utils/dates'

// shadcn/ui components
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Feature components
import { ApplicationTable } from '@/components/internships/ApplicationTable'
import { StatusBadge } from '@/components/internships/StatusBadge'
```
