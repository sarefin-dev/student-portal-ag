# ArefinLab Student Portal — Technology Stack (Version-Locked Build Spec)

| | |
|---|---|
| **Product** | ArefinLab Student Portal |
| **Document** | Technology Stack & Build Spec — **version-locked** |
| **Version** | v0.3 — supersedes v0.2 (adds data table, PDF generation, background jobs) |
| **Purpose** | **Input document for Claude Code** (and general agentic CLIs) to build the app |
| **Companions** | `CLAUDE.md` (root agent guide), BRD/PRD v0.1, App Flow v0.1, Design System v0.1, Backend Schema v0.1 |
| **Versions verified** | Live against the npm registry on the build date (Node 22 LTS environment) |

> All version numbers below were resolved from the npm registry, not from memory. Cross-package peer dependencies were checked so the manifest installs cleanly. **Pin exactly (no `^`/`~`), commit the lockfile, and do not upgrade a package without re-checking peers.**

---

## 1. Golden rules (for the building agent)

1. **Exact pins only.** Every dependency is pinned to an exact version. No caret/tilde ranges. Commit `package-lock.json`.
2. **Library-age policy.** Do not introduce a library that is *both* <1 year old *and* <10k GitHub stars, **unless** it is a first-party/official SDK for a platform we already use, or has well-established compatibility. Two deliberate exceptions are documented in §4 (`velite`, `tw-animate-css`) with justification.
3. **Compatibility over novelty.** Where the latest major breaks the toolchain, pin the latest version the *whole* toolchain supports (see the TypeScript decision in §4).
4. **Portability.** Primary production is **AWS Amplify**; **Vercel** and **Azure** are test/secondary targets. Use `output: 'standalone'`; **do not** use Vercel-only runtime APIs so all three deploy from the same build.
5. **Security defaults.** No secrets in client code; all data access behind Supabase RLS; payment webhook signed + idempotent.
6. **Server-first.** App Router, React Server Components by default; add `"use client"` only where interactivity requires it.

---

## 2. Platform & runtime

| Item | Locked value | Notes |
|---|---|---|
| Runtime | **Node.js 22.x (Active LTS)** — tested on `22.22.2` | `.nvmrc` = `22`; `engines.node` = `>=22 <23` |
| Package manager | **npm 10.x** (bundled with Node 22) | Maximum compatibility; commit `package-lock.json` |
| Language | **TypeScript 5.9.3** (`strict: true`) | Not TS 7 — see §4.1 |
| Framework | **Next.js 16.3.1** (App Router) | `output: 'standalone'` |
| UI runtime | **React 19.2.8 / React DOM 19.2.8** | |

---

## 3. Exact dependency manifest

### 3.1 Runtime dependencies (`dependencies`)

| Package | Exact version | Purpose |
|---|---|---|
| next | 16.3.1 | Framework (App Router) |
| react | 19.2.8 | UI runtime |
| react-dom | 19.2.8 | UI runtime |
| @supabase/supabase-js | 2.112.3 | DB / Auth / Storage client |
| @supabase/ssr | 0.12.4 | Supabase SSR/cookies for App Router (official) |
| @tanstack/react-query | 5.101.4 | Client data fetching/caching (dashboards) |
| react-hook-form | 7.85.0 | Forms (checkout, admin) |
| @hookform/resolvers | 5.9.1 | RHF ↔ Zod bridge |
| zod | 4.4.3 | Validation (forms, env, API bodies) |
| ai | 7.0.68 | AI SDK core (single interface for grading) |
| @ai-sdk/google | 4.0.45 | Gemini provider (primary) |
| @ai-sdk/deepseek | 3.0.28 | DeepSeek provider (fallback) |
| resend | 6.20.0 | Transactional email |
| hls.js | 1.6.19 | Video player (Bunny HLS) + resume control |
| date-fns | 4.4.0 | Timezone-aware dates (class routine) |
| sharp | 0.35.3 | Image optimization (Next image + Velite build) |
| lucide-react | 1.32.0 | Icons (shadcn/ui) |
| class-variance-authority | 0.7.1 | Variant styling (shadcn/ui) |
| clsx | 2.1.1 | Class composition |
| tailwind-merge | 3.6.0 | Tailwind class merge |
| @tanstack/react-table | 8.21.3 | Data tables (admin: verification queue, ledger, roster, audit log) — **v8 pinned, not v9**, see §4.6 |
| recharts | 3.10.1 | Charting engine underlying shadcn/ui's chart components (progress rings, admin trend/revenue charts) — added per Design System v0.1 §9.6/§11; peer-verified against React 19 |
| @react-pdf/renderer | 4.6.1 | Generate PDFs from React (certificates) |
| pdf-lib | 1.17.1 | Stamp/watermark existing PDFs (paid eBooks/resources) |

