# Feature Priority Matrix
## GlobalCampus AI — Effort vs. Impact Analysis

**Version:** 1.0.0  
**Status:** Active — Pre-Development  
**Last Updated:** 2026-05-08  
**Framework:** MoSCoW + Effort/Impact Scoring + Dependency Ordering  

---

## Table of Contents

1. [Scoring Methodology](#1-scoring-methodology)
2. [MoSCoW Classification](#2-moscow-classification)
3. [Effort × Impact Matrix](#3-effort--impact-matrix)
4. [Feature Dependency Graph](#4-feature-dependency-graph)
5. [Build Order Derivation](#5-build-order-derivation)
6. [Cut Decisions for MVP](#6-cut-decisions-for-mvp)
7. [Risk-Adjusted Priority](#7-risk-adjusted-priority)
8. [Post-MVP Backlog Ranking](#8-post-mvp-backlog-ranking)

---

## 1. Scoring Methodology

### Impact Score (1–5)

Measures the value delivered to the primary user (international CS student in Korea).

| Score | Meaning |
|---|---|
| 5 | Core value proposition — users will not use the platform without this |
| 4 | High value — significantly improves the primary workflow |
| 3 | Medium value — useful but not a reason to choose this platform |
| 2 | Low value — nice to have; users will not miss it at MVP |
| 1 | Minimal value — cosmetic or marginal improvement |

### Effort Score (1–5)

Measures implementation complexity for a solo developer on the defined tech stack.

| Score | Meaning |
|---|---|
| 5 | Very high — multiple days, external service integration, complex state |
| 4 | High — 1–2 days, significant business logic or API complexity |
| 3 | Medium — 4–8 hours, standard CRUD with some complexity |
| 2 | Low — 2–4 hours, straightforward implementation |
| 1 | Trivial — < 2 hours, mostly configuration or boilerplate |

### Priority Score

```
Priority = Impact / Effort
```

Higher priority score = do first. Equal priority scores are broken by dependency order and risk.

---

## 2. MoSCoW Classification

### Must Have (MVP — ship these or the product does not launch)

These are features without which the target user has no reason to use the platform at all.

| Feature | Rationale |
|---|---|
| Email/password authentication | Cannot have a multi-user product without it |
| Google OAuth | Core usability expectation for student demographic |
| Dashboard overview | Entry point to all features — must exist |
| Internship application CRUD | Primary stated value proposition |
| Internship status pipeline | The core workflow differentiation vs. a spreadsheet |
| AI Lecture Explainer | Second primary value proposition |
| Study Vault CRUD | Storage layer for AI-generated explanations — Explainer is incomplete without it |
| Vault full-text search | Vault without search is just a list — search is what makes it useful |
| Career Roadmap Generator | Third primary value proposition |
| Roadmap progress tracking | Roadmap without tracking is a document, not a tool |
| Protected routes (middleware) | Security baseline — all content must be user-scoped |
| Row-Level Security | Data isolation — non-negotiable |

### Should Have (MVP — include if time allows, but MVP ships without them)

These meaningfully improve the product but do not block launch.

| Feature | Rationale |
|---|---|
| Study Goals | Connects roadmap to daily habits; useful but dashboard works without it |
| Application timeline events | Status history; valuable but current status alone is sufficient at launch |
| Onboarding flow | Improves first-run experience; dashboard still works without it |
| Dashboard quick note widget | Convenience; users can navigate to Vault directly |
| Vault tag filtering | Enhances Vault; full-text search is sufficient at MVP |
| Roadmap session history | Multiple saved roadmaps; single active roadmap is sufficient |

### Could Have (Post-MVP — build after launch validation)

| Feature | Rationale |
|---|---|
| Email deadline notifications | Useful but requires email infrastructure (Resend/Postmark) + cron jobs |
| Mobile-optimized layout | Desktop-first at MVP; refine after real usage data |
| Dark/light mode toggle | Dark mode only at MVP; toggle adds design overhead |
| Password reset via email | Important but Google OAuth covers most auth failure cases |
| Bulk status update (internships) | Convenience for power users; not needed at launch |
| Application recruiter email field | Nice detail; company name + status is sufficient at MVP |

### Won't Have (Not in scope — firm boundary)

| Feature | Rationale |
|---|---|
| Mobile native app | Requires separate codebase; web-responsive is sufficient |
| Team/group features | Multi-user data sharing requires significant auth and RLS rework |
| Resume builder | PDF generation + storage + AI generation = separate product scope |
| Job listing aggregation | Legal complexity (web scraping) + data reliability issues |
| LeetCode integration | External API dependency; fragile; defer |
| GitHub activity import | Nice-to-have; adds external auth complexity |
| Social features (peer comparison) | Anonymization requirements; multi-user infrastructure |
| Calendar sync (Google, iCal) | OAuth scope expansion + calendar API complexity |

---

## 3. Effort × Impact Matrix

### Feature Scoring Table

| # | Feature | Impact | Effort | Priority | Phase |
|---|---|---|---|---|---|
| 1 | Email/password auth | 5 | 2 | **2.5** | 0 |
| 2 | Google OAuth | 4 | 2 | **2.0** | 0 |
| 3 | Middleware route protection | 5 | 1 | **5.0** | 0 |
| 4 | Row-Level Security (database) | 5 | 2 | **2.5** | 0 |
| 5 | Dashboard shell (sidebar + layout) | 4 | 2 | **2.0** | 0 |
| 6 | Internship application CRUD | 5 | 3 | **1.67** | 1 |
| 7 | Internship status pipeline (enum + badge) | 5 | 2 | **2.5** | 1 |
| 8 | Application list with filter/sort | 4 | 3 | **1.33** | 1 |
| 9 | Application detail + timeline | 3 | 3 | **1.0** | 1 |
| 10 | Dashboard pipeline stats | 4 | 2 | **2.0** | 1 |
| 11 | Dashboard upcoming deadlines | 4 | 2 | **2.0** | 1 |
| 12 | Study Vault CRUD | 5 | 3 | **1.67** | 1 |
| 13 | Vault full-text search | 5 | 2 | **2.5** | 1 |
| 14 | Vault category filter | 3 | 1 | **3.0** | 1 |
| 15 | Vault markdown editor/preview | 4 | 2 | **2.0** | 1 |
| 16 | Study Goals CRUD | 3 | 2 | **1.5** | 1 |
| 17 | AI provider abstraction layer | 5 | 2 | **2.5** | 2 |
| 18 | Per-user rate limiting (AI) | 4 | 2 | **2.0** | 2 |
| 19 | AI Lecture Explainer (API route) | 5 | 3 | **1.67** | 2 |
| 20 | AI Lecture Explainer (UI) | 5 | 3 | **1.67** | 2 |
| 21 | Explainer → Save to Vault | 4 | 1 | **4.0** | 2 |
| 22 | Career Roadmap Generator (API) | 5 | 4 | **1.25** | 2 |
| 23 | Career Roadmap Generator (UI) | 5 | 4 | **1.25** | 2 |
| 24 | Roadmap item completion tracking | 4 | 2 | **2.0** | 2 |
| 25 | Error boundaries + fallback UI | 4 | 2 | **2.0** | 3 |
| 26 | Loading skeletons (all pages) | 3 | 2 | **1.5** | 3 |
| 27 | Lighthouse performance audit | 4 | 3 | **1.33** | 3 |
| 28 | Accessibility audit (WCAG 2.1 AA) | 3 | 2 | **1.5** | 3 |
| 29 | Production deployment (Vercel) | 5 | 2 | **2.5** | 3 |
| 30 | Smoke test on production | 5 | 1 | **5.0** | 3 |

### Visual Priority Matrix

```
IMPACT
  5 │  [4][7][17]  [1][13]     [6][12][19][20]   [22][23]
    │
  4 │  [21][30]    [2][5][10]  [8][15][18][24]   
    │              [11][25][29] [27]
    │
  3 │  [3][14]     [26]        [9][16][28]
    │
  2 │                                             
    │
  1 │                                             
    └─────────────────────────────────────────────
         1           2           3           4     5   EFFORT
    
    HIGH PRIORITY ◄─────────────────────► LOWER PRIORITY
    (build first)                         (build later)
```

**Top-right quadrant (High Impact, High Effort) = Core AI features**  
These have the most value but take the most time. They come last in the build order despite high impact, because the low-effort high-impact features must exist first (infrastructure, data layer).

**Top-left quadrant (High Impact, Low Effort) = Do first**  
Middleware, RLS, status pipeline, full-text search, AI provider abstraction. Maximum value per hour of work.

---

## 4. Feature Dependency Graph

A feature cannot be built until its dependencies are complete. This graph determines the strict build ordering.

```
[Supabase Project Created]
        │
        ▼
[Database Schema Applied] ─────────────────────────────────────────┐
        │                                                           │
        ▼                                                           ▼
[Supabase Client (server + browser)]                    [TypeScript Types Generated]
        │                                                           │
        ▼                                                           ▼
[Authentication (email + Google)] ◄──────────────────── [Auth User Types Available]
        │
        ▼
[Middleware Route Protection]
        │
        ├──────────────────────────────────────────────────────────┐
        │                                                           │
        ▼                                                           ▼
[Dashboard Shell (layout)]                              [User Profile CRUD]
        │
        ├─────────────────────────────────────┐
        │                                     │
        ▼                                     ▼
[Internship Actions (CRUD)]         [Vault Actions (CRUD)]
        │                                     │
        ▼                                     │
[Internship API Routes]                       ▼
        │                           [Vault API Routes]
        ▼                                     │
[Internship List UI]                [Vault Two-Panel UI]
        │                                     │
        ▼                                     ▼
[Dashboard Stats Widget]            [Vault Search + Filters]
                                              │
                                              ▼
                               [Study Goals CRUD] ─────────────┐
                                                                │
                                                                ▼
                                                    [Dashboard Integration Complete]
                                                                │
                                                                ▼
                                                    [AI Provider Abstraction]
                                                                │
                               ┌────────────────────────────────┤
                               │                                │
                               ▼                                ▼
                    [Lecture Explainer API]          [Roadmap Generator API]
                               │                                │
                               ▼                                ▼
                    [Lecture Explainer UI]           [Roadmap UI]
                               │                                │
                               ▼                                ▼
                    [Save to Vault Integration]     [Roadmap Progress Tracking]
                               │                                │
                               └──────────────┬─────────────────┘
                                              │
                                              ▼
                                  [Error Boundaries + Fallbacks]
                                              │
                                              ▼
                                  [Performance + Accessibility Audit]
                                              │
                                              ▼
                                  [Production Deployment]
```

**Key observations from this graph:**

1. The database schema is the root dependency for everything. It must be correct before auth is built, because auth writes to `user_profiles`.

2. Auth is the second root dependency. Every subsequent feature depends on a working auth session.

3. The AI features have the deepest dependency chain (Schema → Auth → Shell → Data layer → AI infra → Feature). This is why they come last.

4. The Vault and Internship tracker have parallel dependency chains — they could theoretically be built simultaneously, but a solo developer builds them sequentially.

---

## 5. Build Order Derivation

Sorting by dependency order, then by Priority Score (Impact/Effort) within the same dependency level:

| Build Order | Feature | Priority Score | Reason for Position |
|---|---|---|---|
| 1 | Database schema + migrations | — | Root dependency |
| 2 | TypeScript types generation | — | Enables typed queries |
| 3 | Supabase client (server + browser) | — | Required for all queries |
| 4 | Email/password auth | 2.5 | Required for all features |
| 5 | Google OAuth | 2.0 | Auth completion |
| 6 | Middleware route protection | 5.0 | Highest priority score in Phase 0 |
| 7 | Dashboard shell | 2.0 | Navigation frame for all features |
| 8 | User profile CRUD | 1.5 | Onboarding + profile settings |
| 9 | Internship status pipeline (enum + badge) | 2.5 | Built with data layer — low effort, high value |
| 10 | Dashboard stats API route | 2.0 | Dashboard is entry point — show data early |
| 11 | Dashboard upcoming deadlines widget | 2.0 | Core dashboard value |
| 12 | Internship CRUD actions | 1.67 | Foundation for tracker UI |
| 13 | Internship list + filter UI | 1.33 | Core tracker experience |
| 14 | Application form (create/edit) | — | Completes tracker CRUD |
| 15 | Application detail + timeline | 1.0 | Enhancement to tracker |
| 16 | Vault CRUD actions | 1.67 | Foundation for vault UI |
| 17 | Vault full-text search | 2.5 | Core vault utility |
| 18 | Vault category filter | 3.0 | Highest priority score in vault section |
| 19 | Vault two-panel UI | — | Vault experience |
| 20 | Vault markdown editor | 2.0 | Makes vault useful for notes |
| 21 | Study Goals CRUD | 1.5 | Dashboard integration |
| 22 | Dashboard quick note widget | — | Convenience integration |
| 23 | **AI provider abstraction** | 2.5 | Enables all AI features |
| 24 | Per-user rate limiting | 2.0 | Must precede AI features |
| 25 | Explainer → Save to Vault | 4.0 | Highest priority in Phase 2 |
| 26 | Lecture Explainer API route | 1.67 | Core AI feature |
| 27 | Lecture Explainer UI | 1.67 | UI for above |
| 28 | Roadmap Generator API route | 1.25 | Complex but high value |
| 29 | Roadmap UI | 1.25 | UI for above |
| 30 | Roadmap item completion tracking | 2.0 | Makes roadmap a tool, not a document |
| 31 | Error boundaries | 2.0 | Production safety |
| 32 | Loading skeletons | 1.5 | UX polish |
| 33 | Performance audit | 1.33 | Launch readiness |
| 34 | Production deployment | 2.5 | The actual launch |
| 35 | Smoke test | 5.0 | Verification (mandatory last step) |

---

## 6. Cut Decisions for MVP

If timeline pressure forces scope reduction, cut in this order (cut later items first):

### First to cut (least impact to core value):

**Cut: Application recruiter email field**
- Saves: 30 minutes
- Cost: Minor detail loss; recruiter name alone is sufficient

**Cut: Application detail timeline view**
- Saves: 3 hours
- Cost: No status history visible; current status in list view is sufficient

**Cut: Vault tag filtering**
- Saves: 2 hours
- Cost: Search still works; tags still store but filtering is disabled

**Cut: Roadmap session history sidebar**
- Saves: 3 hours
- Cost: Only current roadmap visible; can still generate new ones

**Cut: Study Goals linking to roadmap items**
- Saves: 2 hours
- Cost: Goals and roadmap items don't sync; both still work independently

### Second to cut (impacts UX but not core functionality):

**Cut: Loading skeletons (replace with spinner)**
- Saves: 3 hours
- Cost: UX degrades slightly; loading spinners are functional

**Cut: Onboarding flow**
- Saves: 4 hours
- Cost: Users see empty dashboard on first login; profile can be updated in settings

**Cut: Roadmap item descriptions (show titles only)**
- Saves: 2 hours of prompt engineering and parsing
- Cost: Roadmap is less informative; titles alone are still actionable

### Do NOT cut:

- Authentication (any variant)
- Internship application CRUD + status pipeline
- AI Lecture Explainer (any variant)
- Vault CRUD + search
- Roadmap Generator (any variant)
- Error boundaries + production deployment

These are the non-negotiable core. Everything else is optional.

---

## 7. Risk-Adjusted Priority

Some features have low priority scores but high risk — building them wrong creates cascading failures.

| Feature | Priority Score | Risk Level | Adjusted Priority | Why High Risk |
|---|---|---|---|---|
| Database schema | — | **Critical** | Build first, get right | Schema changes in production require migrations; mistakes compound |
| Row-Level Security | 2.5 | **Critical** | Build in Phase 0 | A single wrong policy exposes all user data |
| AI provider abstraction | 2.5 | **High** | Build before any AI feature | Coupling to one provider creates lock-in; fix before it's used in two features |
| Middleware route protection | 5.0 | **High** | Highest Phase 0 priority | Missing middleware exposes all routes; easy to miss during development |
| TypeScript types (generated) | — | **High** | Regenerate after every schema change | Stale types cause runtime errors that TypeScript can't catch |
| Server Action validation (Zod) | — | **Medium** | Add to every action | Missing validation is a correctness and security issue |

---

## 8. Post-MVP Backlog Ranking

Features for after launch validation, ranked by Priority Score:

| Rank | Feature | Impact | Effort | Score | Trigger |
|---|---|---|---|---|---|
| 1 | Email deadline notifications | 5 | 3 | 1.67 | When 10+ users have applications with deadlines |
| 2 | Password reset via email | 4 | 2 | 2.0 | Any user reports being locked out |
| 3 | Mobile-optimized layout | 4 | 3 | 1.33 | When mobile traffic > 20% of sessions |
| 4 | Bulk status update | 3 | 2 | 1.5 | When average user has > 15 applications |
| 5 | Dark/light mode toggle | 2 | 2 | 1.0 | If explicitly requested by multiple users |
| 6 | GitHub activity display | 3 | 3 | 1.0 | When roadmap progress tracking is well-used |
| 7 | Google Calendar sync | 4 | 4 | 1.0 | When internship tracker has > 100 MAU |
| 8 | LeetCode progress integration | 3 | 4 | 0.75 | When roadmap generator is well-adopted |
| 9 | Resume builder | 5 | 5 | 1.0 | Separate product decision — requires own planning |
| 10 | Community features | 4 | 5 | 0.8 | Only after 500+ MAU; requires major architecture changes |

**The trigger column is important.** Do not build post-MVP features speculatively. Build them when real usage data validates the need.
