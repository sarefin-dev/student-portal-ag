# ArefinLab Student Portal - Production Deployment Guide

This guide covers deploying the **ArefinLab Student Portal** to **AWS Amplify** (primary production target) or **Vercel** (alternative/test target), configuring the **Supabase** backend, setting up **Upstash Redis**, configuring **AI Gateways & Fallbacks**, and verifying critical production workflows.

---

## 1. Supabase Database, Auth & Storage Setup

Before deploying the Next.js frontend, your Supabase production project must be initialized.

### A. Link Project & Push Migrations
1. Log in and link the Supabase CLI to your production project:
   ```bash
   npx supabase login
   npx supabase link --project-ref <your-production-project-ref>
   ```
2. Apply all database migrations in exact numeric order:
   ```bash
   npx supabase db push
   ```

### B. Enable Required Database Extensions
1. In the Supabase Dashboard, navigate to **Database -> Extensions**.
2. Search for and enable:
   * **`pg_cron`** *(strictly required for scheduled background jobs, reminders, and async processing)*.
   * **`pgcrypto`** / **`uuid-ossp`** *(for UUID generations)*.

### C. Configure Supabase Storage Buckets
Ensure the following storage buckets exist under **Storage**:
* **`private_resources`** *(Private)* — Used for eBooks, downloadable course assets, and lesson attachments (served securely via signed URLs and `/api/resources/[id]/download`).
* **`course-thumbnails`** *(Public)* — Used for public storefront course and resource cover images.
* **`avatars`** *(Public)* — User and instructor profile pictures.

### D. Authentication & URL Configuration
In Supabase Dashboard -> **Authentication -> URL Configuration**:
* **Site URL**: `https://portal.arefinlab.com` (or your production domain)
* **Redirect URLs**:
  * `https://portal.arefinlab.com/**`
  * `https://portal.arefinlab.com/auth/callback`
  * `https://portal.arefinlab.com/reset-password`

---

## 2. Environment Variables Contract

All variables are strictly validated on boot using Zod (`src/env.ts`). Configure these in your hosting environment (AWS Amplify / Vercel).

```env
# ==========================================
# Core Application
# ==========================================
NEXT_PUBLIC_APP_URL="https://portal.arefinlab.com"

# ==========================================
# Supabase (Auth, Database & Storage)
# ==========================================
NEXT_PUBLIC_SUPABASE_URL="https://<your-project-ref>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOi..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOi..." # Server-only! Never expose to client.

# ==========================================
# Upstash Redis (Caching & Rate Limiting)
# ==========================================
UPSTASH_REDIS_REST_URL="https://<your-db>.upstash.io"
UPSTASH_REDIS_REST_TOKEN="AcE..."

# ==========================================
# AI Models & OpenRouter Gateway
# ==========================================
OPENROUTER_API_KEY="sk-or-v1-..."
OPENROUTER_BASE_URL="https://openrouter.ai/api/v1"
OPENROUTER_MODEL="nvidia/nemotron-3-ultra-550b-a55b:free"
OPENROUTER_FALLBACK_MODELS="meta-llama/llama-3.3-70b-instruct:free,deepseek/deepseek-chat:free"
# OLLAMA_MODEL="" # Optional local development model

# ==========================================
# Transactional Email (Resend)
# ==========================================
RESEND_API_KEY="re_..."

# ==========================================
# Video Streaming (Bunny.net Stream)
# ==========================================
BUNNY_STREAM_LIBRARY_ID="123456"
BUNNY_STREAM_API_KEY="your-bunny-api-key"
BUNNY_STREAM_CDN_HOSTNAME="vz-xxxxxx.b-cdn.net"

# ==========================================
# Payment SMS Webhook (HMAC Signature)
# ==========================================
SMS_WEBHOOK_SECRET="your-strong-random-webhook-secret"
```

---

## 3. AWS Amplify Deployment (Primary Production)

AWS Amplify is the primary production target. The application is built with `output: 'standalone'`.

### Step-by-Step Setup:
1. **Connect Repo**: Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify) > **Create new app** > **Host web app** > Select GitHub and authorize repo `sarefin-dev/student-portal-ag`.
2. **Build Settings (`amplify.yml`)**:
   Ensure your build settings match:
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
         - .next/cache/**/*
   ```
3. **Environment Variables**:
   In AWS Amplify Console, go to **App settings -> Environment variables** and paste all variables from Section 2.
   
   > ⚠️ **CRITICAL WARNING:**
   > **DO NOT** set `NODE_ENV=production` in the Amplify Console environment variables. Doing so instructs `npm ci` to skip installing `devDependencies` (TypeScript, Tailwind, ESLint), which will fail your build. Amplify handles production bundling internally during `next build`.

4. **Deploy**: Click **Save and Deploy**.

---

## 4. Vercel Deployment (Alternative / Staging Target)

If deploying to Vercel for staging or testing:
1. Import the Git repository into Vercel.
2. In Project Settings -> **Environment Variables**, paste the variables from Section 2.
3. Build command: `npm run build` (Next.js preset).
4. Output directory: `.next`.
5. Deploy.

---

## 5. Post-Deployment Verification Checklist

Complete the following verification steps once deployed:

### 1. Initialize First Superadmin Account
* Sign up an account via `/login`.
* In the Supabase SQL Editor, promote this account to admin:
  ```sql
  update profiles 
  set role = 'admin', is_super_admin = true 
  where email = 'your-email@example.com';
  ```
* Verify access to `/admin` dashboard.

### 2. Verify AI Tutor & Conversation History
* Log into a student account and navigate to any course lesson (`/learn/[slug]/lessons/[lessonId]`).
* Open the AI Tutor floating widget and send a question.
* Confirm that:
  1. Response streams in real-time.
  2. Question & answer are persisted to the `ai_chat_messages` table.
  3. Refreshing the page restores the conversation history.

### 3. Verify PDF Certificate Generation
* Complete a course or test the certificate download route:
  `/api/certificates/<cert-id>/download`
* Verify that:
  1. `public/logo.png` renders as the crisp header logo and background watermark.
  2. Instructor digital signature (`signature.png` or uploaded URL) renders on the signature line.
  3. Bengali and Latin fonts (`NotoSansBengali-Bold.ttf`, `NotoSansBengali-Regular.ttf`) render correctly.

### 4. Verify Payment Webhook & Verification Queue
* Trigger a test SMS payload to `/api/webhooks/sms` with header `x-signature: <hmac>`.
* Confirm that automatic matching approves pending orders, or routes ambiguous/mismatched amounts to `/admin/queue`.

### 5. Verify Scheduled Background Tasks
* Check Supabase `cron.job` table to ensure `process_jobs_queue` and notification dispatchers are active:
  ```sql
  select * from cron.job;
  ```