**Added by the shadcn/ui CLI when components are generated** (Radix primitives, e.g. `@radix-ui/react-dialog`, `-dropdown-menu`, `-slot`, etc.): **pin each to the exact version the CLI installs at build time**, commit the generated `components/ui/*` files, and commit the lockfile. Do not float these.

**Optional runtime (add only if used):**
| Package | Exact version | When |
|---|---|---|
| @ai-sdk/react | 4.0.71 | Only if a client-side AI UI (streaming) is built; grading is server-side and does not need it |
| @react-email/components | 1.0.12 | Only if using React-templated emails; plain HTML via Resend also works |

### 3.2 Dev dependencies (`devDependencies`)

| Package | Exact version | Purpose |
|---|---|---|
| typescript | 5.9.3 | Compiler (toolchain-max, see §4.1) |
| @types/node | match Node 22 (pin latest `22.x`, resolve via lockfile) | Node types aligned to runtime |
| @types/react | 19.2.18 | React types |
| @types/react-dom | 19.2.4 | React DOM types |
| tailwindcss | 4.3.3 | Styling (v4, CSS-first config) |
| @tailwindcss/postcss | 4.3.3 | Tailwind v4 PostCSS plugin |
| postcss | 8.5.26 | CSS pipeline |
| tw-animate-css | 1.4.0 | Animations for shadcn/ui on Tailwind v4 (see §4.3) |
| shadcn | 4.18.0 | Component generator CLI (pin; run via `npx shadcn@4.18.0`) |
| velite | 0.4.0 | MDX/Markdown → typed content (blog) — **exception, §4.2** |
| @mdx-js/mdx | 3.1.1 | MDX compilation (Velite peer) |
| esbuild | 0.28.2 | Velite build peer |
| terser | 5.50.0 | Velite minification peer (optional) |
| eslint | 10.8.1 | Linting (flat config) |
| eslint-config-next | 16.3.1 | Next.js lint rules (matches Next 16) |
| typescript-eslint | 8.67.0 | Type-aware lint (parser+plugin; supports TS <6.1) |
| prettier | 3.9.6 | Formatting |
| prettier-plugin-tailwindcss | 0.8.1 | Class sorting (Tailwind v4) |
| vitest | 4.1.11 | Unit tests |
| @vitejs/plugin-react | 6.0.5 | React support for Vitest |
| @testing-library/react | 16.3.2 | Component tests |
| @testing-library/dom | 10.4.1 | Testing-library peer |
| @testing-library/jest-dom | 7.0.1 | DOM matchers |
| @testing-library/user-event | 14.6.5 | Interaction tests |
| jsdom | 30.0.1 | Vitest DOM environment |
| @playwright/test | 1.62.1 | End-to-end tests |

---

## 4. Notable compatibility decisions (read before changing pins)

### 4.1 TypeScript 5.9.3, not 7.x
The registry's latest TypeScript is **7.0.2** (the native compiler line), but **`typescript-eslint@8.67.0` declares `typescript: >=4.8.4 <6.1.0`.** Pinning TS 7 breaks type-aware linting. The latest version the entire toolchain (Next, ESLint, typescript-eslint) supports is **TypeScript 5.9.3**. Revisit only when `typescript-eslint` publishes a release whose peer range includes 6/7.

### 4.2 Velite (documented exception)
`velite@0.4.0` is pre-1.0 and below the 10k-star threshold, so it violates the library-age rule. **It is included per explicit product direction.** Justification: it is purpose-built for the Next.js + MDX content pipeline, actively maintained, and lets the reference-architecture articles embed custom SVG/React. Its build peers are pinned (`@mdx-js/mdx 3.1.1`, `esbuild 0.28.2`, `sharp 0.35.3`, `terser 5.50.0`). It does **not** peer-depend on our app Zod, so no Zod version conflict.

