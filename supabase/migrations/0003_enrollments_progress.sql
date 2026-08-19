-- ============================================================================
-- 0003_enrollments_progress.sql
-- Enrollments (never deleted — status-only lifecycle), block-level progress
-- (source of truth), a derived lesson_progress view, and the trigger that
-- maintains the cached course-level completion percentage.
-- ============================================================================

create table enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id),
  course_id uuid not null references courses(id) on delete restrict,
  status text not null default 'active' check (status in ('active', 'banned')),
  source text not null default 'self' check (source in ('self', 'admin', 'form')),
  order_item_id uuid, -- FK added in 0006 after order_items exists (forward reference)
  enrolled_at timestamptz not null default now(),
  banned_at timestamptz,
  banned_by uuid references profiles(id),
  banned_reason text,
  completion_percent numeric(5,2) not null default 0, -- cached, trigger-maintained (§E9)
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, course_id)
  -- No deleted_at: enrollments are never deleted (FR-ENR-2), only banned.
);
create index idx_enrollments_student on enrollments(student_id);
create index idx_enrollments_course on enrollments(course_id);
create trigger trg_enrollments_updated_at before update on enrollments
  for each row execute function set_updated_at();

create or replace function is_enrolled_active(p_course_id uuid) returns boolean
  language sql stable security definer as $$
  select exists (
    select 1 from enrollments
    where course_id = p_course_id and student_id = auth.uid() and status = 'active'
  );
$$;

alter table enrollments enable row level security;
create policy enrollments_select_own on enrollments
  for select using (student_id = auth.uid() or is_admin() or is_instructor_of(course_id));
create policy enrollments_write_admin on enrollments
  for all using (is_admin()) with check (is_admin());
create policy enrollments_insert_self on enrollments
  for insert with check (student_id = auth.uid() and source = 'self');

-- ---------------------------------------------------------------------------
-- Enrolled-student read access to content, now that enrollments exists.
-- Access requires: course not deactivated-for-new-students in a way that
-- blocks reading (deactivated courses stay READ-ONLY per FR-CRS-10, so a
-- deactivated course is still readable, just not enroll-able — that rule
-- lives in the enrollment-creation path, not here), enrollment active
-- (FR-PRG-6 / §F11 — a ban makes rows genuinely inaccessible), and — for
-- lessons/content_blocks specifically — drip unlock respected, UNLESS the
-- lesson is flagged is_preview (publicly readable without enrollment at all).
-- ---------------------------------------------------------------------------

create or replace function lesson_is_unlocked(p_lesson_id uuid, p_student_id uuid) returns boolean
  language sql stable security definer as $$
  select case l.drip_mode
    when 'immediate' then true
    when 'absolute_date' then now() >= l.drip_unlock_at
    when 'relative_to_enrollment' then now() >= (
      select e.enrolled_at + make_interval(days => l.drip_unlock_offset_days)
      from enrollments e
      join submodules s on s.id = l.submodule_id
      join modules m on m.id = s.module_id
      where e.course_id = m.course_id and e.student_id = p_student_id
    )
  end
  from lessons l where l.id = p_lesson_id;
$$;

create policy lessons_select_preview_public on lessons
  for select using (is_preview = true);

create policy lessons_select_enrolled on lessons
  for select using (
    is_enrolled_active((
      select m.course_id from modules m join submodules s on s.module_id = m.id
      where s.id = submodule_id
    ))
    and lesson_is_unlocked(id, auth.uid())
  );

create policy modules_select_enrolled on modules
  for select using (is_enrolled_active(course_id));

create policy submodules_select_enrolled on submodules
  for select using (is_enrolled_active((select course_id from modules where id = module_id)));

create policy content_blocks_select_enrolled on content_blocks
  for select using (
    exists (
      select 1 from lessons l
      join submodules s on s.id = l.submodule_id
      join modules m on m.id = s.module_id
      where l.id = lesson_id
        and (l.is_preview = true or (is_enrolled_active(m.course_id) and lesson_is_unlocked(l.id, auth.uid())))
    )
  );

create policy course_attachments_select_enrolled on course_attachments
  for select using (is_enrolled_active(course_id));

