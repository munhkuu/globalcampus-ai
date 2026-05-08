# API Specification
## GlobalCampus AI

**Version:** 1.0.0  
**Status:** Active — Pre-Development  
**Last Updated:** 2026-05-08  
**Base URL:** `https://globalcampus.ai/api`  

---

## Table of Contents

1. [API Design Philosophy](#1-api-design-philosophy)
2. [Authentication](#2-authentication)
3. [Response Envelope](#3-response-envelope)
4. [Error Codes](#4-error-codes)
5. [Rate Limiting](#5-rate-limiting)
6. [Endpoints: Internship Applications](#6-endpoints-internship-applications)
7. [Endpoints: AI Features](#7-endpoints-ai-features)
8. [Endpoints: Vault Notes](#8-endpoints-vault-notes)
9. [Endpoints: Roadmap](#9-endpoints-roadmap)
10. [Endpoints: Study Goals](#10-endpoints-study-goals)
11. [Endpoints: User Profile](#11-endpoints-user-profile)
12. [Server Actions](#12-server-actions)
13. [Webhook Events](#13-webhook-events)

---

## 1. API Design Philosophy

### 1.1 Architecture Decision: Mixed Server Actions + API Routes

GlobalCampus AI uses **Next.js Server Actions** for most mutations (create, update, delete) and **API Routes** for AI endpoints and complex queries. This is not arbitrary — the distinction follows a clear rule:

**Use Server Actions when:**
- The operation is a simple database mutation (CRUD)
- The result is used to update page state (revalidatePath)
- Progressive enhancement is desired (form submission without JavaScript)

**Use API Routes when:**
- The response is streamed (AI text generation)
- The endpoint needs to be called from client-side `fetch` with dynamic parameters
- External services need to call the endpoint (webhooks)
- The response format is not a page rerender

This document specifies only the **API Routes**. Server Actions are documented in §12.

### 1.2 API Route Naming

All API routes follow REST conventions:
- `GET /api/resource` — list resources
- `GET /api/resource/:id` — get one resource
- `POST /api/resource` — create resource
- `PATCH /api/resource/:id` — partial update
- `DELETE /api/resource/:id` — delete resource

AI endpoints are namespaced under `/api/ai/` and use POST with a structured body.

---

## 2. Authentication

All API routes require a valid Supabase session. The session is transmitted via cookies (HttpOnly, set by the Supabase SSR package).

**How authentication works in API routes:**
```typescript
// Every API route starts with:
const supabase = createServerClient(cookies())
const { data: { user }, error } = await supabase.auth.getUser()

if (error || !user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
// All subsequent queries use `user.id` for filtering
```

There are no API keys for client-to-server communication. The Supabase session cookie is the authentication token. This is intentional — API keys add complexity and a new attack surface for a single-tenant (per-user) application.

---

## 3. Response Envelope

All API responses follow a consistent envelope:

**Success response:**
```json
{
  "data": { ... },
  "meta": {
    "timestamp": "2026-05-08T09:00:00.000Z"
  }
}
```

**List response:**
```json
{
  "data": [ ... ],
  "meta": {
    "total": 42,
    "page": 1,
    "per_page": 20,
    "timestamp": "2026-05-08T09:00:00.000Z"
  }
}
```

**Error response:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable description",
    "field": "company_name"  // present for validation errors
  }
}
```

---

## 4. Error Codes

| HTTP Status | Error Code | Meaning |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Request body failed Zod validation |
| 400 | `INVALID_INPUT` | Input is structurally valid but semantically rejected |
| 401 | `UNAUTHORIZED` | No valid session |
| 403 | `FORBIDDEN` | Authenticated but accessing another user's resource |
| 404 | `NOT_FOUND` | Resource does not exist or not owned by user |
| 422 | `AI_REJECTION` | Input was rejected by AI content validator |
| 429 | `RATE_LIMITED` | Request exceeds per-user rate limit |
| 500 | `INTERNAL_ERROR` | Unexpected server error (details logged, not returned) |
| 503 | `AI_UNAVAILABLE` | AI provider returned an error; retry is appropriate |

---

## 5. Rate Limiting

AI endpoints are rate limited per user to control cost. Limits are applied by tracking `ai_interactions` records per user in the last hour.

| Endpoint | Limit | Window |
|---|---|---|
| `POST /api/ai/explain` | 20 requests | 1 hour |
| `POST /api/ai/roadmap` | 5 requests | 1 hour |

When a rate limit is exceeded, the response is:
```json
HTTP 429 Too Many Requests
X-RateLimit-Limit: 20
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1746698400

{
  "error": {
    "code": "RATE_LIMITED",
    "message": "You've used 20/20 explanations this hour. Resets at 10:00 AM."
  }
}
```

Standard CRUD endpoints are not rate limited at MVP. Supabase's built-in protections are sufficient for single-user operations.

---

## 6. Endpoints: Internship Applications

### `GET /api/internships`

Returns the authenticated user's internship applications with optional filtering and sorting.

**Query parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `status` | string | — | Filter by status enum value |
| `sort` | string | `deadline` | One of: `deadline`, `applied_date`, `company_name`, `updated_at` |
| `order` | string | `asc` | `asc` or `desc` |
| `page` | integer | `1` | Pagination page |
| `per_page` | integer | `20` | Records per page (max 100) |

**Response: 200 OK**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "company_name": "Kakao Corp",
      "role_title": "Backend Engineering Intern",
      "status": "interview",
      "applied_date": "2026-04-10",
      "deadline": "2026-05-15",
      "job_url": "https://careers.kakao.com/...",
      "resume_url": null,
      "recruiter_name": "Kim Minjun",
      "recruiter_email": null,
      "notes": "Passed OA. Technical interview scheduled.",
      "interview_stage": "1st round technical",
      "is_priority": true,
      "created_at": "2026-04-10T11:20:00.000Z",
      "updated_at": "2026-04-22T09:15:00.000Z"
    }
  ],
  "meta": {
    "total": 14,
    "page": 1,
    "per_page": 20,
    "timestamp": "2026-05-08T09:00:00.000Z"
  }
}
```

---

### `GET /api/internships/:id`

Returns a single internship application with its full timeline.

**Response: 200 OK**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "company_name": "Kakao Corp",
    "role_title": "Backend Engineering Intern",
    "status": "interview",
    "applied_date": "2026-04-10",
    "deadline": "2026-05-15",
    "job_url": "https://careers.kakao.com/...",
    "resume_url": "https://drive.google.com/...",
    "recruiter_name": "Kim Minjun",
    "recruiter_email": "minjun.kim@kakao.com",
    "notes": "Passed OA. Technical interview scheduled.",
    "interview_stage": "1st round technical",
    "is_priority": true,
    "timeline": [
      {
        "id": "661f9511-...",
        "from_status": null,
        "to_status": "applied",
        "note": "Applied via company portal",
        "created_at": "2026-04-10T11:20:00.000Z"
      },
      {
        "id": "772g0622-...",
        "from_status": "applied",
        "to_status": "oa",
        "note": "OA link received via email",
        "created_at": "2026-04-18T14:30:00.000Z"
      }
    ],
    "created_at": "2026-04-10T11:20:00.000Z",
    "updated_at": "2026-04-22T09:15:00.000Z"
  },
  "meta": {
    "timestamp": "2026-05-08T09:00:00.000Z"
  }
}
```

---

### `GET /api/internships/stats`

Returns aggregate statistics for the dashboard pipeline view.

**Response: 200 OK**
```json
{
  "data": {
    "total": 14,
    "by_status": {
      "applied": 5,
      "oa": 3,
      "interview": 2,
      "rejected": 3,
      "accepted": 1
    },
    "upcoming_deadlines": [
      {
        "id": "550e8400-...",
        "company_name": "Naver Corp",
        "role_title": "Frontend Intern",
        "deadline": "2026-05-10",
        "status": "applied",
        "days_remaining": 2
      }
    ]
  },
  "meta": {
    "timestamp": "2026-05-08T09:00:00.000Z"
  }
}
```

---

## 7. Endpoints: AI Features

### `POST /api/ai/explain`

Submits text for CS concept explanation. This is the core AI Lecture Explainer endpoint.

**Request body:**
```json
{
  "input": "힙 정렬의 시간 복잡도는 O(n log n)이며, 불안정 정렬입니다.",
  "depth": "intermediate",
  "code_language": "python",
  "bilingual": true
}
```

**Request schema (Zod):**
```typescript
z.object({
  input: z.string().min(10).max(2000),
  depth: z.enum(['beginner', 'intermediate', 'advanced']),
  code_language: z.enum(['python', 'java', 'cpp', 'javascript', 'kotlin']),
  bilingual: z.boolean().default(false)
})
```

**Response: 200 OK**
```json
{
  "data": {
    "concept": "Heap Sort",
    "explanation": "Heap sort is a comparison-based sorting algorithm that uses a binary heap data structure. It works in two phases: first building a max-heap from the input array, then repeatedly extracting the maximum element to produce a sorted array.",
    "korean_context": "힙 정렬 (Heap Sort) — 힙 자료구조를 이용한 정렬 알고리즘입니다.",
    "code_example": "import heapq\n\ndef heap_sort(arr):\n    heapq.heapify(arr)  # Build min-heap in O(n)\n    return [heapq.heappop(arr) for _ in range(len(arr))]",
    "key_points": [
      "Time complexity: O(n log n) in all cases (best, average, worst)",
      "Space complexity: O(1) — sorts in place",
      "Unstable sort — equal elements may change relative order",
      "Not cache-friendly due to non-sequential memory access"
    ],
    "related_concepts": ["Binary Heap", "Priority Queue", "Comparison Sorting"],
    "model_used": "anthropic/claude-3-haiku"
  },
  "meta": {
    "timestamp": "2026-05-08T09:00:00.000Z"
  }
}
```

**Error responses:**

`422 Unprocessable Entity` — input rejected by content validator:
```json
{
  "error": {
    "code": "AI_REJECTION",
    "message": "Input does not appear to be CS-related. Please paste a CS concept or Korean technical term."
  }
}
```

`503 Service Unavailable` — AI provider error:
```json
{
  "error": {
    "code": "AI_UNAVAILABLE",
    "message": "AI service is temporarily unavailable. Please try again in a moment."
  }
}
```

---

### `POST /api/ai/roadmap`

Generates a structured CS career roadmap based on user inputs.

**Request body:**
```json
{
  "target_role": "Backend Engineer",
  "company_type": "korean_tech",
  "current_skills": ["Python", "SQL", "basic algorithms"],
  "weekly_hours": 15,
  "timeline_months": 6,
  "session_name": "My Backend Roadmap"
}
```

**Request schema (Zod):**
```typescript
z.object({
  target_role: z.string().min(3).max(100),
  company_type: z.enum([
    'korean_tech',
    'global_startup',
    'faang_adjacent',
    'research'
  ]),
  current_skills: z.array(z.string()).min(1).max(20),
  weekly_hours: z.number().int().min(1).max(40),
  timeline_months: z.enum([3, 6, 12]),
  session_name: z.string().min(1).max(100)
})
```

**Response: 200 OK**
```json
{
  "data": {
    "session_id": "880a1234-...",
    "session_name": "My Backend Roadmap",
    "target_role": "Backend Engineer",
    "company_type": "korean_tech",
    "timeline_months": 6,
    "phases": [
      {
        "phase_number": 1,
        "phase_title": "Phase 1: Core DSA & Problem Solving (Months 1–2)",
        "goal": "Build the algorithm foundation required for Korean tech company coding tests (Kakao, Naver style)",
        "items": [
          {
            "id": "item-uuid-1",
            "item_type": "topic",
            "title": "Arrays, Strings, and Sliding Window",
            "description": "Master array manipulation and two-pointer / sliding window patterns. These appear in 40%+ of Korean coding test problems.",
            "order_index": 1,
            "completed": false
          },
          {
            "id": "item-uuid-2",
            "item_type": "topic",
            "title": "Stack, Queue, and Deque",
            "description": "Understand LIFO/FIFO structures and implement them. Korean tests commonly ask for expression evaluation and next greater element problems.",
            "order_index": 2,
            "completed": false
          },
          {
            "id": "item-uuid-3",
            "item_type": "project",
            "title": "Build a LeetCode-style problem tracker CLI",
            "description": "Practice Python + data structures by building a CLI that logs solved problems, tags them by topic, and tracks time spent.",
            "order_index": 3,
            "completed": false
          }
        ]
      },
      {
        "phase_number": 2,
        "phase_title": "Phase 2: Backend Fundamentals (Months 2–4)",
        "goal": "Build production-relevant backend skills for internship interviews",
        "items": [ "..." ]
      }
    ],
    "model_used": "anthropic/claude-3-5-sonnet"
  },
  "meta": {
    "timestamp": "2026-05-08T09:00:00.000Z"
  }
}
```

---

## 8. Endpoints: Vault Notes

### `GET /api/vault`

Returns user's vault notes with search and filter support.

**Query parameters:**

| Parameter | Type | Description |
|---|---|---|
| `q` | string | Full-text search query |
| `category` | string | Filter by note_category enum |
| `tags` | string | Comma-separated tag filter |
| `source` | string | Filter by note_source enum |
| `sort` | string | `created_at` or `updated_at` (default: `updated_at`) |
| `order` | string | `asc` or `desc` (default: `desc`) |
| `page` | integer | Default: 1 |
| `per_page` | integer | Default: 20, max 100 |

**Response: 200 OK**
```json
{
  "data": [
    {
      "id": "note-uuid-1",
      "title": "Heap Sort Explanation",
      "content": "## Heap Sort\n\nHeap sort uses a binary heap...",
      "category": "algorithms",
      "tags": ["sorting", "heap", "O(n log n)"],
      "source": "ai_generated",
      "created_at": "2026-05-08T09:00:00.000Z",
      "updated_at": "2026-05-08T09:00:00.000Z"
    }
  ],
  "meta": {
    "total": 47,
    "page": 1,
    "per_page": 20,
    "timestamp": "2026-05-08T09:00:00.000Z"
  }
}
```

---

## 9. Endpoints: Roadmap

### `GET /api/roadmap`

Returns the user's roadmap sessions (history).

**Response: 200 OK**
```json
{
  "data": [
    {
      "id": "session-uuid-1",
      "session_name": "My Backend Roadmap",
      "target_role": "Backend Engineer",
      "company_type": "korean_tech",
      "timeline_months": 6,
      "weekly_hours": 15,
      "is_active": true,
      "progress": {
        "total_items": 24,
        "completed_items": 7,
        "percentage": 29
      },
      "created_at": "2026-04-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 2,
    "timestamp": "2026-05-08T09:00:00.000Z"
  }
}
```

### `GET /api/roadmap/:id`

Returns a full roadmap session with all items and completion status.

---

## 10. Endpoints: Study Goals

### `GET /api/goals`

Returns user's study goals.

**Query parameters:** `completed` (boolean filter), `sort`, `order`

**Response: 200 OK**
```json
{
  "data": [
    {
      "id": "goal-uuid-1",
      "title": "Complete Binary Tree chapter in CLRS",
      "description": null,
      "target_date": "2026-05-20",
      "completed": false,
      "roadmap_item_id": null,
      "created_at": "2026-05-01T00:00:00.000Z",
      "updated_at": "2026-05-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 8,
    "timestamp": "2026-05-08T09:00:00.000Z"
  }
}
```

---

## 11. Endpoints: User Profile

### `GET /api/profile`

Returns the authenticated user's profile.

**Response: 200 OK**
```json
{
  "data": {
    "id": "user-uuid",
    "display_name": "Munkh",
    "university": "Yonsei University",
    "graduation_year": 2027,
    "target_role": "Backend Engineer",
    "preferred_language": "en",
    "onboarding_completed": true,
    "email": "munkh5098@gmail.com",
    "created_at": "2026-01-15T00:00:00.000Z"
  },
  "meta": {
    "timestamp": "2026-05-08T09:00:00.000Z"
  }
}
```

### `PATCH /api/profile`

Updates profile fields. Only provided fields are updated.

**Request body:**
```json
{
  "display_name": "Munkh",
  "university": "Yonsei University",
  "graduation_year": 2027,
  "target_role": "Backend Engineer"
}
```

---

## 12. Server Actions

Server Actions handle most mutations. They are typed TypeScript functions called directly from React components. Unlike API routes, they revalidate the Next.js cache on success.

### Internship Actions

```typescript
// lib/actions/internships.ts

// Create a new application — validates input, inserts record, logs timeline event
createApplication(data: CreateApplicationInput): Promise<ActionResult<Application>>

// Update application status — updates status, logs timeline event
updateApplicationStatus(id: string, status: ApplicationStatus, note?: string): Promise<ActionResult>

// Update application fields — partial update of any application fields
updateApplication(id: string, data: Partial<Application>): Promise<ActionResult>

// Delete an application — hard delete
deleteApplication(id: string): Promise<ActionResult>
```

### Vault Actions

```typescript
// lib/actions/vault.ts

// Create vault note — can be called from Lecture Explainer "Save" button
createVaultNote(data: CreateNoteInput): Promise<ActionResult<VaultNote>>

// Update note content, title, tags
updateVaultNote(id: string, data: Partial<VaultNote>): Promise<ActionResult>

// Delete note
deleteVaultNote(id: string): Promise<ActionResult>
```

### Goal Actions

```typescript
// lib/actions/goals.ts

createStudyGoal(data: CreateGoalInput): Promise<ActionResult<StudyGoal>>
toggleGoalCompleted(id: string): Promise<ActionResult>
updateStudyGoal(id: string, data: Partial<StudyGoal>): Promise<ActionResult>
deleteStudyGoal(id: string): Promise<ActionResult>
```

### Roadmap Actions

```typescript
// lib/actions/roadmap.ts

// Mark a single roadmap item complete/incomplete
toggleRoadmapItem(itemId: string): Promise<ActionResult>

// Rename a roadmap session
updateRoadmapSessionName(sessionId: string, name: string): Promise<ActionResult>

// Delete a roadmap session (and all items)
deleteRoadmapSession(sessionId: string): Promise<ActionResult>
```

### Profile Actions

```typescript
// lib/actions/profile.ts

updateProfile(data: Partial<UserProfile>): Promise<ActionResult>
completeOnboarding(): Promise<ActionResult>
```

### ActionResult type

```typescript
type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; field?: string }
```

---

## 13. Webhook Events

### Supabase Auth Webhooks

Supabase sends webhook events to `/api/webhooks/auth` for user lifecycle events.

**`user.created` event:** Triggers creation of a `user_profiles` row if the database trigger has not already handled it (failsafe).

**`user.deleted` event:** Logged for audit purposes. Data deletion is handled by cascade deletes in the database.

**Webhook verification:** Requests include a `X-Supabase-Webhook-Secret` header verified against `SUPABASE_WEBHOOK_SECRET` environment variable.

```typescript
// app/api/webhooks/auth/route.ts
export async function POST(request: NextRequest) {
  const secret = request.headers.get('X-Supabase-Webhook-Secret')
  if (secret !== process.env.SUPABASE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // Handle event...
}
```
