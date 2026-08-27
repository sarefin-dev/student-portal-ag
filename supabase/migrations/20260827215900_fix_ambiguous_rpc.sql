drop function if exists import_course_tree(jsonb, uuid);

create or replace function import_course_tree(
  payload jsonb,
  p_instructor_id uuid
) returns uuid language plpgsql security definer as $$
declare
  v_course_id uuid;
  v_module_id uuid;
  v_submodule_id uuid;
  v_lesson_id uuid;
  v_routine_id uuid;
  
  v_module jsonb;
  v_submodule jsonb;
  v_lesson jsonb;
  v_session jsonb;
  
  v_mod_idx int;
  v_sub_idx int;
  v_les_idx int;
  v_blk_idx int;
begin
  -- 1. Ensure caller is authorized
  if not is_admin() then
    raise exception 'Unauthorized';
  end if;

  -- 2. Insert Course
  insert into courses (title, slug, type, description, status, created_by)
  values (
    payload->>'title',
    coalesce(payload->>'slug', regexp_replace(lower(payload->>'title'), '[^a-z0-9]+', '-', 'g') || '-' || substring(md5(random()::text) from 1 for 4)),
    coalesce(payload->>'type', 'recorded'),
    coalesce(payload->>'description', ''),
    'draft',
    p_instructor_id
  )
  returning id into v_course_id;

  -- 3. Assign Instructor
  insert into instructor_assignments (course_id, instructor_id, is_lead)
  values (v_course_id, p_instructor_id, true)
  on conflict (course_id, instructor_id) do update set is_lead = true;

  -- 4. Insert Routine & Live Sessions (if provided)
  if payload ? 'routine' and jsonb_typeof(payload->'routine') = 'object' then
    insert into routines (course_id, name)
    values (v_course_id, payload->'routine'->>'name')
    returning id into v_routine_id;

    for v_session in select * from jsonb_array_elements(payload->'routine'->'sessions') loop
      insert into live_sessions (routine_id, title, scheduled_at, duration_minutes, meeting_url)
      values (
        v_routine_id,
        v_session->>'title',
        (v_session->>'scheduled_at')::timestamptz,
        coalesce((v_session->>'duration_minutes')::int, 60),
        v_session->>'meeting_url'
      );
    end loop;
  end if;

  -- 5. Build Curriculum Tree
  v_mod_idx := 1;
  for v_module in select * from jsonb_array_elements(payload->'modules') loop
    insert into modules (course_id, title, position)
    values (v_course_id, v_module->>'title', v_mod_idx)
    returning id into v_module_id;

    v_sub_idx := 1;
    for v_submodule in select * from jsonb_array_elements(v_module->'submodules') loop
      insert into submodules (module_id, title, position)
      values (v_module_id, v_submodule->>'title', v_sub_idx)
      returning id into v_submodule_id;

      v_les_idx := 1;
      for v_lesson in select * from jsonb_array_elements(v_submodule->'lessons') loop
        insert into lessons (submodule_id, title, position, is_premium)
        values (v_submodule_id, v_lesson->>'title', v_les_idx, coalesce((v_lesson->>'isPremium')::boolean, true))
        returning id into v_lesson_id;

        -- 6. Stub content block for the lesson
        if v_lesson ? 'video_url' and v_lesson->>'video_url' != '' then
          insert into content_blocks (lesson_id, type, content, position)
          values (v_lesson_id, 'video', v_lesson->>'video_url', 1);
          
          if v_lesson ? 'text_content' and v_lesson->>'text_content' != '' then
            insert into content_blocks (lesson_id, type, content, position)
            values (v_lesson_id, 'text', v_lesson->>'text_content', 2);
          end if;
        else
          insert into content_blocks (lesson_id, type, content, position)
          values (v_lesson_id, 'text', coalesce(v_lesson->>'text_content', 'Lesson content coming soon.'), 1);
        end if;

        v_les_idx := v_les_idx + 1;
      end loop;
      v_sub_idx := v_sub_idx + 1;
    end loop;
    v_mod_idx := v_mod_idx + 1;
  end loop;

  return v_course_id;
end;
$$;
