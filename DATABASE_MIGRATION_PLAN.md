# Database Migration Plan
## GlobalCampus AI — Supabase / PostgreSQL

**Version:** 1.0.0  
**Status:** Active — Pre-Development  
**Last Updated:** 2026-05-08  

---

## Table of Contents

1. [Migration Strategy](#1-migration-strategy)
2. [Table Creation Order & Rationale](#2-table-creation-order--rationale)
3. [Migration 0001: Initial Schema](#3-migration-0001-initial-schema)
4. [Post-Migration Verification Checklist](#4-post-migration-verification-checklist)
5. [Seed Data for Development](#5-seed-data-for-development)
6. [Rollback Plan](#6-rollback-plan)
7. [Schema Change Workflow (Post-Launch)](#7-schema-change-workflow-post-launch)
8. [Common Migration Errors & Fixes](#8-common-migration-errors--fixes)
9. [Environment-Specific Notes](#9-environment-specific-notes)

---

## 1. Migration Strategy

### One migration file for the entire MVP schema

The MVP launches with a single migration file: `0001_initial_schema.sql`. This is deliberate.

In production systems with teams and live data, multiple granular migration files are best practice because they allow partial rollbacks and atomic schema changes. At the pre-launch stage with zero production data, a single comprehensive migration file is:
- Easier to read as documentation
- Easier to apply to a fresh database
- Easier to rollback (drop and recreate)
- Eliminates the complexity of migration state management during development

**Post-launch rule:** Every schema change after go-live gets its own numbered migration file. `0001` is never modified after the first application of it.

### Migration tooling

```bash
# All migration operations use the Supabase CLI

# Apply pending migrations to the linked project
supabase db push

# Check migration status (what's applied, what's pending)
supabase migration list

# Create a new empty migration file (post-launch use)
supabase migration new description_of_change

# Reset local database (development only — destroys all data)
supabase db reset

# Generate TypeScript types from current schema
supabase gen types typescript --linked > lib/types/database.types.ts
```

### The golden rule of migrations

**A migration that has been applied to production is permanent.**  
Never modify `0001_initial_schema.sql` after it has been applied to the production database. All schema changes after that point become new numbered migration files.

---

## 2. Table Creation Order & Rationale

PostgreSQL enforces foreign key constraints at creation time. Tables that reference other tables must be created after the referenced table. The creation order must follow this dependency chain:

```
CREATION ORDER:
─────────────────────────────────────────────────────────
Step 1: Extensions
        └── uuid-ossp (for gen_random_uuid())

Step 2: Custom types (ENUMs)
        ├── application_status
        ├── note_category
        └── note_source

Step 3: Utility functions
        └── update_updated_at_column()

Step 4: auth.users (Supabase-managed — already exists)
        ← All subsequent tables reference this

Step 5: user_profiles
        └── References: auth.users(id)
        ← Must exist before application data (profile trigger fires on signup)

Step 6: internship_applications
        └── References: auth.users(id)

Step 7: application_timeline_events
        └── References: auth.users(id)
        └── References: internship_applications(id)
        ← Must come after internship_applications

Step 8: vault_notes
        └── References: auth.users(id)

Step 9: study_goals
        └── References: auth.users(id)
        └── References: roadmap_items(id) ← nullable FK, can be added after

Step 10: roadmap_sessions
         └── References: auth.users(id)

Step 11: roadmap_items
         └── References: auth.users(id)
         └── References: roadmap_sessions(id)
         ← Must come after roadmap_sessions

Step 12: ai_interactions
         └── References: auth.users(id)

Step 13: Indexes (after all tables exist)

Step 14: RLS policies (after all tables exist)

Step 15: Triggers (after all tables and functions exist)
         ├── trg_user_profiles_updated_at
         ├── trg_applications_updated_at
         ├── trg_vault_search_vector
         ├── trg_vault_updated_at
         ├── trg_goals_updated_at
         └── trg_create_profile_on_signup
─────────────────────────────────────────────────────────
```

**Why `study_goals` references `roadmap_items` as a nullable FK:**

The foreign key `study_goals.roadmap_item_id` references `roadmap_items(id)` but is nullable. This means it can be added even though `roadmap_items` is created later — because the constraint only fires when the value is non-null. In practice, both tables exist before any data is inserted, so order doesn't matter for data integrity. For clarity, create `roadmap_items` before finalizing `study_goals` FK if Postgres raises an error during migration.

---

## 3. Migration 0001: Initial Schema

**File location:** `supabase/migrations/0001_initial_schema.sql`

**Execution sections and what to verify after each:**

### Section 1: Extensions

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

**Verify:** `SELECT * FROM pg_extension WHERE extname = 'uuid-ossp';` returns one row.

### Section 2: Enums

```sql
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
```

**Verify:** `SELECT typname FROM pg_type WHERE typtype = 'e';` shows all three types.

**Important:** Adding values to an existing enum in PostgreSQL requires `ALTER TYPE ... ADD VALUE`. This is a migration-only operation. Plan enum values carefully at design time — changing them post-launch requires a migration.

### Section 3: Utility function

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Verify:** `SELECT proname FROM pg_proc WHERE proname = 'update_updated_at_column';`

### Section 4: user_profiles table

```sql
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
```

**Design note on `preferred_language`:** Using `TEXT NOT NULL DEFAULT 'en'` rather than an enum. Language codes will expand if Korean UI is added; a TEXT column with a CHECK constraint (`CHECK (preferred_language IN ('en', 'ko'))`) is easier to extend than an enum.

### Section 5: internship_applications table

```sql
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
```

**Design note on `notes` field:** `TEXT` type supports unlimited length. The application layer enforces length limits — not the database. This allows longer notes without a migration if limits change.

### Section 6: application_timeline_events table

```sql
CREATE TABLE application_timeline_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID NOT NULL REFERENCES internship_applications(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_status     application_status,
  to_status       application_status NOT NULL,
  note            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Design note:** No `updated_at` on this table. Timeline events are append-only. An event that was created is a historical fact — it is never updated. The absence of `updated_at` enforces this contract.

### Section 7: vault_notes table

```sql
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
```

**Design note on `search_vector`:** This column is populated by a trigger, never by application code. The application code must never attempt to set `search_vector` directly — the trigger handles it. Exclude `search_vector` from all INSERT and UPDATE statements in Server Actions.

### Section 8: study_goals table

```sql
CREATE TABLE study_goals (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  roadmap_item_id   UUID REFERENCES roadmap_items(id) ON DELETE SET NULL,
  title             TEXT NOT NULL,
  description       TEXT,
  target_date       DATE,
  completed         BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Design note on `ON DELETE SET NULL`:** When a roadmap item is deleted, the corresponding study goal is not deleted — only the `roadmap_item_id` link is nulled. This preserves the user's goal even if they delete a roadmap.

### Section 9: roadmap_sessions table

```sql
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
```

**Design note on `raw_ai_output`:** Storing the raw AI response serves two purposes: (1) debugging when the structured parse fails, (2) ability to re-parse with a different parser if the output structure is changed. The storage cost is negligible for the operational benefit.

### Section 10: roadmap_items table

```sql
CREATE TABLE roadmap_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID NOT NULL REFERENCES roadmap_sessions(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phase_number  SMALLINT NOT NULL,
  phase_title   TEXT NOT NULL,
  item_type     TEXT NOT NULL CHECK (item_type IN ('topic', 'project', 'resource', 'interview_prep')),
  title         TEXT NOT NULL,
  description   TEXT,
  order_index   SMALLINT NOT NULL,
  completed     BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at  TIMESTAMPTZ,
  CONSTRAINT positive_phase CHECK (phase_number > 0),
  CONSTRAINT positive_order CHECK (order_index >= 0)
);
```

**Design note on CHECK constraints:** `item_type` uses a CHECK constraint rather than an enum. This is intentional — item types may need extension (e.g., adding 'assessment') without an enum migration.

### Section 11: ai_interactions table

```sql
CREATE TABLE ai_interactions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature           TEXT NOT NULL CHECK (feature IN ('explainer', 'roadmap')),
  model_used        TEXT NOT NULL,
  prompt_tokens     INTEGER CHECK (prompt_tokens >= 0),
  completion_tokens INTEGER CHECK (completion_tokens >= 0),
  latency_ms        INTEGER CHECK (latency_ms >= 0),
  succeeded         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Section 12: Triggers

```sql
-- updated_at triggers
CREATE TRIGGER trg_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_applications_updated_at
  BEFORE UPDATE ON internship_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_vault_updated_at
  BEFORE UPDATE ON vault_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_goals_updated_at
  BEFORE UPDATE ON study_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Full-text search vector trigger
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

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_create_profile_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_profile();
```

**Critical note on `SECURITY DEFINER`:** The `create_user_profile` function uses `SECURITY DEFINER` so it runs with the permissions of the function owner (postgres), not the calling user. This is necessary because the trigger fires in the context of `auth.users`, which is outside the `public` schema. Without `SECURITY DEFINER`, the trigger would fail with a permissions error.

---

## 4. Post-Migration Verification Checklist

Run these checks in Supabase SQL Editor immediately after applying the migration:

```sql
-- 1. Verify all tables exist
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
-- Expected: application_timeline_events, ai_interactions, internship_applications,
--           roadmap_items, roadmap_sessions, study_goals, user_profiles, vault_notes

-- 2. Verify all enums exist
SELECT typname, enumlabel FROM pg_enum 
JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
ORDER BY typname, enumsortorder;
-- Expected: application_status (5 values), note_category (7 values), note_source (3 values)

-- 3. Verify RLS is enabled on all tables
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
-- Expected: rowsecurity = true for all 8 tables

-- 4. Verify RLS policies exist
SELECT tablename, policyname FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename;
-- Expected: at least 1 policy per table

-- 5. Verify triggers exist
SELECT trigger_name, event_object_table FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table;

-- 6. Verify indexes exist
SELECT indexname, tablename FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 7. Test the profile auto-creation trigger
-- (Do this after creating a test user via Auth UI)
SELECT id FROM public.user_profiles;
-- Should return one row per registered user

-- 8. Test full-text search vector trigger
INSERT INTO public.vault_notes (user_id, title, content)
VALUES ('YOUR_TEST_USER_UUID', 'Binary Search Tree', 'A BST is a tree where left < root < right');
SELECT title, search_vector IS NOT NULL AS has_search_vector FROM public.vault_notes;
-- search_vector should be populated automatically
-- Clean up: DELETE FROM vault_notes WHERE title = 'Binary Search Tree';
```

**Do not proceed to application development if any of these checks fail.**

---

## 5. Seed Data for Development

Seed data makes development faster — you don't need to manually create test records every time you reset the database.

**File:** `supabase/seed.sql`  
**When to apply:** After `supabase db reset` (development only)

```sql
-- supabase/seed.sql
-- DEVELOPMENT ONLY — never run on production

-- Note: Replace 'YOUR_TEST_USER_UUID' with an actual user UUID after creating a test account

-- Seed internship applications
INSERT INTO internship_applications 
  (user_id, company_name, role_title, status, applied_date, deadline, notes, is_priority)
VALUES
  ('YOUR_TEST_USER_UUID', 'Kakao Corp', 'Backend Engineering Intern', 'interview', '2026-04-01', '2026-05-20', 'Passed OA. Technical interview scheduled for next week.', true),
  ('YOUR_TEST_USER_UUID', 'Naver Corp', 'Frontend Intern', 'oa', '2026-04-05', '2026-05-15', 'OA deadline approaching.', false),
  ('YOUR_TEST_USER_UUID', 'LINE Corp', 'Software Engineer Intern', 'applied', '2026-04-10', '2026-06-01', NULL, false),
  ('YOUR_TEST_USER_UUID', 'Samsung SDS', 'Data Engineering Intern', 'rejected', '2026-03-15', NULL, 'Rejected at resume screening stage.', false),
  ('YOUR_TEST_USER_UUID', 'Krafton', 'Game Backend Intern', 'applied', '2026-04-20', '2026-05-30', NULL, false);

-- Seed timeline events for the Kakao application
INSERT INTO application_timeline_events (application_id, user_id, from_status, to_status, note)
SELECT 
  id,
  user_id,
  NULL,
  'applied',
  'Applied via company careers portal'
FROM internship_applications WHERE company_name = 'Kakao Corp';

INSERT INTO application_timeline_events (application_id, user_id, from_status, to_status, note)
SELECT 
  id,
  user_id,
  'applied',
  'oa',
  'Received OA invitation via email'
FROM internship_applications WHERE company_name = 'Kakao Corp';

INSERT INTO application_timeline_events (application_id, user_id, from_status, to_status, note)
SELECT 
  id,
  user_id,
  'oa',
  'interview',
  'Passed OA. Technical interview in 1 week.'
FROM internship_applications WHERE company_name = 'Kakao Corp';

-- Seed vault notes
INSERT INTO vault_notes (user_id, title, content, category, tags, source)
VALUES
  ('YOUR_TEST_USER_UUID', 
   '힙 정렬 (Heap Sort)', 
   '## 힙 정렬\n\n힙 자료구조를 이용한 정렬 알고리즘.\n\n**시간 복잡도:** O(n log n)\n**공간 복잡도:** O(1)\n\n```python\nimport heapq\n\ndef heap_sort(arr):\n    heapq.heapify(arr)\n    return [heapq.heappop(arr) for _ in range(len(arr))]\n```\n\n불안정 정렬이므로 같은 값의 순서가 보장되지 않는다.',
   'algorithms',
   ARRAY['sorting', 'heap', '힙', 'O(n log n)'],
   'ai_generated'),
  
  ('YOUR_TEST_USER_UUID',
   'BFS vs DFS',
   '## BFS vs DFS\n\n**BFS (너비 우선 탐색):** Queue 사용. 최단 경로 탐색에 적합.\n**DFS (깊이 우선 탐색):** Stack 또는 재귀 사용. 사이클 탐지, 위상 정렬에 적합.',
   'algorithms',
   ARRAY['graph', 'traversal', 'BFS', 'DFS'],
   'manual'),
  
  ('YOUR_TEST_USER_UUID',
   'Kakao Interview Notes — Round 1',
   '## Technical Interview Notes\n\n**Asked about:** Binary search tree operations, time complexity analysis\n**My performance:** Explained BST insertion correctly but stumbled on deletion\n\n**To study:** Tree deletion with 3 cases (leaf, one child, two children)',
   'interview_prep',
   ARRAY['kakao', 'binary-tree', 'interview'],
   'manual');

-- Seed study goals
INSERT INTO study_goals (user_id, title, description, target_date, completed)
VALUES
  ('YOUR_TEST_USER_UUID', 'Complete binary tree chapter', 'Cover insertion, deletion, and traversal', '2026-05-15', false),
  ('YOUR_TEST_USER_UUID', 'Solve 20 LeetCode graph problems', 'Focus on BFS/DFS patterns', '2026-05-30', false),
  ('YOUR_TEST_USER_UUID', 'Review dynamic programming basics', NULL, '2026-05-10', true);
```

**How to use seed data:**
```bash
# After any database reset during development:
supabase db reset                 # Reapplies migrations + runs seed.sql automatically
                                  # (if seed.sql is present)

# Or manually run seed after reset:
supabase db push
psql "$(supabase status | grep 'DB URL' | awk '{print $3}')" < supabase/seed.sql
```

---

## 6. Rollback Plan

### Pre-launch rollback (development)

Simple: drop the database and reapply the migration.

```bash
# Drops all tables, types, functions, and reapplies all migrations
supabase db reset

# Regenerate types after reset
supabase gen types typescript --linked > lib/types/database.types.ts
```

This is the nuclear option. Use it when the migration is fundamentally wrong, not for minor fixes.

### Post-launch rollback (production)

**If the migration has been applied to production and has errors:**

1. **Do NOT run `supabase db reset` on production** — this destroys all user data.
2. Write a compensating migration to undo the specific change:

```sql
-- Example: if a column was added incorrectly
-- supabase/migrations/0002_rollback_bad_column.sql
ALTER TABLE internship_applications DROP COLUMN IF EXISTS bad_column_name;
```

3. Apply the compensating migration:
```bash
supabase db push
```

**Migration rollback policy:**
- Additive changes (new table, new column, new index) are safe to apply and easy to rollback
- Destructive changes (DROP TABLE, DROP COLUMN, ALTER COLUMN TYPE) are **never** in a migration without explicit data migration steps
- Type changes must be done as: add new column → backfill data → drop old column → rename new column

---

## 7. Schema Change Workflow (Post-Launch)

After the first production deployment, follow this process for every schema change:

```
Step 1: Plan the change
  - What problem does this solve?
  - Is it additive (safe) or destructive (risky)?
  - Does it affect existing data? (requires backfill migration)

Step 2: Write the migration file
  supabase migration new your_description_here
  # Creates: supabase/migrations/0002_your_description_here.sql

Step 3: Write the SQL
  - For new tables: full CREATE TABLE with indexes and RLS
  - For new columns: ALTER TABLE ... ADD COLUMN (use DEFAULT for existing rows)
  - For new indexes: CREATE INDEX CONCURRENTLY (doesn't lock table)
  - NEVER: DROP without explicit planning

Step 4: Test on development database
  supabase db push
  # Verify the migration applies cleanly

Step 5: Update TypeScript types
  supabase gen types typescript --linked > lib/types/database.types.ts
  # Update any TypeScript code affected by the change

Step 6: Test the affected application features
  # Full manual test of features that touch the changed tables

Step 7: Apply to production
  supabase link --project-ref PRODUCTION_PROJECT_REF
  supabase db push
  supabase link --project-ref DEV_PROJECT_REF  # Switch back to dev
```

### Safe migration patterns

**Adding a nullable column (always safe):**
```sql
ALTER TABLE internship_applications ADD COLUMN linkedin_url TEXT;
```

**Adding a NOT NULL column with a default (safe if default is appropriate):**
```sql
ALTER TABLE internship_applications 
  ADD COLUMN source TEXT NOT NULL DEFAULT 'direct';
```

**Adding an index without locking (safe for production):**
```sql
CREATE INDEX CONCURRENTLY idx_applications_company 
  ON internship_applications(user_id, company_name);
```

**Adding an enum value (safe in Postgres 9.1+, no table rewrite):**
```sql
ALTER TYPE application_status ADD VALUE 'waitlist' AFTER 'interview';
```

---

## 8. Common Migration Errors & Fixes

**Error: `relation "auth.users" does not exist`**  
Cause: Running the migration with a user that doesn't have access to the `auth` schema.  
Fix: Use Supabase CLI (`supabase db push`) rather than raw psql. The CLI uses the correct superuser connection.

**Error: `type "application_status" does not exist`**  
Cause: Trying to create a table that uses an enum before the enum is defined.  
Fix: Ensure enum definitions come before table definitions in the migration file. They already do in `0001_initial_schema.sql` — this error means lines were reordered.

**Error: `trigger "trg_create_profile_on_signup" for relation "users" already exists`**  
Cause: Applying the migration twice without resetting.  
Fix: `supabase db reset` (development) or create a compensating migration that drops and recreates the trigger (production).

**Error: `permission denied for table auth.users`**  
Cause: The `create_user_profile()` function is not defined with `SECURITY DEFINER`.  
Fix: The function definition in the migration includes `SECURITY DEFINER` — verify it was not accidentally removed.

**Error: RLS policy blocks all reads after migration**  
Cause: RLS was enabled but no SELECT policy was created.  
Fix: Verify the policy uses `FOR ALL` (covers SELECT, INSERT, UPDATE, DELETE) or has separate policies for each operation. Check with: `SELECT * FROM pg_policies WHERE tablename = 'your_table';`

**TypeScript error: `Property 'xyz' does not exist on type 'Tables<"table_name">'`**  
Cause: A column was added to the database after the last type generation.  
Fix: `supabase gen types typescript --linked > lib/types/database.types.ts`

---

## 9. Environment-Specific Notes

### Development Environment

- Use Supabase cloud (free tier), not local Docker
- Database is disposable — `supabase db reset` is safe
- Seed data keeps development productive
- TypeScript types should be regenerated whenever the schema changes

### Staging Environment (Vercel Preview Deployments)

- Use a separate Supabase project from both development and production
- Apply the same migrations as production
- Do not use seed data in staging (test with real user flows instead)
- Staging schema must always match production schema

### Production Environment

- Migration is applied via `supabase db push` from the Supabase CLI
- Never use `supabase db reset` — destroys all user data
- Every migration is applied as a numbered file (never modify existing files)
- TypeScript types are regenerated and committed to the repository after each production migration
- Take a database backup before any destructive migration:
  ```bash
  # Supabase provides point-in-time recovery on Pro tier
  # On free tier, export data before any risky migration:
  supabase db dump --data-only > backup_$(date +%Y%m%d).sql
  ```
