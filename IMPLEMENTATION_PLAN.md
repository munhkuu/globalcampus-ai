# Implementation Plan
## GlobalCampus AI — Phased Engineering Execution

**Version:** 1.0.0  
**Status:** Active — Pre-Development  
**Last Updated:** 2026-05-08  
**Context:** Solo developer, consumer-grade hardware, targeting production MVP in 12 weeks  

---

## Table of Contents

1. [Solo Developer Constraints & Strategy](#1-solo-developer-constraints--strategy)
2. [Execution Principles](#2-execution-principles)
3. [Phase 0: Foundation — Weeks 1–2](#3-phase-0-foundation--weeks-12)
4. [Phase 1: Non-AI Core — Weeks 3–6](#4-phase-1-non-ai-core--weeks-36)
5. [Phase 2: AI Integration — Weeks 7–9](#5-phase-2-ai-integration--weeks-79)
6. [Phase 3: Hardening & Launch — Weeks 10–12](#6-phase-3-hardening--launch-weeks-1012)
7. [Hardware-Conscious Development Practices](#7-hardware-conscious-development-practices)
8. [Debugging Complexity Reduction](#8-debugging-complexity-reduction)
9. [Technical Debt Prevention Rules](#9-technical-debt-prevention-rules)
10. [Weekly Checkpoint Format](#10-weekly-checkpoint-format)
11. [Risk Mitigation Playbook](#11-risk-mitigation-playbook)

---

## 1. Solo Developer Constraints & Strategy

### The real constraint is cognitive load, not time

On a team, you can parallelize: one engineer handles auth while another builds the data layer. Solo, these must be strictly sequential. The largest risk is **context switching between too many open problems simultaneously.** A solo developer who has three features "in progress" at once will finish none of them well.

**Rule: one feature at a time, shipped to working state before starting the next.**

### Hardware constraints

Low-end hardware means:
- The TypeScript compiler will be slow on large codebases — keep the project lean
- Running `npm run dev` with hot reload and multiple browser tabs open may cause lag
- Do NOT run local Supabase (Docker) alongside `npm run dev` — the memory pressure will kill productivity. Use the cloud Supabase free tier for development.
- Keep the dependency list minimal. Every package added to `node_modules` has a compile-time and disk cost.

### Development environment optimization

```bash
# Use turbopack for faster dev server (Next.js 15 default)
npm run dev  # --turbopack is default in Next.js 15

# Only open one browser tab during development
# Use Supabase cloud (not local Docker)
# Close all non-essential applications during build/compile
```

### The "weekly working product" rule

At the end of every week, the application must be in a state where it can be demonstrated. No half-built features spanning multiple weeks. If a feature is too large for one week, break it into demonstrable sub-features.

This forces scope discipline and keeps morale high — you see progress.

---

## 2. Execution Principles

These apply to every task in every phase:

**Build → verify → commit → move on.**  
Finish a task completely before starting the next. A task is finished when it works end-to-end in the browser, not just when the code compiles.

**No scaffolding ahead of need.**  
Do not create files, folders, or abstractions for features you have not started building. The folder structure in `FOLDER_STRUCTURE.md` shows the final state — build toward it incrementally. An empty `components/roadmap/` folder created in Week 1 is cognitive noise in Week 3.

**Commit after every working unit.**  
A working unit is: form submits successfully, API route returns correct data, component renders correctly. Not: file is created, types are defined, function is stubbed.

```bash
# Commit message format
git commit -m "feat(internships): add status update with timeline log"
git commit -m "fix(vault): search returns empty array when no results instead of null"
git commit -m "chore(auth): add middleware protection for all dashboard routes"
```

**Test in the browser, not just in TypeScript.**  
TypeScript compiling is necessary but not sufficient. After every task, open the browser and manually walk through the feature. Write down what breaks. Fix it before moving to the next task.

**When stuck for more than 90 minutes, move on.**  
Document the blocker in a `BLOCKERS.md` file. Continue to the next task. Often, working on adjacent code resolves the blocker naturally. Do not let a single stuck point stall the whole project.

---

## 3. Phase 0: Foundation — Weeks 1–2

**Exit condition:** A deployed Next.js application with working auth, connected to Supabase, with the dashboard shell rendering. All subsequent phases build on top of this.

**Why this phase exists:** Every future feature assumes auth works, Supabase is connected, and the dashboard shell renders. Building on a broken foundation wastes all subsequent work.

---

### Week 1: Project Initialization

**Day 1: Project scaffold**

Order matters here. Do not install packages you don't need yet.

```bash
# 1. Initialize Next.js with TypeScript + Tailwind
npx create-next-app@latest globalcampus-ai \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir=false \
  --import-alias "@/*"

cd globalcampus-ai

# 2. Install only what Phase 0 needs
npm install @supabase/supabase-js @supabase/ssr

# 3. Initialize shadcn/ui
npx shadcn@latest init
# Select: Default style, Slate base color, CSS variables: yes

# 4. Add only the shadcn components Phase 0 needs
npx shadcn@latest add button card input label form
```

**Day 1 checkpoint:** `npm run dev` shows the default Next.js page. No TypeScript errors.

**Day 2: Tailwind and design tokens**

Configure `globals.css` with the complete CSS variable system from `UI_UX_GUIDELINES.md`. Configure `tailwind.config.ts` to reference these variables.

Verify by creating a single test page that shows a dark background with correct font rendering. Delete the test page after verification.

**Day 2 checkpoint:** Dark background renders correctly. Inter font loads. CSS variables are accessible.

**Day 3: Supabase connection**

1. Create Supabase project (ap-northeast-2 region)
2. Create `lib/supabase/client.ts` — browser client
3. Create `lib/supabase/server.ts` — server client (cookies)
4. Create `.env.local` from template
5. Test connection with a single query in a server component

```typescript
// Quick connection test in app/page.tsx — delete after verification
const supabase = createServerClient()
const { data, error } = await supabase.from('_any_table_').select('count')
console.log('Connection test:', error ? 'FAILED' : 'OK')
```

**Day 3 checkpoint:** Server component can query Supabase without error. Delete the test code.

**Day 4–5: Database schema**

Apply the migration from `DATABASE_SCHEMA.md`. Do this in this exact order:

1. Run `supabase link --project-ref YOUR_REF`
2. Create `supabase/migrations/0001_initial_schema.sql` (copy from DATABASE_SCHEMA.md)
3. Run `supabase db push`
4. Verify in Supabase Table Editor: all 8 tables exist
5. Verify triggers exist: `update_updated_at_column`, `update_vault_search_vector`, `create_user_profile`
6. Verify RLS is enabled on all tables (shown by lock icon in Table Editor)
7. Generate types: `supabase gen types typescript --linked > lib/types/database.types.ts`

**Day 4–5 checkpoint:** All tables exist. TypeScript types file generated. `npm run build` succeeds with no errors.

---

### Week 2: Authentication + Shell

**Day 6–7: Authentication flow**

Build in this exact sequence — each step must work before the next begins:

```
Step 1: Build /login page (static HTML, no logic)
Step 2: Add email/password form with validation (zod)
Step 3: Wire form to Supabase signInWithPassword Server Action
Step 4: Redirect to /dashboard on success
Step 5: Build /register page (same pattern)
Step 6: Wire register to Supabase signUp
Step 7: Add middleware.ts for route protection
Step 8: Test full loop: register → login → see protected page → logout
Step 9: Add Google OAuth button (Supabase handles the flow)
Step 10: Test Google OAuth
```

**Install additional shadcn components needed for auth:**
```bash
npx shadcn@latest add form toast separator
```

**Day 6–7 checkpoint:** Complete auth loop works. Email register and Google OAuth both work. Unauthenticated users cannot access `/dashboard`.

**Day 8–9: Dashboard shell**

Build in this sequence:

```
Step 1: Create /(dashboard)/layout.tsx with a placeholder main area
Step 2: Build Sidebar component (navigation links, logo, user info)
Step 3: Wire Sidebar to active route detection (usePathname)
Step 4: Add logout Server Action to user menu
Step 5: Build Header component (page title area)
Step 6: Create /(dashboard)/page.tsx with "Dashboard coming soon" placeholder
Step 7: Create placeholder pages for all routes (internships, explainer, roadmap, vault)
Step 8: Verify navigation between all pages works
```

**Install additional shadcn components:**
```bash
npx shadcn@latest add dropdown-menu avatar badge
```

**Day 8–9 checkpoint:** Sidebar renders on all dashboard routes. Active route is highlighted. All navigation links work. Logout works.

**Day 10: Onboarding + Profile**

```
Step 1: Build /api/profile GET route
Step 2: Build updateProfile Server Action
Step 3: Build onboarding modal (university, target role, graduation year)
Step 4: Show onboarding on first login (check onboarding_completed)
Step 5: Verify profile row exists in user_profiles after signup
```

**Day 10 checkpoint:** New user sees onboarding. Profile data saves. `onboarding_completed` updates to `true`.

**Week 2 end: Deploy to Vercel**

Deploy the current state to Vercel before Week 3 begins. This catches environment variable issues and deployment configuration problems early — not at launch.

```bash
# Commit everything
git add . && git commit -m "feat: complete Phase 0 — auth + shell + database"

# Push to GitHub, connect to Vercel, deploy
```

**Phase 0 complete when:** Vercel URL shows working login → dashboard shell flow. TypeScript compiles cleanly. Database tables exist.

---

## 4. Phase 1: Non-AI Core — Weeks 3–6

**Exit condition:** Internship tracker, Study Vault, and Study Goals fully functional. Dashboard shows live data. No AI features yet.

**Why AI comes later:** AI is the most brittle layer (network-dependent, expensive, prompt-sensitive). Build the storage, display, and interaction patterns first. This also means you can use the product before AI is ready — which reveals UX issues earlier.

---

### Week 3: Dashboard Data + Internship Data Layer

**Build order rationale:** The dashboard depends on the internship stats API. The internship UI (Week 4) depends on the data layer. Build the data layer first so the UI has real data to display immediately.

**Day 11–12: Dashboard server-side data**

```
Task: Build /api/internships/stats route
- Auth check
- Query: count applications by status
- Query: applications with deadline in next 14 days, sorted by deadline
- Return structured JSON (see API_SPECIFICATION.md §6)

Task: Build Dashboard server component
- Fetch stats in page.tsx (server component — no useEffect)
- Pass data to PipelineStats, DeadlineCard components
- Build PipelineStats: 5 status buckets with counts
- Build DeadlineCard: list of upcoming deadlines with days remaining
```

**Day 12 checkpoint:** Dashboard page shows real data (even if there are zero applications, it renders correctly).

**Day 13–14: Internship data layer**

Build all Server Actions before any UI. This forces you to think about data contracts first:

```typescript
// lib/actions/internships.ts — build in this order:

// 1. createApplication — simplest write path
// 2. updateApplicationStatus — most-used mutation
// 3. updateApplication — partial update (all fields)
// 4. deleteApplication — with cascade check

// lib/utils/validators.ts — add Zod schema for internship input
```

**Test each Server Action manually** using a test script or temporary button before building the real UI:

```typescript
// Temporary test in a dashboard component — delete after testing
<button onClick={() => createApplication({
  company_name: 'Test Co',
  role_title: 'Test Role',
  // ... minimal valid input
})}>
  Test Create
</button>
```

**Day 13–14 checkpoint:** All 4 Server Actions execute without errors. Records appear in Supabase Table Editor.

**Day 15: GET API routes**

```
Build: GET /api/internships (list with pagination, status filter)
Build: GET /api/internships/:id (single with timeline)
```

Test each route in the browser directly (`http://localhost:3000/api/internships`) before the UI uses them.

**Day 15 checkpoint:** Both GET routes return correctly shaped JSON. Status filter parameter works.

---

### Week 4: Internship Tracker UI

**Install shadcn components needed this week:**
```bash
npx shadcn@latest add table dialog select sheet
```

**Day 16–17: Application table + filters**

```
Step 1: Build ApplicationTable component (static — hardcoded data)
Step 2: Wire to SWR fetching from /api/internships
Step 3: Build StatusBadge component (5 variants)
Step 4: Build StatusFilter tab bar
Step 5: Wire filter tabs to SWR key (changing filter re-fetches)
Step 6: Build column sort (click header → update sort param in SWR key)
```

**Build order within ApplicationTable:**
- Get the table rendering with static data first
- Then wire to real data
- Then add interactivity (filters, sort)
Never add all three simultaneously.

**Day 16–17 checkpoint:** Table renders with real data. Status filter tabs work. Columns sort on click.

**Day 18–19: Create/Edit form + slide-over**

```
Step 1: Build ApplicationForm as a controlled form (all fields, Zod validation)
Step 2: Build a Sheet (slide-over panel from shadcn) wrapper
Step 3: Wire "+ Add Application" button to open Sheet
Step 4: Wire form submit to createApplication Server Action
Step 5: On success: close Sheet, revalidate SWR cache
Step 6: Wire "Edit" button (per row) to open Sheet with pre-populated data
Step 7: Wire edit submit to updateApplication Server Action
```

**Day 18–19 checkpoint:** Can create and edit applications. Sheet opens/closes correctly. Table updates after mutation.

**Day 20: Delete + detail page**

```
Step 1: Build delete confirmation Dialog
Step 2: Wire delete to deleteApplication Server Action
Step 3: Build /internships/[id]/page.tsx (detail view)
Step 4: Display full application fields + recruiter info
Step 5: Display timeline of status changes
Step 6: Inline status update dropdown on detail page
```

**Day 20 checkpoint:** Full CRUD works. Timeline shows status change history. Detail page loads.

---

### Week 5: Study Vault

**Install shadcn components:**
```bash
npx shadcn@latest add textarea command popover
```

**Day 21–22: Vault data layer**

Same pattern as internships — build all actions before UI:

```
1. createVaultNote Server Action
2. updateVaultNote Server Action
3. deleteVaultNote Server Action
4. GET /api/vault route (with full-text search, category filter, tag filter)
```

Verify full-text search works by inserting a note via Supabase Table Editor and querying the `search_vector` column directly:
```sql
SELECT title, search_vector FROM vault_notes WHERE user_id = 'your-user-id';
```

**Day 21–22 checkpoint:** All vault CRUD Server Actions work. Search route returns results matching the query term.

**Day 23–24: Vault two-panel UI**

The vault page is the most complex UI in Phase 1. Build it in strict layers:

```
Layer 1: Two-panel layout (left panel + right panel), static
Layer 2: Left panel — NoteCard list from SWR, no search yet
Layer 3: Left panel — VaultSearch input, wired to SWR key
Layer 4: Left panel — CategoryFilter chips, wired to SWR key
Layer 5: Right panel — NoteEditor (empty state when nothing selected)
Layer 6: Right panel — selecting a NoteCard shows content in editor
Layer 7: Right panel — edit mode (textarea) vs view mode (markdown render)
Layer 8: Right panel — Save button wired to updateVaultNote Server Action
Layer 9: Left panel — "+ New Note" button creates blank note, opens in right panel
Layer 10: Right panel — Delete with confirmation
```

**Do not build all 10 layers in one session.** Layers 1–4 in Day 23, Layers 5–10 in Day 24.

**Markdown rendering:** Install `react-markdown` + `remark-gfm` for the read view:
```bash
npm install react-markdown remark-gfm
```

**Day 23–24 checkpoint:** Two-panel layout works. Notes searchable. Edit/view toggle works. Markdown renders in view mode.

**Day 25: Tags + vault integration**

```
Step 1: Add tag input to NoteEditor (comma-separated → array)
Step 2: Build TagFilter chip selector in left panel
Step 3: Wire tag filter to SWR key
Step 4: Wire "Save to Vault" from dashboard QuickNote widget to createVaultNote
```

**Day 25 checkpoint:** Tag filtering works. Dashboard QuickNote saves to vault.

---

### Week 6: Study Goals + Dashboard Integration

**Day 26–27: Study Goals**

Goals are simpler than the internship tracker. Build quickly:

```
1. createStudyGoal Server Action
2. toggleGoalCompleted Server Action (sets completed + completed_at)
3. deleteStudyGoal Server Action
4. Build GoalList component (used on dashboard)
5. Build inline "Add Goal" form (simple: title + optional target date)
6. Build toggle checkbox in GoalList
7. Wire completed goals to strikethrough styling
```

**Day 26–27 checkpoint:** Goals can be created, toggled, and deleted. Dashboard shows goal list.

**Day 28: Dashboard completion**

```
Step 1: Wire GoalProgress widget on dashboard to real goal data
Step 2: Wire RecentVaultEntries widget to /api/vault (limit 3, sorted by updated_at)
Step 3: Wire PipelineStats to /api/internships/stats
Step 4: Verify all dashboard data fetches are parallel (no await chains)
Step 5: Add loading skeletons for each dashboard widget
Step 6: Verify empty states: new user with zero records sees correct empty UI
```

**Day 28 checkpoint:** Dashboard shows live data from all sources. Empty states render. Skeletons show during load.

**Day 29–30: Phase 1 integration testing**

This is a deliberate testing buffer — do not skip it.

```
Test 1: Create 5 internship applications → verify they appear on dashboard
Test 2: Update status through the full pipeline → verify timeline records
Test 3: Create 10 vault notes → search for each → verify results
Test 4: Set a goal, complete it → verify dashboard shows correct count
Test 5: Delete an application → verify it disappears everywhere
Test 6: Log out and back in → verify data persists
Test 7: Test on a slow connection (Chrome DevTools → Network → Slow 3G)
Test 8: Open browser console → verify zero errors and zero warnings
```

Fix every bug found before starting Phase 2.

**Phase 1 complete when:** All tests above pass. Zero console errors. All CRUD flows work end-to-end.

---

## 5. Phase 2: AI Integration — Weeks 7–9

**Exit condition:** AI Lecture Explainer and Career Roadmap Generator fully functional.

**The discipline required here:** AI features are easy to build badly. The `callAI()` abstraction must be built before any feature uses it. Both features must degrade gracefully when the AI provider fails.

---

### Week 7: AI Infrastructure

**Day 31–32: Provider abstraction + rate limiter**

Build `lib/ai/provider.ts` completely before touching any AI feature:

```
Step 1: Define AIMessage, AIRequestOptions, AIResponse TypeScript interfaces
Step 2: Implement callAI() — POST to OpenRouter endpoint, parse response, return typed result
Step 3: Implement error handling — catch network errors, API errors, timeout
Step 4: Test callAI() in isolation with a trivial prompt:
        "Say 'hello' and nothing else."
        Verify the response structure matches AIResponse type.
Step 5: Implement checkRateLimit(userId, feature) using ai_interactions table
Step 6: Implement logAIInteraction(userId, feature, model, tokens, latency, succeeded)
Step 7: Verify rate limiting: call AI 21 times → 21st call returns rate limit error
```

**Critical test before any feature uses AI:**
```typescript
// Test script (delete after testing)
const result = await callAI([
  { role: 'user', content: 'What is O(n log n)?' }
])
console.log(result) // Must be AIResponse shape, not throw
```

**Day 32 checkpoint:** `callAI()` works and is tested. Rate limiting is tested. Interaction logging is tested.

**Day 33: Prompt system**

```
Step 1: Build lib/ai/prompts/explainer.ts — system prompt function with params
Step 2: Build lib/ai/prompts/roadmap.ts — system prompt function with params
Step 3: Test each prompt function renders correct string output given test params
Step 4: Build lib/ai/validators.ts — input length and content validation
Step 5: Test validators reject: empty string, 2001-char string, clearly non-CS input
```

Prompts are TypeScript functions, not template literals — see `SYSTEM_ARCHITECTURE.md §5.2`.

**Day 33 checkpoint:** Both prompt functions work. Validators correctly reject invalid inputs.

---

### Week 8: AI Lecture Explainer

**Day 34–35: Explainer API route**

```
Step 1: Build POST /api/ai/explain route skeleton (auth check + return empty)
Step 2: Add Zod validation for request body
Step 3: Add rate limit check (checkRateLimit → 429 if exceeded)
Step 4: Add input validation (validateExplainerInput → 422 if rejected)
Step 5: Build system prompt with buildExplainerPrompt()
Step 6: Call callAI() with system prompt + user input
Step 7: Parse AI response into structured output shape
Step 8: Log interaction to ai_interactions
Step 9: Return structured JSON

Test the route directly with curl/Postman before building UI:
curl -X POST http://localhost:3000/api/ai/explain \
  -H "Content-Type: application/json" \
  -d '{"input": "힙 정렬이란?", "depth": "intermediate", "code_language": "python", "bilingual": true}'
```

**Response parsing strategy:** The AI returns text. Parse it into the structured shape (concept, explanation, code_example, key_points). Use a consistent output format in the system prompt to make parsing reliable.

**Day 34–35 checkpoint:** Route returns structured JSON. Korean input works. Rate limiting triggers at 20 requests. Invalid input returns 422.

**Day 36–37: Explainer UI**

```
Install: (no new packages needed — react-markdown already installed)

Step 1: Build ExplainerInput component (textarea + depth selector + language selector + bilingual toggle)
Step 2: Build ExplanationOutput component (renders structured JSON: concept header, explanation, code block, key points list)
Step 3: Build loading state (progress bar + label "Generating explanation...")
Step 4: Build error state (message + retry button)
Step 5: Wire form submit to POST /api/ai/explain via fetch
Step 6: Wire "Save to Vault" button to createVaultNote Server Action with source='ai_generated'

Build order within the page:
- Get the layout right with static mock data first
- Then wire the API call
- Then handle loading/error states
- Then wire Save to Vault
```

**Handling the 10-second wait:** Use an `isLoading` state. Disable the submit button during loading. Show the progress bar. Do not stream — parse the full response and render it at once (streaming adds significant complexity with no UX benefit for 10-second responses).

**Day 36–37 checkpoint:** Full explainer flow works. Output saves to vault correctly. Error state shows when AI is unavailable.

**Day 38: Explainer polish**

```
Step 1: Add code syntax highlighting to code blocks (install react-syntax-highlighter)
Step 2: Test with 5 different Korean CS terms — verify output quality
Step 3: Test bilingual mode — verify Korean term appears alongside English
Step 4: Test error handling — disconnect internet → verify error state (not blank screen)
Step 5: Verify saved vault notes have source='ai_generated'
```

```bash
npm install react-syntax-highlighter @types/react-syntax-highlighter
```

**Day 38 checkpoint:** Code blocks render with syntax highlighting. AI output quality is acceptable for Korean CS terms. Error handling works.

---

### Week 9: Career Roadmap Generator

**Day 39–40: Roadmap API route**

The roadmap endpoint is more complex than the explainer because it:
1. Generates structured output (phases + items)
2. Saves to database (roadmap_sessions + roadmap_items)
3. Must deactivate previous active roadmap

```
Step 1: Build POST /api/ai/roadmap route skeleton
Step 2: Add Zod validation for all 6 input fields
Step 3: Add rate limit check (5/hour)
Step 4: Build roadmap system prompt with all inputs injected
Step 5: Call callAI() — use OPENROUTER_DEFAULT_MODEL (higher quality model)
Step 6: Parse AI response into phases + items structure
Step 7: Insert roadmap_session record
Step 8: Insert all roadmap_item records in a single batch insert
Step 9: Deactivate previous active session (UPDATE is_active = false WHERE user_id = ...)
Step 10: Return full structured roadmap
```

**AI output parsing is the hardest part of this route.** The prompt must instruct the AI to return JSON in a specific schema. Validate the parsed output with Zod before inserting to the database. If parsing fails, return a 503 error — do not insert malformed data.

**Day 39–40 checkpoint:** Route generates roadmap, saves to database. Previous session deactivated. Route tested directly with curl.

**Day 41–42: Roadmap GET routes + completion tracking**

```
Step 1: Build GET /api/roadmap (list of sessions with progress calculation)
Step 2: Build GET /api/roadmap/:id (full session with all items)
Step 3: Build toggleRoadmapItem Server Action (updates completed + completed_at)
Step 4: Build updateRoadmapSessionName Server Action
Step 5: Build deleteRoadmapSession Server Action
```

**Day 41–42 checkpoint:** GET routes return correct data with progress percentage. Toggle works and persists.

**Day 43–45: Roadmap UI**

```
Step 1: Build RoadmapForm component (5 fields, Zod validation)
Step 2: Build loading state specific to roadmap (15-second wait → show "Building your roadmap...")
Step 3: Build RoadmapView component (list of phases)
Step 4: Build PhaseCard component (phase header with progress + collapsible item list)
Step 5: Build roadmap item row (checkbox + title + description)
Step 6: Wire item checkbox to toggleRoadmapItem Server Action
Step 7: Build history sidebar (previous sessions list, click to load)
Step 8: Wire overall completion % to dashboard GoalProgress widget
```

**Day 43–45 checkpoint:** Full roadmap generation flow works. Items can be checked off. Dashboard shows roadmap progress. History is accessible.

**Phase 2 complete when:** Both AI features work end-to-end. Rate limiting tested. Error states verified. AI output quality acceptable.

---

## 6. Phase 3: Hardening & Launch — Weeks 10–12

**Exit condition:** Production-ready application — performance audited, accessibility audited, all error paths handled, deployed to production.

### Week 10: Performance

**Day 46–47: Bundle analysis + optimization**

```bash
# Analyze bundle size
npm install @next/bundle-analyzer
# Add to next.config.ts, run: ANALYZE=true npm run build
```

Look for: Large packages that could be lazy-loaded. Duplicate dependencies. Client components that could be server components.

```
Checks:
□ Are all data fetches in server components parallel? (no await chains)
□ Are Client Components only used where browser APIs are needed?
□ Is react-syntax-highlighter lazy-loaded? (it's large)
□ Is react-markdown only in the client bundle? (it needs to be)
□ Is the shadcn/ui import tree-shaken correctly?
```

**Day 48–50: Lighthouse audit + fixes**

Run Lighthouse on every main page. Target: Performance > 90.

Common fixes:
- Add `loading="lazy"` to images
- Add `sizes` prop to `next/image`
- Move large third-party scripts to dynamic import
- Fix `key` prop issues in React lists (causes re-render thrashing)

### Week 11: Error Handling + Edge Cases

**Day 51–52: Error boundaries**

```
Step 1: Add root error boundary in app/layout.tsx
Step 2: Add dashboard error boundary in (dashboard)/layout.tsx
Step 3: Add page-level error.tsx files for each route
Step 4: Test each error boundary by throwing intentionally
Step 5: Verify error pages show actionable message, not a white screen
```

**Day 53–55: Edge case walkthrough**

Execute this checklist manually:

```
□ Register with invalid email → form shows inline error
□ Register with weak password → form shows inline error
□ Login with wrong credentials → toast shows error
□ Session expires while on dashboard → redirected to login
□ Create application with missing required field → form validation triggers
□ Submit AI explainer with empty input → client validation blocks submission
□ Submit AI explainer with 2001-character input → error message shown
□ AI explainer fails (wrong API key) → error state shown, not blank screen
□ Roadmap generation fails → error state shown with retry option
□ Delete application → confirmation dialog appears before deletion
□ Open vault, search for nonexistent term → empty state shown
□ Dashboard loads with zero data → all widgets show empty states
□ Navigate to /dashboard/nonexistent-page → 404 page
□ Open application with expired session → redirected to login with return URL
```

Fix every failure before continuing.

### Week 12: Production Deployment

**Day 56–58: Production Supabase setup**

```
Step 1: Create production Supabase project (separate from development)
Step 2: Apply migrations to production project
Step 3: Configure production SMTP (Resend or similar)
Step 4: Configure Google OAuth for production domain
Step 5: Generate production TypeScript types (should match dev — verify)
Step 6: Configure Supabase Auth redirect URLs for production domain
```

**Day 59–60: Vercel production deployment**

```
Step 1: Set all environment variables in Vercel (production environment)
Step 2: Deploy to production
Step 3: Execute smoke test on production URL:
  - Register new account
  - Complete onboarding
  - Create internship application
  - Use AI explainer
  - Generate roadmap
  - Create vault note
  - Verify all data persists after logout/login
Step 4: Enable Vercel Analytics
Step 5: Verify no console errors on production
```

**Phase 3 complete when:** Smoke test passes on production URL. Lighthouse scores acceptable. All error states verified.

---

## 7. Hardware-Conscious Development Practices

**Avoid during active development:**
- Running `supabase start` (Docker eats RAM — use cloud Supabase)
- Opening multiple `npm run dev` servers simultaneously
- Running `npm run build` frequently (slow on weak CPU — only run for deployment verification)
- Installing packages you might need later (install when needed)

**Optimize your dev loop:**
```bash
# Use the Turbopack-enabled dev server (faster HMR on weak hardware)
npm run dev  # Next.js 15 uses Turbopack by default

# Keep node_modules lean — avoid dependencies with complex transitive trees
# Before installing anything: check bundle size at bundlephobia.com

# Use Supabase Table Editor instead of writing SQL queries for quick data checks
# It's faster than writing a test script and destroying it
```

**TypeScript compiler performance:**
```json
// tsconfig.json — add to reduce compile time on weak hardware
{
  "compilerOptions": {
    "incremental": true,          // Cache compiled output
    "skipLibCheck": true,         // Don't type-check node_modules
    "isolatedModules": true       // Per-file compilation (faster)
  }
}
```

---

## 8. Debugging Complexity Reduction

These patterns prevent the most common debugging nightmares in Next.js projects:

**Pattern 1: Don't mix server and client data fetching**
If a page fetches data in a server component, do not also fetch the same data in a client component `useEffect`. One source of truth per data type.

**Pattern 2: Log every Server Action result during development**
```typescript
// During development, add to every Server Action:
console.log('[Action] createApplication result:', result)
// Remove before production
```

**Pattern 3: Test API routes before building the UI that calls them**
A route that returns wrong data will cause confusing UI bugs. Verify the route response directly in the browser or with curl first.

**Pattern 4: When something breaks, check in this order:**
```
1. Browser console (client-side error?)
2. Terminal / Vercel logs (server-side error?)
3. Supabase logs (database query error?)
4. Network tab in DevTools (what did the request/response actually look like?)
5. Is RLS blocking the query? (Test in Supabase SQL Editor)
```

**Pattern 5: Keep Server Actions simple**
If a Server Action is doing more than: validate → query → revalidate, it is too complex. Extract the business logic into a utility function that can be tested independently.

---

## 9. Technical Debt Prevention Rules

**Rule 1: No `any` types.** When TypeScript can't infer a type, find out why. The answer is either a missing Supabase type or a missing interface. Fix it. `any` types hide bugs.

**Rule 2: No commented-out code in commits.** Delete dead code. Git history is the undo button.

**Rule 3: No TODO comments in committed code.** TODOs become permanent. If something needs to be done, either do it now or add it to `DEVELOPMENT_ROADMAP.md` as a post-MVP item.

**Rule 4: One responsibility per file.** A file that does data fetching, business logic, AND rendering is three files. The rule is strict in `lib/actions/` — each action file handles one domain (internships, vault, goals).

**Rule 5: Types from the database, not invented.** The `Database` type from `lib/types/database.types.ts` is the ground truth. Invent new types only for things that genuinely don't exist in the database (UI state, computed properties).

**Rule 6: Environment variables are never optional.** If a variable is required, make the application fail to start without it:
```typescript
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
if (!OPENROUTER_API_KEY) throw new Error('OPENROUTER_API_KEY is required')
```
This prevents production bugs from missing environment variables.

---

## 10. Weekly Checkpoint Format

At the end of each week, answer these questions before starting the next week:

```
WEEK [N] CHECKPOINT
Date: ____________
Branch: __________

1. COMPLETED THIS WEEK (what actually shipped):
   □ Task name → verified working in browser? YES/NO
   □ Task name → verified working in browser? YES/NO

2. BLOCKERS (unresolved, carried forward):
   - Description of blocker + what was tried

3. CONSOLE STATE:
   □ Zero browser console errors? YES/NO
   □ Zero TypeScript compiler errors? YES/NO
   □ Zero Supabase RLS errors? YES/NO

4. DATA INTEGRITY CHECK:
   □ Supabase Table Editor shows correct data? YES/NO
   □ RLS is active on all user tables? YES/NO

5. NEXT WEEK PLAN:
   - Task 1 (specific, one sentence)
   - Task 2 (specific, one sentence)
   - ...
```

Do not start Week N+1 if Week N has unchecked boxes in section 3 (console state).

---

## 11. Risk Mitigation Playbook

| Risk | Early Warning Sign | Response |
|---|---|---|
| AI output quality too low | Test responses don't match expected structure | Rewrite system prompt; add output format constraints; test with 10 diverse inputs before accepting |
| Supabase RLS blocking legitimate queries | 403 errors in API routes for authenticated users | Test in SQL Editor with `SET LOCAL "request.jwt.claims"`. Verify policy uses `auth.uid()` not hardcoded value |
| TypeScript errors from stale generated types | Type errors on Supabase query results | Re-run `supabase gen types typescript --linked > lib/types/database.types.ts` |
| Bundle size too large | Lighthouse Performance < 80 | Analyze with `@next/bundle-analyzer`; lazy-load react-syntax-highlighter and react-markdown |
| Week falling behind by 2+ days | Multiple tasks still in-progress at mid-week | Cut scope: skip non-essential polish, defer edge case handling, ship the functional core |
| AI provider rate limits during testing | 429 errors from OpenRouter | Temporarily use `meta-llama/llama-3.1-8b-instruct:free` model during development |
| Session management issues | Users get logged out unexpectedly | Check Supabase JWT expiry settings; verify `@supabase/ssr` cookie handling in middleware |
