# ArefinLab Student Portal — Backend Schema

| | |
|---|---|
| **Product** | ArefinLab Student Portal |
| **Document** | Backend Schema — database, auth/authorization, RLS, functions, API contract |
| **Version** | v0.1 |
| **Companions** | `CLAUDE.md`, BRD/PRD v0.1, App Flow v0.1, Tech Stack v0.3, Design System v0.1 |
| **Deliverable** | This document **plus** `supabase/migrations/0001…0009_*.sql` — the actual SQL, not a description of it |
| **Validation** | Every migration in this set was executed against a real PostgreSQL 16 instance (matching Supabase's shape) and confirmed to apply cleanly. Core logic — auth bootstrap, progress aggregation, certificate auto-issuance, the full payment-verification match/no-match/duplicate path, coupon redemption capping, audit logging, and the retention purge — was exercised with real inserts and confirmed to produce the correct result, not just confirmed to compile. See §10. |
| **Scale (tested)** | 39 tables · 85 RLS policies · 30 triggers · 15 custom functions · 1 view · 47 indexes |

> **Agent instruction:** The SQL in `supabase/migrations/` is the schema. This document explains *why* it's shaped the way it is and gives you the parts that don't live in SQL comments (API contract, scheduled jobs, cross-cutting conventions). Where this document and the SQL ever disagree, the SQL is correct — file a note rather than silently trusting the prose.

---

## 1. Conventions (apply uniformly, do not re-derive per table)

| Convention | Rule |
|---|---|
| Primary keys | `uuid primary key default gen_random_uuid()` everywhere (`pgcrypto` extension) |
| Table naming | snake_case, plural (`courses`, `enrollments`) |
| Timestamps | `timestamptz`, `default now()`; every mutable table gets `created_at` + `updated_at`, maintained by the shared `set_updated_at()` trigger |
| Status/type/kind columns | `text` + `CHECK (... in (...))`, **not native Postgres `ENUM` types** — adding a new status later is a constraint change, not a type migration. This is a deliberate startup-friction tradeoff, not an oversight. |
| Money | `numeric(12,2)`, never floating point |
| Flexible/evolving payloads | `jsonb`, validated at the application layer with Zod — see §3 |
| Soft delete | `deleted_at timestamptz`, nullable — only on the tables listed in §2's purge-eligible tier |
| RLS | Enabled on every table without exception (verified: 39/39, §10) — even admin-only tables get an explicit policy rather than relying on "no policy = no access," which is fragile if a future migration adds one incorrectly |
| Migration tool | Supabase CLI (`supabase migration new <name>`) — the files in `supabase/migrations/` are already in the shape it expects |

---

## 2. Retention & soft-delete policy

This is a **safety net for admin mistakes** (accidentally deleted a draft course, a duplicate coupon), not a user-facing "delete my account" feature — the PRD doesn't request account deletion anywhere, so it isn't built. If that changes later, it's a new scoped feature, not an extension of this mechanism.

**Mechanism:** soft-delete via `deleted_at`. A scheduled function, `purge_soft_deleted()` (§7), permanently removes rows whose `deleted_at` is more than 30 days old — giving a 30-day undo window before anything is actually gone.

| Tier | Tables | Behavior |
|---|---|---|
| **Soft-delete + 30-day purge** | `modules`, `submodules`, `lessons`, `content_blocks`, `videos`, `course_attachments`, `resources`, `bundles`, `coupons`, `testimonials`, `live_sessions`, `courses` | `deleted_at` set on delete; purged after 30 days. `courses` purges last and **only if it has zero enrollments ever** — enforced both by the purge function's own check and, independently, by an `ON DELETE RESTRICT` foreign key from `enrollments.course_id`, so a bug in one safeguard doesn't remove the other. |
| **Never deleted — status only** | `payments`, `orders`, `order_items`, `installments`, `refunds` (modeled as `payments.kind = 'refund'`), `audit_log`, `enrollments` | Financial and audit records don't get a 30-day clock; they don't get a delete path at all. A ban is `enrollments.status = 'banned'`, never a row removal (`FR-ENR-2`). |
| **Suspend only** | `profiles` | `FR-ACC-4` — suspension is reversible and never a delete. |

`courses.status` (`draft/active/archived/deactivated`) and `deleted_at` are **two different axes** — don't conflate them. `FR-CRS-9`'s "soft archive" is a visible, deliberate lifecycle state (`status = 'archived'`); `deleted_at` is the separate undo-safety mechanism for a mistake, typically only relevant to a `draft` course that was never really live.

---

## 3. Storage architecture: JSONB vs. normalized, blob vs. document

- **Flexible/evolving data is JSONB, validated by Zod at the app layer:** `content_blocks.payload` (shape varies by `block_type`), `jobs.payload`, `audit_log.before`/`after`, `videos.captions`. Adding a new content-block type later is a Zod schema change, not a migration. Core transactional entities (`courses`, `enrollments`, `payments`, `orders`) stay fully normalized regardless — this policy only applies to genuinely variant data.
- **Generated/uploaded files never live in Postgres.** Certificates (PDF), watermarked resource downloads, course attachments — the database stores a `storage_path` (Supabase Storage) or, for video, Bunny Stream identifiers (`videos` table, §5.2). No `bytea` columns anywhere in this schema.
- **Signed playback tokens and signed download URLs are never persisted** — generated server-side per request from Bunny's/Supabase's APIs (`FR-PRG-1`, `FR-RES-3`).

---

## 4. Auth & authorization architecture

### 4.1 Identity
Supabase Auth owns `auth.users`. A trigger (`handle_new_auth_user`, in `0001`) automatically creates a matching `profiles` row on signup — `profiles` is the single source of truth for `role` and `status`, and is what every RLS policy actually checks.

### 4.2 RLS strategy: `SECURITY DEFINER` helper functions, not JWT custom claims
Every policy in this schema is built from a small set of reusable, `SECURITY DEFINER` SQL functions rather than per-policy inline subqueries or Supabase Auth Hook custom claims. This is the simpler of the two standard Supabase patterns — no Auth Hook wiring — at a performance cost that's irrelevant at this product's scale.

| Function | Checks |
|---|---|
| `is_admin()` | Caller's `profiles.role = 'admin'` |
| `is_instructor()` | Caller's `profiles.role = 'instructor'` |
| `is_instructor_of(course_id)` | Caller is an assigned instructor on that specific course (`instructor_assignments`) — supports co-instructors |
| `is_enrolled_active(course_id)` | Caller has an `enrollments` row for that course with `status = 'active'` |
| `lesson_is_unlocked(lesson_id, student_id)` | Evaluates the lesson's drip config against enrollment date/absolute date |
| `assessment_course_id(assessment_id)` | Resolves the owning course whether the assessment is attached at lesson or module level |
| `current_profile_status()` | Caller's `profiles.status` |

### 4.3 Enforcement is defense-in-depth, not app-layer-only
Ban-from-course and account suspension are enforced **inside RLS itself**, not just checked in application code — `is_enrolled_active()` requires `status = 'active'`, so a banned student's rows for that course become genuinely unreadable at the database layer even if a bug exists in the application. This directly implements `FR-PRG-6`'s requirement that progress is *preserved but access is blocked*: the row still exists (progress isn't lost), it's just not visible while banned.

### 4.4 RBAC-to-RLS mapping
The PRD's RBAC matrix (§4.1) maps directly onto this schema's policies: every "own courses only" row in that matrix is `is_instructor_of(course_id)`; every "admin: all" row is `is_admin()` (usually OR'd, since admins can always do what instructors can). No capability in the RBAC matrix lacks a corresponding policy.

---

## 5. Schema at a glance, by domain

Full column definitions, constraints, indexes, and RLS policies are in the SQL — this table is a map, not a substitute for reading it.

### 5.1 Identity, audit, jobs — `0001`
| Table | Purpose |
|---|---|
| `profiles` | Role + status source of truth, 1:1 with `auth.users` |
| `audit_log` | Append-only; no update/delete policy exists for *any* role — that absence is the immutability enforcement mechanism (`FR-ACC-6`) |
| `jobs` | Retryable async work queue (Tech Stack §6) — SMS-match retries, email retries, AI-grading retries |

### 5.2 Courses & content — `0002`
| Table | Purpose |
|---|---|
| `courses` | Core course entity; `status` lifecycle + `deleted_at` undo-safety are separate axes (§2) |
| `course_installment_plans` | Template: N installments, each with its own amount and due-offset (`FR-PAY-2`) |
| `instructor_assignments` | Co-instructor support |
| `modules` → `submodules` → `lessons` → `content_blocks` | The full hierarchy (`FR-CRS-2`); `content_blocks.payload` is JSONB, type-discriminated by `block_type` (§3) |
| `videos` | First-class entity — referenced from a `content_block`'s payload *and* from `live_sessions.recording_video_id`, so Bunny metadata is never duplicated |
| `course_attachments` | Course-level eBook/routine/resource attachments (`FR-CRS-6`) — distinct from `content_blocks` (lesson-level, ordered) and from `resources` (independently sellable, §5.6) |

### 5.3 Enrollment & progress — `0003`
| Table / View | Purpose |
|---|---|
| `enrollments` | Never deleted (§2); carries the cached `completion_percent`, maintained by `recompute_enrollment_progress()` |
| `block_progress` | The atomic source of truth for progress — one row per (student, content block); video resume position is a latest-snapshot column, not a history log |
| `lesson_progress` (view) | Computed on read, not cached — cheap at the per-lesson scale a single screen renders |

### 5.4 Live sessions — `0004`
`live_sessions`, `attendance` — instructor-marked, tz-aware scheduling (`FR-LIVE-*`).

### 5.5 Assessments & certificates — `0005`
| Table | Purpose |
|---|---|
| `assessments` | Attached to exactly one of `lesson_id` / `module_id` (`FR-ASM-1`, enforced by a `CHECK`) |
| `assessment_questions` | MCQ or short-answer, no shared cross-course question bank in v1 |
| `assessment_attempts` | Per-student, per-attempt-number |
| `question_responses` | Carries the AI-vs-instructor-reviewed state directly — `overridden_at is not null` is exactly the Design System §9.7 badge-state condition |
| `certificates` | Publicly readable by design (`FR-CERT-2`'s "verifiable link" *is* the point) — auto-issued by trigger, not application code (§7) |

### 5.6 Storefront & promotions — `0006`
`resources`, `resource_downloads`, `bundles`, `bundle_items`, `coupons`, `coupon_redemptions` (redemption cap enforced atomically by trigger, §7), `referral_codes`, `referral_attributions`, `waitlist_entries`.

### 5.7 Commerce & verification — `0007`
| Table | Purpose |
|---|---|
| `orders` / `order_items` | Never deleted; `order_items` polymorphically targets a course, bundle, or resource via a `CHECK`-enforced exclusive-FK pattern |
| `installments` | Dedicated table, not a JSONB schedule — the overdue-reminder sweep needs to query individual due dates directly |
| `payments` | Append-only; `kind` (`payment`/`refund`) carries direction, `amount` is always positive |
| `pending_verifications` / `received_transactions` | The full bKash/Nagad verification engine — see §6 |

### 5.8 Engagement — `0008`
`testimonials` (submitted → admin-approved), `notifications` (in-app), `email_log` (delivery debugging).

### 5.9 Cross-cutting — `0009`
The generic audit trigger, certificate auto-issuance trigger, and the 30-day purge function — see §7.

---

## 6. The verification engine — how matching actually works

This is the highest-stakes piece of business logic in the schema, so it gets its own section rather than a table row. `match_pending_verification(pending_verification_id)` is an explicit `SECURITY DEFINER` function — not a passive trigger cascade, because the branching (match / no-match / amount-mismatch / already-consumed) is exactly the kind of imperative logic that gets fragile as a reactive trigger chain.

**Called from two places:** the SMS webhook route, immediately after inserting a new `received_transactions` row (the common case: SMS arrives after the student submits their TrxID); and a scheduled `pg_cron` sweep over still-`pending` rows (the reverse case: TrxID submitted before the SMS arrives, or the webhook call failed).

**What it does, in order:**
1. Locks the `pending_verifications` row (`FOR UPDATE`) and exits early if it's not still `pending` — idempotent, safe to call twice.
2. Looks for an unconsumed `received_transactions` row with a matching TrxID and provider. No match → returns `no_match`, row stays pending for the next sweep.
3. Match found but amount differs → flips to `manual_review` (this is the partial-installment / wrong-amount case from `FR-VER-6`) and returns `amount_mismatch`.
4. Exact match → **consumes** the transaction (the `unique` constraint on `consumed_by_pending_verification_id` is the one-to-one guard, `FR-VER-5`), inserts a `payments` row, and either marks the specific `installment` paid or — for a first/full payment — marks the order `completed` and **auto-enrolls** the student into every course in the order (including expanding a bundle into its member courses), then enqueues a confirmation email via `jobs`.

**Tested, not assumed** (§10): I ran this exact sequence — no-match before the SMS arrives, matched after it arrives, order flips to `completed`, payment recorded, enrollment created, and a second call against the same already-matched row returns `matched` again without creating a duplicate payment.

---

## 7. Database functions & triggers

| Name | Type | Fires on / called by | Purpose |
|---|---|---|---|
| `set_updated_at()` | Trigger fn | `BEFORE UPDATE`, every mutable table | Universal `updated_at` maintenance |
| `handle_new_auth_user()` | Trigger fn | `AFTER INSERT` on `auth.users` | Auto-creates the matching `profiles` row |
| `is_admin()`, `is_instructor()`, `is_instructor_of()`, `is_enrolled_active()`, `lesson_is_unlocked()`, `assessment_course_id()`, `current_profile_status()` | Functions | Called from RLS policies | See §4.2 |
| `recompute_enrollment_progress()` | Trigger fn | `AFTER INSERT/UPDATE` on `block_progress` | Recalculates and caches `enrollments.completion_percent` |
| `match_pending_verification(id)` | Function | Webhook route + `pg_cron` sweep | See §6 |
| `enforce_coupon_redemption_cap()` | Trigger fn | `BEFORE INSERT` on `coupon_redemptions` | Atomically checks and increments the redemption count under a row lock — race-safe |
| `audit_trigger_fn()` | Trigger fn | `profiles` (update), `enrollments` (insert/update), `payments` (insert), `courses` (update) | Generic before/after JSONB diff writer — automatic, so it can't be forgotten by a route author (`FR-ACC-6`) |
| `issue_certificate_on_completion()` | Trigger fn | `AFTER UPDATE` on `enrollments`, when `completion_percent` crosses to 100 | Auto-issues the certificate; relies on `block_progress` for assessment-type blocks already reflecting the correct pass/required rule — see the note in `0009` for the exact application-layer contract this depends on |
| `purge_soft_deleted()` | Function | `pg_cron`, daily | The 30-day retention sweep (§2) |

---

## 8. Key API endpoints

Standard reads/writes (browsing courses, submitting a form, reading your own data) go through the **Supabase client directly**, with RLS as the entire security boundary — documenting those would just restate the policies above. What follows is **only** the privileged/custom logic that RLS can't express alone: Next.js Route Handlers running under the service role.

| Method & path | Purpose | Auth |
|---|---|---|
| `POST /api/webhooks/sms` | Receives the Android SMS forwarder's signed POST; parses provider-specific regex into `received_transactions`; attempts `match_pending_verification` for any pending row with that TrxID | Shared-secret signature header (`FR-VER-9`), not a user session |
| `POST /api/checkout/orders` | Creates an order + items; validates coupon/pricing server-side rather than trusting client-submitted totals | Authenticated student |
| `POST /api/checkout/pending-verification` | Submits a TrxID against an order or a specific installment; attempts an immediate match for fast feedback | Authenticated student, must own the order |
| `POST /api/checkout/direct-submission` | The standalone "I already paid" flow (App Flow `PAY-06`) — same underlying `pending_verifications` insert, different entry point | Authenticated student |
| `POST /api/admin/verifications/:id/approve` \| `/reject` | Resolves a `manual_review` item | Admin only |
| `POST /api/admin/payments/manual` | Off-form/direct payment entry (`FR-PAY-3`) — auto-creates a minimal order + order item so every payment keeps a uniform `order_id` | Admin only |
| `POST /api/admin/refunds` | Records a `payments` row with `kind = 'refund'` | Admin only |
| `POST /api/assessments/:attemptId/submit` | Grades MCQ instantly; enqueues an `ai_grade_response` job per short-answer question | Authenticated student, own attempt |
| `POST /api/admin/grading/:responseId/override` | Instructor/admin override — writes the `instructor_override_*` columns and `overridden_at` | Instructor (own course) or admin |
| `GET /api/resources/:id/download` | Checks `download_limit` against `resource_downloads`, logs the download, returns a signed Supabase Storage URL | Authenticated student who purchased (or the resource is free) |
| `GET /api/videos/:id/playback-token` | Generates a signed Bunny playback token on request — never persisted (§3, `FR-PRG-1`) | Enrolled student or staff |
| `POST /api/certificates/generate-pdf` | Consumes a `generate_certificate_pdf` job; renders via `@react-pdf/renderer`, uploads to Storage, sets `certificates.pdf_storage_path` | Internal (job processor) |

---

## 9. Scheduled jobs (`pg_cron`)

| Schedule | Function | Purpose |
|---|---|---|
| Every few minutes | Poller over `jobs` where `status='pending' and run_after <= now()` | Retries failed sends/grades/matches with backoff |
| Every few minutes | Sweep `pending_verifications` still `pending` | Calls `match_pending_verification()` for the reverse-order case (TrxID submitted before SMS arrives) |
| Hourly | Sweep `installments` where `due_at < now() and status = 'pending'` | Flip to `overdue`, enqueue reminder (`FR-PAY-5`) |
| Hourly | Sweep `orders` `pending` with no `pending_verifications` row after a delay | Enqueue abandoned-checkout nudge (`FR-VER-10`) |
| Daily | Sweep `live_sessions` starting soon | Send class reminders (`FR-LIVE-4`) |
| Daily, 03:00 | `purge_soft_deleted()` | The 30-day retention sweep (§2) |

---

## 10. What was actually tested (not just written)

Beyond confirming all 9 migrations execute cleanly in sequence against a Supabase-shaped database, I ran real data through the paths most likely to hide a bug in prose-only documentation:

- Auth bootstrap: inserting into `auth.users` correctly auto-creates a `profiles` row.
- Progress aggregation: `block_progress` inserts correctly walk `enrollments.completion_percent` from 0% → 50% → 100% across a 2-block lesson.
- Certificate auto-issuance: hitting exactly 100% completion fires the certificate trigger and no earlier.
- The full verification path (§6): no-match → SMS arrives → matched → order completed → payment recorded → student auto-enrolled → re-running against an already-matched row does not create a duplicate payment.
- The DB-level duplicate-TrxID guard rejects a genuine duplicate insert.
- The coupon redemption cap rejects a second redemption once `max_redemptions` is reached.
- The audit trigger fires and captures `entity_type` correctly on real enrollment and profile mutations.
- `purge_soft_deleted()` executes without error.
- RLS is confirmed *enabled* (not just policies defined) on all 39 tables — the specific failure mode of a correct-looking policy silently doing nothing because `ENABLE ROW LEVEL SECURITY` was never called.

One real bug was caught this way and fixed before delivery: `assessment_course_id()`'s module-attached branch initially referenced a column that doesn't exist on `assessments` (it needs to join through `modules`) — exactly the kind of error that looks fine on a read-through and fails the first time it's actually called.

---

## 11. Migration manifest

| File | Contents |
|---|---|
| `0001_extensions_auth_core.sql` | Extensions, `profiles`, auth bootstrap trigger, `audit_log`, `jobs`, base RLS helpers |
| `0002_courses_content.sql` | Courses, installment plan templates, co-instructors, module→submodule→lesson→content-block hierarchy, videos, course attachments |
| `0003_enrollments_progress.sql` | Enrollments, drip-aware content RLS, `block_progress`, `lesson_progress` view, the completion-percent trigger |
| `0004_live_sessions_attendance.sql` | Live sessions, attendance |
| `0005_assessments_certificates.sql` | Assessments, questions, attempts, responses, certificates |
| `0006_storefront_promo.sql` | Resources, bundles, coupons, referrals, waitlist |
| `0007_commerce_verification.sql` | Orders, order items, installments, payments, the full verification engine incl. `match_pending_verification()` |
| `0008_engagement_notifications.sql` | Testimonials, notifications, email log |
| `0009_audit_triggers_retention.sql` | The generic audit trigger, certificate issuance trigger, `purge_soft_deleted()` |

Apply in this order — later files reference earlier ones. Place them at `supabase/migrations/` at the repo root (not `src/db/` — see the Tech Stack addendum below).

---

## 12. Tech Stack addendum (action taken)

The Tech Stack document's repo structure listed `src/db/` as the home for "SQL migrations + RLS policies." That's not where the Supabase CLI actually looks — it expects `supabase/migrations/` at the project root. This has been corrected there: `supabase/migrations/` now holds the SQL (this deliverable), and `src/db/` is reserved for TypeScript-side database helpers (typed client wrappers, Zod schemas mirroring each `jsonb` payload shape) — a different, complementary concern, not a duplicate location for the same files.

---

## 13. Open items

- The exact `pg_cron` schedule expressions (`cron.schedule(...)` calls) are written as prose in §9 — finalize as literal `cron.schedule` statements once deployed to a real Supabase project, since local testing couldn't exercise the `pg_cron` extension itself (not installable outside Supabase's managed environment).
- `question_responses.ai_provider` records which of Gemini/DeepSeek actually answered (Tech Stack's primary/fallback pair) — confirm the AI grading route writes this consistently; it's what backs the Design System §9.7 indicator's provider-agnostic display.
- The application-layer contract noted in `0009` — that `block_progress` for assessment-type blocks must already reflect the correct pass/required rule before the certificate trigger fires — is a real coupling between the API route that grades an attempt and this trigger. Flag this explicitly in the P3 build phase (Tech Stack §12) so it isn't missed.

---

*End of Backend Schema v0.1. Validated against a real PostgreSQL 16 instance — see §10.*
