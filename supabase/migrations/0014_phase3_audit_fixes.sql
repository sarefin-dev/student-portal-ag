-- ============================================================================
-- 0014_phase3_audit_fixes.sql
-- Fixes RLS policies for assessments and storage, tightens student attempts,
-- and creates an atomic RPC for manual ledger entry.
-- ============================================================================

-- 1. Fix Instructor Assessment Creation RLS
drop policy if exists assessments_write_staff on assessments;
create policy assessments_write_staff on assessments
  for all using (is_admin() or is_instructor_of(assessment_course_id(id)))
  with check (
    is_admin() or is_instructor_of(
      coalesce(
        (select course_id from modules where id = module_id),
        (select m.course_id from lessons l join modules m on l.submodule_id = (select submodule_id from submodules where id = l.submodule_id limit 1) where l.id = lesson_id limit 1)
      )
    )
  );
-- Wait, the lesson_id -> course_id lookup can be extracted into a helper if it's too complex.
-- Actually, a simpler way is just to create a helper `get_course_id_for_assessment_target(p_lesson_id uuid, p_module_id uuid)`.

create or replace function get_course_id_for_assessment_target(p_lesson_id uuid, p_module_id uuid)
returns uuid language sql stable security definer as $$
  select coalesce(
    (select course_id from modules where id = p_module_id),
    (select m.course_id from modules m
     join submodules s on s.module_id = m.id
     join lessons l on l.submodule_id = s.id
     where l.id = p_lesson_id)
  );
$$;

drop policy if exists assessments_write_staff on assessments;
create policy assessments_write_staff on assessments
  for all using (is_admin() or is_instructor_of(assessment_course_id(id)))
  with check (is_admin() or is_instructor_of(get_course_id_for_assessment_target(lesson_id, module_id)));


-- 2. Secure Assessment Attempts RLS
drop policy if exists assessment_attempts_insert_own on assessment_attempts;
create policy assessment_attempts_insert_own on assessment_attempts
  for insert with check (
    student_id = auth.uid() 
    and status = 'in_progress' 
    and score_percent is null 
    and passed is null
  );

drop policy if exists assessment_attempts_update_own on assessment_attempts;
create policy assessment_attempts_update_own on assessment_attempts
  for update using (student_id = auth.uid() and status = 'in_progress')
  with check (
    status in ('in_progress', 'submitted')
    and score_percent is null
    and passed is null
  );


-- 3. Atomic Manual Enrollment RPC
create or replace function force_manual_enrollment(
  p_student_id uuid,
  p_course_id uuid,
  p_amount numeric,
  p_trx_id text,
  p_admin_id uuid
) returns void language plpgsql security definer as $$
declare
  v_order_id uuid;
  v_order_item_id uuid;
begin
  if not is_admin() then
    raise exception 'Unauthorized';
  end if;

  insert into orders (student_id, total_amount, status)
  values (p_student_id, p_amount, 'completed')
  returning id into v_order_id;

  insert into order_items (order_id, item_type, course_id, unit_price_amount)
  values (v_order_id, 'course', p_course_id, p_amount)
  returning id into v_order_item_id;

  insert into payments (order_id, kind, method, amount, trx_id, entered_by)
  values (v_order_id, 'payment', 'manual', p_amount, p_trx_id, p_admin_id);

  insert into enrollments (student_id, course_id, source, order_item_id)
  values (p_student_id, p_course_id, 'admin', v_order_item_id)
  on conflict (student_id, course_id) do nothing;
end;
$$;


-- 4. Fix Storage RLS to include instructors
drop policy if exists "Admins can upload to public_media" on storage.objects;
create policy "Staff can upload to public_media"
on storage.objects for insert
with check (
  bucket_id = 'public_media' 
  and auth.role() = 'authenticated'
  and (public.is_admin() or public.is_instructor())
);

drop policy if exists "Admins can update public_media" on storage.objects;
create policy "Staff can update public_media"
on storage.objects for update
using (
  bucket_id = 'public_media' 
  and auth.role() = 'authenticated'
  and (public.is_admin() or public.is_instructor())
);

drop policy if exists "Admins can delete from public_media" on storage.objects;
create policy "Staff can delete from public_media"
on storage.objects for delete
using (
  bucket_id = 'public_media' 
  and auth.role() = 'authenticated'
  and (public.is_admin() or public.is_instructor())
);
