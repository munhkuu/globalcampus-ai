# Component Architecture
## GlobalCampus AI — React Component Design

**Version:** 1.0.0  
**Status:** Active — Pre-Development  
**Last Updated:** 2026-05-08  

---

## Table of Contents

1. [Component Design Philosophy](#1-component-design-philosophy)
2. [Server vs. Client Boundary Rules](#2-server-vs-client-boundary-rules)
3. [State Ownership Model](#3-state-ownership-model)
4. [Component Tree: Dashboard](#4-component-tree-dashboard)
5. [Component Tree: Internship Tracker](#5-component-tree-internship-tracker)
6. [Component Tree: AI Lecture Explainer](#6-component-tree-ai-lecture-explainer)
7. [Component Tree: Career Roadmap](#7-component-tree-career-roadmap)
8. [Component Tree: Study Vault](#8-component-tree-study-vault)
9. [Shared Component Patterns](#9-shared-component-patterns)
10. [Props Contracts](#10-props-contracts)
11. [Data Fetching Patterns](#11-data-fetching-patterns)
12. [Form Patterns](#12-form-patterns)

---

## 1. Component Design Philosophy

### Small surface area, clear purpose

Every component answers one question: "What is this for?" If the answer requires "and", split it.

- `StatusBadge` — renders a status as a colored badge. One job.
- `ApplicationTable` — renders the application list. One job.
- `ApplicationForm` — handles create and edit. **Two jobs** — acceptable because the form is identical for both operations; splitting would create duplication.

### Props over context (at component level)

React Context is used only for truly global state (theme, current user). Feature-level data flows down as props. This makes component behavior predictable and testable in isolation.

Exception: `Toaster` (from shadcn/ui) uses Context internally. This is acceptable — it is a global notification mechanism.

### Flat component trees, not deep hierarchies

Deep nesting creates prop-drilling. If data needs to travel more than 3 levels down, either lift the data fetch to the nearest server component ancestor, or extract the deeply nested component into its own page-level component.

```
Page (Server — fetches data)
  └── FeatureShell (Server — passes data down)
        └── FeatureList (Client — renders list, handles selection)
              └── ListItem (Client — renders row)

// 3 levels is acceptable. 5+ levels means extract.
```

---

## 2. Server vs. Client Boundary Rules

### The Rule

A component is a **Server Component** unless it needs one of these:
1. `useState` or `useReducer`
2. `useEffect` or `useRef`
3. Browser event listeners (`onClick`, `onChange`, `onSubmit`)
4. Browser-only APIs (`window`, `document`, `localStorage`)
5. A library that is not SSR-compatible

Everything else is a Server Component. Server Components are simpler — they have no hydration overhead, no client bundle impact, and direct access to server resources.

### Boundary marking

The `"use client"` directive marks the boundary. Place it as deep in the tree as possible:

```tsx
// ✅ Good: Server Component does the data fetch
// Only the interactive part is a Client Component

// app/(dashboard)/internships/page.tsx — Server Component
export default async function InternshipsPage() {
  const applications = await fetchApplications()           // server-only
  return <ApplicationList initialData={applications} />    // passes data down
}

// components/internships/ApplicationList.tsx
"use client"                                               // only this boundary
export function ApplicationList({ initialData }) {
  const [filter, setFilter] = useState('all')             // client state
  // ...
}
```

```tsx
// ❌ Wrong: Making the whole page a Client Component just for a filter button
"use client"
export default function InternshipsPage() {
  const [applications, setApplications] = useState([])
  useEffect(() => {
    fetch('/api/internships').then(...)                    // all data fetching in client
  }, [])
  // This bundles everything into the client, slows first load, has no SSR benefit
}
```

### `"use client"` placement map

| Component | Server or Client | Reason |
|---|---|---|
| `app/(dashboard)/layout.tsx` | **Server** | Static shell, no interactivity |
| `app/(dashboard)/page.tsx` | **Server** | Data fetch only |
| `components/layout/Sidebar.tsx` | **Client** | `usePathname()` for active state |
| `components/layout/Header.tsx` | **Client** | User dropdown, logout button |
| `components/dashboard/PipelineStats.tsx` | **Server** | Receives data as props, renders |
| `components/dashboard/DeadlineCard.tsx` | **Server** | Receives data as props, renders |
| `components/dashboard/QuickNote.tsx` | **Client** | Form with `useState` |
| `components/dashboard/GoalProgress.tsx` | **Client** | Checkbox interaction |
| `components/internships/ApplicationTable.tsx` | **Client** | Filter state, sort state |
| `components/internships/ApplicationForm.tsx` | **Client** | Controlled form |
| `components/internships/StatusBadge.tsx` | **Server** | Pure render, no interaction |
| `components/internships/StatusFilter.tsx` | **Client** | Tab selection state |
| `components/vault/NoteCard.tsx` | **Server** | Pure render (selection handled by parent) |
| `components/vault/NoteEditor.tsx` | **Client** | Text editing, view/edit toggle |
| `components/vault/VaultSearch.tsx` | **Client** | Search input state |
| `components/explainer/ExplainerInput.tsx` | **Client** | Form with multiple `useState` |
| `components/explainer/ExplanationOutput.tsx` | **Client** | Receives AI output, renders |
| `components/roadmap/RoadmapForm.tsx` | **Client** | Form state |
| `components/roadmap/RoadmapView.tsx` | **Client** | Collapse state per phase |
| `components/roadmap/PhaseCard.tsx` | **Client** | Item completion toggle |

---

## 3. State Ownership Model

### Three types of state in this application

**1. Server state** — data that lives in the database. Managed by SWR (for client-side caching) or fetched directly in Server Components.  
**2. UI state** — transient interaction state. Managed by `useState` in the component that needs it.  
**3. URL state** — filter and sort parameters. Stored in the URL query string, not React state.

### URL state for filters (not React state)

Internship list filters (status, sort) are stored in the URL:
```
/internships?status=interview&sort=deadline&order=asc
```

This enables:
- Shareable filtered URLs
- Browser back/forward navigation restores filter state
- No state management code needed in the component

Implementation: `useSearchParams()` to read, `useRouter().push()` to update.

```tsx
// Reading filter from URL
const searchParams = useSearchParams()
const status = searchParams.get('status') ?? 'all'
const sort = searchParams.get('sort') ?? 'deadline'

// Updating filter (replaces history entry, does not add new one)
router.replace(`/internships?status=${newStatus}&sort=${sort}`)
```

### SWR as the client-side data cache

SWR fetches from API routes and caches the result. The SWR key is the URL (including query parameters). When filters change, the URL changes, which changes the SWR key, which triggers a re-fetch.

```tsx
// SWR key changes when filter changes → automatic re-fetch
const { data, isLoading } = useSWR(
  `/api/internships?status=${status}&sort=${sort}`,
  fetcher
)
```

### Server Actions for mutations

All write operations go through Server Actions. After a successful mutation, the SWR cache is invalidated via `mutate()`:

```tsx
const handleCreate = async (formData) => {
  const result = await createApplication(formData)
  if (result.success) {
    mutate('/api/internships')          // revalidate list
    mutate('/api/internships/stats')    // revalidate dashboard stats
    setSheetOpen(false)
  }
}
```

---

## 4. Component Tree: Dashboard

```
app/(dashboard)/page.tsx                              [Server Component]
│
│   Data fetched server-side (parallel):
│   ├── fetchInternshipStats()  → stats
│   └── fetchStudyGoals()       → goals
│
├── DashboardHeader                                   [Server Component]
│   └── renders: "Good morning, {displayName}"
│
├── DeadlineCard ({ deadlines })                      [Server Component]
│   └── DeadlineRow (per deadline)                    [Server Component]
│       └── DaysRemaining                             [Server Component]
│
├── QuickNote                                         [Client Component]
│   ├── state: value (string)
│   ├── state: isSubmitting (boolean)
│   └── action: createVaultNote(Server Action)
│
├── PipelineStats ({ stats })                         [Server Component]
│   └── StatusBar (per status)                        [Server Component]
│
├── GoalProgress ({ goals })                          [Client Component]
│   ├── state: goals (optimistic)
│   ├── GoalItem (per goal)                           [Client Component]
│   │   └── checkbox: toggleGoalCompleted(Server Action)
│   └── AddGoalInline                                 [Client Component]
│       └── action: createStudyGoal(Server Action)
│
└── RecentVaultEntries                                [Server Component]
    └── fetches: 3 most recent notes
    └── VaultEntryLink (per note)                     [Server Component]
```

**Key decisions:**
- Dashboard data is fetched in the Server Component (not SWR) — no loading state needed on first paint
- `QuickNote` is a Client Component because it has a textarea with controlled state
- `GoalProgress` is a Client Component because checkboxes use optimistic UI

---

## 5. Component Tree: Internship Tracker

```
app/(dashboard)/internships/page.tsx                  [Server Component]
│
│   Data: none fetched server-side
│   (list data fetched via SWR in ApplicationList)
│
├── InternshipsHeader                                  [Server Component]
│   └── title: "Internship Tracker"
│
├── InternshipsToolbar                                 [Client Component]
│   ├── state: sheetOpen (boolean)
│   ├── StatusFilter                                   [Client Component]
│   │   ├── reads: searchParams.status
│   │   └── on change: router.replace(new URL)
│   ├── SortDropdown                                   [Client Component]
│   │   └── on change: router.replace(new URL)
│   └── "+ Add Application" Button
│       └── onClick: setSheetOpen(true)
│
├── ApplicationList                                    [Client Component]
│   ├── state: sheetOpen, selectedId, sheetMode
│   ├── SWR: useSWR('/api/internships?{params}')
│   │
│   ├── ApplicationTable ({ applications })            [Client Component]
│   │   ├── ApplicationRow (per application)           [Client Component]
│   │   │   ├── StatusBadge ({ status })               [Server-compatible]
│   │   │   ├── StatusDropdown                         [Client Component]
│   │   │   │   └── on change: updateApplicationStatus(Server Action)
│   │   │   ├── Edit Button
│   │   │   │   └── onClick: openSheet(id, 'edit')
│   │   │   └── Delete Button
│   │   │       └── onClick: openDeleteDialog(id)
│   │   └── Empty State (when applications.length === 0)
│   │
│   ├── ApplicationSheet (Sheet wrapper)               [Client Component]
│   │   ├── state: open (from parent)
│   │   └── ApplicationForm                            [Client Component]
│   │       ├── mode: 'create' | 'edit'
│   │       ├── initialData: Application | null
│   │       ├── react-hook-form + Zod validation
│   │       └── on submit:
│   │           create → createApplication(Server Action)
│   │           edit   → updateApplication(Server Action)
│   │
│   └── DeleteDialog                                   [Client Component]
│       └── on confirm: deleteApplication(Server Action)

app/(dashboard)/internships/[id]/page.tsx             [Server Component]
│
│   Data: fetchApplicationById(id)
│
├── ApplicationDetail ({ application })               [Server Component]
│   ├── ApplicationFields (all detail fields)         [Server Component]
│   ├── StatusDropdown (inline update)                [Client Component]
│   │   └── on change: updateApplicationStatus(Server Action)
│   └── Timeline ({ events })                         [Server Component]
│       └── TimelineEvent (per event)                 [Server Component]
│
└── Back Link → /internships
```

**Key decisions:**
- The Sheet (slide-over panel) lives in `ApplicationList`, not in the page, because it manages the `sheetOpen` state alongside the table
- `StatusBadge` has no interactivity — it renders identically server or client. Listed as "Server-compatible" meaning it can be used without `"use client"` in parent components
- Delete confirmation is a Dialog, not inline — destructive actions require a confirmation step

---

## 6. Component Tree: AI Lecture Explainer

```
app/(dashboard)/explainer/page.tsx                    [Server Component]
│
│   Data: none (no server-side prefetch needed)
│
└── ExplainerShell                                    [Client Component]
    │
    │   State:
    │   ├── input (string)
    │   ├── depth ('beginner' | 'intermediate' | 'advanced')
    │   ├── codeLanguage (string)
    │   ├── bilingual (boolean)
    │   ├── isLoading (boolean)
    │   ├── error (string | null)
    │   └── output (ExplainerOutput | null)
    │
    ├── ExplainerInput                                [Client Component]
    │   ├── Textarea (controlled, bound to `input`)
    │   ├── DepthSelector (Select component)
    │   │   └── options: Beginner / Intermediate / Advanced
    │   ├── LanguageSelector (Select component)
    │   │   └── options: Python / Java / C++ / JavaScript / Kotlin
    │   ├── BilingualToggle (Switch component)
    │   └── "Explain" Button
    │       └── onClick: handleExplain() → POST /api/ai/explain
    │
    └── ExplanationOutput                            [Client Component]
        ├── Empty State (shown when output === null and !isLoading)
        │   └── "Paste lecture text or a Korean CS term above"
        ├── Loading State (shown when isLoading === true)
        │   └── Progress bar + "Generating explanation..."
        ├── Error State (shown when error !== null)
        │   └── Error message + "Try Again" button
        └── Result View (shown when output !== null)
            ├── ConceptTitle (output.concept)
            ├── ExplanationText (output.explanation)
            ├── CodeBlock (output.code_example)
            │   └── react-syntax-highlighter
            ├── KeyPointsList (output.key_points[])
            ├── KoreanContext (output.korean_context, if bilingual)
            └── SaveToVaultButton
                └── onClick: createVaultNote(Server Action, source='ai_generated')
```

**Key decisions:**
- The entire page is effectively one large Client Component (`ExplainerShell`) because all state is interconnected — input state drives the API call, which produces output state
- The two-column layout (Input | Output) is CSS Grid at the page level — not two separate components
- Loading and error states are managed in `ExplainerShell` and passed as props, not separate state in each child

---

## 7. Component Tree: Career Roadmap

```
app/(dashboard)/roadmap/page.tsx                      [Server Component]
│
│   Data: fetchActiveRoadmapSession() → session | null
│         fetchRoadmapHistory() → sessions[]
│
└── RoadmapShell ({ activeSession, history })         [Client Component]
    │
    │   State:
    │   ├── view: 'form' | 'roadmap'  (switches based on activeSession)
    │   ├── isGenerating (boolean)
    │   ├── historyOpen (boolean)
    │   └── viewingSessionId (string | null)
    │
    ├── RoadmapHistory (right sidebar)                [Client Component]
    │   ├── HistoryItem (per past session)            [Client Component]
    │   │   └── onClick: setViewingSessionId(id)
    │   └── "View history" toggle button
    │
    ├── [if view === 'form']
    │   └── RoadmapForm                               [Client Component]
    │       ├── react-hook-form + Zod
    │       ├── TargetRoleInput (text + datalist)
    │       ├── CompanyTypeSelect
    │       ├── SkillsInput (tag-style multi-input)
    │       ├── WeeklyHoursInput (number)
    │       ├── TimelineSelect (3 / 6 / 12 months)
    │       ├── SessionNameInput
    │       ├── LoadingState (shown during generation)
    │       │   └── "Building your roadmap..." + progress bar
    │       └── Submit Button → POST /api/ai/roadmap
    │
    └── [if view === 'roadmap']
        └── RoadmapView ({ session, items })          [Client Component]
            │
            │   State:
            │   └── expandedPhases (Set<number>)
            │
            ├── RoadmapHeader
            │   ├── SessionName (editable)            [Client Component]
            │   │   └── updateRoadmapSessionName(Server Action)
            │   ├── OverallProgress (percentage bar)
            │   └── "Generate New" Button
            │       └── onClick: setView('form')
            │
            └── PhaseList
                └── PhaseCard (per phase)             [Client Component]
                    │   State: isExpanded (from parent Set)
                    │
                    ├── PhaseHeader (clickable → toggle expand)
                    │   ├── PhaseTitle
                    │   └── PhaseProgress (X/Y items completed)
                    │
                    └── [if expanded]
                        └── ItemList
                            └── RoadmapItem (per item) [Client Component]
                                ├── Checkbox
                                │   └── onChange: toggleRoadmapItem(Server Action)
                                ├── ItemTitle
                                │   └── [completed → line-through styling]
                                └── ItemDescription (collapsible)

app/(dashboard)/roadmap/[id]/page.tsx                 [Server Component]
│   Read-only view of a historical roadmap session
│   Data: fetchRoadmapById(id)
└── RoadmapView (read-only mode, no checkboxes)       [Server Component]
```

**Key decisions:**
- `RoadmapShell` manages the `form ↔ roadmap` view toggle — this avoids a page navigation and keeps the transition smooth
- Phase expand/collapse state is `Set<number>` (set of expanded phase numbers) rather than a map — simpler to toggle and read
- Historical roadmap view (`/roadmap/[id]`) is a separate Server Component with no interactive elements — read-only

---

## 8. Component Tree: Study Vault

```
app/(dashboard)/vault/page.tsx                        [Server Component]
│
│   Data: none prefetched (vault uses SWR for search-driven fetching)
│
└── VaultShell                                        [Client Component]
    │
    │   State:
    │   ├── selectedNoteId (string | null)
    │   ├── editorMode ('view' | 'edit')
    │   ├── isCreatingNew (boolean)
    │   └── deleteDialogNoteId (string | null)
    │
    ├── VaultLeftPanel
    │   ├── VaultToolbar                              [Client Component]
    │   │   ├── VaultSearch                           [Client Component]
    │   │   │   ├── state: query (string)
    │   │   │   └── on change: updates SWR key
    │   │   └── "+ New Note" Button
    │   │       └── onClick: handleNewNote()
    │   │
    │   ├── CategoryFilter                            [Client Component]
    │   │   └── CategoryChip (per category)           [Client Component]
    │   │       └── onClick: toggleCategory(cat)
    │   │
    │   ├── NoteList (SWR-driven)                    [Client Component]
    │   │   └── NoteCard (per note)                  [Client Component]
    │   │       ├── Title
    │   │       ├── CategoryBadge
    │   │       ├── SourceBadge (AI-Generated indicator)
    │   │       ├── Timestamp
    │   │       └── onClick: setSelectedNoteId(note.id)
    │   │
    │   └── Empty State (no notes match search/filter)
    │
    └── VaultRightPanel
        ├── [if selectedNoteId === null and !isCreatingNew]
        │   └── Empty State: "Select a note or create a new one"
        │
        └── [if selectedNoteId !== null or isCreatingNew]
            └── NoteEditor                            [Client Component]
                │
                │   State:
                │   ├── localTitle (string)
                │   ├── localContent (string)
                │   ├── localCategory
                │   ├── localTags (string[])
                │   ├── isDirty (boolean — unsaved changes)
                │   └── isSaving (boolean)
                │
                ├── NoteEditorHeader
                │   ├── NoteTitle (editable input)
                │   ├── "View" / "Edit" Toggle Button
                │   ├── Save Button (shown when isDirty)
                │   │   └── onClick: updateVaultNote(Server Action)
                │   └── Delete Button
                │       └── onClick: openDeleteDialog(noteId)
                │
                ├── [if editorMode === 'view']
                │   └── MarkdownRenderer (react-markdown)
                │       └── CodeBlock (react-syntax-highlighter)
                │
                └── [if editorMode === 'edit']
                    ├── ContentTextarea (controlled)
                    ├── CategorySelect
                    └── TagInput (comma-separated → array)
```

**Key decisions:**
- The two-panel layout is managed by `VaultShell` which holds `selectedNoteId`. This means selecting a note does not cause a navigation (no URL change) — the right panel updates in place. Fast, no loading state needed.
- `isDirty` tracks unsaved changes — the Save button only appears when content has changed from its saved state. This prevents accidental saves and makes it clear when you have unsaved work.
- Creating a new note immediately shows the editor with empty fields — the note is only saved to the database when the user explicitly saves. No auto-save stub records.

---

## 9. Shared Component Patterns

### ConfirmDialog

Used for all destructive actions (delete application, delete note, delete roadmap).

```tsx
interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string                    // e.g., "Delete Application"
  description: string              // e.g., "This will permanently delete your Kakao application."
  confirmLabel?: string            // Default: "Delete"
  onConfirm: () => Promise<void>   // The action to perform
}
```

Keyboard behavior: focus defaults to "Cancel" button on open. "Delete" is accessible but not the default focus target.

### LoadingButton

A button that shows a spinner and disables itself during async operations:

```tsx
interface LoadingButtonProps extends ButtonProps {
  isLoading: boolean
  loadingText?: string             // e.g., "Saving..." (shown instead of children)
}
```

### FormError

Displays inline validation errors below form fields:

```tsx
interface FormErrorProps {
  message?: string                 // If undefined, renders nothing
}
```

### EmptyState

Consistent empty state pattern across all list views:

```tsx
interface EmptyStateProps {
  title: string                    // e.g., "No applications yet"
  description?: string             // e.g., "Start tracking your internship search."
  action?: {
    label: string                  // e.g., "Add Application"
    onClick: () => void
  }
}
```

---

## 10. Props Contracts

### `StatusBadge`

```typescript
interface StatusBadgeProps {
  status: 'applied' | 'oa' | 'interview' | 'rejected' | 'accepted'
  size?: 'sm' | 'md'              // Default: 'md'
}
```

### `ApplicationTable`

```typescript
import type { Tables } from '@/lib/types/database.types'

type Application = Tables<'internship_applications'>

interface ApplicationTableProps {
  applications: Application[]
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, status: Application['status']) => void
  isLoading?: boolean
}
```

### `ApplicationForm`

```typescript
interface ApplicationFormProps {
  mode: 'create' | 'edit'
  initialData?: Partial<Application>   // Only provided in 'edit' mode
  onSuccess: () => void                // Called after successful submit
  onCancel: () => void
}
```

### `NoteCard`

```typescript
type VaultNote = Tables<'vault_notes'>

interface NoteCardProps {
  note: VaultNote
  isSelected: boolean
  onClick: () => void
}
```

### `PhaseCard`

```typescript
type RoadmapItem = Tables<'roadmap_items'>

interface PhaseCardProps {
  phaseNumber: number
  phaseTitle: string
  items: RoadmapItem[]
  isExpanded: boolean
  onToggleExpand: () => void
  onItemToggle: (itemId: string, completed: boolean) => void
}
```

### `ExplanationOutput`

```typescript
interface ExplanationResult {
  concept: string
  explanation: string
  code_example?: string
  code_language?: string
  key_points: string[]
  korean_context?: string
  model_used: string
}

interface ExplanationOutputProps {
  result: ExplanationResult | null
  isLoading: boolean
  error: string | null
  onSaveToVault: (result: ExplanationResult) => void
  onRetry: () => void
}
```

---

## 11. Data Fetching Patterns

### Pattern 1: Server Component (preferred for initial page data)

```tsx
// app/(dashboard)/internships/page.tsx
export default async function InternshipsPage() {
  // Direct server-side fetch — no useEffect, no loading state
  const supabase = createServerClient()
  const { data: stats } = await supabase
    .from('internship_applications')
    .select('status')
  
  // Pass to Client Component for interactivity
  return <InternshipsHeader initialStats={stats} />
}
```

### Pattern 2: SWR for client-side data (used for filter-driven lists)

```tsx
// lib/hooks/useInternships.ts
export function useInternships(params: { status?: string; sort?: string }) {
  const searchParams = new URLSearchParams()
  if (params.status) searchParams.set('status', params.status)
  if (params.sort) searchParams.set('sort', params.sort)

  return useSWR<{ data: Application[]; meta: Meta }>(
    `/api/internships?${searchParams}`,
    fetcher,
    {
      revalidateOnFocus: false,     // Prevents unnecessary refetch on tab focus
      dedupingInterval: 5000,       // 5s cache before re-requesting same key
    }
  )
}
```

### Pattern 3: Optimistic updates (used for status changes)

```tsx
const { data, mutate } = useInternships(params)

const handleStatusChange = async (id: string, newStatus: ApplicationStatus) => {
  // Immediately update local cache (optimistic)
  const optimisticData = {
    ...data,
    data: data.data.map(app => 
      app.id === id ? { ...app, status: newStatus } : app
    )
  }
  await mutate(optimisticData, false)    // false = don't revalidate yet

  // Perform server update
  const result = await updateApplicationStatus(id, newStatus)

  // Revalidate regardless of result (confirms or reverts)
  await mutate()

  if (!result.success) {
    toast.error('Status update failed')
  }
}
```

---

## 12. Form Patterns

### Standard form structure

All forms use `react-hook-form` with Zod validation via `@hookform/resolvers/zod`.

```tsx
"use client"

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  company_name: z.string().min(1, 'Company name is required').max(100),
  role_title: z.string().min(1, 'Role title is required').max(150),
  // ...
})

type FormData = z.infer<typeof schema>

export function ApplicationForm({ mode, initialData, onSuccess }) {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      company_name: initialData?.company_name ?? '',
      role_title: initialData?.role_title ?? '',
      // ...
    }
  })

  const onSubmit = async (data: FormData) => {
    const result = mode === 'create'
      ? await createApplication(data)
      : await updateApplication(initialData.id, data)
    
    if (result.success) {
      toast.success(mode === 'create' ? 'Application added' : 'Application updated')
      onSuccess()
    } else {
      toast.error(result.error)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="company_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Name</FormLabel>
              <FormControl>
                <Input placeholder="Kakao Corp" {...field} />
              </FormControl>
              <FormMessage />              {/* Shows Zod validation error */}
            </FormItem>
          )}
        />
        {/* ... more fields */}
        
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <LoadingButton 
            type="submit" 
            isLoading={form.formState.isSubmitting}
            loadingText={mode === 'create' ? 'Adding...' : 'Saving...'}
          >
            {mode === 'create' ? 'Add Application' : 'Save Changes'}
          </LoadingButton>
        </div>
      </form>
    </Form>
  )
}
```

### Zod schemas live in `lib/utils/validators.ts`

Schemas are defined once and imported by both the form (client-side validation) and the Server Action (server-side validation):

```typescript
// lib/utils/validators.ts
export const createApplicationSchema = z.object({
  company_name: z.string().min(1).max(100),
  role_title: z.string().min(1).max(150),
  status: z.enum(['applied', 'oa', 'interview', 'rejected', 'accepted']),
  applied_date: z.string().optional(),
  deadline: z.string().optional(),
  // ...
})

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>
```

The Server Action uses the same schema:
```typescript
// lib/actions/internships.ts
export async function createApplication(input: unknown) {
  const parsed = createApplicationSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: 'Invalid input' }
  }
  // ...
}
```

This ensures validation is consistent between client and server without duplicating the schema definition.
