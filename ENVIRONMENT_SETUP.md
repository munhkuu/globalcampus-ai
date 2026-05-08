# Environment Setup Guide
## GlobalCampus AI

**Version:** 1.0.0  
**Last Updated:** 2026-05-08  

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Local Development Setup](#2-local-development-setup)
3. [Environment Variables Reference](#3-environment-variables-reference)
4. [Supabase Configuration](#4-supabase-configuration)
5. [OpenRouter / AI Provider Setup](#5-openrouter--ai-provider-setup)
6. [Vercel Deployment](#6-vercel-deployment)
7. [Environment Variable Template](#7-environment-variable-template)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Prerequisites

Install the following before starting:

**Node.js 20+**
```bash
node --version  # Must be >= 20.0.0
```
Download from https://nodejs.org or install via `nvm`:
```bash
nvm install 20
nvm use 20
```

**Supabase CLI**
```bash
npm install -g supabase
supabase --version  # Verify installation
```

**Git**
```bash
git --version
```

**Accounts required:**
- Supabase account: https://supabase.com (free tier sufficient for development)
- OpenRouter account: https://openrouter.ai (pay-per-token; ~$5 credit lasts significant development time)
- Vercel account: https://vercel.com (free tier sufficient for MVP)

---

## 2. Local Development Setup

### Step 1: Clone the repository

```bash
git clone https://github.com/your-org/globalcampus-ai.git
cd globalcampus-ai
```

### Step 2: Install dependencies

```bash
npm install
```

### Step 3: Set up environment variables

```bash
cp .env.local.example .env.local
```

Fill in `.env.local` using the values from the following sections. Do not commit this file.

### Step 4: Set up Supabase (local or cloud)

**Option A: Cloud Supabase project (recommended for getting started quickly)**

1. Go to https://supabase.com/dashboard
2. Create a new project
3. Select region: `ap-northeast-2` (Seoul) — reduces latency for Korean users
4. Wait for project provisioning (~2 minutes)
5. Copy your project credentials (see §4)

**Option B: Local Supabase (for offline development)**
```bash
supabase start
# This starts local Postgres, Auth, and Storage via Docker
```

### Step 5: Apply database migrations

```bash
# Link to your cloud project (skip if using local)
supabase link --project-ref YOUR_PROJECT_REF

# Apply all migrations to the database
supabase db push

# Verify tables were created
supabase db diff --schema public  # Should show no diff
```

### Step 6: Generate TypeScript types

After applying migrations, generate the typed Supabase client:

```bash
# For cloud project:
supabase gen types typescript --linked > lib/types/database.types.ts

# For local project:
supabase gen types typescript --local > lib/types/database.types.ts
```

**Regenerate this file whenever the schema changes.** Stale types are worse than no types.

### Step 7: Run the development server

```bash
npm run dev
```

Open `http://localhost:3000`. You should see the login page.

### Step 8: Verify the setup

1. Create an account at `http://localhost:3000/register`
2. Log in — you should be redirected to the dashboard
3. Open Supabase Table Editor — you should see a row in `user_profiles` with your user ID
4. Log out — you should be redirected to `/login`

---

## 3. Environment Variables Reference

### Client-side variables (safe to expose in browser)

These are prefixed with `NEXT_PUBLIC_`. They are included in the client JavaScript bundle. Never put secrets here.

---

**`NEXT_PUBLIC_SUPABASE_URL`**

Your Supabase project's API URL.

Format: `https://[PROJECT_REF].supabase.co`

Where to find it: Supabase Dashboard → Settings → API → Project URL

```
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
```

---

**`NEXT_PUBLIC_SUPABASE_ANON_KEY`**

The Supabase anonymous (public) key. This key is safe to expose because Row-Level Security policies restrict what it can access. It cannot access data that the user doesn't own.

Where to find it: Supabase Dashboard → Settings → API → Project API Keys → `anon public`

```
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### Server-side variables (never exposed to browser)

Variables without the `NEXT_PUBLIC_` prefix exist only in the Node.js server environment. They are never included in client bundles.

---

**`SUPABASE_SERVICE_ROLE_KEY`**

The Supabase service role key. This key bypasses Row-Level Security and has full database access. It is used only in API routes and Server Actions where you need to perform privileged operations (e.g., logging AI interactions on behalf of the user).

**Never use this key in client components. Never commit it to the repository.**

Where to find it: Supabase Dashboard → Settings → API → Project API Keys → `service_role secret`

```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

**`OPENROUTER_API_KEY`**

Your OpenRouter API key. Used to make AI inference requests.

Where to find it: https://openrouter.ai/keys → Create new key

```
OPENROUTER_API_KEY=sk-or-v1-...
```

---

**`OPENROUTER_DEFAULT_MODEL`**

The default AI model used for the Career Roadmap Generator. This model handles more complex, structured output and can use a higher-capability (slightly slower/more expensive) model.

Recommended starting value: `anthropic/claude-3-5-haiku`

For lower cost during development: `meta-llama/llama-3.1-8b-instruct`

```
OPENROUTER_DEFAULT_MODEL=anthropic/claude-3-5-haiku
```

---

**`OPENROUTER_FAST_MODEL`**

The AI model used for the Lecture Explainer. This feature is latency-sensitive — students expect a fast response when they paste lecture text. Use a fast, cost-efficient model here.

Recommended starting value: `anthropic/claude-3-haiku`

For lowest cost: `meta-llama/llama-3.1-8b-instruct:free` (free tier available on OpenRouter)

```
OPENROUTER_FAST_MODEL=anthropic/claude-3-haiku
```

---

**`OPENROUTER_BASE_URL`**

The base URL for the AI provider endpoint. OpenRouter's API is compatible with the OpenAI SDK format.

Default value (do not change unless switching away from OpenRouter):
```
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

---

**`SUPABASE_WEBHOOK_SECRET`**

A secret used to verify webhook requests from Supabase Auth. Generate a random string (32+ characters).

How to generate:
```bash
openssl rand -base64 32
```

Configure this in Supabase Dashboard → Database → Webhooks → Create webhook → add header `X-Supabase-Webhook-Secret` with this value.

```
SUPABASE_WEBHOOK_SECRET=your-random-32-char-secret
```

---

**`NEXT_PUBLIC_APP_URL`**

The public URL of the application. Used for OAuth redirect URLs and email links.

Development: `http://localhost:3000`
Production: `https://your-domain.vercel.app` or custom domain

```
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 4. Supabase Configuration

### 4.1 Auth Settings

In Supabase Dashboard → Authentication → Settings:

**Email auth:**
- Enable email/password sign-ups: ON
- Confirm email: ON (users must verify their email)
- Minimum password length: 8

**Google OAuth:**
1. Go to Google Cloud Console → APIs & Services → Credentials
2. Create an OAuth 2.0 Client ID (Web application)
3. Add authorized redirect URIs:
   - `https://[PROJECT_REF].supabase.co/auth/v1/callback`
   - `http://localhost:3000/auth/callback` (for local dev)
4. Copy Client ID and Client Secret
5. In Supabase Dashboard → Authentication → Providers → Google:
   - Enable Google provider
   - Paste Client ID and Client Secret
   - Save

**Redirect URLs (in Supabase Auth settings):**
```
http://localhost:3000/**
https://your-domain.vercel.app/**
```

### 4.2 Email Templates

Configure the email confirmation and password reset templates in Supabase Dashboard → Authentication → Email Templates.

**Recommended email sender:** Use a custom SMTP server via Supabase Dashboard → Project Settings → Auth → SMTP Settings. Supabase's built-in email sender has rate limits that are insufficient for production.

Recommended free option: Resend (https://resend.com) — 3,000 emails/month free tier.

### 4.3 Row Level Security Verification

After applying migrations, verify RLS is working correctly:

```sql
-- In Supabase SQL Editor
-- Test that RLS blocks cross-user access
-- (Replace USER_ID_1 with an actual user ID)

SET LOCAL role = authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "USER_ID_1"}';

-- This should return only USER_ID_1's applications
SELECT * FROM internship_applications;
```

---

## 5. OpenRouter / AI Provider Setup

### 5.1 Account Setup

1. Create an account at https://openrouter.ai
2. Add a payment method (credit card — pay per token, not subscription)
3. Add initial credits ($5–$10 is sufficient for extensive development)
4. Create an API key at https://openrouter.ai/keys

### 5.2 Model Selection

OpenRouter charges per token. For development, use cost-efficient models:

| Use Case | Development Model | Production Model |
|---|---|---|
| Lecture Explainer | `meta-llama/llama-3.1-8b-instruct:free` | `anthropic/claude-3-haiku` |
| Roadmap Generator | `meta-llama/llama-3.1-8b-instruct:free` | `anthropic/claude-3-5-haiku` |

**Switch models via environment variables only.** Never hardcode model names in application code.

### 5.3 Rate Limits

OpenRouter rate limits depend on your account tier. The default is 200 requests/minute for free accounts, which is sufficient for development. Paid accounts have higher limits.

The application's own rate limiting (20 explain requests/hour, 5 roadmap requests/hour per user) is below any provider limit.

### 5.4 Using Groq Instead of OpenRouter

Groq provides extremely fast inference for Llama models at low cost. To use Groq for the Lecture Explainer:

```
OPENROUTER_BASE_URL=https://api.groq.com/openai/v1
OPENROUTER_API_KEY=your-groq-api-key
OPENROUTER_FAST_MODEL=llama3-8b-8192
```

The application's `callAI` function is compatible with any OpenAI-format API endpoint. No code changes required.

---

## 6. Vercel Deployment

### 6.1 Initial Deployment

**Connect GitHub repository to Vercel:**
1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Framework preset: Next.js (auto-detected)
4. Root directory: `.` (leave default)
5. Build command: `npm run build` (default)
6. Output directory: `.next` (default)

**Configure environment variables:**
In Vercel Dashboard → Project → Settings → Environment Variables, add all variables from §3.

Set each variable for the appropriate environments:
- Development: local `.env.local` only
- Preview: all `NEXT_PUBLIC_*` variables + safe server variables (use a staging Supabase project)
- Production: all variables using production values

### 6.2 Supabase for Production

Create a **separate Supabase project** for production. Never use your development project in production:

```
Development Supabase project → .env.local only
Production Supabase project → Vercel production environment variables
```

Apply migrations to the production project before the first deployment:
```bash
# Link to production project
supabase link --project-ref YOUR_PROD_PROJECT_REF

# Push migrations to production
supabase db push
```

### 6.3 Custom Domain (Optional)

In Vercel Dashboard → Project → Settings → Domains:
1. Add your custom domain
2. Update your domain's DNS records as Vercel instructs
3. Update `NEXT_PUBLIC_APP_URL` to the custom domain
4. Update Supabase Auth redirect URLs to include the custom domain

### 6.4 Deployment Checklist

Before first production deployment, verify:

- [ ] Production Supabase project created and migrations applied
- [ ] All production environment variables set in Vercel
- [ ] Google OAuth redirect URLs updated for production domain
- [ ] SMTP email provider configured in production Supabase
- [ ] `NEXT_PUBLIC_APP_URL` set to production domain
- [ ] RLS policies verified on production database
- [ ] Test login and CRUD operations on production URL
- [ ] AI endpoints tested on production (check API keys are correct)
- [ ] Vercel Analytics enabled

### 6.5 Preview Deployments

Vercel automatically creates a preview deployment for every pull request. Configure preview environment variables in Vercel to point to a staging Supabase project, not the development or production project.

```
# Preview environment in Vercel
NEXT_PUBLIC_SUPABASE_URL=https://[STAGING_REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[staging_anon_key]
SUPABASE_SERVICE_ROLE_KEY=[staging_service_role_key]
# Keep same OpenRouter keys (staging and production can share AI access)
```

---

## 7. Environment Variable Template

Save this as `.env.local.example` in your repository (committed to git — this file has no real values):

```bash
# =============================================================
# GlobalCampus AI — Environment Variables
# =============================================================
# Copy this file to .env.local and fill in your values.
# NEVER commit .env.local to git.

# =============================================================
# SUPABASE — client-side (safe to expose in browser)
# =============================================================

# Your Supabase project URL
# Find at: Supabase Dashboard > Settings > API > Project URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co

# Supabase anonymous (public) key — safe to expose
# Find at: Supabase Dashboard > Settings > API > anon public
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# =============================================================
# SUPABASE — server-side only (NEVER expose to browser)
# =============================================================

# Supabase service role key — KEEP SECRET
# Find at: Supabase Dashboard > Settings > API > service_role secret
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Secret for verifying Supabase webhook requests
# Generate with: openssl rand -base64 32
SUPABASE_WEBHOOK_SECRET=your-random-secret-here

# =============================================================
# AI PROVIDER (OpenRouter or compatible)
# =============================================================

# OpenRouter API key
# Get from: https://openrouter.ai/keys
OPENROUTER_API_KEY=sk-or-v1-...

# OpenRouter (or Groq) base URL — OpenAI-compatible format
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# Model for Lecture Explainer — prioritize speed
# Options: anthropic/claude-3-haiku, meta-llama/llama-3.1-8b-instruct:free
OPENROUTER_FAST_MODEL=anthropic/claude-3-haiku

# Model for Roadmap Generator — prioritize quality
# Options: anthropic/claude-3-5-haiku, anthropic/claude-3-5-sonnet
OPENROUTER_DEFAULT_MODEL=anthropic/claude-3-5-haiku

# =============================================================
# APPLICATION
# =============================================================

# Public URL of this deployment
# Development: http://localhost:3000
# Production: https://your-domain.vercel.app
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 8. Troubleshooting

### "Workspace still starting" / Supabase connection errors

Verify `NEXT_PUBLIC_SUPABASE_URL` is correct and the Supabase project is active (not paused). Free tier projects pause after 1 week of inactivity.

### TypeScript errors after schema change

Regenerate types:
```bash
supabase gen types typescript --linked > lib/types/database.types.ts
```

### "Invalid JWT" errors in API routes

The `SUPABASE_SERVICE_ROLE_KEY` may be incorrect. Verify it matches the `service_role secret` in Supabase Dashboard → Settings → API, not the anon key.

### AI requests returning 401

Verify `OPENROUTER_API_KEY` is set correctly in `.env.local`. The key must start with `sk-or-v1-` for OpenRouter keys.

### Google OAuth not working in development

Verify that `http://localhost:3000/auth/callback` is in the list of authorized redirect URIs in both Google Cloud Console and Supabase Auth settings.

### Migrations not applying

```bash
# Check current migration state
supabase migration list

# If migrations are out of sync, reset and reapply (development only — destroys data)
supabase db reset
```

### RLS blocking your own data in development

If you're testing with the Supabase anon key client and not seeing data, verify:
1. You are logged in (session exists)
2. The user ID in the session matches the `user_id` on the records
3. RLS policies exist on the table (`SELECT * FROM pg_policies WHERE tablename = 'your_table';`)
