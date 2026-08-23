# ArefinLab Student Portal - Deployment Guide

This guide covers how to deploy the ArefinLab Student Portal to Vercel, AWS, and Microsoft Azure.

Because this project is built with Next.js App Router and utilizes `output: 'standalone'` in `next.config.ts`, it is highly portable. It can run in a serverless environment (Vercel) or as a standalone Node.js container (AWS ECS, Azure App Service).

---

## 1. Prerequisites (All Platforms)

Before deploying the frontend, ensure your backend infrastructure is ready:

1. **Supabase Database:**
   - Ensure your Supabase project is created.
   - Run `supabase db push` via the CLI to apply all migrations in `supabase/migrations/*.sql`.
   - Ensure the `pg_cron` extension is enabled (done automatically by the migrations).
2. **Environment Variables:**
   You will need to provide the following variables to your hosting provider:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL="https://[YOUR_PROJECT_REF].supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR_ANON_KEY]"
   SUPABASE_SERVICE_ROLE_KEY="[YOUR_SERVICE_ROLE_KEY]"
   RESEND_API_KEY="[YOUR_RESEND_KEY]"
   SMS_WEBHOOK_SECRET="[YOUR_WEBHOOK_SECRET]"
   ```

---

## 2. Deploying to Vercel (Recommended / Easiest)

Vercel is the creator of Next.js and provides zero-configuration deployments for this stack.

1. **Push your code to GitHub/GitLab/Bitbucket.**
2. Log into the [Vercel Dashboard](https://vercel.com).
3. Click **Add New...** > **Project**.
4. Import your `ArefinLab` repository.
5. In the **Configure Project** screen:
   - Expand the **Environment Variables** section.
   - Add all the variables listed in the Prerequisites.
6. Click **Deploy**.
7. *Note on Cron Jobs:* Vercel Serverless Functions have timeouts. The `pg_cron` jobs in Supabase are configured to hit your `/api/cron/notifications` endpoint. Ensure you use the Vercel production domain for the cron job URL in your Supabase database.

---

## 3. Deploying to AWS

### Option A: AWS Amplify (Easiest AWS option)
AWS Amplify Gen 2 fully supports Next.js App Router SSR out of the box.

1. Open the **AWS Amplify Console**.
2. Select **Host web app** and connect your GitHub repository.
3. Select your `main` branch.
4. In the **Build settings** step, expand **Advanced settings** and add your **Environment Variables**.
5. Save and deploy. Amplify will automatically detect Next.js and build it.

### Option B: AWS ECS / Fargate (Docker)
If you prefer containerized orchestration:

1. Use the provided `Dockerfile` (located in this `deployment/` folder) to build your image.
2. Build and push the image to AWS ECR:
   ```bash
   aws ecr get-login-password | docker login --username AWS --password-stdin [ACCOUNT_ID].dkr.ecr.[REGION].amazonaws.com
   docker build -t arefinlab-portal -f deployment/Dockerfile .
   docker tag arefinlab-portal:latest [ACCOUNT_ID].dkr.ecr.[REGION].amazonaws.com/arefinlab-portal:latest
   docker push [ACCOUNT_ID].dkr.ecr.[REGION].amazonaws.com/arefinlab-portal:latest
   ```
3. Create an ECS Task Definition using the Fargate launch type.
4. Inject your Environment Variables into the container definition securely via AWS Secrets Manager or Parameter Store.
5. Deploy the ECS Service behind an Application Load Balancer (ALB).

---

## 4. Deploying to Microsoft Azure

### Option A: Azure Static Web Apps (Next.js Hybrid)
1. In the Azure Portal, create a new **Static Web App**.
2. Select **GitHub** as your deployment source and link your repository.
3. Build Details:
   - **Build Presets:** Next.js
   - **App location:** `/`
   - **Output location:** (Leave blank or `.` - Azure detects Next.js standalone).
4. After creation, go to **Environment Variables** in the Azure Portal and add your Supabase/Resend keys.

### Option B: Azure App Service (Linux Node.js/Docker)
1. Create a new **Web App** in Azure.
2. Under Publish, select **Docker Container** (using the provided `Dockerfile` pushed to Azure Container Registry) OR select **Code** with Runtime stack **Node 20 LTS**.
3. **If using Code (Standalone deployment):**
   - In Configuration > Application settings, add your Environment Variables.
   - Add a Startup Command: `node server.js`
   - Deploy your code via GitHub Actions using the standard Azure Web App deployment template. The GitHub action must run `npm run build`, and then zip and deploy the contents of the `.next/standalone` folder along with the `public` and `.next/static` folders.

---

## 5. Post-Deployment Checks
- Check the **Notification Bell** to ensure the WebSocket connection (Supabase Realtime) isn't being blocked by load balancers (applies to AWS ECS / Azure App Service).
- Perform a test transaction via the checkout to ensure the SMS webhook route is reachable from the public internet.
