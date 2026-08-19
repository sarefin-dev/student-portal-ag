-- ============================================================================
-- 0002_courses_content.sql
-- Courses, installment plan templates, co-instructors, module/submodule/
-- lesson/content-block hierarchy, videos, course-level attachments.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- courses
-- `status` is the PRD's business lifecycle (FR-CRS-9/10). `deleted_at` is the
-- separate admin-mistake-undo mechanism (§A) — a course can be `archived`
-- (a deliberate, visible lifecycle state) without ever being soft-deleted,
-- and a `draft` course can be soft-deleted if created by mistake. These are
-- not the same axis; do not conflate them.
-- ---------------------------------------------------------------------------
create table courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  type text not null
    check (type in ('live_cohort', 'recorded', 'text_based', 'mixed')),
  status text not null default 'draft'
    check (status in ('draft', 'active', 'archived', 'deactivated')),
  outcomes text[] not null default '{}',           -- FR-CRS-4
  thumbnail_url text,
  price_amount numeric(12,2) not null default 0,
  currency text not null default 'BDT',
  drip_enabled boolean not null default false,
  video_completion_threshold_percent numeric(5,2) not null default 90.00, -- FR-PRG-3
  assessment_gating_default boolean not null default false,               -- FR-ASM-5 course-level default
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index idx_courses_status on courses(status) where deleted_at is null;
create index idx_courses_type on courses(type);
create unique index idx_courses_slug_active on courses(slug) where deleted_at is null;

create trigger trg_courses_updated_at
  before update on courses
  for each row execute function set_updated_at();

-- Fixed installment plan template attached to a course (FR-PAY-2). Amounts
-- need not be equal; due_days_after_enrollment lets each installment define
-- its own offset.
create table course_installment_plans (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  installment_number int not null,
  amount numeric(12,2) not null,
  due_days_after_enrollment int not null default 0,
  created_at timestamptz not null default now(),
  unique (course_id, installment_number)
);

-- Co-instructor support (FR-CRS "InstructorAssignment").
create table instructor_assignments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  instructor_id uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  unique (course_id, instructor_id)
);
create index idx_instructor_assignments_instructor on instructor_assignments(instructor_id);

-- Course/enrollment-scoped RLS helpers, added now that instructor_assignments exists.
create or replace function is_instructor_of(p_course_id uuid) returns boolean
  language sql stable security definer as $$
  select exists (
    select 1 from instructor_assignments
    where course_id = p_course_id and instructor_id = auth.uid()
  );
$$;

alter table courses enable row level security;
create policy courses_select_public on courses
  for select using (status in ('active', 'deactivated') and deleted_at is null);
create policy courses_select_own_or_admin on courses
  for select using (is_admin() or is_instructor_of(id));
create policy courses_write_admin_or_owner on courses
  for all using (is_admin() or is_instructor_of(id))
  with check (is_admin() or is_instructor_of(id));

alter table course_installment_plans enable row level security;
create policy installment_plans_select_public on course_installment_plans
  for select using (true);
create policy installment_plans_write_admin_or_owner on course_installment_plans
  for all using (is_admin() or is_instructor_of(course_id))
  with check (is_admin() or is_instructor_of(course_id));

alter table instructor_assignments enable row level security;
create policy instructor_assignments_select on instructor_assignments
  for select using (is_admin() or instructor_id = auth.uid());
create policy instructor_assignments_write_admin on instructor_assignments
  for all using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------------
-- Module -> Submodule -> Lesson -> Content block hierarchy (FR-CRS-2/3).
-- ---------------------------------------------------------------------------
create table modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  title text not null,
  position int not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index idx_modules_course on modules(course_id, position) where deleted_at is null;
create trigger trg_modules_updated_at before update on modules
  for each row execute function set_updated_at();

