# CLAUDE.md — ArefinLab Student Portal

Authoritative build guide for Claude Code (and other agentic CLIs). Read this first, then the three spec documents. If anything here conflicts with a spec, **this file wins for build/process rules**; the specs win for product behavior.

## Document set
Place all three spec files in `docs/` at the repo root, next to this `CLAUDE.md`. Open and follow them by path:

- **`docs/ArefinLab-Student-Portal-Tech-Stack.md`** — the version-locked build spec: exact dependency pins, compatibility notes, env contract (§8), repo structure (§9), commands (§10), `package.json` (§11), and the phased build task list `P0`–`P6` (§12). **Start here for how to build.**
- **`docs/ArefinLab-Student-Portal-BRD-PRD.md`** — what to build. Requirements carry stable IDs `FR-<MODULE>-<n>` (e.g. `FR-PAY-2`). These IDs are the task backbone.
- **`docs/ArefinLab-Student-Portal-App-Flow.md`** — every screen and journey. Screens carry IDs `PUB-*, AUTH-*, PAY-*, STU-*, CLS-*, INS-*, ADM-*, SYS-*`. Routes in `src/app/**` are named after these IDs.
- **`docs/ArefinLab-Student-Portal-Design-System.md`** — the single source of visual truth: exact color tokens (light/dark), typography, spacing/density, radius, elevation, motion, the full component inventory, and page templates. **Every color, size, and state is a locked decision, not a suggestion** — implement from it directly rather than making a visual judgment call.
- **`docs/ArefinLab-Student-Portal-Backend-Schema.md`** — the database design doc, paired with the actual schema at **`supabase/migrations/0001…0009_*.sql`**. The SQL is the schema — this doc explains the RLS/auth strategy, the retention policy, and the parts that don't live in SQL comments (API contract, scheduled jobs). Every migration in that folder has been executed against a real Postgres instance and confirmed to work, not just written — see its §10 for exactly what was tested. Apply the files in numeric order.

Reading order: this file → Tech Stack → PRD → App Flow → Design System → Backend Schema. If you rename or move these files, update the paths above so they stay accurate.

When implementing, reference the IDs in commits/PRs (e.g. "implements FR-VER-4 + PAY-05").

## Golden build rules
1. **Exact version pins only.** Use the versions in the Tech Stack `package.json` verbatim. No `^`/`~`. Run `npm ci`. Commit `package-lock.json`. Never upgrade a package without re-checking peer deps.
2. **TypeScript is pinned to 5.9.3** (not 7.x) because `typescript-eslint@8.67.0` supports `<6.1.0`. Do not bump TS past what the linter supports.
3. **AI SDK trio moves together:** `ai`, `@ai-sdk/google`, `@ai-sdk/deepseek` (shared `@ai-sdk/provider@4.0.7`). Never bump one alone.
4. **Portable build.** `output: 'standalone'`. Primary prod = **AWS Amplify**; **Vercel** and **Azure** are test targets. **Do not** use Vercel-only runtime APIs. **Do not** set `NODE_ENV=production` in the Amplify console (breaks `npm ci`).
5. **Library policy.** Do not add a dependency that is both <1yr old and <10k stars unless it is an official SDK for a platform we use or has established compatibility. The only approved exceptions are `velite` and `tw-animate-css` (see Tech Stack §4).
6. **Visual decisions are already made.** Every color, spacing, radius, and component state comes from `docs/ArefinLab-Student-Portal-Design-System.md`. Do not pick a color, radius, shadow, or animation independently — if a case isn't covered, apply the nearest documented pattern and flag the gap rather than improvising.
7. **The schema is already made, and it's tested.** Apply `supabase/migrations/*.sql` in numeric order rather than writing new tables from scratch. Do not add a table, bypass an RLS policy, or hard-delete a row from the "never deleted" tier (Backend Schema §2) without checking that document first — the retention policy and the payments/orders/audit-log exclusions are deliberate, not gaps to fill in.

## Conventions
- **Next.js App Router**, React Server Components by default; add `"use client"` only when needed.
- **Supabase** via `@supabase/ssr` for auth/session; **RLS on every table** — access rules live in the database, not just the app.
- **Validation** with Zod at every boundary (env, API bodies, forms).
- **Forms** with react-hook-form + `@hookform/resolvers`.
- **UI** from shadcn/ui (`npx shadcn@4.18.0 add …`); commit generated `components/ui/*` and pin the Radix versions installed.
- **Styling** Tailwind v4 (CSS-first; no `tailwind.config.js` required; no autoprefixer).
- **Dates** with date-fns, timezone-aware (class routine, reminders).
- **Content** MDX in `content/**` compiled by Velite.
- **Data tables** (admin: verification queue, ledger, roster, audit log) with `@tanstack/react-table` **v8 (`8.21.3`), not v9** — v9 is a brand-new breaking rewrite that even shadcn/ui's own docs haven't migrated to yet. See Tech Stack §4.6 before touching this pin.
- **PDF generation:** `@react-pdf/renderer` to generate PDFs from React (certificates). `pdf-lib` to stamp/watermark existing PDFs (paid eBooks/resources) — these solve different problems, don't conflate them.
- **Background jobs:** no separate queue service. Use **`pg_cron`** for scheduled work (reminders, nudges) and a **`jobs` table + `pg_cron` poller** for retryable async work (SMS-match retries, email retries, AI-grading retries). Create the `jobs` table in P0 so later phases can enqueue into it. See Tech Stack §6.

## Security guardrails (non-negotiable)
- No secrets in client code. `SUPABASE_SERVICE_ROLE_KEY`, AI keys, `RESEND_API_KEY`, Bunny keys, `SMS_WEBHOOK_SECRET` are server-only.
- **Payment SMS webhook**: verify the shared-secret signature; HTTPS only; **idempotent on transaction ID**; a TrxID can verify exactly one pending record; match on **TrxID + amount**.
- **Never auto-approve ambiguous payments** — route mismatches, timeouts, and bank transfers to the manual queue.
- **Never loosen RLS** to make something work. Fix the policy.
- All financial/access mutations write to the **audit log** (`FR-ACC-6`).

## Commands
```
npm ci                 # install from lockfile
npm run dev            # dev server
npm run typecheck      # tsc --noEmit  (must pass)
npm run lint           # eslint .      (must pass)
npm run test           # vitest run    (must pass)
npm run test:e2e       # playwright test
npm run build          # next build (output: standalone)
npx shadcn@4.18.0 add <name>   # add a UI component, then commit it
supabase db push               # apply supabase/migrations/*.sql to the linked project
supabase migration new <name>  # create a new migration file (keep the numeric order)
```

## Definition of done (every task)
`npm run typecheck && npm run lint && npm run test` all pass; relevant Playwright e2e passes; RLS enforced; no secret in the client bundle; builds with `output: 'standalone'`; commit references the `FR-*` / screen IDs implemented.

## Build order
Follow Tech Stack §12 phases `P0` → `P6`. Do not start a later phase's feature before its dependencies exist. `P0` (auth, schema, RLS, audit log) must be solid before payments (`P2`).

## Environment
Copy `.env.example` → `.env.local`; fill per Tech Stack §8. Validate at boot with Zod; fail fast if a required var is missing.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
