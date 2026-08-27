# ArefinLab Student Portal — AI Integration Guide

This document outlines the architecture, configuration, and implementation guidelines for AI features across the ArefinLab Student Portal.

## 1. AI Architecture & Fallback Strategy

To ensure high availability and keep operational costs at zero, the portal utilizes a **3-Tier AI Fallback Engine** built on the [Vercel AI SDK](https://sdk.vercel.ai/docs). 

When a large generative task is requested (e.g., AI Course/Module/Submodule Import), the system processes the request in the following order:

1. **Tier 1 (Local): Ollama (`llama3.3`)**
   - **Why:** Zero latency cost, absolute privacy, works offline.
   - **Condition:** The system first attempts to hit the local Ollama daemon. If the developer is running it locally, it processes the request instantly.
2. **Tier 2 (Cloud Primary): OpenRouter Free Models**
   - **Why:** If Ollama is unavailable (e.g., in production or if the daemon is off), the request routes to OpenRouter. We leverage models like `meta-llama/llama-3-8b-instruct:free`.
3. **Tier 3 (Cloud Fallback): OpenRouter Fallback**
   - **Why:** If the primary free model is rate-limited or down, the system immediately reroutes to a secondary free model (e.g., `google/gemini-flash-1.5-exp`).

*For smaller tasks (like generating 1-sentence certificate summaries), the portal defaults directly to the Google Generative AI integration (`gemini-2.5-flash`).*

## 2. Environment Variables

To fully enable the AI features, the following environment variables must be present in your `.env.local` (and your AWS Amplify environment settings):

```bash
# Required for primary cloud AI fallbacks (Course Imports)
OPENROUTER_API_KEY="sk-or-v1-..."

# Required for quick AI tasks (Certificate Summaries)
GOOGLE_GENERATIVE_AI_API_KEY="AIzaSy..."
```

## 3. Libraries & Dependencies

The AI ecosystem strictly relies on the following pinned dependencies to ensure compatibility across Next.js Server Actions:

- `ai` (Vercel AI SDK Core)
- `@ai-sdk/google` (Native Gemini Support)
- `@ai-sdk/openai` (Used as the OpenAI-compatible router to connect to OpenRouter)
- `zod` (Used to enforce strict JSON schemas on AI outputs)

*Warning: As per `CLAUDE.md`, the AI SDK trio must be updated together. Never bump one independently.*

## 4. Usage Patterns

### Pattern A: Structured Content Generation (JSON)
Used when parsing unstructured text into database-ready structures (e.g., `src/app/admin/courses/import-actions.ts`).

```typescript
import { generateObject } from 'ai';
import { z } from 'zod';
import { getCloudAI, FREE_MODELS } from '@/lib/ai/openrouter';

const CourseSchema = z.object({
  title: z.string(),
  modules: z.array(z.object({
    title: z.string()
  }))
});

// The system attempts Ollama, then OpenRouter, then Fallback
const result = await generateObject({
  model: (await getCloudAI())(FREE_MODELS.chat),
  schema: CourseSchema,
  prompt: `Extract curriculum from: ${rawText}`
});
```

### Pattern B: Simple Text Generation
Used when generating short strings or metadata (e.g., `src/app/admin/courses/[id]/settings/actions.ts`).

```typescript
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

const { text } = await generateText({
  model: google('gemini-2.5-flash'),
  prompt: `Write a one-sentence summary for a certificate...`,
});
```

## 5. Adding New AI Features

When integrating a new AI capability into the portal, strictly adhere to these rules:
1. **Server Actions Only:** All AI generation must happen in server actions (`'use server'`). Never bundle SDKs or expose API keys to the client.
2. **Schema Validation:** Always use `generateObject` alongside a strict `Zod` schema if the AI output interacts with the PostgreSQL database.
3. **Timeout Safety:** AI tasks can take 10-30 seconds. Always provide visual loading states (e.g., `isSubmitting` with `Loader2` spinners) in the React UI so the user does not trigger parallel requests.
