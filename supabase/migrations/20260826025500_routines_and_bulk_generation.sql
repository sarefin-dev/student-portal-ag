-- ============================================================================
-- 0017_routines_and_bulk_generation.sql
-- Introduces Detachable Routines (Batches) for Live Cohorts
-- ============================================================================

-- 1. Create routines table
create table if not exists routines (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_routines_course on routines(course_id);

drop trigger if exists trg_routines_updated_at on routines;
create trigger trg_routines_updated_at before update on routines
  for each row execute function set_updated_at();

alter table routines enable row level security;
drop policy if exists routines_select on routines;
create policy routines_select on routines
  for select using (true); -- Publicly viewable for storefront checkout

drop policy if exists routines_write on routines;
create policy routines_write on routines
  for all using (is_admin() or is_instructor_of(course_id))
  with check (is_admin() or is_instructor_of(course_id));

-- 2. Add routine_id to live_sessions
alter table live_sessions add column if not exists routine_id uuid references routines(id) on delete cascade;
create index if not exists idx_live_sessions_routine on live_sessions(routine_id);

-- 3. Add routine_id to enrollments
alter table enrollments add column if not exists routine_id uuid references routines(id) on delete set null;

-- 4. Data Migration: Create Default Routines for existing live_sessions
do $$
declare
  c record;
  new_routine_id uuid;
begin
  for c in (select distinct course_id from live_sessions) loop
    -- Create a default routine for this course
    insert into routines (course_id, name, description)
    values (c.course_id, 'Default Routine', 'Auto-generated routine from legacy sessions')
    returning id into new_routine_id;

    -- Move all live sessions for this course into the new routine
    update live_sessions set routine_id = new_routine_id where course_id = c.course_id;

    -- Assign all active enrollments for this course into the new routine
    update enrollments set routine_id = new_routine_id where course_id = c.course_id;
  end loop;
end;
$$;
