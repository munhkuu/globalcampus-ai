# UI/UX Guidelines
## GlobalCampus AI — Design System & Interaction Philosophy

**Version:** 1.0.0  
**Status:** Active — Pre-Development  
**Last Updated:** 2026-05-08  

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Visual Identity](#2-visual-identity)
3. [Color System](#3-color-system)
4. [Typography](#4-typography)
5. [Spacing & Layout](#5-spacing--layout)
6. [Component Patterns](#6-component-patterns)
7. [Dark Mode Strategy](#7-dark-mode-strategy)
8. [Interaction Design](#8-interaction-design)
9. [Navigation Architecture](#9-navigation-architecture)
10. [Responsive Design](#10-responsive-design)
11. [Loading & Empty States](#11-loading--empty-states)
12. [Page-by-Page Design Specifications](#12-page-by-page-design-specifications)

---

## 1. Design Philosophy

### What this product is not

GlobalCampus AI is not a consumer app. It is not trying to feel friendly, playful, or welcoming. The users are CS students under deadline pressure. They are productive people who want tools that get out of their way.

The design draws from products that CS professionals use daily: **Vercel's dashboard, Linear's issue tracker, GitHub's interface, Notion's calm surfaces.** These products share a common approach: information density without visual noise, hierarchy through whitespace rather than color, and interactions that feel mechanical and predictable.

**The design must fail these four tests:**
- Does it look like a student project? (No bold gradients, no glow effects, no hero sections)
- Does it look like a consumer wellness app? (No round avatars, no confetti, no motivational quotes)
- Does it look like a corporate enterprise tool? (No blue gradients, no clip art icons, no Comic Sans-adjacent fonts)
- Does it require reading to navigate? (No. The information hierarchy tells you where to look)

### Core design principle: Density without clutter

The users are managing 10–30 concurrent internship applications during recruiting season. They need to see status, deadline, and company name in a single row. They do not need large cards with icons and color-coded backgrounds.

Every UI decision is evaluated against: **does this help the user get the information they need faster?** If adding a visual element does not answer yes, it is removed.

---

## 2. Visual Identity

### Aesthetic reference

The platform's aesthetic is **precision-dark**: dark backgrounds, high-contrast text, minimal use of color (accent color appears only to draw attention), fine borders, clean monospace elements where code is present.

Think: a terminal that grew up, not a marketing site that went dark.

### What "professional" means in this context

- Borders are visible but thin (1px, not 2px)
- Surfaces are slightly different shades, not dramatically contrasting panels
- Color is used for signal, not decoration (green = accepted, red = rejected — and that's it)
- Motion is used for orientation, not entertainment (a panel sliding in is navigation, not performance)

---

## 3. Color System

All colors are defined as CSS custom properties in `globals.css`. Tailwind's theme config references these variables — no hardcoded hex values in component code.

### 3.1 CSS Custom Properties

```css
/* globals.css */

:root {
  /* Base surfaces */
  --background: 0 0% 3.9%;         /* Near-black base */
  --surface-1: 0 0% 6%;            /* Card backgrounds */
  --surface-2: 0 0% 9%;            /* Input backgrounds, hover states */
  --surface-3: 0 0% 13%;           /* Active state backgrounds */

  /* Borders */
  --border: 0 0% 14.9%;            /* Default border */
  --border-muted: 0 0% 12%;        /* Subtle dividers */

  /* Text */
  --foreground: 0 0% 98%;          /* Primary text — near white */
  --foreground-muted: 0 0% 63.9%;  /* Secondary text */
  --foreground-subtle: 0 0% 45%;   /* Placeholder text, metadata */

  /* Accent — used sparingly */
  --accent: 217 91% 60%;           /* Blue — links, active nav, CTAs */
  --accent-foreground: 0 0% 98%;

  /* Status colors — informational only */
  --status-applied: 217 91% 60%;   /* Blue */
  --status-oa: 43 96% 56%;         /* Amber */
  --status-interview: 270 70% 65%; /* Purple */
  --status-rejected: 0 72% 51%;    /* Red */
  --status-accepted: 142 71% 45%;  /* Green */

  /* Destructive */
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 0 0% 98%;

  /* Functional */
  --ring: 217 91% 60%;             /* Focus rings */
  --radius: 0.5rem;                /* Border radius */
}
```

### 3.2 Color Usage Rules

**Accent color (`--accent`) is reserved for:**
- Active navigation item
- Primary CTA buttons
- Links
- Focus rings
- Progress indicators

**Status colors are reserved for:**
- `StatusBadge` component only
- Pipeline stats bars on dashboard
- Never used as background colors for full sections

**Text hierarchy:**
- `--foreground` — headings, primary content
- `--foreground-muted` — labels, secondary text
- `--foreground-subtle` — timestamps, metadata, placeholder text

**Rule: Never use status colors for anything other than application status.** This preserves semantic meaning. If red appears, it means "Rejected." Not danger, not error, not attention.

---

## 4. Typography

### Font choices

**Primary font:** `Inter` (via `next/font/google`)  
**Rationale:** Inter is the industry standard for SaaS dashboards. It is designed for screen rendering at small sizes, has excellent readability at 14px (our body text size), and has wide Unicode coverage for Korean characters.

**Monospace font:** `JetBrains Mono` (via `next/font/google`)  
**Use:** Code blocks in Lecture Explainer output, code examples in vault notes, ID displays.

**No custom display font.** The dashboard is not a marketing page. Using a distinct display font signals "designed for impression" rather than "designed for use."

### Type Scale

All sizes defined as Tailwind utilities mapping to CSS variables:

| Token | Size | Weight | Use |
|---|---|---|---|
| `text-xs` | 11px | 400 | Metadata, timestamps, counts |
| `text-sm` | 13px | 400 | Body text, form labels, table content |
| `text-sm font-medium` | 13px | 500 | Navigation items, button labels |
| `text-base` | 15px | 400 | Primary body text |
| `text-lg font-semibold` | 18px | 600 | Card headings, section titles |
| `text-xl font-bold` | 20px | 700 | Page titles |
| `text-2xl font-bold` | 24px | 700 | Dashboard greeting, hero stat |

**Maximum heading size on the dashboard is `text-xl`.** This is intentional. The dashboard is a tool, not a landing page. Large headings waste space that belongs to data.

### Korean Text

Korean text (in vault notes, lecture explainer) renders correctly in Inter. No separate font loading is required. Ensure `lang` attribute is set on elements containing Korean text for proper browser rendering and screen reader support.

---

## 5. Spacing & Layout

### 5.1 Spacing System

Use only Tailwind's default spacing scale. Do not introduce custom spacing values.

**Page layout:**
- Sidebar width: `w-56` (224px)
- Main content max-width: `max-w-6xl` (1152px)
- Content padding: `p-6` (24px) on desktop
- Section gap: `gap-6`
- Card internal padding: `p-4` or `p-5`

**Component spacing:**
- Between list items: `gap-2` (8px)
- Between card sections: `gap-4` (16px)
- Between form fields: `gap-3` (12px)
- Table row height: 40px (implicit via `py-2.5`)

### 5.2 Grid System

The dashboard uses a 12-column CSS grid for the stats section:

```
┌─────────────────────────────────────────────────────┐
│  Upcoming Deadlines (7 cols) │ Quick Note (5 cols)  │
├─────────────────────────────────────────────────────┤
│  Pipeline Stats (4 cols) │ Goals (4 cols) │ Rec (4) │
└─────────────────────────────────────────────────────┘
```

This is implemented as `grid grid-cols-12 gap-6` with children using `col-span-*` utilities.

---

## 6. Component Patterns

### 6.1 Cards

All content surfaces use the `Card` shadcn/ui component. Cards have:
- Background: `--surface-1`
- Border: 1px `--border`
- Border radius: `--radius` (8px)
- No box shadow (shadows are a Web 2.0 pattern; borders do this job better in dark mode)

```tsx
<Card className="border border-border bg-surface-1">
  <CardHeader className="pb-3">
    <CardTitle className="text-sm font-medium text-muted-foreground">
      Upcoming Deadlines
    </CardTitle>
  </CardHeader>
  <CardContent>
    {/* content */}
  </CardContent>
</Card>
```

### 6.2 Status Badge

The `StatusBadge` component maps application status to a colored badge. It is the only component allowed to use status colors.

```tsx
const STATUS_CONFIG = {
  applied:   { label: 'Applied',   class: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  oa:        { label: 'OA',        class: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  interview: { label: 'Interview', class: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  rejected:  { label: 'Rejected',  class: 'bg-red-500/10 text-red-400 border-red-500/20' },
  accepted:  { label: 'Accepted',  class: 'bg-green-500/10 text-green-400 border-green-500/20' },
}
```

Pattern: colored text on a 10% opacity matching background, thin matching border. This is subtle — it signals status without screaming it.

### 6.3 Buttons

Three button variants in use:

- **Primary:** Filled accent background — use for the single most important action on a page
- **Secondary (outline):** Border-only — use for secondary actions
- **Ghost:** No border, no background — use for tertiary actions (cancel, clear)

**Rule:** Maximum one primary button per page section. If there are two CTAs of equal importance, make both secondary and use positioning to imply hierarchy.

### 6.4 Forms

Form layout follows a consistent pattern:
- Label above input (not inline, not floating)
- Labels use `text-sm font-medium text-foreground`
- Helper text uses `text-xs text-muted-foreground`
- Error text uses `text-xs text-destructive` and appears below the input
- Required field indicator: asterisk (*) in muted foreground, not red (avoids alarm signaling for routine fields)

### 6.5 Tables

The internship application list is a table, not a card grid. Grids work for browsing. Tables work for scanning and comparing. Students comparing 15 applications by deadline + status need a table.

Table design:
- Header row: `text-xs font-medium text-muted-foreground uppercase tracking-wide`
- Row hover: `hover:bg-surface-2` — subtle, not jarring
- Row height: compact (40px) — maximize data density
- Status column uses `StatusBadge`
- Deadline column highlights dates within 7 days in amber

### 6.6 Empty States

Every list view has an empty state. Empty states are minimal and instructional:
- Brief label: "No applications yet"
- One line of context: "Start tracking your internship search."
- One action button: "Add Application"
- No illustrations, no large icons, no motivational text

---

## 7. Dark Mode Strategy

Dark mode is the **default and only mode** for MVP. This is a deliberate product decision, not a design constraint. The target users are CS students — the demographic with the highest dark mode adoption rate. It also eliminates the implementation overhead of a theme toggle and the design overhead of maintaining two complete color systems.

If a theme toggle is requested post-MVP, the CSS variable system makes it straightforward: add `:root.light { ... }` overrides and a toggle that adds/removes the `.light` class on the HTML element.

**Implementation:** `class="dark"` is set on `<html>` in the root layout. Tailwind's `dark:` variants are not needed — all colors are handled via CSS variables that are already scoped to dark by default.

---

## 8. Interaction Design

### 8.1 Feedback Hierarchy

Every user action must receive feedback within 100ms. Acceptable feedback forms:

| Action | Feedback | Timing |
|---|---|---|
| Button click | Visual press state | Immediate |
| Form submit | Loading spinner on button + button disabled | Immediate |
| Data save | Toast notification ("Saved") | On success |
| Status update | Optimistic UI change + toast | Immediate (UI) / async (confirm) |
| Delete | Confirmation dialog → success toast | After confirm |
| AI generation | Streaming skeleton or progress indicator | During generation |

### 8.2 Toast Notifications

Toasts appear bottom-right. They are:
- **4 seconds** auto-dismiss for success messages
- **Persistent until dismissed** for errors
- Maximum 2 toasts visible simultaneously

Toast variants: success (green icon), error (red icon), info (blue icon). No warning toast — upgrade to error or downgrade to info.

### 8.3 Optimistic UI

Status updates in the internship tracker are optimistic: the UI reflects the new status immediately, before the database confirms the write. If the write fails, the status reverts and an error toast appears.

This is implemented via SWR's `mutate` function with an optimistic data argument:

```tsx
const handleStatusChange = async (newStatus: ApplicationStatus) => {
  // Immediately update UI
  await mutate(
    `/api/internships/${id}`,
    { ...application, status: newStatus },
    false // don't revalidate yet
  )
  // Trigger server update
  const result = await updateApplicationStatus(id, newStatus)
  // On success, revalidate; on failure, rollback + error toast
  await mutate(`/api/internships/${id}`)
  if (!result.success) {
    toast.error('Status update failed. Changes reverted.')
  }
}
```

### 8.4 Keyboard Navigation

The entire application must be navigable via keyboard:
- `Tab` / `Shift+Tab` between interactive elements
- `Enter` / `Space` to activate buttons and selects
- `Escape` to dismiss modals and dropdowns
- Arrow keys within dropdown menus

Focus rings: visible, 2px, using `--ring` color. The default focus ring is never removed — only replaced with a more visible custom ring.

### 8.5 Confirmations

Destructive actions (delete application, delete vault note, delete roadmap) require a confirmation dialog. The dialog:
- Shows what will be deleted
- Has a clearly labeled "Delete" button in destructive variant
- Has a "Cancel" button in ghost variant
- Defaults keyboard focus to "Cancel" (not "Delete")

---

## 9. Navigation Architecture

### 9.1 Sidebar Structure

The sidebar is the primary navigation element. It is fixed-width (`w-56`) on desktop, hidden on mobile (replaced by a bottom nav or hamburger).

```
┌──────────────────┐
│  GlobalCampus AI │  ← Logo + wordmark
│  ─────────────── │
│  Dashboard       │  ← active state: accent left border + accent text
│  Internships     │
│  Lecture AI      │
│  Career Roadmap  │
│  Study Vault     │
│  ─────────────── │
│                  │
│  ─────────────── │
│  [Avatar] Munkh  │  ← User menu (settings, logout)
└──────────────────┘
```

**Active state:** Left border 2px accent color + text in accent color. No background change on active item — the border is sufficient signal.

**Hover state:** `bg-surface-2` — subtle background shift.

### 9.2 Breadcrumbs

Breadcrumbs appear on detail pages (single application view, single note view). Format:
`Internships / Kakao Backend Intern`

The page title is always the last breadcrumb segment and is not a link.

---

## 10. Responsive Design

The platform targets desktop-first (students at laptops or desktop computers). Responsive breakpoints exist but mobile is a secondary concern for MVP.

| Breakpoint | Behavior |
|---|---|
| `< 768px` (mobile) | Sidebar collapses. Bottom navigation bar. Tables become stacked cards. |
| `768px – 1024px` (tablet) | Sidebar collapses to icon-only mode. Content uses full width. |
| `> 1024px` (desktop) | Full sidebar. Standard grid layout. |

Mobile users can access all features. The experience is functional but not optimized — mobile app optimization is a post-MVP milestone.

---

## 11. Loading & Empty States

### 11.1 Loading Skeletons

Skeleton loading is used for data that loads after navigation. The skeleton mirrors the exact shape of the content it will replace:

- Internship table: 5 skeleton rows of the same height as real rows
- Dashboard stats: skeleton rectangles in card shapes
- AI output: animated pulse in the output container

Do not use generic spinners for content areas. Spinners are acceptable only for button loading states.

### 11.2 AI Loading State

The Lecture Explainer and Roadmap Generator have special loading states because the wait is 5–15 seconds:

- A subtle progress animation (not a spinner — an indeterminate progress bar)
- Text label: "Generating explanation..." or "Building your roadmap..."
- The button that triggered the action becomes disabled and shows a minimal spinner

Do not show "AI is thinking" or any anthropomorphized language. The system is processing an API request — describe it as such in the UI if description is needed at all.

### 11.3 Error States

Error states for failed data fetches show:
- Brief error label: "Failed to load applications"
- A retry button
- No stack traces, no error codes visible to the user

Error states for failed AI requests show:
- Label: "Something went wrong. Please try again."
- A retry button
- Specificity only if actionable: "Input too long (max 2000 characters)" rather than a generic error when length validation fails

---

## 12. Page-by-Page Design Specifications

### Dashboard (`/`)

Layout: 12-column grid, no scrolling required on 1080p.

Top row (full width):
- Greeting: "Good morning, Munkh." in `text-xl font-semibold`
- Date in `text-sm text-muted-foreground`

Row 1 (7:5 split):
- Upcoming Deadlines card: list of applications with deadlines in next 14 days
- Quick Note card: textarea + "Save to Vault" button

Row 2 (4:4:4 split):
- Application Pipeline: status counts as horizontal bar with labels
- Active Study Goals: list with toggle checkboxes
- Recent Vault Entries: 3 most recent notes, title only, click to open

---

### Internship Tracker (`/internships`)

Full-width table. Toolbar above table: status filter tabs + sort dropdown + "+ Add Application" button.

Table columns: Company | Role | Status | Applied Date | Deadline | Actions

"+ Add Application" opens a right-side slide-over panel (not a modal — the table remains visible for reference).

Status filter tabs: All | Applied | OA | Interview | Accepted | Rejected — clicking filters the table instantly (client-side, no reload).

---

### AI Lecture Explainer (`/explainer`)

Two-column layout: input panel (left, ~40%) + output panel (right, ~60%).

Input panel:
- Label: "Paste lecture text or a Korean CS term"
- Textarea (8 rows)
- Controls: Depth selector (Beginner/Intermediate/Advanced), Code Language selector, Bilingual toggle
- "Explain" button (primary)

Output panel:
- Empty state with instructions when no output yet
- After generation: structured output with concept title, explanation, code block, key points
- "Save to Vault" button below output

---

### Career Roadmap (`/roadmap`)

Two views: Form (for generation) and Roadmap Display (after generation).

Generation form: single-page form with 5 fields, clean and uncluttered. Submit triggers API call and shows loading state. On completion, transitions to Roadmap Display.

Roadmap Display: Vertical list of collapsible phases. Each phase has a header with completion percentage. Phase items are shown as checkable rows. Checked items show `line-through` styling. Progress bar at top shows overall completion.

History sidebar (right, collapsible): Previous roadmap sessions listed by name + date. Click to load a historical roadmap in read-only mode.

---

### Study Vault (`/vault`)

Left panel: Search bar + filter controls (category, source, tags). Note list below — compact rows showing title, category badge, and timestamp.

Right panel: Note editor/viewer. When a note is selected, it fills the right panel with a markdown editor (edit mode) or rendered preview (view mode). Toggle between edit and view via a button in the panel header.

"New Note" button opens a blank editor in the right panel.

This two-panel layout keeps the user in context. Navigating between notes does not trigger a full page reload.
