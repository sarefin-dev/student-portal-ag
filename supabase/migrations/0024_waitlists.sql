-- Waitlists table for "Coming Soon" or full courses
create table course_waitlists (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

-- Ensure a user can only join a waitlist once per course
create unique index idx_course_waitlists_course_email on course_waitlists(course_id, email);

-- RLS: Only admins can read waitlists, public can insert (but cannot read)
alter table course_waitlists enable row level security;

create policy "Admins can view waitlists" on course_waitlists
  for select using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Anyone can join waitlist" on course_waitlists
  for insert with check (true);
