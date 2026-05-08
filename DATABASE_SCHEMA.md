# Database Schema
## GlobalCampus AI — Supabase / PostgreSQL

**Version:** 1.0.0  
**Status:** Active — Pre-Development  
**Last Updated:** 2026-05-08  
**Database:** PostgreSQL 15 (via Supabase)  

---

## Table of Contents

1. [Design Principles](#1-design-principles)
2. [Entity Relationship Overview](#2-entity-relationship-overview)
3. [Table Specifications](#3-table-specifications)
4. [Indexes](#4-indexes)
5. [Row-Level Security Policies](#5-row-level-security-policies)
6. [Enums](#6-enums)
7. [Full SQL Migration](#7-full-sql-migration)
8. [TypeScript Types (Generated)](#8-typescript-types-generated)
9. [Data Lifecycle Notes](#9-data-lifecycle-notes)

---

## 1. Design Principles

**User isolation is the primary constraint.** Every table that stores user-created content contains a `user_id` column that references `auth.users(id)`. Row-Level Security policies use this column to ensure a user's queries never return another user's records, regardless of what the application code does.

**No soft deletes in MVP.** Soft deletes (an `is_deleted` boolean) add query complexity and require discipline to filter consistently across the codebase. At MVP scale, hard deletes are simpler and correct. If audit logs become a requirement, a separate `deleted_records` table can be introduced.

**Timestamps are UTC everywhere.** All `created_at` and `updated_at` columns use `TIMESTAMPTZ` (timestamp with time zone) defaulting to `now()`. Display formatting to the user's local timezone is handled at the UI layer.

**Auto-update `updated_at`.** A reusable trigger function `update_updated_at_column()` fires before any UPDATE on tables with an `updated_at` column. This eliminates the possibility of stale timestamps from application bugs.

**IDs are UUIDs.** Using UUID primary keys (via `gen_random_uuid()`) means:
- IDs can be generated client-side if needed (for optimistic UI)
- No sequential integer enumeration attacks
- Consistent with Supabase's auth.users ID format

---

## 2. Entity Relationship Overview

```
auth.users (Supabase managed)
    │
    ├── user_profiles (1:1)
    │
    ├── internship_applications (1:many)
    │       └── application_timeline_events (1:many)
    │
    ├── vault_notes (1:many)
    │
    ├── study_goals (1:many)
    │
    ├── roadmap_sessions (1:many)
    │       └── roadmap_items (1:many)
    │
    └── ai_interactions (1:many)
```

---

## 3. Table Specifications

---

### 3.1 `user_profiles`

Stores user-level preferences and metadata not managed by Supabase Auth. This is a 1:1 extension of `auth.users`.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | UUID | NO | — | References `auth.users(id)`, also PK |
| `display_name` | TEXT | YES | NULL | User's preferred display name |
| `university` | TEXT | YES | NULL | e.g., "KAIST", "Yonsei University" |
| `graduation_year` | SMALLINT | YES | NULL | e.g., 2026 |
| `target_role` | TEXT | YES | NULL | Primary career goal |
| `preferred_language` | TEXT | NO | 'en' | UI language preference (en/ko) |
| `onboarding_completed` | BOOLEAN | NO | FALSE | Tracks first-run completion |
| `created_at` | TIMESTAMPTZ | NO | `now()` | |
| `updated_at` | TIMESTAMPTZ | NO | `now()` | Auto-updated by trigger |

**Rationale for separating from auth.users:** Supabase Auth's `raw_user_meta_data` column is available, but storing structured data there prevents type generation and creates schema drift. A dedicated profile table allows proper typing and independent evolution.

---

### 3.2 `internship_applications`

The core table for the Internship Tracker feature.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | UUID | NO | `gen_random_uuid()` | PK |
| `user_id` | UUID | NO | — | FK → `auth.users(id)` ON DELETE CASCADE |
| `company_name` | TEXT | NO | — | |
| `role_title` | TEXT | NO | — | |
| `status` | application_status | NO | 'applied' | Enum: see §6 |
| `applied_date` | DATE | NO | `CURRENT_DATE` | |
| `deadline` | DATE | YES | NULL | Application or OA deadline |
| `job_url` | TEXT | YES | NULL | URL to job posting |
| `resume_url` | TEXT | YES | NULL | Link to resume used (Drive, GitHub) |
| `recruiter_name` | TEXT | YES | NULL | |
| `recruiter_email` | TEXT | YES | NULL | |
| `notes` | TEXT | YES | NULL | Markdown-formatted notes |
| `interview_stage` | TEXT | YES | NULL | e.g., "1st round technical" |
| `is_priority` | BOOLEAN | NO | FALSE | User-flagged as high priority |
| `created_at` | TIMESTAMPTZ | NO | `now()` | |
| `updated_at` | TIMESTAMPTZ | NO | `now()` | Auto-updated by trigger |

**Index targets:** `user_id` (all queries filter by user), `status` (filter panel), `deadline` (dashboard urgency sort).

---

### 3.3 `application_timeline_events`

A log of status changes for each application. Enables the user to see a history of how an application progressed. This is append-only — events are never updated.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | UUID | NO | `gen_random_uuid()` | PK |
| `application_id` | UUID | NO | — | FK → `internship_applications(id)` ON DELETE CASCADE |
| `user_id` | UUID | NO | — | FK → `auth.users(id)` (denormalized for RLS) |
| `from_status` | application_status | YES | NULL | NULL on first event (creation) |
| `to_status` | application_status | NO | — | |
| `note` | TEXT | YES | NULL | Optional note about the transition |
| `created_at` | TIMESTAMPTZ | NO | `now()` | |

**Why `user_id` is denormalized here:** RLS policies on `application_timeline_events` can join to `internship_applications` to check ownership, but this creates a join in every RLS check and degrades performance. Denormalizing `user_id` allows a simple equality check in the RLS policy.

---

### 3.4 `vault_notes`

The Study Vault's note storage. Supports full-text search via PostgreSQL's `tsvector`.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | UUID | NO | `gen_random_uuid()` | PK |
| `user_id` | UUID | NO | — | FK → `auth.users(id)` ON DELETE CASCADE |
| `title` | TEXT | NO | — | |
| `content` | TEXT | YES | NULL | Markdown body |
| `category` | note_category | NO | 'other' | Enum: see §6 |
| `tags` | TEXT[] | NO | '{}' | PostgreSQL text array |
| `source` | note_source | NO | 'manual' | Enum: manual, ai_generated, roadmap |
| `search_vector` | TSVECTOR | YES | NULL | Auto-populated by trigger |
| `created_at` | TIMESTAMPTZ | NO | `now()` | |
| `updated_at` | TIMESTAMPTZ | NO | `now()` | Auto-updated by trigger |

**Full-text search implementation:**
A `BEFORE INSERT OR UPDATE` trigger populates `search_vector` from the title and content columns using `to_tsvector('english', ...)`. Queries use `search_vector @@ plainto_tsquery('english', $1)`.

The English dictionary is used as the default. Korean text in notes remains searchable by keyword prefix matching through a separate `ILIKE` query fallback. A future enhancement can add Korean language stemming via the `pg_trgm` extension.

**Tags implementation:**
PostgreSQL native arrays are used instead of a separate `tags` join table because:
- Tag queries are always `user_id` scoped (no cross-user tag aggregation needed at MVP)
- Array operations (`@>`, `&&`) are indexed via GIN
- No overhead of an extra table and join for this use case

---

### 3.5 `study_goals`

Tracks user-defined study goals. These appear on the dashboard and connect to the roadmap system.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | UUID | NO | `gen_random_uuid()` | PK |
| `user_id` | UUID | NO | — | FK → `auth.users(id)` ON DELETE CASCADE |
| `roadmap_item_id` | UUID | YES | NULL | FK → `roadmap_items(id)` (if linked) |
| `title` | TEXT | NO | — | |
| `description` | TEXT | YES | NULL | |
| `target_date` | DATE | YES | NULL | |
| `completed` | BOOLEAN | NO | FALSE | |
| `completed_at` | TIMESTAMPTZ | YES | NULL | Set when completed = TRUE |
| `created_at` | TIMESTAMPTZ | NO | `now()` | |
| `updated_at` | TIMESTAMPTZ | NO | `now()` | Auto-updated by trigger |

**Goal-roadmap link:** When a roadmap item is checked off (completed), the corresponding `study_goals` record's `completed` field updates. This creates a bi-directional progress tracking system between manually-created goals and AI-generated roadmap items.

---

### 3.6 `roadmap_sessions`

Stores each AI-generated roadmap as a session. Users can generate multiple roadmaps (for different roles or timeframes) and keep a history.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | UUID | NO | `gen_random_uuid()` | PK |
| `user_id` | UUID | NO | — | FK → `auth.users(id)` ON DELETE CASCADE |
| `session_name` | TEXT | NO | — | User-editable name for the roadmap |
| `target_role` | TEXT | NO | — | Input: desired role |
| `company_type` | TEXT | YES | NULL | Input: company type |
| `current_skills` | TEXT[] | NO | '{}' | Input: skills at generation time |
| `weekly_hours` | SMALLINT | NO | — | Input: available hours/week |
| `timeline_months` | SMALLINT | NO | — | Input: target timeline |
| `raw_ai_output` | TEXT | NO | — | Full AI response (for debugging/regeneration) |
| `is_active` | BOOLEAN | NO | TRUE | User's currently active roadmap |
| `created_at` | TIMESTAMPTZ | NO | `now()` | |

---

### 3.7 `roadmap_items`

Individual items within a roadmap session. Structured output parsed from the AI response.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | UUID | NO | `gen_random_uuid()` | PK |
| `session_id` | UUID | NO | — | FK → `roadmap_sessions(id)` ON DELETE CASCADE |
| `user_id` | UUID | NO | — | FK → `auth.users(id)` (denormalized for RLS) |
| `phase_number` | SMALLINT | NO | — | Phase ordering (1, 2, 3...) |
| `phase_title` | TEXT | NO | — | e.g., "Phase 1: Foundations" |
| `item_type` | TEXT | NO | — | 'topic', 'project', 'resource', 'interview_prep' |
| `title` | TEXT | NO | — | |
| `description` | TEXT | YES | NULL | |
| `order_index` | SMALLINT | NO | — | Display order within phase |
| `completed` | BOOLEAN | NO | FALSE | |
| `completed_at` | TIMESTAMPTZ | YES | NULL | |

---

### 3.8 `ai_interactions`

Audit log for all AI feature usage. Inputs are not stored — only metadata. Used for rate limiting, cost tracking, and feature analytics.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | UUID | NO | `gen_random_uuid()` | PK |
| `user_id` | UUID | NO | — | FK → `auth.users(id)` ON DELETE CASCADE |
| `feature` | TEXT | NO | — | 'explainer' or 'roadmap' |
| `model_used` | TEXT | NO | — | e.g., 'anthropic/claude-3-haiku' |
| `prompt_tokens` | INTEGER | YES | NULL | |
| `completion_tokens` | INTEGER | YES | NULL | |
| `latency_ms` | INTEGER | YES | NULL | End-to-end response time |
| `succeeded` | BOOLEAN | NO | TRUE | FALSE if AI call returned an error |
| `created_at` | TIMESTAMPTZ | NO | `now()` | |

---

## 4. Indexes

```sql
-- internship_applications
CREATE INDEX idx_applications_user_id ON internship_applications(user_id);
CREATE INDEX idx_applications_status ON internship_applications(user_id, status);
CREATE INDEX idx_applications_deadline ON internship_applications(user_id, deadline) WHERE deadline IS NOT NULL;

-- application_timeline_events
CREATE INDEX idx_timeline_application_id ON application_timeline_events(application_id);
CREATE INDEX idx_timeline_user_id ON application_timeline_events(user_id);

-- vault_notes
CREATE INDEX idx_vault_user_id ON vault_notes(user_id);
CREATE INDEX idx_vault_category ON vault_notes(user_id, category);
CREATE INDEX idx_vault_search ON vault_notes USING GIN(search_vector);
CREATE INDEX idx_vault_tags ON vault_notes USING GIN(tags);

-- study_goals
CREATE INDEX idx_goals_user_id ON study_goals(user_id);
CREATE INDEX idx_goals_roadmap_item ON study_goals(roadmap_item_id) WHERE roadmap_item_id IS NOT NULL;

-- roadmap_sessions
CREATE INDEX idx_roadmap_sessions_user_id ON roadmap_sessions(user_id);

-- roadmap_items
CREATE INDEX idx_roadmap_items_session ON roadmap_items(session_id);
CREATE INDEX idx_roadmap_items_user ON roadmap_items(user_id);

-- ai_interactions
CREATE INDEX idx_ai_user_date ON ai_interactions(user_id, created_at DESC);
CREATE INDEX idx_ai_feature ON ai_interactions(user_id, feature);
```

---

## 5. Row-Level Security Policies

RLS is enabled on all user-content tables. The policy pattern is: **a user may only SELECT, INSERT, UPDATE, or DELETE rows where `user_id = auth.uid()`.**

```sql
-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE internship_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_interactions ENABLE ROW LEVEL SECURITY;

-- user_profiles: owns their own profile
CREATE POLICY "user_profiles_self_access" ON user_profiles
  FOR ALL USING (auth.uid() = id);

-- internship_applications
CREATE POLICY "applications_user_owns" ON internship_applications
  FOR ALL USING (auth.uid() = user_id);

-- application_timeline_events
CREATE POLICY "timeline_user_owns" ON application_timeline_events
  FOR ALL USING (auth.uid() = user_id);

-- vault_notes
CREATE POLICY "vault_user_owns" ON vault_notes
  FOR ALL USING (auth.uid() = user_id);

-- study_goals
CREATE POLICY "goals_user_owns" ON study_goals
  FOR ALL USING (auth.uid() = user_id);

-- roadmap_sessions
CREATE POLICY "roadmap_sessions_user_owns" ON roadmap_sessions
  FOR ALL USING (auth.uid() = user_id);

-- roadmap_items
CREATE POLICY "roadmap_items_user_owns" ON roadmap_items
  FOR ALL USING (auth.uid() = user_id);

-- ai_interactions (user can read own; insert via service role only)
CREATE POLICY "ai_interactions_user_read" ON ai_interactions
  FOR SELECT USING (auth.uid() = user_id);
```

**Important:** `ai_interactions` INSERT operations use the Supabase service role key (server-side only). Users can read their own interaction history but cannot insert directly.

---

## 6. Enums

```sql
-- Application status pipeline
CREATE TYPE application_status AS ENUM (
  'applied',
  'oa',           -- Online Assessment
  'interview',
  'rejected',
  'accepted'
);

-- Study vault note categories
CREATE TYPE note_category AS ENUM (
  'algorithms',
  'data_structures',
  'system_design',
  'korean_terms',
  'interview_prep',
  'lecture_notes',
  'other'
);

-- How a vault note was created
CREATE TYPE note_source AS ENUM (
  'manual',
  'ai_generated',
  'roadmap'
);
```

---

## 7. Full SQL Migration

The following is the complete initial migration file (`supabase/migrations/0001_initial_schema.sql`):

```sql
-- =============================================================
-- GlobalCampus AI — Initial Schema Migration
-- Version: 0001
-- =============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================
-- ENUMS
-- =============================================================

CREATE TYPE application_status AS ENUM (
  'applied', 'oa', 'interview', 'rejected', 'accepted'
);

CREATE TYPE note_category AS ENUM (
  'algorithms', 'data_structures', 'system_design',
  'korean_terms', 'interview_prep', 'lecture_notes', 'other'
);

CREATE TYPE note_source AS ENUM (
  'manual', 'ai_generated', 'roadmap'
);

-- =============================================================
-- UTILITY: auto-update updated_at
-- =============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- TABLES
-- =============================================================

-- user_profiles
CREATE TABLE user_profiles (
  id                    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name          TEXT,
  university            TEXT,
  graduation_year       SMALLINT,
  target_role           TEXT,
  preferred_language    TEXT NOT NULL DEFAULT 'en',
  onboarding_completed  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- internship_applications
CREATE TABLE internship_applications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name    TEXT NOT NULL,
  role_title      TEXT NOT NULL,
  status          application_status NOT NULL DEFAULT 'applied',
  applied_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  deadline        DATE,
  job_url         TEXT,
  resume_url      TEXT,
  recruiter_name  TEXT,
  recruiter_email TEXT,
  notes           TEXT,
  interview_stage TEXT,
  is_priority     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_applications_updated_at
  BEFORE UPDATE ON internship_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- application_timeline_events
CREATE TABLE application_timeline_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID NOT NULL REFERENCES internship_applications(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_status     application_status,
  to_status       application_status NOT NULL,
  note            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- vault_notes
CREATE TABLE vault_notes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  content        TEXT,
  category       note_category NOT NULL DEFAULT 'other',
  tags           TEXT[] NOT NULL DEFAULT '{}',
  source         note_source NOT NULL DEFAULT 'manual',
  search_vector  TSVECTOR,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Full-text search trigger for vault_notes
CREATE OR REPLACE FUNCTION update_vault_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector = to_tsvector('english',
    coalesce(NEW.title, '') || ' ' || coalesce(NEW.content, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_vault_search_vector
  BEFORE INSERT OR UPDATE ON vault_notes
  FOR EACH ROW EXECUTE FUNCTION update_vault_search_vector();

CREATE TRIGGER trg_vault_updated_at
  BEFORE UPDATE ON vault_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- study_goals
CREATE TABLE study_goals (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  roadmap_item_id   UUID,
  title             TEXT NOT NULL,
  description       TEXT,
  target_date       DATE,
  completed         BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_goals_updated_at
  BEFORE UPDATE ON study_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- roadmap_sessions
CREATE TABLE roadmap_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_name    TEXT NOT NULL,
  target_role     TEXT NOT NULL,
  company_type    TEXT,
  current_skills  TEXT[] NOT NULL DEFAULT '{}',
  weekly_hours    SMALLINT NOT NULL,
  timeline_months SMALLINT NOT NULL,
  raw_ai_output   TEXT NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- roadmap_items
CREATE TABLE roadmap_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID NOT NULL REFERENCES roadmap_sessions(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phase_number  SMALLINT NOT NULL,
  phase_title   TEXT NOT NULL,
  item_type     TEXT NOT NULL,
  title         TEXT NOT NULL,
  description   TEXT,
  order_index   SMALLINT NOT NULL,
  completed     BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at  TIMESTAMPTZ
);

-- ai_interactions
CREATE TABLE ai_interactions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature           TEXT NOT NULL,
  model_used        TEXT NOT NULL,
  prompt_tokens     INTEGER,
  completion_tokens INTEGER,
  latency_ms        INTEGER,
  succeeded         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================
-- INDEXES
-- =============================================================

CREATE INDEX idx_applications_user_id ON internship_applications(user_id);
CREATE INDEX idx_applications_status ON internship_applications(user_id, status);
CREATE INDEX idx_applications_deadline ON internship_applications(user_id, deadline) WHERE deadline IS NOT NULL;
CREATE INDEX idx_timeline_application_id ON application_timeline_events(application_id);
CREATE INDEX idx_timeline_user_id ON application_timeline_events(user_id);
CREATE INDEX idx_vault_user_id ON vault_notes(user_id);
CREATE INDEX idx_vault_category ON vault_notes(user_id, category);
CREATE INDEX idx_vault_search ON vault_notes USING GIN(search_vector);
CREATE INDEX idx_vault_tags ON vault_notes USING GIN(tags);
CREATE INDEX idx_goals_user_id ON study_goals(user_id);
CREATE INDEX idx_roadmap_sessions_user_id ON roadmap_sessions(user_id);
CREATE INDEX idx_roadmap_items_session ON roadmap_items(session_id);
CREATE INDEX idx_roadmap_items_user ON roadmap_items(user_id);
CREATE INDEX idx_ai_user_date ON ai_interactions(user_id, created_at DESC);

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE internship_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_profiles_self_access" ON user_profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "applications_user_owns" ON internship_applications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "timeline_user_owns" ON application_timeline_events FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "vault_user_owns" ON vault_notes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "goals_user_owns" ON study_goals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "roadmap_sessions_user_owns" ON roadmap_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "roadmap_items_user_owns" ON roadmap_items FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "ai_interactions_user_read" ON ai_interactions FOR SELECT USING (auth.uid() = user_id);
```

---

## 8. TypeScript Types (Generated)

Run `supabase gen types typescript --local > lib/types/database.types.ts` after applying migrations. Never hand-write these — let the Supabase CLI generate them from the live schema.

The generated file will export a `Database` type used to type the Supabase client:

```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database.types'

const supabase = createClient<Database>(url, key)

// Now all queries are fully typed:
const { data } = await supabase
  .from('internship_applications')  // IntelliSense knows this table
  .select('*')
  .eq('status', 'interview')        // IntelliSense knows valid enum values
```

---

## 9. Data Lifecycle Notes

**User deletion:** When a user deletes their account (via Supabase Auth), all child records cascade delete automatically via the `ON DELETE CASCADE` foreign key constraints. No orphaned data remains.

**Profile creation:** A `user_profiles` record is inserted automatically via a Supabase database trigger on `auth.users` insert. This ensures every user has a profile row immediately after signup.

```sql
-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_create_profile_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_profile();
```

**Roadmap deactivation:** When a user generates a new roadmap, the previous `roadmap_sessions` record's `is_active` is set to `FALSE` before the new session is created. This preserves history while maintaining a clear "active roadmap" concept.