create policy videos_select_enrolled on videos
  for select using (
    exists (
      select 1 from content_blocks cb
      join lessons l on l.id = cb.lesson_id
      join submodules s on s.id = l.submodule_id
      join modules m on m.id = s.module_id
      where (cb.payload->>'video_id')::uuid = videos.id
        and (l.is_preview = true or is_enrolled_active(m.course_id))
    )
  );

-- ---------------------------------------------------------------------------
-- block_progress: the atomic source of truth for progress (§E7).
-- ---------------------------------------------------------------------------
create table block_progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id),
  content_block_id uuid not null references content_blocks(id) on delete cascade,
  status text not null default 'not_started'
    check (status in ('not_started', 'in_progress', 'completed')),
  video_position_seconds int,       -- latest snapshot only (§E8, no heartbeat log in v1)
  video_watched_percent numeric(5,2),
  text_marked_read boolean,
  completed_at timestamptz,
  last_interacted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, content_block_id)
);
create index idx_block_progress_student on block_progress(student_id);
create trigger trg_block_progress_updated_at before update on block_progress
  for each row execute function set_updated_at();

alter table block_progress enable row level security;
create policy block_progress_select_own_or_staff on block_progress
  for select using (
    student_id = auth.uid() or is_admin() or is_instructor_of((
      select m.course_id from content_blocks cb
      join lessons l on l.id = cb.lesson_id
      join submodules s on s.id = l.submodule_id
      join modules m on m.id = s.module_id
      where cb.id = content_block_id
    ))
  );
create policy block_progress_write_own on block_progress
  for all using (student_id = auth.uid())
  with check (student_id = auth.uid());

-- ---------------------------------------------------------------------------
-- lesson_progress: derived VIEW, computed on read (not cached) — cheap at
-- the per-lesson/per-module scale a single screen renders (§E9 rationale).
-- A lesson is complete when every one of its (non-deleted) blocks is complete.
-- ---------------------------------------------------------------------------
create view lesson_progress as
select
  l.id as lesson_id,
  bp.student_id,
  count(cb.id) as total_blocks,
  count(cb.id) filter (where bp.status = 'completed') as completed_blocks,
  (count(cb.id) > 0 and count(cb.id) filter (where bp.status = 'completed') = count(cb.id)) as is_complete
from lessons l
join content_blocks cb on cb.lesson_id = l.id and cb.deleted_at is null
left join block_progress bp on bp.content_block_id = cb.id
where l.deleted_at is null
group by l.id, bp.student_id;

-- ---------------------------------------------------------------------------
-- Trigger: recompute enrollments.completion_percent whenever a student's
-- block_progress changes. This is the one cached aggregate in the schema
-- (§E9) — everything else derives from block_progress on read.
-- ---------------------------------------------------------------------------
create or replace function recompute_enrollment_progress()
returns trigger language plpgsql security definer as $$
declare
  v_course_id uuid;
  v_total_blocks int;
  v_completed_blocks int;
  v_percent numeric(5,2);
begin
  select m.course_id into v_course_id
  from content_blocks cb
  join lessons l on l.id = cb.lesson_id
  join submodules s on s.id = l.submodule_id
  join modules m on m.id = s.module_id
  where cb.id = coalesce(new.content_block_id, old.content_block_id);

  select count(*), count(*) filter (where bp.status = 'completed')
    into v_total_blocks, v_completed_blocks
  from content_blocks cb
  join lessons l on l.id = cb.lesson_id
  join submodules s on s.id = l.submodule_id
  join modules m on m.id = s.module_id
  left join block_progress bp
    on bp.content_block_id = cb.id and bp.student_id = coalesce(new.student_id, old.student_id)
  where m.course_id = v_course_id and cb.deleted_at is null;

  v_percent := case when v_total_blocks = 0 then 0
    else round(100.0 * v_completed_blocks / v_total_blocks, 2) end;

  update enrollments
  set completion_percent = v_percent,
      completed_at = case when v_percent = 100 and completed_at is null then now()
                           when v_percent < 100 then null
                           else completed_at end
  where course_id = v_course_id and student_id = coalesce(new.student_id, old.student_id);

  return new;
end;
$$;

create trigger trg_block_progress_recompute
  after insert or update on block_progress
  for each row execute function recompute_enrollment_progress();
