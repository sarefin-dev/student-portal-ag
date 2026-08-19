-- ============================================================================
-- 0001_extensions_auth_core.sql
-- Extensions, Supabase auth stub (for local testing only — real Supabase
-- provides the actual auth schema), profiles, audit_log, jobs, base helpers.
-- ============================================================================

create extension if not exists pgcrypto;

-- Generic updated_at trigger, applied to every mutable table.
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles: the public-schema companion to auth.users. Source of truth for
-- role and account status. id is FK'd 1:1 to auth.users.id.
-- ---------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete restrict,
  email text not null,
  full_name text not null,
  phone text,
  avatar_url text,
  role text not null default 'student'
    check (role in ('admin', 'instructor', 'student')),
  status text not null default 'active'
    check (status in ('active', 'suspended')),
  suspended_at timestamptz,
  suspended_by uuid references profiles(id),
  suspended_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_profiles_role on profiles(role);
create index idx_profiles_status on profiles(status);

create trigger trg_profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- Auto-create a profile row whenever a new auth.users row appears.
-- Role defaults to 'student'; admin/instructor accounts are promoted
-- explicitly by an admin after creation (FR-ACC-2).
create or replace function handle_new_auth_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.email, 'New user'));
  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();

-- ---------------------------------------------------------------------------
-- Basic RLS helper functions (profile-only checks). Course/enrollment-scoped
-- helpers are added in later migrations once those tables exist.
-- ---------------------------------------------------------------------------
create or replace function is_admin() returns boolean
  language sql stable security definer as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function is_instructor() returns boolean
  language sql stable security definer as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'instructor'
  );
$$;

create or replace function current_profile_status() returns text
  language sql stable security definer as $$
  select status from profiles where id = auth.uid();
$$;

alter table profiles enable row level security;

create policy profiles_select_own_or_admin on profiles
  for select using (id = auth.uid() or is_admin());

create policy profiles_update_own on profiles
  for update using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from profiles where id = auth.uid()));
  -- students/instructors can edit their own row but never change their own role

create policy profiles_admin_all on profiles
  for all using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------------
-- audit_log: append-only. No update/delete policy exists for any role,
-- including admin — that is what makes it immutable (FR-ACC-6).
-- ---------------------------------------------------------------------------
create table audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id), -- null = system/service-role action
  action text not null,                  -- e.g. 'enrollment.banned', 'payment.refunded'
  entity_type text not null,             -- e.g. 'enrollment', 'payment'
  entity_id uuid not null,
  before jsonb,
  after jsonb,
  reason text,
  created_at timestamptz not null default now()
);
create index idx_audit_log_entity on audit_log(entity_type, entity_id);
create index idx_audit_log_actor on audit_log(actor_id);
create index idx_audit_log_created on audit_log(created_at);

alter table audit_log enable row level security;
create policy audit_log_select_admin on audit_log for select using (is_admin());
create policy audit_log_insert_system on audit_log for insert with check (true);
-- No update or delete policy is defined for any role — Postgres RLS denies
-- an operation outright when no policy grants it. This is the enforcement
-- mechanism for immutability, not an application-layer convention.

-- ---------------------------------------------------------------------------
-- jobs: lightweight retry queue, per Tech Stack §6. Polled by a scheduled
-- pg_cron function; not exposed to any client role.
-- ---------------------------------------------------------------------------
create table jobs (
  id uuid primary key default gen_random_uuid(),
  job_type text not null,       -- e.g. 'send_email', 'retry_sms_match', 'retry_ai_grading'
  payload jsonb not null default '{}',
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'done', 'failed')),
  attempts int not null default 0,
  max_attempts int not null default 5,
  run_after timestamptz not null default now(),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);
create index idx_jobs_poll on jobs(status, run_after) where status = 'pending';

create trigger trg_jobs_updated_at
  before update on jobs
  for each row execute function set_updated_at();

alter table jobs enable row level security;
create policy jobs_admin_only on jobs for all using (is_admin()) with check (is_admin());
-- The pg_cron poller and API route handlers run under the service role,
-- which bypasses RLS entirely — this policy only governs client access.
