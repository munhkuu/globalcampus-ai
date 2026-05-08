# Product Requirements Document
## GlobalCampus AI — International CS Student Productivity Platform

**Version:** 1.0.0  
**Status:** Active — Pre-Development  
**Author:** Engineering Team  
**Last Updated:** 2026-05-08  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Target Users](#3-target-users)
4. [Market Context](#4-market-context)
5. [Product Vision](#5-product-vision)
6. [Core Workflows](#6-core-workflows)
7. [Feature Specifications](#7-feature-specifications)
8. [Non-Functional Requirements](#8-non-functional-requirements)
9. [Out of Scope (MVP)](#9-out-of-scope-mvp)
10. [Success Metrics](#10-success-metrics)
11. [Risk Assessment](#11-risk-assessment)

---

## 1. Executive Summary

GlobalCampus AI is a productivity and career platform built specifically for international computer science students studying in South Korea. It centralizes four high-friction workflows that this demographic faces simultaneously: tracking internship applications across Korean and global companies, understanding lecture content delivered in technical Korean, building structured CS career roadmaps, and organizing study materials across multiple courses.

The platform's value is not AI novelty — it is the **integration of AI assistance directly into structured workflows** that students already perform manually. The AI layer is contextual, not conversational. It appears at the moment of friction, not as a general-purpose chatbot layered on top.

---

## 2. Problem Statement

### 2.1 The Context

International CS students studying in Korea occupy an unusually high-pressure position. They must simultaneously:

- Learn computer science at an advanced level
- Navigate a foreign academic and professional system
- Compete for internships against both Korean nationals and other international students
- Overcome language barriers in technical lectures, documentation, and recruiting communications
- Build competitive portfolios without the local networks that domestic students rely on

The tools available to them are fragmented. They use Notion for notes, spreadsheets for internship tracking, ChatGPT for lecture translation, Roadmap.sh for career paths, and Anki for memorization. None of these tools talk to each other. There is no workflow continuity. Every tool requires context re-entry.

### 2.2 The Specific Failures

**Internship tracking:**  
Students manually maintain spreadsheets with application statuses that go stale. There is no reminder system, no recruiter note field, no centralized view of where they stand across 10–30 simultaneous applications during recruiting season. A single missed OA deadline due to spreadsheet neglect can cost a candidate months.

**Lecture comprehension:**  
Korean technical lectures use specialized vocabulary that general-purpose translation tools handle poorly. When a professor says "힙 정렬의 시간 복잡도" in passing, a student needs an immediate, accurate, educational explanation — not a literal translation. Google Translate and ChatGPT both lack the pedagogical context to serve this need well.

**Career roadmap:**  
Students frequently waste study hours on topics that don't map to their target roles. A student aiming for a backend engineering role at a Korean fintech company needs a materially different study path than one targeting a Silicon Valley startup. Generic roadmaps fail to account for this specificity, and students have no way to track progress against custom goals.

**Study organization:**  
Notes, algorithm explanations, interview prep, and CS terminology accumulate across Notion, Google Docs, KakaoTalk saved messages, and screenshots. When a student needs to recall a specific data structure explanation from three months ago, retrieval fails. The knowledge exists but is inaccessible.

### 2.3 The Root Cause

These failures share a common cause: **the absence of a single system of record built for the specific context of this student cohort.** General tools exist. Context-aware, workflow-integrated tools for this population do not.

---

## 3. Target Users

### 3.1 Primary User: International CS Student in Korea

**Demographic:**
- Undergraduate or graduate CS student
- International student (non-Korean national), most commonly from Mongolia, China, Southeast Asia, India, Central Asia
- Enrolled at a Korean university (KAIST, Yonsei, Korea University, POSTECH, Hanyang, Sungkyunkwan)
- Age range: 19–28

**Technical Profile:**
- Comfortable with web tools and productivity software
- Familiar with GitHub, Notion, Google Workspace
- Varying Korean language proficiency (intermediate technical comprehension is the median)
- English as primary working language

**Career Aspirations:**
- Targeting internships at Korean tech companies (Kakao, Naver, LINE, Samsung, LG CNS, Krafton) or global companies with Korean offices
- Secondarily targeting global remote internships (US/EU startups, FAANG-adjacent)
- Interested in competitive algorithms and DSA interview preparation common in Korean recruiting

**Pain Intensity:**
- Internship management: **Critical** — missed deadlines have direct career consequences
- Lecture comprehension: **High** — academic performance depends on it
- Career roadmap: **Medium-High** — students feel directionless without structure
- Study vault: **Medium** — desired but not yet perceived as urgent by most students

### 3.2 Secondary User: Advanced Underclassman (Pre-Internship)

A student in their first or second year who is not yet applying for internships but is using the platform primarily for:
- Building a structured CS study plan
- Organizing lecture notes and terminology
- Understanding the career landscape before recruiting season begins

This user does not use the internship tracker heavily but drives adoption of the study vault and roadmap generator.

### 3.3 Excluded Users (MVP)

- Domestic Korean students (the language interface and problem framing are specific to internationals)
- Graduate researchers (different workflow; more publication-oriented)
- Non-CS students (the AI system is explicitly CS-contextualized)

---

## 4. Market Context

### 4.1 Why This Exists Now

Three converging conditions make this viable in 2025–2026:

1. **International student enrollment in Korea has grown substantially** — Korean universities have actively expanded international recruitment, with over 200,000 international students enrolled as of 2024.
2. **Korean tech internship demand is high** — companies like Kakao, Naver, and Krafton run structured internship programs that attract international applicants, but the recruiting process is opaque to outsiders.
3. **AI inference costs have dropped to the point where contextual AI features are economically viable** in a student-facing SaaS product at a freemium price point.

### 4.2 Competitive Landscape

| Product | What It Does | Why It Falls Short |
|---|---|---|
| Notion | General note-taking and databases | No AI integration; no CS-specific context; requires significant setup |
| Simplify / Teal | Job application tracking | US-market focus; no Korean job ecosystem; no student-specific features |
| ChatGPT | General AI assistant | No workflow integration; no persistence; no student progress tracking |
| Roadmap.sh | Static CS learning roadmaps | Not personalized; no progress tracking; not connected to other workflows |
| Anki | Flashcard memorization | No AI generation; isolated from lecture content; no CS career context |

No product in market combines internship tracking, AI-assisted lecture comprehension, personalized roadmaps, and study organization in a single platform with Korean academic context.

---

## 5. Product Vision

**Mission statement:**  
Give every international CS student in Korea the organizational infrastructure and contextual AI assistance to compete on equal footing with domestic students.

**Core design principle:**  
AI assists workflows; it does not replace them. The student remains in control of their data, their tracking, and their decisions. The platform surfaces AI capabilities at moments of specific friction — not as a constant chat interface.

**What success looks like in 12 months:**
- A student can log an internship application in under 30 seconds
- A student can paste a paragraph of Korean CS lecture text and receive a pedagogically useful explanation within 10 seconds
- A student's study vault contains searchable, tagged knowledge they actually built — not AI-generated filler
- A student can see their career roadmap progress update as they log completed study goals

---

## 6. Core Workflows

### Workflow 1: Internship Application Lifecycle

```
Discover opportunity → Log application → Track status → Log interview stages → Record outcome
                                ↓
                    Attach notes, links, recruiter context
                                ↓
                    Dashboard shows active pipeline status
```

**Key friction points resolved:**
- Single-click status updates (no spreadsheet editing)
- Deadline reminders integrated into dashboard
- Recruiter notes attached to application record, not scattered in messages

### Workflow 2: Lecture Comprehension

```
Attend lecture → Encounter unclear concept/term → Paste text or terminology → Receive explanation
                                                            ↓
                                         Optionally save explanation to Study Vault
```

**Key friction points resolved:**
- Korean technical terms explained with CS context, not literal translation
- Output calibrated to the student's level (not a PhD paper, not a 5-year-old explanation)
- Direct save-to-vault integration preserves the explanation for later review

### Workflow 3: Career Roadmap Generation

```
Input: target role + current skills + weekly study hours
                    ↓
         AI generates structured roadmap
                    ↓
         Student tracks progress against roadmap items
                    ↓
         Dashboard shows roadmap completion percentage
```

**Key friction points resolved:**
- Role specificity (backend at Korean fintech ≠ ML engineer at US startup)
- Linked to actual study hours student can commit
- Progress is tracked, not just generated and forgotten

### Workflow 4: Study Vault

```
Create note → Tag by category → Search by keyword or tag
                  ↓
     AI-generated notes saved from Lecture Explainer
                  ↓
     Algorithm explanations, interview prep, terminology
```

**Key friction points resolved:**
- One searchable location for all CS study material
- Tags allow retrieval by category (Algorithms, Data Structures, System Design, Korean Terms)
- Timestamps allow chronological review before exams

### Workflow 5: Dashboard Overview

```
Daily login → See: upcoming internship deadlines + study goal progress + recent vault entries + quick note
```

**Key friction points resolved:**
- Single view of everything relevant today
- No navigation required to assess current status
- Quick-add actions accessible without deep navigation

---

## 7. Feature Specifications

### Feature 1: Authentication

**Scope:** Email/password and Google OAuth login, protected routes, persistent sessions.

**Acceptance Criteria:**
- User can create an account with email and password
- User can sign in with Google (OAuth 2.0 via Supabase)
- Sessions persist across browser closes (JWT + refresh token)
- Unauthenticated users are redirected to `/login` from all dashboard routes
- Password reset flow is functional via email
- Email confirmation required for new email/password accounts

**Technical constraints:**
- Supabase Auth handles the entire auth lifecycle
- JWTs are validated server-side on every API route call
- No custom session management — Supabase session is the single source of truth

**Out of scope:** Social login beyond Google (GitHub, LinkedIn) — deferred to post-MVP.

---

### Feature 2: Student Dashboard

**Scope:** The primary landing page after login. A contextual overview of current state across all platform modules.

**Acceptance Criteria:**
- Dashboard renders within 2 seconds on a standard connection
- Shows upcoming internship deadlines (next 14 days) sorted by urgency
- Shows count of applications by status (Applied, OA, Interview, Rejected, Accepted)
- Shows active study goals with completion progress
- Shows 3 most recently accessed vault entries
- Contains a quick-note widget (textarea that saves to vault on submit)
- All dashboard data fetched in parallel (not waterfall)

**Data sources:**
- `internship_applications` table (deadline + status)
- `study_goals` table (completion status)
- `vault_notes` table (recent entries)

**Design principle:** The dashboard must not require scrolling to see critical information on a standard 1080p display. Information hierarchy is: deadlines → application pipeline → goals → recent notes.

---

### Feature 3: Internship Tracker

**Scope:** Full CRUD for internship applications with status pipeline, recruiter notes, resume links, and interview stage tracking.

**Application record fields:**
| Field | Type | Required | Notes |
|---|---|---|---|
| Company name | text | yes | |
| Role title | text | yes | |
| Status | enum | yes | Applied, OA, Interview, Rejected, Accepted |
| Application date | date | yes | Default: today |
| Deadline | date | no | Used for dashboard urgency |
| Job URL | URL | no | |
| Resume link | URL | no | Google Drive / GitHub link |
| Recruiter name | text | no | |
| Recruiter email | text | no | |
| Notes | rich text | no | Interview notes, OA feedback |
| Interview stage | text | no | e.g., "1st round", "final" |

**Acceptance Criteria:**
- User can create, read, update, delete applications
- Status can be updated via dropdown in list view (no modal required)
- Applications filterable by status, company name, date range
- Applications sortable by deadline, date applied, company name
- Bulk status update supported (select multiple → change status)
- Notes field supports basic markdown (bold, italic, bullet lists)
- Application count by status visible in a summary bar at top of page

---

### Feature 4: AI Lecture Explainer

**Scope:** A contextual AI tool for explaining CS concepts from lecture text or Korean technical terminology.

**Input modes:**
1. **Free text paste** — student pastes a paragraph or sentence from lecture slides
2. **Terminology mode** — student enters a Korean CS term and requests bilingual explanation

**Output format:**
- Plain-language explanation of the concept (not a literal translation)
- Identification of the underlying CS topic (e.g., "This is about heap sort — a comparison-based sorting algorithm")
- Code example when applicable (language selectable: Python, Java, C++)
- Optional bilingual output (Korean term → English CS equivalent with explanation)

**Acceptance Criteria:**
- Explanation generated within 10 seconds on standard connection
- User can select explanation depth: Beginner / Intermediate / Advanced
- User can select preferred code language
- Output can be saved directly to Study Vault with one click
- System does not operate as a general chatbot — input is scoped to CS lecture content
- If input is not CS-related, the system returns a scoped refusal message

**AI prompt strategy:**
The system prompt explicitly frames the AI as a "CS teaching assistant for a student who may be reading Korean lecture material." It is not a general assistant. Inputs are pre-validated for CS relevance before the AI prompt is submitted.

---

### Feature 5: CS Career Roadmap Generator

**Scope:** A structured, AI-generated learning roadmap based on user-specified role, current skills, and available time.

**Input fields:**
| Field | Type | Notes |
|---|---|---|
| Target role | dropdown + freetext | Backend Engineer, Frontend Engineer, ML Engineer, Data Engineer, DevOps, etc. |
| Company type | dropdown | Korean tech company, Global startup, FAANG-adjacent, Research |
| Current skills | multi-select + freetext | Languages, frameworks, tools |
| Weekly study hours | number | 1–40 |
| Timeline | dropdown | 3 months, 6 months, 1 year |

**Output format:**
A structured roadmap divided into phases. Each phase contains:
- Phase title and goal
- Technologies/topics to study (ordered by dependency)
- Recommended resources (not pulled from the web — curated from training data)
- Practice projects with brief descriptions
- Interview preparation topics relevant to the phase

**Acceptance Criteria:**
- Roadmap generated within 15 seconds
- Output is structured (not a wall of text) — rendered as collapsible sections
- Generated roadmap saved to `roadmap_history` table automatically
- User can mark individual roadmap items as complete
- Completion percentage visible on dashboard
- User can regenerate with different inputs; previous versions preserved in history

**AI differentiation:**
The prompt system distinguishes between Korean company recruiting (algorithm-heavy, Kakao/Naver style coding tests) and global company recruiting (system design-heavy, LeetCode-focused). Output is calibrated accordingly.

---

### Feature 6: Study Vault

**Scope:** A searchable, tagged knowledge base for CS study materials.

**Note fields:**
| Field | Type | Notes |
|---|---|---|
| Title | text | Required |
| Content | markdown | Rich text body |
| Category | enum | Algorithms, Data Structures, System Design, Korean Terms, Interview Prep, Lecture Notes, Other |
| Tags | string array | Free-form tags |
| Source | enum | Manual, AI-Generated (from Lecture Explainer), Roadmap |
| Created at | timestamp | Auto |
| Updated at | timestamp | Auto |

**Acceptance Criteria:**
- User can create, read, update, delete notes
- Full-text search across title and content
- Filter by category and tags
- Sort by date created, date updated, title
- Notes from AI Lecture Explainer auto-populate with source = "AI-Generated"
- Vault accessible from Lecture Explainer output (one-click save)
- Markdown rendered in read view; raw editor in edit view

---

## 8. Non-Functional Requirements

### Performance
- Dashboard initial load: < 2s on 50 Mbps connection
- AI feature responses: < 15s (UI shows streaming or skeleton during wait)
- Database queries: < 200ms for single-user filtered queries (enforced via indexing)
- Page transitions: < 300ms (Next.js App Router prefetching)

### Reliability
- Uptime target: 99.5% (acceptable for MVP; Vercel + Supabase default SLAs cover this)
- AI feature failures must degrade gracefully — show error state, do not crash the page
- Form state preserved on network failure (no data loss on submit error)

### Security
- All routes behind authentication middleware
- Row-level security on all Supabase tables (users can only access their own data)
- API keys never exposed to the client
- AI inputs sanitized before prompt submission
- No PII logged in AI interaction history beyond user ID

### Accessibility
- WCAG 2.1 AA compliance target
- All interactive elements keyboard-navigable
- Semantic HTML used throughout
- Sufficient color contrast in both light and dark modes (dark mode is default)

### Internationalization
- UI language: English (fixed for MVP)
- Content: supports Korean text input and display throughout
- Date formats: ISO 8601 in database; localized display in UI

---

## 9. Out of Scope (MVP)

The following features are explicitly deferred and will not be built in the initial release:

- **Mobile app** — web-responsive only; native mobile is post-MVP
- **Team/group features** — GlobalCampus AI is a single-user product at MVP
- **Email notifications** — deadline reminders are dashboard-only; email alerts deferred
- **Resume builder** — acknowledged user need; out of scope for MVP complexity
- **Job scraping/aggregation** — legal and infrastructure complexity; deferred
- **Social features** (peer comparison, community notes) — deferred
- **Calendar integration** (Google Calendar, iCal sync) — deferred
- **GitHub integration** (activity import, project tracking) — deferred
- **LeetCode integration** — deferred
- **Offline mode** — not feasible with Supabase-first architecture at MVP stage

---

## 10. Success Metrics

### Activation Metrics (First 30 days)
- User creates at least 1 internship application: target 70% of registered users
- User uses AI Lecture Explainer at least once: target 60%
- User creates at least 3 vault entries: target 50%

### Engagement Metrics (30–90 days)
- Weekly active users / monthly active users: target > 40%
- Average internship applications per active user: target > 5
- AI Lecture Explainer sessions per week per active user: target > 2

### Retention Metrics (90 days)
- Day-30 retention: target > 35%
- Day-60 retention: target > 20%

### Quality Metrics
- AI explanation usefulness (in-product rating): target > 4.0 / 5.0
- Page error rate: < 0.5%
- P95 AI response time: < 12 seconds

---

## 11. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| AI response quality insufficient for technical CS content | Medium | High | Implement prompt engineering quality gates; test against Korean CS curriculum samples |
| Supabase free tier limits hit at early growth | Medium | Medium | Design schema for efficient query patterns; upgrade path documented |
| OpenRouter API rate limits during high-traffic periods | Low-Medium | Medium | Implement per-user request queuing; fail gracefully with retry UI |
| Korean CS terminology coverage gaps in AI model | Medium | Medium | Supplement with curated term database; allow user corrections |
| Low initial user acquisition | High | High | Build for one cohort first (single university); validate before scaling |
| GDPR / Korean PIPA data compliance | Low | High | Store minimal PII; data residency in region-appropriate Supabase tier |
