# ArefinLab Student Portal - Deployment Guide

This guide covers deploying the application to **AWS Amplify** (primary production target) or **Vercel** (test target), along with setting up the production **Supabase** database.

## 1. Supabase Database & Auth Setup

Before deploying the frontend, your production database must be ready.

1. **Create a new Supabase Project**: Go to the Supabase dashboard and create a new project.
2. **Link the CLI**:
   ```bash
   npx supabase login
   npx supabase link --project-ref <your-production-project-ref>
   ```
3. **Push Migrations**: 
   Apply all migrations exactly in numeric order.
   ```bash
   npx supabase db push
   ```
4. **Enable `pg_cron`**: 
   In the Supabase Dashboard, go to **Database -> Extensions**, search for `pg_cron`, and enable it. This is strictly required for background jobs (reminders, nudges, retries).
5. **Configure Auth**: 
   In the Supabase Dashboard -> **Authentication -> URL Configuration**, add your production domain (e.g., `https://portal.arefinlab.com`) to the **Site URL** and **Redirect URLs**.

## 2. Environment Variables Preparation

Gather the following secrets. You will need to input these into your hosting provider (AWS Amplify / Vercel).

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ... # Keep this secret!

# AI Integration
OPENROUTER_API_KEY=sk-or-v1-...

# Email & Storage (Phase 5/6 dependencies)
RESEND_API_KEY=re_...
BUNNY_API_KEY=...

# Payment Gateway
SMS_WEBHOOK_SECRET=your_secure_webhook_secret_here
```

## 3. AWS Amplify Deployment (Primary Prod)

AWS Amplify requires specific configuration for Next.js App Router applications building in `standalone` mode.

1. **Create App**: Go to AWS Amplify Console > Create new app > Host web app > Connect your GitHub repository.
2. **Configure Build Settings**:
   During the setup, Amplify will detect Next.js. Update the Build Settings (YAML) to ensure a clean install:
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
   ```
3. **Set Environment Variables**: 
   Add all the variables from Section 2 in the Amplify Console under **Hosting -> Environment variables**.
   > **WARNING:** **DO NOT** set `NODE_ENV=production` in the Amplify console environment variables. This breaks `npm ci` by skipping devDependencies required for the build (like TypeScript and Tailwind). Amplify handles the Next.js production environment automatically during build.
4. **Deploy**: Save and deploy. Amplify will automatically leverage the `standalone` output mode defined in `next.config.js`.

## 4. Vercel Deployment (Alternative/Test Target)

If you are using Vercel for staging or testing:
1. Import the GitHub repository into Vercel.
2. Paste the environment variables into the Vercel dashboard.
3. Keep the default Build Command (`npm run build`) and Output Directory (`.next`).
4. Click Deploy.

> **NOTE:** The app is built to be portable (`output: 'standalone'`). Do not rely on Vercel-specific runtime APIs in the code.

## 5. Post-Deployment Checklist

- [ ] **Admin Account Setup**: Log into the app, find your user record in the Supabase `profiles` table, and manually change your `role` to `'admin'`.
- [ ] **Test AI Integration**: Navigate to Admin > AI Settings. Ensure the OpenRouter gateway (`https://openrouter.ai/api/v1`) is selected and attempt an AI-based action (e.g., importing a course).
- [ ] **Test Webhook**: Trigger a test payload to `/api/webhooks/sms` to ensure your HMAC verification and DB idempotency constraints are working in production.
- [ ] **Verify Storage/CDN**: Upload a test thumbnail for a course and ensure it resolves via your CDN.