### 4.3 Tailwind v4 + shadcn/ui
Tailwind is **v4** (CSS-first; no `tailwind.config.js` required, no `autoprefixer` needed — `@tailwindcss/postcss` handles it). shadcn/ui on v4 uses **`tw-animate-css`** (the v4-compatible successor to the older `tailwindcss-animate`). `tw-animate-css` is newer/smaller and is the **second documented exception**, justified as the required animation utility for shadcn on Tailwind v4.

### 4.4 AI SDK provider alignment
`ai@7.0.68`, `@ai-sdk/google@4.0.45`, and `@ai-sdk/deepseek@3.0.28` all resolve to **`@ai-sdk/provider@4.0.7`**, confirming cross-compatibility. Keep these three upgraded together; never bump one alone.

### 4.5 Supabase SSR
`@supabase/ssr@0.12.4` requires `@supabase/supabase-js ^2.111.0`; pinned `2.112.3` satisfies it. Use `@supabase/ssr` (not the deprecated auth-helpers) for App Router cookie/session handling.

### 4.6 TanStack Table pinned to v8, not v9
The registry's `latest` tag for `@tanstack/react-table` is **9.1.2**, but v9 is a ground-up rewrite (new reactivity model, opt-in features, changed public API) that only reached stable release weeks before this document was written. shadcn/ui's own Table/Data Table documentation and examples are still written against the v8 API, and the shadcn/ui project has an open tracking issue explicitly recommending new installs pin to the v8 range because migrating is "not just a package bump." Since this project builds its admin tables on shadcn patterns and prioritizes maximum compatibility, we pin **`8.21.3`** (the latest mature v8 release; peers `react >=16.8`, satisfied by React 19) rather than v9. Revisit once shadcn/ui's own examples move to v9.

### 4.7 pdf-lib: age/stars note
`pdf-lib@1.17.1` has roughly 8,500 GitHub stars — under the 10k bar — but the project is **7+ years old**, so it does not trip the library-age rule (which excludes a package only when it is *both* under 1 year old *and* under 10k stars). Included on that basis; it is also the most widely used JS library for modifying/stamping existing PDFs (watermarking paid eBooks), which `@react-pdf/renderer` is not designed for (that one generates PDFs from React trees, e.g. certificates).

---

## 5. Hosting & portability

| Environment | Role | How |
|---|---|---|
| **AWS Amplify** | **Primary production** | Next.js 16 build; `output: 'standalone'`; do **not** set `NODE_ENV=production` in the Amplify console (it drops devDependencies and breaks `npm ci`) |
| **Vercel** | Test / preview | Native Next.js; used to validate PR previews |
| **Azure** | Test / staging | Deploy the `standalone` server to Azure App Service (Node 22) or a container image; wired via CI |

**Portability rules:** target `output: 'standalone'`; keep middleware runtime-portable; **avoid Vercel-only APIs** (`@vercel/*` runtime features, Vercel-only Edge specifics). One build artifact must run on all three.

---

## 6. Background jobs & scheduling

Two distinct needs, both handled **inside Supabase — no new vendor/worker service**:

| Need | Mechanism | Examples |
|---|---|---|
| **Scheduled** (runs on a timer) | **`pg_cron`** (Supabase Postgres extension) triggering SQL functions or Edge Functions | Class reminders, installment overdue reminders, abandoned-checkout nudges, waitlist digest |
| **Retryable async work** (must survive failure, needs backoff) | A simple **`jobs` table + `pg_cron` poller** (lightweight queue pattern: `status`, `attempts`, `run_after`, `payload` columns; a scheduled function claims and processes due rows) | Retrying a failed SMS-transaction match, retrying a failed Resend email, retrying an AI grading call after a timeout |

**Decision:** start with **`pg_cron` alone**, using the `jobs`-table pattern above for anything that needs retries. This avoids adding a queue service (e.g. `pgmq`, a hosted queue) until real failure/retry volume justifies it — consistent with the "no premature scaling" principle (§1). The `jobs` table and its poller function are created as part of **P0** (bootstrap) so every later phase (P2 payments, P3 grading, P6 notifications) can enqueue into it rather than firing fire-and-forget calls.

