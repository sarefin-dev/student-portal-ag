create or replace function mark_lesson_complete_for_cohort(
  p_course_id uuid,
  p_lesson_id uuid
) returns void language plpgsql security definer as $$
begin
  -- Ensure the user is an admin or instructor of the course
  if not (is_admin() or is_instructor_of(p_course_id)) then
    raise exception 'unauthorized';
  end if;

  -- Insert or update block_progress for all active students and all blocks in the lesson
  insert into block_progress (student_id, content_block_id, status, completed_at, last_accessed_at)
  select 
    e.student_id,
    cb.id as content_block_id,
    'completed' as status,
    now() as completed_at,
    now() as last_accessed_at
  from enrollments e
  cross join content_blocks cb
  where e.course_id = p_course_id
    and e.status = 'active'
    and cb.lesson_id = p_lesson_id
  on conflict (student_id, content_block_id) 
  do update set 
    status = 'completed',
    completed_at = coalesce(block_progress.completed_at, now()),
    last_accessed_at = now();
end;
$$;
