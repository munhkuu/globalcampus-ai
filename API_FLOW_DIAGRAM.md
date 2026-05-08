# API Flow Diagrams
## GlobalCampus AI — Request/Response Architecture

**Version:** 1.0.0  
**Status:** Active — Pre-Development  
**Last Updated:** 2026-05-08  

---

## Table of Contents

1. [Legend](#1-legend)
2. [Authentication Flows](#2-authentication-flows)
3. [Dashboard Data Flow](#3-dashboard-data-flow)
4. [Internship Tracker Flows](#4-internship-tracker-flows)
5. [AI Lecture Explainer Flow](#5-ai-lecture-explainer-flow)
6. [Career Roadmap Generator Flow](#6-career-roadmap-generator-flow)
7. [Study Vault Flows](#7-study-vault-flows)
8. [Error Flow Patterns](#8-error-flow-patterns)
9. [Optimistic UI Flow](#9-optimistic-ui-flow)
10. [Rate Limiting Flow](#10-rate-limiting-flow)
11. [Session Expiry Flow](#11-session-expiry-flow)
12. [Cross-Feature Integration Flows](#12-cross-feature-integration-flows)

---

## 1. Legend

```
[Browser]          = Client-side React (user's browser)
[Middleware]       = Next.js middleware.ts (edge runtime)
[Server Comp]      = Next.js Server Component (server-side render)
[Server Action]    = Next.js Server Action (server-side function)
[API Route]        = Next.js API Route handler
[Supabase]         = Supabase PostgreSQL + Auth
[OpenRouter]       = AI provider (OpenRouter / Groq)

────────►  = HTTP request / function call
◄────────  = Response / return value
- - - - ►  = Conditional path (only happens in some cases)
═════════  = Parallel execution
✓          = Success path
✗          = Error path
```

---

## 2. Authentication Flows

### 2.1 Email/Password Login

```
[Browser]               [Middleware]      [Server Action]     [Supabase Auth]
    │                       │                   │                   │
    │  Submit login form     │                   │                   │
    │──────────────────────────────────────────►│                   │
    │                       │                   │  signInWithPassword│
    │                       │                   │──────────────────►│
    │                       │                   │                   │
    │                       │                   │◄──────────────────│
    │                       │                   │  { session, user } │
    │                       │                   │                   │
    │                       │                   │  Set cookies       │
    │                       │                   │  (access_token,    │
    │                       │                   │   refresh_token)   │
    │◄──────────────────────────────────────────│                   │
    │  redirect('/dashboard')│                   │                   │
    │                       │                   │                   │
    │  GET /dashboard        │                   │                   │
    │──────────────────────►│                   │                   │
    │                       │  getSession()      │                   │
    │                       │──────────────────────────────────────►│
    │                       │◄──────────────────────────────────────│
    │                       │  { session: valid }│                   │
    │                       │                   │                   │
    │◄──────────────────────│                   │                   │
    │  Dashboard page        │                   │                   │

Error path (wrong credentials):
    │                       │                   │                   │
    │◄──────────────────────────────────────────│                   │
    │  { error: "Invalid credentials" }          │                   │
    │  Toast: "Invalid email or password"        │                   │
```

### 2.2 Google OAuth Login

```
[Browser]               [Supabase Auth]      [Google OAuth]
    │                       │                    │
    │  Click "Sign in with Google"               │
    │──────────────────────►│                    │
    │                       │  Generate OAuth URL│
    │◄──────────────────────│                    │
    │  Redirect to Google   │                    │
    │──────────────────────────────────────────►│
    │                       │                    │  User authorizes
    │                       │                    │◄──────────────────
    │◄──────────────────────────────────────────│
    │  Redirect to /auth/callback?code=XYZ       │
    │                       │                    │
    │  GET /auth/callback   │                    │
    │──────────────────────►│                    │
    │                       │  exchangeCodeForSession(code)
    │                       │──────────────────────────────────────►│
    │                       │◄──────────────────────────────────────│
    │                       │  { session, user } │
    │                       │  Set cookies        │
    │◄──────────────────────│                    │
    │  redirect('/dashboard')│                    │
```

### 2.3 Every Protected Page Request

```
[Browser]              [Middleware]         [Supabase Auth]   [Server Comp]
    │                      │                     │                 │
    │  GET /dashboard/...  │                     │                 │
    │─────────────────────►│                     │                 │
    │                      │  Read session cookie │                 │
    │                      │  getUser()          │                 │
    │                      │────────────────────►│                 │
    │                      │◄────────────────────│                 │
    │                      │  { user: valid }     │                 │
    │                      │                     │                 │
    │                      │─────────────────────────────────────►│
    │                      │  Pass request to Server Component     │
    │                      │                     │                 │
    │◄─────────────────────────────────────────────────────────────│
    │  Rendered page        │                     │                 │

Error path (no valid session):
    │                      │◄────────────────────│                 │
    │                      │  { user: null }      │                 │
    │◄─────────────────────│                     │                 │
    │  redirect('/login?returnUrl=/dashboard/...') │                 │
```

### 2.4 Token Refresh

```
[Browser]              [Middleware]         [Supabase Auth]
    │                      │                     │
    │  Any request          │                     │
    │─────────────────────►│                     │
    │                      │  getUser()          │
    │                      │  (access token expired)              │
    │                      │────────────────────►│               │
    │                      │                     │  Use refresh token
    │                      │                     │  → new access token
    │                      │◄────────────────────│               │
    │                      │  { user: valid, new cookies }       │
    │                      │  Update cookie      │               │
    │◄─────────────────────│                     │               │
    │  Normal response      │                     │               │
```

The Supabase SSR package handles this automatically. No application code needed.

---

## 3. Dashboard Data Flow

### 3.1 Initial Dashboard Load

```
[Browser]          [Server Component: page.tsx]      [Supabase]
    │                         │                          │
    │  GET /dashboard          │                          │
    │────────────────────────►│                          │
    │                         │═══════════════════════   │
    │                         │  (Parallel queries)  ║   │
    │                         │─────────────────────╗║──►│ Query: internship_applications
    │                         │                     ║║   │ (status counts + deadlines)
    │                         │─────────────────────╣║──►│ Query: study_goals
    │                         │                     ║║   │ (active goals)
    │                         │─────────────────────╝║──►│ Query: vault_notes
    │                         │                      ║   │ (3 most recent)
    │                         │◄═════════════════════╝   │
    │                         │  All results returned    │
    │                         │                          │
    │◄────────────────────────│                          │
    │  Fully rendered HTML     │                          │
    │  (no loading spinners)   │                          │
```

**Key insight:** Because all data fetching happens in the Server Component before HTML is sent, the browser receives a fully rendered page. There are no loading skeletons for the initial load.

### 3.2 Dashboard After Mutation (SWR Revalidation)

```
[Browser: GoalProgress]    [Server Action]    [Next.js Cache]    [Supabase]
    │                           │                  │                 │
    │  Check off goal           │                  │                 │
    │──────────────────────────►│                  │                 │
    │  (optimistic: goal        │                  │                 │
    │   shows checked)          │                  │                 │
    │                           │  UPDATE study_goals
    │                           │  SET completed = true
    │                           │─────────────────────────────────►│
    │                           │◄─────────────────────────────────│
    │                           │  { success }     │                 │
    │                           │                  │                 │
    │                           │  revalidatePath('/dashboard')     │
    │                           │─────────────────►│                 │
    │◄──────────────────────────│                  │                 │
    │  Return success            │                  │                 │
    │                           │                  │                 │
    │  (Next.js re-renders dashboard server component in background) │
```

---

## 4. Internship Tracker Flows

### 4.1 Load Application List (SWR)

```
[Browser: ApplicationList]     [API Route]         [Supabase]
    │                              │                    │
    │  useSWR('/api/internships?   │                    │
    │   status=interview&sort=     │                    │
    │   deadline')                 │                    │
    │─────────────────────────────►│                    │
    │                              │  Validate session  │
    │                              │  Parse query params│
    │                              │─────────────────►│
    │                              │  SELECT * FROM     │
    │                              │  internship_apps   │
    │                              │  WHERE user_id = $1│  ← RLS enforces this
    │                              │  AND status = $2   │
    │                              │  ORDER BY deadline │
    │                              │◄─────────────────│
    │◄─────────────────────────────│                    │
    │  { data: [...], meta: {...} } │                    │
    │                              │                    │
    │  SWR caches result           │                    │
    │  Table renders               │                    │
```

### 4.2 Create Application

```
[Browser: ApplicationForm]   [Server Action]        [Supabase]        [SWR Cache]
    │                              │                    │                  │
    │  Submit form                 │                    │                  │
    │─────────────────────────────►│                    │                  │
    │                              │  1. Validate auth  │                  │
    │                              │  2. Parse + Zod    │                  │
    │                              │  3. INSERT app     │                  │
    │                              │─────────────────►│                  │
    │                              │◄─────────────────│                  │
    │                              │  { new_app }      │                  │
    │                              │                    │                  │
    │                              │  4. INSERT timeline_event             │
    │                              │     (from_status: null,               │
    │                              │      to_status: 'applied')            │
    │                              │─────────────────►│                  │
    │                              │◄─────────────────│                  │
    │                              │                    │                  │
    │                              │  5. revalidatePath('/internships')    │
    │                              │  6. revalidatePath('/dashboard')      │
    │◄─────────────────────────────│                    │                  │
    │  { success: true }           │                    │                  │
    │                              │                    │                  │
    │  Close Sheet                 │                    │                  │
    │  mutate('/api/internships')  │                    │──────────────────►│
    │  (re-fetches from API)       │                    │                  │ invalidate
    │  Table updates               │                    │                  │
```

### 4.3 Status Update (Optimistic UI)

```
[Browser: StatusDropdown]   [SWR Cache]    [Server Action]    [Supabase]
    │                           │               │                 │
    │  Select new status        │               │                 │
    │                           │               │                 │
    │  STEP 1: Optimistic update│               │                 │
    │──────────────────────────►│               │                 │
    │  mutate(optimisticData)   │               │                 │
    │  (UI shows new status     │               │                 │
    │   immediately)            │               │                 │
    │                           │               │                 │
    │  STEP 2: Server call      │               │                 │
    │──────────────────────────────────────────►│                 │
    │                           │               │  UPDATE status  │
    │                           │               │─────────────────►│
    │                           │               │◄─────────────────│
    │                           │               │  { success }    │
    │                           │               │                 │
    │                           │               │  INSERT timeline_event
    │                           │               │─────────────────►│
    │                           │               │◄─────────────────│
    │◄──────────────────────────────────────────│                 │
    │  { success: true }        │               │                 │
    │                           │               │                 │
    │  STEP 3: Confirm cache    │               │                 │
    │──────────────────────────►│               │                 │
    │  mutate() [revalidate]    │               │                 │
    │                           │               │                 │

Error path (server update fails):
    │◄──────────────────────────────────────────│                 │
    │  { success: false }       │               │                 │
    │                           │               │                 │
    │  ROLLBACK: mutate()       │               │                 │
    │──────────────────────────►│               │                 │
    │  (re-fetches real data)   │               │                 │
    │  UI reverts to original   │               │                 │
    │                           │               │                 │
    │  toast.error('Failed')    │               │                 │
```

---

## 5. AI Lecture Explainer Flow

### 5.1 Complete Explanation Request

```
[Browser: ExplainerShell]   [API Route: /api/ai/explain]   [Supabase]   [OpenRouter]
    │                                   │                       │             │
    │  Click "Explain"                  │                       │             │
    │  setIsLoading(true)               │                       │             │
    │  Show progress bar                │                       │             │
    │                                   │                       │             │
    │  POST /api/ai/explain             │                       │             │
    │  { input, depth, codeLanguage,    │                       │             │
    │    bilingual }                    │                       │             │
    │──────────────────────────────────►│                       │             │
    │                                   │                       │             │
    │                                   │  1. Validate auth     │             │
    │                                   │     getUser()         │             │
    │                                   │────────────────────►│             │
    │                                   │◄────────────────────│             │
    │                                   │  { user }            │             │
    │                                   │                       │             │
    │                                   │  2. Check rate limit  │             │
    │                                   │     COUNT ai_interactions           │
    │                                   │     WHERE user_id = $1              │
    │                                   │     AND feature = 'explainer'       │
    │                                   │     AND created_at > now() - 1hr    │
    │                                   │────────────────────►│             │
    │                                   │◄────────────────────│             │
    │                                   │  { count: 4 }        │             │
    │                                   │  (under limit: 20)   │             │
    │                                   │                       │             │
    │                                   │  3. Validate input    │             │
    │                                   │     validateExplainerInput(input)   │
    │                                   │  { valid: true }      │             │
    │                                   │                       │             │
    │                                   │  4. Build prompt      │             │
    │                                   │     buildExplainerPrompt(params)    │
    │                                   │                       │             │
    │                                   │  5. Call AI           │             │
    │                                   │     callAI(messages)  │             │
    │                                   │──────────────────────────────────►│
    │                                   │                       │    ~5-10s   │
    │                                   │◄──────────────────────────────────│
    │                                   │  { content, tokens }  │             │
    │                                   │                       │             │
    │                                   │  6. Parse response    │             │
    │                                   │     → ExplanationResult structure   │
    │                                   │                       │             │
    │                                   │  7. Log interaction   │             │
    │                                   │     INSERT ai_interactions          │
    │                                   │────────────────────►│             │
    │                                   │◄────────────────────│             │
    │                                   │                       │             │
    │◄──────────────────────────────────│                       │             │
    │  { data: ExplanationResult }      │                       │             │
    │                                   │                       │             │
    │  setOutput(result)                │                       │             │
    │  setIsLoading(false)              │                       │             │
    │  Render ExplanationOutput         │                       │             │
```

### 5.2 Save to Vault After Explanation

```
[Browser: SaveToVaultButton]  [Server Action: createVaultNote]  [Supabase]
    │                                      │                        │
    │  Click "Save to Vault"               │                        │
    │─────────────────────────────────────►│                        │
    │                                      │  1. Validate auth      │
    │                                      │  2. INSERT vault_notes │
    │                                      │     { title: concept,  │
    │                                      │       content: formatted explanation,
    │                                      │       category: 'algorithms',
    │                                      │       source: 'ai_generated' }
    │                                      │───────────────────────►│
    │                                      │                        │  trigger:
    │                                      │                        │  search_vector populated
    │                                      │◄───────────────────────│
    │                                      │  { new_note }          │
    │                                      │  revalidatePath('/vault')
    │◄─────────────────────────────────────│                        │
    │  { success: true }                   │                        │
    │                                      │                        │
    │  Button shows "Saved ✓"              │                        │
    │  (temporary state, reverts after 2s) │                        │
```

---

## 6. Career Roadmap Generator Flow

### 6.1 Roadmap Generation

```
[Browser: RoadmapForm]    [API Route: /api/ai/roadmap]    [Supabase]    [OpenRouter]
    │                               │                          │               │
    │  Submit form                  │                          │               │
    │  setIsGenerating(true)        │                          │               │
    │  "Building your roadmap..."   │                          │               │
    │                               │                          │               │
    │  POST /api/ai/roadmap         │                          │               │
    │  { target_role, company_type, │                          │               │
    │    current_skills, weekly_    │                          │               │
    │    hours, timeline_months,    │                          │               │
    │    session_name }             │                          │               │
    │──────────────────────────────►│                          │               │
    │                               │  1. Auth check           │               │
    │                               │  2. Zod validation        │               │
    │                               │  3. Rate limit check (5/hr)               │
    │                               │  4. Build roadmap prompt  │               │
    │                               │     (company_type influences              │
    │                               │      Korean vs global framing)            │
    │                               │                          │               │
    │                               │  5. Call AI (default model — higher quality)
    │                               │──────────────────────────────────────────►│
    │                               │                          │    ~10-15s    │
    │                               │◄──────────────────────────────────────────│
    │                               │  { raw JSON roadmap }   │               │
    │                               │                          │               │
    │                               │  6. Parse AI response    │               │
    │                               │     Zod validate structure│               │
    │                               │                          │               │
    │                               │  7. Deactivate old session│               │
    │                               │     UPDATE roadmap_sessions               │
    │                               │     SET is_active = false │               │
    │                               │     WHERE user_id = $1   │               │
    │                               │────────────────────────►│               │
    │                               │◄────────────────────────│               │
    │                               │                          │               │
    │                               │  8. INSERT roadmap_session│               │
    │                               │────────────────────────►│               │
    │                               │◄────────────────────────│               │
    │                               │  { session_id }         │               │
    │                               │                          │               │
    │                               │  9. Batch INSERT items  │               │
    │                               │     (all phases + items) │               │
    │                               │────────────────────────►│               │
    │                               │◄────────────────────────│               │
    │                               │                          │               │
    │                               │  10. Log interaction     │               │
    │                               │  11. Return full roadmap │               │
    │◄──────────────────────────────│                          │               │
    │  { data: { session_id, phases } }                        │               │
    │                               │                          │               │
    │  setIsGenerating(false)       │                          │               │
    │  setView('roadmap')           │                          │               │
    │  Render RoadmapView           │                          │               │
```

### 6.2 Check Off Roadmap Item

```
[Browser: RoadmapItem]    [Server Action: toggleRoadmapItem]    [Supabase]
    │                                     │                          │
    │  Check checkbox                     │                          │
    │  (optimistic: item shows checked)   │                          │
    │────────────────────────────────────►│                          │
    │                                     │  UPDATE roadmap_items    │
    │                                     │  SET completed = true,   │
    │                                     │      completed_at = now()│
    │                                     │  WHERE id = $1           │
    │                                     │  AND user_id = $2        │  ← RLS + explicit check
    │                                     │─────────────────────────►│
    │                                     │◄─────────────────────────│
    │                                     │  { success }             │
    │                                     │  revalidatePath('/roadmap')
    │                                     │  revalidatePath('/dashboard')
    │◄────────────────────────────────────│                          │
    │  { success: true }                  │                          │
    │                                     │                          │
    │  Dashboard re-renders:              │                          │
    │  GoalProgress updates %             │                          │
```

---

## 7. Study Vault Flows

### 7.1 Vault Search

```
[Browser: VaultSearch]    [SWR]     [API Route: /api/vault]     [Supabase]
    │                      │                  │                      │
    │  Type "binary tree"  │                  │                      │
    │  (debounced 300ms)   │                  │                      │
    │                      │                  │                      │
    │  SWR key changes:    │                  │                      │
    │  /api/vault?q=binary+tree               │                      │
    │─────────────────────►│                  │                      │
    │                      │  GET /api/vault?q=binary+tree           │
    │                      │─────────────────►│                      │
    │                      │                  │  1. Auth check       │
    │                      │                  │  2. Full-text query  │
    │                      │                  │     WHERE user_id=$1 │
    │                      │                  │     AND search_vector│
    │                      │                  │     @@ plainto_tsquery│
    │                      │                  │     ('binary tree')  │
    │                      │                  │──────────────────────►│
    │                      │                  │◄──────────────────────│
    │                      │                  │  { notes[] }         │
    │                      │◄─────────────────│                      │
    │◄─────────────────────│                  │                      │
    │  NoteList re-renders │                  │                      │
    │  with search results │                  │                      │
```

**Debounce implementation:**
```typescript
// In VaultSearch client component
const [query, setQuery] = useState('')
const debouncedQuery = useDebounce(query, 300)  // 300ms delay

// SWR key only updates when debouncedQuery changes
const { data } = useSWR(`/api/vault?q=${debouncedQuery}`, fetcher)
```

This prevents an API request on every keystroke.

### 7.2 Create Note (Manual)

```
[Browser: NoteEditor]    [Server Action: createVaultNote]    [Supabase]    [SWR]
    │                                  │                          │            │
    │  Click "+ New Note"              │                          │            │
    │  Editor shows empty form         │                          │            │
    │                                  │                          │            │
    │  User types title + content      │                          │            │
    │  isDirty = true                  │                          │            │
    │  "Save" button appears           │                          │            │
    │                                  │                          │            │
    │  Click "Save"                    │                          │            │
    │─────────────────────────────────►│                          │            │
    │                                  │  INSERT vault_notes      │            │
    │                                  │  { title, content,       │            │
    │                                  │    category, tags,       │            │
    │                                  │    source: 'manual' }    │            │
    │                                  │─────────────────────────►│            │
    │                                  │                          │  trigger:  │
    │                                  │                          │  search_vector│
    │                                  │◄─────────────────────────│            │
    │                                  │  { new_note }            │            │
    │                                  │  revalidatePath('/vault')│            │
    │◄─────────────────────────────────│                          │            │
    │  { success: true, note }         │                          │            │
    │                                  │                          │            │
    │  setSelectedNoteId(note.id)      │                          │            │
    │  setIsCreatingNew(false)         │                          │            │
    │  isDirty = false                 │                          │            │
    │  "Save" button disappears        │                          │            │
    │                                  │                          │            │
    │  mutate('/api/vault')            │──────────────────────────────────────►│
    │  Note appears in left panel list │                          │  invalidate│
```

---

## 8. Error Flow Patterns

### 8.1 API Route Error (Network Failure)

```
[Browser]               [SWR]            [API Route]
    │                     │                   │
    │  Component mounts   │                   │
    │─────────────────────►│                   │
    │                     │  GET /api/...     │
    │                     │──────────────────►│
    │                     │                   │  Network error /
    │                     │                   │  timeout
    │                     │◄──────────────────│
    │                     │  Error            │
    │                     │                   │
    │                     │  SWR retry logic: │
    │                     │  Retry 1 (1s)     │
    │                     │──────────────────►│
    │                     │◄──────────────────│  Error again
    │                     │  Retry 2 (2s)     │
    │                     │──────────────────►│
    │                     │◄──────────────────│  Error again
    │                     │  Retry 3 (4s)     │
    │                     │──────────────────►│
    │                     │◄──────────────────│  Error again
    │                     │                   │
    │                     │  Give up          │
    │◄─────────────────────│                   │
    │  Error state renders │                   │
    │  "Failed to load data. Retry"            │
```

### 8.2 Server Action Error (Database Error)

```
[Browser: ApplicationForm]   [Server Action]    [Supabase]
    │                              │                 │
    │  Submit form                 │                 │
    │─────────────────────────────►│                 │
    │                              │  INSERT ...     │
    │                              │─────────────────►│
    │                              │                 │  DB error
    │                              │◄─────────────────│
    │                              │  { error: "..." }│
    │                              │                 │
    │                              │  catch error    │
    │                              │  log to server  │
    │◄─────────────────────────────│                 │
    │  { success: false,           │                 │
    │    error: "Something went wrong. Please try again." }
    │                              │                 │
    │  toast.error(message)        │                 │
    │  Form stays open (not closed)│                 │
    │  Submit button re-enables    │                 │
```

### 8.3 AI Provider Error

```
[Browser]        [API Route: /api/ai/explain]    [OpenRouter]
    │                       │                         │
    │  POST /api/ai/explain │                         │
    │──────────────────────►│                         │
    │                       │  callAI(messages)       │
    │                       │────────────────────────►│
    │                       │                         │  500 error /
    │                       │                         │  timeout /
    │                       │                         │  model unavailable
    │                       │◄────────────────────────│
    │                       │  throw AIProviderError  │
    │                       │                         │
    │                       │  catch error            │
    │                       │  Log to server (with details)
    │                       │  Log failed interaction to DB
    │◄──────────────────────│                         │
    │  HTTP 503             │                         │
    │  { error: {           │                         │
    │    code: "AI_UNAVAILABLE",
    │    message: "AI service is temporarily unavailable."
    │  }}                   │                         │
    │                       │                         │
    │  setError(message)    │                         │
    │  setIsLoading(false)  │                         │
    │  Show error state with │                        │
    │  "Try Again" button   │                         │
```

---

## 9. Optimistic UI Flow

### Pattern: Optimistic Status Update with Rollback

```
TIME →

T=0ms   User selects "OA" from status dropdown
        Current status: "Applied"
        
T=0ms   UI updates immediately (optimistic)
        StatusBadge shows "OA" (not yet confirmed)
        SWR cache updated with optimistic data

T=0ms   Server Action called: updateApplicationStatus(id, 'oa')

T=50ms  [Server: Auth check ✓]
T=80ms  [Server: DB UPDATE ✓]
T=90ms  [Server: INSERT timeline_event ✓]
T=100ms Server Action returns { success: true }

T=100ms SWR revalidates (fetches from API)
T=150ms API returns confirmed data
        StatusBadge shows "OA" (confirmed)
        No visual change — optimistic was correct
        
─────────────────────────────────────────────────────────────

T=0ms   [Alternative: DB Update Fails]

T=0ms   UI shows "OA" (optimistic)
T=100ms Server Action returns { success: false }

T=100ms mutate() called (re-fetch from API)
T=150ms API returns real data: status = "Applied"
        StatusBadge reverts to "Applied"
        User sees status revert

T=150ms toast.error("Status update failed")
        User knows the update didn't save
```

**The user sees:**
- Instant response (no waiting)
- Correct final state (either confirmed or reverted)
- An error message only if the update failed

---

## 10. Rate Limiting Flow

### AI Feature Rate Limit Check

```
[API Route: /api/ai/explain]                [Supabase]
    │                                            │
    │  checkRateLimit(userId, 'explainer')       │
    │                                            │
    │  SELECT COUNT(*) FROM ai_interactions      │
    │  WHERE user_id = $1                        │
    │  AND feature = 'explainer'                 │
    │  AND created_at > now() - INTERVAL '1 hour'│
    │──────────────────────────────────────────►│
    │◄──────────────────────────────────────────│
    │  { count: 4 }                              │
    │                                            │
    │  [if count < 20]:                          │
    │  ✓ Continue to AI call                     │
    │                                            │
    │  [if count >= 20]:                         │
    │  ✗ Return 429                              │
    │                                            │
    │  Calculate reset time:                     │
    │  Find oldest interaction in the window,    │
    │  reset = oldest.created_at + 1 hour        │
    │──────────────────────────────────────────►│
    │◄──────────────────────────────────────────│
    │  { oldest_created_at }                     │
    │                                            │
    │  Return:                                   │
    │  HTTP 429                                  │
    │  X-RateLimit-Limit: 20                     │
    │  X-RateLimit-Remaining: 0                  │
    │  X-RateLimit-Reset: {epoch timestamp}      │
    │  { error: { code: 'RATE_LIMITED',          │
    │    message: 'Resets at 10:00 AM' }}        │
```

---

## 11. Session Expiry Flow

### User Session Expires While Active

```
[Browser]         [Middleware]    [Supabase Auth]
    │                  │                │
    │  GET /dashboard  │                │
    │─────────────────►│                │
    │                  │  getUser()     │
    │                  │───────────────►│
    │                  │◄───────────────│
    │                  │  { user: null} │
    │                  │  (both tokens expired)
    │◄─────────────────│                │
    │  redirect('/login?returnUrl=/dashboard')
    │                  │                │
    │  User sees login page             │
    │  ReturnUrl preserved in query     │
    │                  │                │
    │  User logs in    │                │
    │─────────────────────────────────►│
    │◄─────────────────────────────────│
    │  redirect(returnUrl = '/dashboard')
    │  User lands back where they were  │
```

### Server Action Called with Expired Session

```
[Browser: Component]    [Server Action]    [Supabase Auth]
    │                        │                   │
    │  Call Server Action    │                   │
    │───────────────────────►│                   │
    │                        │  getUser()        │
    │                        │──────────────────►│
    │                        │◄──────────────────│
    │                        │  { user: null }   │
    │                        │                   │
    │                        │  return:          │
    │                        │  { success: false,│
    │                        │    error: 'Session expired. Please log in again.' }
    │◄───────────────────────│                   │
    │  { success: false }    │                   │
    │                        │                   │
    │  toast.error(message)  │                   │
    │  router.push('/login') │                   │
```

---

## 12. Cross-Feature Integration Flows

### 12.1 Explainer → Vault Integration

```
[Explainer Page]                    [Vault]
    │                                  │
    │  User gets explanation           │
    │  output: ExplanationResult       │
    │                                  │
    │  Click "Save to Vault"           │
    │                                  │
    │  createVaultNote({               │
    │    title: output.concept,        │
    │    content: formatExplanation(), │
    │    category: inferCategory(),    │
    │    source: 'ai_generated',       │
    │    tags: output.related_concepts │
    │  })                              │
    │──────────────────────────────────────────────────────────►│
    │                                  │                         │
    │  Button: "Saved ✓"              │  Note appears in Vault   │
    │  (2 second success state)        │  when next visited       │
```

**`formatExplanation()` converts the structured ExplanationResult into readable Markdown:**
```
## {concept}

{explanation}

```{codeLanguage}
{code_example}
```

### Key Points
- {key_points[0]}
- {key_points[1]}
...

{korean_context}
```

**`inferCategory()` maps concept type to note_category:**
```typescript
function inferCategory(concept: string, keyPoints: string[]): NoteCategory {
  const text = (concept + ' ' + keyPoints.join(' ')).toLowerCase()
  if (text.includes('sort') || text.includes('search') || text.includes('algorithm')) return 'algorithms'
  if (text.includes('tree') || text.includes('heap') || text.includes('queue')) return 'data_structures'
  if (text.includes('system') || text.includes('design') || text.includes('scale')) return 'system_design'
  return 'other'
}
```

### 12.2 Roadmap Progress → Dashboard Integration

```
[Dashboard: GoalProgress]    [API: /internships/stats]    [Supabase]
    │                                  │                      │
    │  Page load (Server Component)    │                      │
    │──────────────────────────────────────────────────────►│
    │                                  │                      │  SELECT
    │                                  │                      │  COUNT(*) FROM roadmap_items
    │                                  │                      │  WHERE user_id = $1
    │                                  │                      │  GROUP BY completed
    │                                  │◄─────────────────────│
    │                                  │  { total: 24, completed: 7 }
    │◄──────────────────────────────────────────────────────│
    │  Renders: "Roadmap: 7/24 items (29%)"                 │
    │                                  │                      │
    │  [User checks off roadmap item on /roadmap]            │
    │                                  │                      │
    │  Server Action: toggleRoadmapItem│                      │
    │  revalidatePath('/dashboard')    │                      │
    │                                  │                      │
    │  Dashboard re-renders:           │                      │
    │  "Roadmap: 8/24 items (33%)"     │                      │
```

### 12.3 Study Goals ↔ Roadmap Item Linking

```
[Roadmap View: PhaseCard]    [Server Action]    [Supabase: study_goals]
    │                              │                     │
    │  Check off roadmap item      │                     │
    │─────────────────────────────►│                     │
    │                              │  UPDATE roadmap_items SET completed=true
    │                              │                     │
    │                              │  [if roadmap_item_id is referenced in study_goals]
    │                              │  UPDATE study_goals  │
    │                              │  SET completed=true, │
    │                              │      completed_at=now()
    │                              │  WHERE roadmap_item_id = $1
    │                              │─────────────────────►│
    │                              │◄─────────────────────│
    │                              │                      │
    │                              │  revalidatePath('/dashboard')
    │                              │  revalidatePath('/roadmap')
    │◄─────────────────────────────│                      │
    │  { success }                 │                      │
    │                              │                      │
    │  Dashboard shows:            │                      │
    │  - Roadmap item: completed ✓ │                      │
    │  - Study goal: completed ✓   │                      │
```

---

## Summary: Request Classification Table

| Operation | Mechanism | Why This Choice |
|---|---|---|
| Page initial load data | Server Component direct query | No client round-trip; data on first paint |
| Filter/search-driven lists | SWR + API Route | Client needs to re-fetch on filter change |
| Create/update/delete | Server Action | Server-only; enables `revalidatePath` |
| Status update | Server Action + optimistic SWR | Needs both instant UI + server confirmation |
| AI explanation | API Route (POST) | Complex response structure; client-initiated |
| AI roadmap | API Route (POST) | Long operation; complex DB writes on success |
| Save to Vault (from Explainer) | Server Action | Simple mutation; no different from any other note create |
| Auth (login/register) | Server Action | Session cookie must be set server-side |
| Auth (OAuth) | Supabase built-in + route handler | OAuth requires server-side token exchange |
| Rate limit check | Server-side in API Route | Never trust client-side rate limiting |
| Webhook handling | API Route | External service callback |
