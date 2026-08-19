-- ============================================================================
-- 0004_live_sessions_attendance.sql
-- Live cohort sessions and attendance (FR-LIVE-*). Attendance registers
-- progress by being read directly on the classroom's progress view — see
-- FR-PRG-3's "live class attended" completion rule, applied at the app
-- layer when rendering a live-cohort lesson's completion state.
-- ============================================================================

create table live_sessions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  title text not null,
  scheduled_at timestamptz not null,
  duration_minutes int not null default 60,
  meeting_url text not null,
  recording_video_id uuid references videos(id), -- linked after the session (FR-CRS-7)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index idx_live_sessions_course on live_sessions(course_id, scheduled_at);
create trigger trg_live_sessions_updated_at before update on live_sessions
  for each row execute function set_updated_at();

create table attendance (
  id uuid primary key default gen_random_uuid(),
  live_session_id uuid not null references live_sessions(id) on delete cascade,
  student_id uuid not null references profiles(id),
  present boolean not null default false,
  marked_by uuid not null references profiles(id),
  marked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (live_session_id, student_id)
);
create index idx_attendance_student on attendance(student_id);

alter table live_sessions enable row level security;
create policy live_sessions_select_enrolled_or_staff on live_sessions
  for select using (is_admin() or is_instructor_of(course_id) or is_enrolled_active(course_id));
create policy live_sessions_write_admin_or_owner on live_sessions
  for all using (is_admin() or is_instructor_of(course_id))
  with check (is_admin() or is_instructor_of(course_id));

alter table attendance enable row level security;
create policy attendance_select on attendance
  for select using (
    student_id = auth.uid() or is_admin() or is_instructor_of((
      select course_id from live_sessions where id = live_session_id
    ))
  );
create policy attendance_write_staff on attendance
  for all using (
    is_admin() or is_instructor_of((select course_id from live_sessions where id = live_session_id))
  )
  with check (
    is_admin() or is_instructor_of((select course_id from live_sessions where id = live_session_id))
  );