**Scale trigger:** if job volume or contention on the polling table becomes a bottleneck, move to a dedicated queue (`pgmq` on Supabase, still no new vendor) — not before.

---

## 7. AI provider configuration

- Single interface via the **AI SDK (`ai`)**. **Gemini primary** (`@ai-sdk/google`), **DeepSeek fallback** (`@ai-sdk/deepseek`).
- Used server-side only, for short-answer grading (score + feedback) with instructor override (`FR-ASM-3/4`). Inputs are short → low cost.
- Keys are server env vars (§9); never exposed to the client. Implement a provider-fallback wrapper: try Gemini, fall back to DeepSeek on error/timeout.

---

## 8. Content & storage

- **Blog/articles:** Velite compiles `content/**/*.mdx` → typed data; images optimized at build via `sharp`. Publishing = git commit + deploy (founder-led, per PRD).
- **Images & files (MVP):** **Supabase Storage** — public bucket for marketing/media, private bucket with **RLS + signed expiring URLs** for paid downloads/watermarked PDFs (`FR-RES-3`). `next/image` for optimization.
- **Video:** **Bunny Stream** (adaptive bitrate, signed playback, email watermark). Player via `hls.js` for resume-position control (`FR-PRG-2`), or Bunny's embed as a zero-dep fallback.
- **Scale path:** move public media to **Cloudflare R2** (zero egress) only when Supabase egress is exceeded.

---

## 9. Environment variable contract

Server-only unless prefixed `NEXT_PUBLIC_`. Provide via `.env.local` (dev) and each host's secret store (prod). Validate at boot with Zod.

```
# App
NEXT_PUBLIC_APP_URL=
NODE_ENV=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # server only, never client

# AI (server only)
GOOGLE_GENERATIVE_AI_API_KEY=     # Gemini (primary)
DEEPSEEK_API_KEY=                 # DeepSeek (fallback)

# Email
RESEND_API_KEY=

# Video (Bunny)
BUNNY_STREAM_LIBRARY_ID=
BUNNY_STREAM_API_KEY=
BUNNY_STREAM_CDN_HOSTNAME=

# Payment SMS webhook
SMS_WEBHOOK_SECRET=               # shared secret for forwarder signature
```

---

## 10. Repository structure

```
arefinlab-portal/
├─ CLAUDE.md                  # agent entry point (authoritative)
├─ docs/                      # spec set (read by the agent, referenced from CLAUDE.md)
│  ├─ ArefinLab-Student-Portal-Tech-Stack.md
│  ├─ ArefinLab-Student-Portal-BRD-PRD.md
│  ├─ ArefinLab-Student-Portal-App-Flow.md
│  ├─ ArefinLab-Student-Portal-Design-System.md
│  └─ ArefinLab-Student-Portal-Backend-Schema.md
├─ supabase/
│  └─ migrations/             # the actual SQL — Supabase CLI's expected location,
│                              # NOT src/db/ (see Backend Schema §12)
├─ .nvmrc                     # 22
├─ package.json               # exact pins (see §12)
├─ package-lock.json          # committed
├─ next.config.ts             # output: 'standalone'
├─ tsconfig.json              # strict
├─ eslint.config.mjs          # flat config
├─ .prettierrc
├─ vitest.config.ts
├─ playwright.config.ts
├─ velite.config.ts
├─ .env.example
├─ content/                   # MDX blog/articles (Velite source)
├─ public/
├─ src/
│  ├─ app/                    # App Router (routes = App Flow screen IDs)
│  │  ├─ (public)/            # PUB-* catalog, course/bundle/resource detail
│  │  ├─ (auth)/              # AUTH-*
│  │  ├─ (student)/           # STU-*, PAY-*
│  │  ├─ classroom/           # CLS-*
│  │  ├─ instructor/          # INS-*
│  │  ├─ admin/               # ADM-*
│  │  └─ api/                 # route handlers (SMS webhook, AI grading, etc.)
│  ├─ components/
│  │  └─ ui/                  # shadcn generated (committed, pinned)
│  ├─ lib/                    # supabase clients, ai provider wrapper, bunny, email
│  ├─ db/                     # TypeScript-side DB helpers: typed client wrappers,
│  │                          # Zod schemas mirroring each content_block/jsonb payload
│  │                          # shape — NOT the SQL itself, that's supabase/migrations/
│  └─ types/
└─ tests/                     # vitest + playwright
```