create table submodules (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references modules(id) on delete cascade,
  title text not null,
  position int not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index idx_submodules_module on submodules(module_id, position) where deleted_at is null;
create trigger trg_submodules_updated_at before update on submodules
  for each row execute function set_updated_at();

create table lessons (
  id uuid primary key default gen_random_uuid(),
  submodule_id uuid not null references submodules(id) on delete cascade,
  title text not null,
  position int not null,
  is_preview boolean not null default false, -- App Flow: 1-2 free-preview lessons
  -- Drip scheduling (FR-CRS-8): exactly one mode is active per lesson.
  drip_mode text not null default 'immediate'
    check (drip_mode in ('immediate', 'absolute_date', 'relative_to_enrollment')),
  drip_unlock_at timestamptz,        -- used when drip_mode = 'absolute_date'
  drip_unlock_offset_days int,       -- used when drip_mode = 'relative_to_enrollment'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint chk_drip_fields check (
    (drip_mode = 'immediate' and drip_unlock_at is null and drip_unlock_offset_days is null)
    or (drip_mode = 'absolute_date' and drip_unlock_at is not null)
    or (drip_mode = 'relative_to_enrollment' and drip_unlock_offset_days is not null)
  )
);
create index idx_lessons_submodule on lessons(submodule_id, position) where deleted_at is null;
create trigger trg_lessons_updated_at before update on lessons
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- videos: first-class entity (§D5) — referenced from a content_block's
-- payload AND from live_sessions.recording_video_id, so Bunny metadata is
-- never duplicated across the two use sites.
-- ---------------------------------------------------------------------------
create table videos (
  id uuid primary key default gen_random_uuid(),
  bunny_library_id text not null,
  bunny_video_guid text not null,
  status text not null default 'uploading'
    check (status in ('uploading', 'processing', 'ready', 'failed')),
  duration_seconds int,
  thumbnail_url text,
  available_resolutions text[],
  captions jsonb not null default '[]', -- [{ "lang": "en", "url": "..." }, ...]
  file_size_bytes bigint,
  uploaded_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (bunny_library_id, bunny_video_guid)
);
create trigger trg_videos_updated_at before update on videos
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- content_blocks: the ordered, polymorphic building block of a lesson
-- (FR-CRS-3). `payload` shape is validated at the application layer (Zod)
-- per block_type — see §B3 for the JSONB-over-per-type-tables rationale.
--   video:      { "video_id": "<uuid references videos.id>" }
--   text:       { "content_markdown": "<string>" }
--   file:       { "storage_path": "<string>", "file_name": "<string>", "mime_type": "<string>" }
--   assessment: { "assessment_id": "<uuid references assessments.id>" }
-- Note: lesson text blocks are simple stored markdown, NOT part of the
-- Velite/MDX blog pipeline (Tech Stack §8) — those are two separate systems.
-- ---------------------------------------------------------------------------
create table content_blocks (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references lessons(id) on delete cascade,
  block_type text not null
    check (block_type in ('video', 'text', 'file', 'assessment')),
  position int not null,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index idx_content_blocks_lesson on content_blocks(lesson_id, position) where deleted_at is null;
create trigger trg_content_blocks_updated_at before update on content_blocks
  for each row execute function set_updated_at();

-- Course-level attachments (FR-CRS-6): eBook, class routine, additional
-- text/link resources. Distinct from `resources` (independently sellable
-- storefront items, migration 0006) and from `content_blocks` (ordered,
-- lesson-level instructional content).
create table course_attachments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  type text not null check (type in ('ebook', 'routine', 'resource')),
  title text not null,
  description text,
  url text,             -- for link-type attachments
  storage_path text,    -- for uploaded-file attachments
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint chk_attachment_source check (url is not null or storage_path is not null)
);
create trigger trg_course_attachments_updated_at before update on course_attachments
  for each row execute function set_updated_at();

-- RLS: all content tables use the same shape — public read only when the
-- parent course is published; full access for admin and the course's
-- assigned instructors. Enrolled-student read access (respecting drip,
-- ban, and course deactivation) is added in migration 0003 once
-- enrollments exists, since it needs that table to evaluate.

alter table modules enable row level security;
alter table submodules enable row level security;
alter table lessons enable row level security;
alter table videos enable row level security;
alter table content_blocks enable row level security;
alter table course_attachments enable row level security;

create policy modules_admin_or_owner on modules for all
  using (is_admin() or is_instructor_of(course_id))
  with check (is_admin() or is_instructor_of(course_id));

create policy submodules_admin_or_owner on submodules for all
  using (is_admin() or is_instructor_of((select course_id from modules where id = module_id)))
  with check (is_admin() or is_instructor_of((select course_id from modules where id = module_id)));

create policy lessons_admin_or_owner on lessons for all
  using (is_admin() or is_instructor_of((
    select m.course_id from modules m join submodules s on s.module_id = m.id
    where s.id = submodule_id
  )))
  with check (is_admin() or is_instructor_of((
    select m.course_id from modules m join submodules s on s.module_id = m.id
    where s.id = submodule_id
  )));

create policy videos_admin_or_uploader on videos for all
  using (is_admin() or uploaded_by = auth.uid())
  with check (is_admin() or uploaded_by = auth.uid());

create policy content_blocks_admin_or_owner on content_blocks for all
  using (is_admin() or is_instructor_of((
    select sm.course_id from lessons l
    join submodules s on s.id = l.submodule_id
    join modules sm on sm.id = s.module_id
    where l.id = lesson_id
  )))
  with check (is_admin() or is_instructor_of((
    select sm.course_id from lessons l
    join submodules s on s.id = l.submodule_id
    join modules sm on sm.id = s.module_id
    where l.id = lesson_id
  )));

create policy course_attachments_admin_or_owner on course_attachments for all
  using (is_admin() or is_instructor_of(course_id))
  with check (is_admin() or is_instructor_of(course_id));
