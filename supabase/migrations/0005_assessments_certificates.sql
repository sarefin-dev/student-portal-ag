-- ============================================================================
-- 0005_assessments_certificates.sql
-- MCQ + AI-graded short-answer assessments, attempts, per-question
-- responses (carries the AI-vs-instructor-reviewed state from Design
-- System §9.7), and certificates.
-- ============================================================================

create table assessments (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references lessons(id) on delete cascade,
  module_id uuid references modules(id) on delete cascade,
  title text not null,
  instructions text,
  is_required boolean not null default false, -- FR-ASM-5 gating, per-assessment override
  max_attempts int,                            -- null = unlimited
  passing_score_percent numeric(5,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint chk_assessment_parent check (
    (lesson_id is not null and module_id is null) or
    (lesson_id is null and module_id is not null)
  ) -- FR-ASM-1: attached to exactly one of lesson or module
);
create trigger trg_assessments_updated_at before update on assessments
  for each row execute function set_updated_at();

create table assessment_questions (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references assessments(id) on delete cascade,
  question_type text not null check (question_type in ('mcq', 'short_answer')),
  prompt text not null,
  position int not null,
  points numeric(5,2) not null default 1,
  options jsonb,                 -- mcq only: [{ "id": "a", "text": "..." }, ...]
  correct_option_id text,        -- mcq only
  grading_rubric_hint text,      -- short_answer only: guidance fed to the AI grader
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_question_fields check (
    (question_type = 'mcq' and options is not null and correct_option_id is not null)
    or (question_type = 'short_answer' and options is null and correct_option_id is null)
  )
);
create trigger trg_assessment_questions_updated_at before update on assessment_questions
  for each row execute function set_updated_at();

create table assessment_attempts (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references assessments(id) on delete cascade,
  student_id uuid not null references profiles(id),
  attempt_number int not null,
  status text not null default 'in_progress'
    check (status in ('in_progress', 'submitted', 'graded')),
  score_percent numeric(5,2),
  passed boolean,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  graded_at timestamptz,
  created_at timestamptz not null default now(),
  unique (assessment_id, student_id, attempt_number)
);
create index idx_assessment_attempts_student on assessment_attempts(student_id);

create table question_responses (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references assessment_attempts(id) on delete cascade,
  question_id uuid not null references assessment_questions(id),
  student_answer jsonb not null,       -- { "selected_option_id": "a" } or { "text": "..." }
  is_correct boolean,                  -- mcq auto-grade
  ai_score_percent numeric(5,2),
  ai_feedback text,
  ai_provider text check (ai_provider in ('gemini', 'deepseek')),
  ai_graded_at timestamptz,
  instructor_id uuid references profiles(id),
  instructor_override_score_percent numeric(5,2),
  instructor_override_feedback text,
  overridden_at timestamptz,           -- Design System §9.7: badge flips to
                                        -- "Instructor-reviewed" when this is not null
  final_score_percent numeric(5,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (attempt_id, question_id)
);
create trigger trg_question_responses_updated_at before update on question_responses
  for each row execute function set_updated_at();

create table certificates (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id),
  course_id uuid not null references courses(id) on delete restrict,
  verify_code text not null unique, -- short, human-shareable (Design System §9.9)
  pdf_storage_path text,
  issued_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (student_id, course_id)
);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table assessments enable row level security;
create or replace function assessment_course_id(p_assessment_id uuid) returns uuid
  language sql stable security definer as $$
  select coalesce(
    (select m.course_id from assessments a
     join lessons l on l.id = a.lesson_id
     join submodules s on s.id = l.submodule_id
     join modules m on m.id = s.module_id
     where a.id = p_assessment_id),
    (select m.course_id from assessments a
     join modules m on m.id = a.module_id
     where a.id = p_assessment_id)
  );
$$;

create policy assessments_select on assessments
  for select using (
    is_admin() or is_instructor_of(assessment_course_id(id)) or is_enrolled_active(assessment_course_id(id))
  );
create policy assessments_write_staff on assessments
  for all using (is_admin() or is_instructor_of(assessment_course_id(id)))
  with check (is_admin() or is_instructor_of(assessment_course_id(id)));

alter table assessment_questions enable row level security;
create policy assessment_questions_select on assessment_questions
  for select using (
    is_admin()
    or is_instructor_of(assessment_course_id(assessment_id))
    or is_enrolled_active(assessment_course_id(assessment_id))
  );
create policy assessment_questions_write_staff on assessment_questions
  for all using (is_admin() or is_instructor_of(assessment_course_id(assessment_id)))
  with check (is_admin() or is_instructor_of(assessment_course_id(assessment_id)));

alter table assessment_attempts enable row level security;
create policy assessment_attempts_select on assessment_attempts
  for select using (
    student_id = auth.uid() or is_admin() or is_instructor_of(assessment_course_id(assessment_id))
  );
create policy assessment_attempts_insert_own on assessment_attempts
  for insert with check (student_id = auth.uid());
create policy assessment_attempts_update_own on assessment_attempts
  for update using (student_id = auth.uid() and status = 'in_progress');

alter table question_responses enable row level security;
create policy question_responses_select on question_responses
  for select using (
    exists (select 1 from assessment_attempts aa where aa.id = attempt_id and (
      aa.student_id = auth.uid()
      or is_admin()
      or is_instructor_of(assessment_course_id(aa.assessment_id))
    ))
  );
create policy question_responses_write_own on question_responses
  for insert with check (
    exists (select 1 from assessment_attempts aa where aa.id = attempt_id and aa.student_id = auth.uid())
  );
create policy question_responses_override_staff on question_responses
  for update using (
    is_admin() or is_instructor_of((
      select assessment_course_id(aa.assessment_id) from assessment_attempts aa where aa.id = attempt_id
    ))
  );

alter table certificates enable row level security;
-- A single public-select policy is correct here, not an oversight: FR-CERT-2
-- requires a publicly verifiable link, so the row is *meant* to be readable
-- by anyone who has (or guesses) the id/verify_code. A separate "own or
-- staff" policy would be redundant, since RLS policies are OR'd together.
create policy certificates_select_public on certificates
  for select using (true);
create policy certificates_write_system on certificates
  for insert with check (is_admin()); -- issuance is otherwise done by the
  -- certificate-issuance trigger (0009) running as security definer