---

## 11. Commands (must be deterministic for the agent)

| Task | Command |
|---|---|
| Install (clean, from lockfile) | `npm ci` |
| Dev server | `npm run dev` |
| Type check | `npm run typecheck` → `tsc --noEmit` |
| Lint | `npm run lint` → `eslint .` |
| Format | `npm run format` → `prettier --write .` |
| Unit tests | `npm run test` → `vitest run` |
| E2E tests | `npm run test:e2e` → `playwright test` |
| Build content | `npm run velite` (or via `prebuild`) |
| Production build | `npm run build` → `next build` |
| Start (standalone) | `node .next/standalone/server.js` |
| Add a UI component | `npx shadcn@4.18.0 add <name>` (commit the result) |

---

## 12. Ready-to-use `package.json` (exact pins)

```json
{
  "name": "arefinlab-portal",
  "private": true,
  "engines": { "node": ">=22 <23" },
  "scripts": {
    "dev": "next dev",
    "prebuild": "velite",
    "build": "next build",
    "start": "next start",
    "velite": "velite",
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "format": "prettier --write .",
    "test": "vitest run",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "@ai-sdk/deepseek": "3.0.28",
    "@ai-sdk/google": "4.0.45",
    "@hookform/resolvers": "5.9.1",
    "@react-pdf/renderer": "4.6.1",
    "@supabase/ssr": "0.12.4",
    "@supabase/supabase-js": "2.112.3",
    "@tanstack/react-query": "5.101.4",
    "@tanstack/react-table": "8.21.3",
    "ai": "7.0.68",
    "class-variance-authority": "0.7.1",
    "clsx": "2.1.1",
    "date-fns": "4.4.0",
    "hls.js": "1.6.19",
    "lucide-react": "1.32.0",
    "next": "16.3.1",
    "pdf-lib": "1.17.1",
    "react": "19.2.8",
    "react-dom": "19.2.8",
    "react-hook-form": "7.85.0",
    "recharts": "3.10.1",
    "resend": "6.20.0",
    "sharp": "0.35.3",
    "tailwind-merge": "3.6.0",
    "zod": "4.4.3"
  },
  "devDependencies": {
    "@mdx-js/mdx": "3.1.1",
    "@playwright/test": "1.62.1",
    "@tailwindcss/postcss": "4.3.3",
    "@testing-library/dom": "10.4.1",
    "@testing-library/jest-dom": "7.0.1",
    "@testing-library/react": "16.3.2",
    "@testing-library/user-event": "14.6.5",
    "@types/react": "19.2.18",
    "@types/react-dom": "19.2.4",
    "@vitejs/plugin-react": "6.0.5",
    "esbuild": "0.28.2",
    "eslint": "10.8.1",
    "eslint-config-next": "16.3.1",
    "jsdom": "30.0.1",
    "postcss": "8.5.26",
    "prettier": "3.9.6",
    "prettier-plugin-tailwindcss": "0.8.1",
    "shadcn": "4.18.0",
    "tailwindcss": "4.3.3",
    "terser": "5.50.0",
    "tw-animate-css": "1.4.0",
    "typescript": "5.9.3",
    "typescript-eslint": "8.67.0",
    "velite": "0.4.0",
    "vitest": "4.1.11"
  }
}
```
> Pin `@types/node` to the latest `22.x` at install (matches Node 22) and let the lockfile record the exact value. Radix primitives are added by the shadcn CLI — pin exactly as installed and commit.

---

## 13. Build task list (keyed to PRD `FR-*` and App Flow screen IDs)

Each phase is a milestone the agent can implement and verify independently. Screen IDs (`PUB-*`, `PAY-*`, …) map to routes in §10.

