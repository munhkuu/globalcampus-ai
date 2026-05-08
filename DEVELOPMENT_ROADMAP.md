# Development Roadmap
## GlobalCampus AI

**Version:** 1.0.0  
**Status:** Active — Pre-Development  
**Last Updated:** 2026-05-08  

---

## Table of Contents

1. [Roadmap Philosophy](#1-roadmap-philosophy)
2. [Phase 0: Foundation (Weeks 1–2)](#2-phase-0-foundation-weeks-12)
3. [Phase 1: Core MVP (Weeks 3–6)](#3-phase-1-core-mvp-weeks-36)
4. [Phase 2: AI Features (Weeks 7–9)](#4-phase-2-ai-features-weeks-79)
5. [Phase 3: Polish & Launch (Weeks 10–12)](#5-phase-3-polish--launch-weeks-1012)
6. [Post-MVP Roadmap](#6-post-mvp-roadmap)
7. [Engineering Priorities](#7-engineering-priorities)
8. [Dependency Map](#8-dependency-map)
9. [Definition of Done](#9-definition-of-done)
10. [Success Criteria by Phase](#10-success-criteria-by-phase)

---

## 1. Roadmap Philosophy

### Build the workflow first; make it AI second

The most common failure mode in AI products is building the AI feature before the workflow exists. Students need a working internship tracker even if the AI is broken. They need a functional study vault even if the explainer fails. The AI features are enhancements to workflows — they are not the product itself.

This roadmap builds in the following order:
1. Infrastructure (the foundation that everything runs on)
2. Non-AI workflows (internship tracker, study vault, dashboard)
3. AI features (explainer, roadmap generator) layered on top of working workflows
4. Polish and production readiness

### Ship working software at every phase

Every phase ends with a deployable application. At the end of Phase 0, you can log in and see an empty dashboard. At the end of Phase 1, the internship tracker works end-to-end. At the end of Phase 2, all features exist. At the end of Phase 3, the product is launch-ready.

This ensures continuous progress is visible and that decisions about scope can be made with a working product in hand, not just documentation.

---

## 2. Phase 0: Foundation (Weeks 1–2)

**Goal:** A deployed Next.js application with authentication working, connected to Supabase, with the dashboard shell rendering correctly.

### Week 1: Project Setup

**Task 0.1 — Project initialization**
- Initialize Next.js 15 with TypeScript, Tailwind CSS, ESLint
- Configure `tsconfig.json` with strict mode and path aliases (`@/` → `./`)
- Install and configure shadcn/ui (select components: Button, Card, Dialog, Input, Select, Badge, Textarea, Toast, DropdownMenu)
- Set up `globals.css` with the complete CSS custom property system from UI/UX Guidelines
- Configure Tailwind with custom color tokens (map to CSS variables)
- Verify: `npm run dev` shows blank page with correct fonts and dark background

**Task 0.2 — Supabase project setup**
- Create Supabase project (select region: ap-northeast-2, Seoul — for latency to Korean users)
- Apply initial migration (`0001_initial_schema.sql`) via Supabase CLI
- Verify all tables, enums, triggers, and RLS policies are created correctly
- Generate TypeScript types: `supabase gen types typescript --local > lib/types/database.types.ts`
- Install `@supabase/supabase-js` and `@supabase/ssr`
- Create `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/middleware.ts`

**Task 0.3 — Environment configuration**
- Create `.env.local` from `.env.local.example`
- Fill in Supabase URL, anon key, service role key
- Add OpenRouter API key placeholder
- Verify Supabase connection with a test query

### Week 2: Authentication & Shell

**Task 0.4 — Authentication flow**
- Build `/login` page with email/password form
- Build `/register` page with email/password form + optional display name
- Implement Google OAuth flow via Supabase
- Implement password reset flow (email → `/reset-password` page)
- Configure `middleware.ts` to protect all `/(dashboard)/*` routes
- Verify: login redirects to dashboard; unauthenticated access to dashboard redirects to login

**Task 0.5 — Dashboard shell**
- Build `Sidebar` component with navigation links, logo, and user avatar/menu
- Build `Header` component with page title and user dropdown
- Build `/(dashboard)/layout.tsx` with sidebar + main content area
- Implement logout action
- Implement mobile navigation (hamburger → slide-out sidebar or bottom nav)
- Verify: Sidebar renders on all dashboard routes; active route is highlighted

**Task 0.6 — User profile and onboarding**
- Build basic `/profile` settings page
- Build onboarding flow (modal or `/onboarding` route): collect university, target role, graduation year
- Set `onboarding_completed = true` after onboarding
- Show onboarding on first login if not completed
- Verify: new user sees onboarding; profile data saves to `user_profiles`

**Phase 0 Exit Criteria:**
- Application deployed to Vercel (preview URL)
- Login/register/logout work
- Dashboard shell renders with correct sidebar and navigation
- Database tables exist with RLS policies active
- TypeScript compiles with zero errors

---

## 3. Phase 1: Core MVP (Weeks 3–6)

**Goal:** All non-AI features fully functional. Users can manage internships, create vault notes, and set study goals.

### Week 3: Dashboard & Internship Tracker (Data Layer)

**Task 1.1 — Dashboard data**
- Build `GET /api/internships/stats` API route
- Fetch dashboard data in `/(dashboard)/page.tsx` (server component)
- Build `PipelineStats` component (status counts + bar visualization)
- Build `DeadlineCard` component (upcoming deadlines list)
- Build `QuickNote` component (textarea → saves to vault on submit)
- Build `GoalProgress` component (study goals list with checkboxes)
- Verify: Dashboard shows real data from database

**Task 1.2 — Internship application data layer**
- Implement `lib/actions/internships.ts` with all CRUD Server Actions
- Build `GET /api/internships` route with pagination and filter support
- Build `GET /api/internships/:id` route with timeline data
- Build `GET /api/internships/stats` route
- Add Zod validation schemas for all internship input types
- Verify: Server Actions and API routes return correctly typed data

### Week 4: Internship Tracker UI

**Task 1.3 — Application list view**
- Build `ApplicationTable` component (table with sortable columns)
- Build `StatusFilter` tab bar (All / Applied / OA / Interview / Accepted / Rejected)
- Build `StatusBadge` component (all 5 status variants)
- Implement client-side filtering by status (SWR + filter state)
- Implement sort by column header click
- Verify: Table shows all applications with correct status badges; filtering and sorting work

**Task 1.4 — Application form (create/edit)**
- Build `ApplicationForm` component (all fields from spec)
- Build slide-over panel wrapper (right-side panel that slides in without replacing the table)
- Implement create application Server Action with validation
- Implement edit application with pre-populated form
- Implement delete with confirmation dialog
- Verify: Full CRUD works; timeline events logged on status change

**Task 1.5 — Application detail view**
- Build `/(dashboard)/internships/[id]/page.tsx`
- Display full application details + recruiter info + notes (markdown rendered)
- Display timeline of status changes
- Implement inline status update (dropdown in detail view)
- Verify: Detail page loads correctly; status changes update timeline

### Week 5: Study Vault

**Task 1.6 — Vault data layer**
- Implement `lib/actions/vault.ts` with all CRUD Server Actions
- Build `GET /api/vault` route with search, category filter, tag filter
- Full-text search using PostgreSQL `tsvector` (verify search trigger is working)
- Add Zod validation schemas
- Verify: Search returns correct results; tag filtering works

**Task 1.7 — Vault UI**
- Build two-panel layout: note list (left) + note editor (right)
- Build `NoteCard` component (title, category badge, timestamp)
- Build `VaultSearch` component (search input with clear button)
- Build `TagFilter` component (tag chips with toggle state)
- Build `NoteEditor` component (markdown editor with preview toggle)
- Implement create / edit / delete note
- Verify: Full CRUD works; search and filters work; markdown renders correctly in preview

### Week 6: Study Goals + Integration

**Task 1.8 — Study goals**
- Implement `lib/actions/goals.ts` with CRUD Server Actions
- Build `GoalList` component (used on dashboard)
- Build goal create/edit form
- Implement `toggleGoalCompleted` with `completed_at` timestamp
- Verify: Goals can be created, checked off, and deleted

**Task 1.9 — Integration polish**
- Wire up "Save to Vault" flow from dashboard Quick Note
- Ensure dashboard revalidates when data changes (correct `revalidatePath` calls)
- Ensure all forms have correct error handling (validation errors shown inline)
- Add toast notifications for all CRUD operations
- Verify: End-to-end flows work without errors in browser console

**Phase 1 Exit Criteria:**
- Internship tracker: full CRUD with status pipeline and timeline
- Study vault: full CRUD with search and tag filtering
- Study goals: create, toggle, delete
- Dashboard: shows live data from all three modules
- Zero TypeScript errors; all forms validated with Zod

---

## 4. Phase 2: AI Features (Weeks 7–9)

**Goal:** AI Lecture Explainer and Career Roadmap Generator fully functional.

### Week 7: AI Infrastructure

**Task 2.1 — AI provider abstraction**
- Implement `lib/ai/provider.ts` (`callAI` function, types, error handling)
- Test against OpenRouter endpoint with a simple prompt
- Implement per-user rate limiting check (query `ai_interactions` table)
- Implement `ai_interactions` logging (server-side, service role key)
- Add `OPENROUTER_API_KEY` and `OPENROUTER_DEFAULT_MODEL` to env config
- Verify: `callAI` returns a response; rate limiting throws correctly after N requests

**Task 2.2 — Input validation layer**
- Implement `lib/ai/validators.ts` with length and content validators
- Test validators against edge cases (empty input, overlong input, non-CS content)
- Verify: Validators correctly reject invalid inputs before API call

### Week 8: AI Lecture Explainer

**Task 2.3 — Explainer API route**
- Implement `lib/ai/prompts/explainer.ts` with the full system prompt function
- Build `POST /api/ai/explain` route
- Integrate auth check, rate limit check, input validation, AI call, interaction logging
- Return structured JSON response (concept, explanation, code example, key points)
- Test with Korean CS terminology inputs and English CS concept inputs
- Verify: Route returns expected structure; Korean terms are correctly handled

**Task 2.4 — Explainer UI**
- Build `/(dashboard)/explainer/page.tsx`
- Build `ExplainerInput` component (textarea + depth selector + language selector + bilingual toggle)
- Build `ExplanationOutput` component (structured display of AI response)
- Implement loading state during AI generation
- Implement error state with retry button
- Connect "Save to Vault" button to `createVaultNote` Server Action with source = 'ai_generated'
- Verify: Full explainer flow works end-to-end; output saves to vault correctly

### Week 9: Career Roadmap Generator

**Task 2.5 — Roadmap API route**
- Implement `lib/ai/prompts/roadmap.ts` with the full system prompt function
- Build `POST /api/ai/roadmap` route
- Implement structured output parsing (AI response → `roadmap_sessions` + `roadmap_items` insert)
- Handle both korean_tech and global targeting in the prompt
- Build `GET /api/roadmap` and `GET /api/roadmap/:id` routes
- Verify: Route generates a roadmap and saves it correctly to the database

**Task 2.6 — Roadmap UI**
- Build `/(dashboard)/roadmap/page.tsx` (form + display, conditional render)
- Build `RoadmapForm` component (5-field form with validation)
- Build `RoadmapView` component (collapsible phases with items)
- Build `PhaseCard` component (phase header with completion % + item list)
- Implement `toggleRoadmapItem` Server Action (marks item complete, logs `completed_at`)
- Build history sidebar (previous roadmap sessions)
- Connect roadmap completion % to dashboard `GoalProgress` component
- Verify: Generation works; item completion updates; history is accessible

**Phase 2 Exit Criteria:**
- AI Lecture Explainer: generates explanation, saves to vault, handles errors gracefully
- Career Roadmap Generator: generates roadmap, saves to database, items are checkable
- Rate limiting is enforced on both AI endpoints
- AI interaction history is logged correctly
- AI features degrade gracefully (network error, API error) without crashing the page

---

## 5. Phase 3: Polish & Launch (Weeks 10–12)

**Goal:** Production-ready application — performance, accessibility, error handling, monitoring, and launch.

### Week 10: Performance & Accessibility

**Task 3.1 — Performance audit**
- Run Lighthouse audit on all main pages (target: Performance > 90, Accessibility > 95)
- Optimize images (use `next/image` everywhere, add proper sizes)
- Verify no unnecessary client component boundaries
- Confirm all data fetches are parallel (no N+1 patterns in server components)
- Verify: Dashboard initial load < 2 seconds on simulated slow connection

**Task 3.2 — Accessibility audit**
- Run axe-core accessibility check on all pages
- Verify all interactive elements have accessible labels
- Verify keyboard navigation works on all interactive elements
- Verify focus management in modals and slide-overs (focus trap)
- Verify color contrast ratios meet WCAG 2.1 AA

### Week 11: Error Handling & Edge Cases

**Task 3.3 — Error boundary and fallbacks**
- Implement root error boundary in `app/layout.tsx`
- Implement route-level error boundaries for dashboard pages
- Test all error states: network failure, API error, database error, rate limit
- Verify: No white screens; all errors show actionable fallback UI

**Task 3.4 — Edge case testing**
- Test application with 0 records (empty states render correctly)
- Test application with 100+ applications (pagination, performance)
- Test AI features with maximum-length inputs
- Test concurrent status updates (optimistic UI rollback on conflict)
- Test session expiry behavior (redirects to login, not a broken page)

### Week 12: Launch Preparation

**Task 3.5 — Production deployment**
- Verify production Supabase project is correctly configured (different from development)
- Apply all migrations to production database
- Configure Vercel environment variables for production
- Enable Vercel Analytics
- Set up Supabase alerting for database errors
- Run smoke tests on production deployment

**Task 3.6 — Documentation and README**
- Finalize README.md with accurate setup instructions
- Verify ENVIRONMENT_SETUP.md reflects final environment variables
- Create a basic feedback mechanism (link to a form or email)

**Phase 3 Exit Criteria:**
- Lighthouse scores: Performance > 90, Accessibility > 95, Best Practices > 95
- All error states handled gracefully
- Production deployment verified with all features working
- Documentation complete and accurate

---

## 6. Post-MVP Roadmap

The following features are out of scope for MVP but have been designed to integrate cleanly with the existing architecture.

### Near-term (3–6 months post-launch)

**Email notifications**
- Deadline reminders sent 48 hours and 24 hours before application deadlines
- Implementation: Supabase Edge Function + Resend API, triggered by a cron job

**Mobile-optimized experience**
- Responsive improvements for sub-768px viewports
- Bottom navigation bar for mobile
- Swipe gestures for status updates

**GitHub integration**
- Link GitHub profile to user account
- Display commit activity on dashboard as a proxy for coding practice activity

### Medium-term (6–12 months)

**Resume builder**
- AI-assisted resume generation based on vault notes and application history
- Export to PDF

**Google Calendar sync**
- Export internship deadlines and interview dates to Google Calendar

**LeetCode progress tracking**
- Connect LeetCode account to track solved problems
- Display algorithm practice progress on dashboard, linked to roadmap items

**Community features (opt-in)**
- Anonymized sharing of internship application outcomes by company
- "Did anyone else apply to Kakao?" insight aggregation

### Long-term (12+ months)

**University-level partnerships**
- White-label version for specific international student programs
- Integration with university's academic calendar for deadline pre-population

**Alumni network**
- Connect students with graduated internationals who are now employed at Korean tech companies
- Verified mentor profiles, limited to 1-hour sessions

---

## 7. Engineering Priorities

When scope must be cut, cut in this order (least important first):

1. Study Goals (simplest to cut — Goals can live in the vault as notes)
2. Application timeline events (status history is nice-to-have; current status is essential)
3. Roadmap history (keep latest roadmap; history is a quality-of-life feature)
4. Mobile navigation optimization (functional is acceptable; polished is post-MVP)
5. Full-text search in vault (ILIKE fallback is functional; GIN-indexed tsvector is ideal)

**Never cut:**
- Authentication (cannot ship without it)
- Internship tracker CRUD (core value proposition)
- AI Lecture Explainer (second core value proposition)
- RLS policies (non-negotiable security requirement)

---

## 8. Dependency Map

```
Phase 0: Auth + Shell
    ↓
Phase 1: Internship Tracker ─── Phase 1: Study Vault ─── Phase 1: Goals
    ↓                                   ↓
Phase 2: AI Infrastructure
    ↓                    ↓
Phase 2: Explainer    Phase 2: Roadmap ─────────── (links to Goals)
    ↓                    ↓
    └────────────────────┘
Phase 3: Polish + Launch
```

AI features cannot begin until Phase 1 establishes the vault (explainer needs vault save) and the goals model (roadmap needs goals sync).

---

## 9. Definition of Done

A feature is "done" when ALL of the following are true:

**Functional:**
- All acceptance criteria from the PRD are met
- Happy path works end-to-end
- Error states are handled (network failure, validation failure, API failure)
- Empty states are handled (no data)

**Code quality:**
- TypeScript compiles with zero errors
- No `any` types used without explicit justification in a comment
- No hardcoded user IDs, API keys, or environment-specific values in source code

**Data integrity:**
- All mutations use the appropriate Server Action or API route (no direct Supabase calls from client components)
- RLS policies verified manually: open Supabase Table Editor, verify another user cannot read the data

**UI:**
- Renders correctly in latest Chrome and Firefox
- Renders correctly on 1440px, 1280px, and 1024px viewport widths
- Loading states render correctly on simulated slow (3G) connection
- No layout shifts during loading

---

## 10. Success Criteria by Phase

| Phase | Measurable Outcome |
|---|---|
| Phase 0 complete | Deployed URL loads login page; login creates session; dashboard shell renders |
| Phase 1 complete | Create 5 internship applications, filter by status, update status, save a vault note — all without errors |
| Phase 2 complete | Paste Korean lecture text → receive explanation → save to vault; generate roadmap → check off 3 items → see dashboard progress update |
| Phase 3 complete | Lighthouse Performance > 90; zero JS errors in console on production during smoke test |
| MVP Launch | 10 real users have completed onboarding; at least 5 have created internship applications |