- **P0 — Bootstrap:** scaffold repo per §10; add pins per §12; `CLAUDE.md`; env validation (Zod); Supabase clients (`@supabase/ssr`); SQL migrations + **RLS**; auth (`FR-ACC-1..6`); AUTH-* screens; audit-log table (`FR-ACC-6`); **background-jobs table + poller per §6**.
- **P1 — Courses & delivery:** course/module/submodule/lesson/block model (`FR-CRS-*`); Bunny playback + resume + watermark (`FR-PRG-1..6`); Velite blog; PUB-*/CLS-01/CLS-02.
- **P2 — Payments & verification:** ledger + installments + refunds (`FR-PAY-*`); checkout wizard + pending states (PAY-01..06); SMS webhook + matcher + manual queue (`FR-VER-1..10`); ADM-02/03/04.
- **P3 — Assessments & certificates:** MCQ + AI short-answer w/ override (`FR-ASM-*`) via AI SDK; certificates (`FR-CERT-*`); CLS-03/CLS-05; INS-04.
- **P4 — Live & lifecycle:** live sessions + attendance + reminders (`FR-LIVE-*`); enrollment lifecycle: perpetual, archive, deactivate, ban, suspend (`FR-ENR-*`); CLS-04; ADM-05/06; INS-03.
- **P5 — Storefront & promos:** paid/free resources + signed downloads (`FR-RES-*`); bundles, coupons, referrals, waitlist (`FR-PRO-*`); PUB-04; ADM-07/08/09.
- **P6 — Dashboards, notifications, content:** role dashboards (`FR-DSH-1..3`); notifications email+in-app (`FR-NOT-*`) via Resend + `pg_cron`; testimonials (`FR-CNT-*`); STU-01..05; INS-01/05/06; ADM-01/10/11/12; SYS-*.

**Definition of done per task:** `npm run typecheck && npm run lint && npm run test` pass; relevant Playwright e2e passes; RLS enforced; no secrets in client bundle; builds with `output: 'standalone'`.

---

## 14. Library-policy audit

| Package | Age/stars status | Verdict |
|---|---|---|
| next, react, react-dom, typescript, tailwindcss, postcss, zod, eslint, prettier, vitest, @playwright/test, @testing-library/*, date-fns, @tanstack/react-query, react-hook-form, hls.js, sharp, esbuild, @mdx-js/mdx, lucide-react, clsx, class-variance-authority, tailwind-merge | Established + popular (or first-party) | ✅ Pass |
| @supabase/supabase-js, @supabase/ssr | Official Supabase SDKs | ✅ Pass (well-established compatibility) |
| ai, @ai-sdk/google, @ai-sdk/deepseek | Official AI SDK (>10k stars umbrella) | ✅ Pass |
| shadcn / Radix primitives | shadcn/ui >70k stars; components committed | ✅ Pass |
| **velite** | Pre-1.0, <10k stars | ⚠️ **Exception — approved by product** (§4.2) |
| **tw-animate-css** | Newer/smaller | ⚠️ **Exception — required for shadcn on Tailwind v4** (§4.3) |
| **@tanstack/react-table (pinned to 8.21.3, not the `latest` 9.x)** | Project: years old, 28k+ stars overall — passes cleanly. v9 itself is a brand-new rewrite; pinned to the mature v8 line for compatibility, not policy | ✅ Pass (see §4.6 for why v8 over v9) |
| **@react-pdf/renderer** | ~16k stars, established since 2017 | ✅ Pass |
| **pdf-lib** | ~8.5k stars (under 10k) but **7+ years old** — rule excludes only <1yr **and** <10k together | ✅ Pass (see §4.7) |
| **recharts** | ~24k+ stars, established since 2016; underlies shadcn/ui's own chart components | ✅ Pass |

---

## 15. Open items

- Confirm **Node 22 LTS** as the pinned runtime (recommended for Amplify/Vercel/Azure compatibility) vs. moving to Node 24 later.
- Confirm **Gemini primary / DeepSeek fallback** ordering (default) or swap.
- Pin the exact **Radix** versions after the first `shadcn add` pass and record them here.
- Confirm the **`jobs` table schema** (columns, retry/backoff policy) during P0 — a starting shape is proposed in §6 but not yet finalized.
- Revisit the **TanStack Table v8 → v9** pin once shadcn/ui's own docs/examples migrate to v9 (§4.6).

---

*End of Technology Stack v0.3 — version-locked build spec (adds data table, PDF generation, background jobs).*
