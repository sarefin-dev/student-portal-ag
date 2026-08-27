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
  if not is_admin() then
    raise exception 'Unauthorized';
  end if;

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

  insert into instructor_assignments (course_id, instructor_id, is_lead)
  values (v_course_id, p_instructor_id, true)
  on conflict (course_id, instructor_id) do update set is_lead = true;

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
        insert into lessons (submodule_id, title, position)
        values (v_submodule_id, v_lesson->>'title', v_les_idx)
        returning id into v_lesson_id;

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


create or replace function import_module_tree(
  payload jsonb,
  p_course_id uuid
) returns uuid language plpgsql security definer as $$
declare
  v_module_id uuid;
  v_submodule_id uuid;
  v_lesson_id uuid;
  
  v_submodule jsonb;
  v_lesson jsonb;
  
  v_mod_idx int;
  v_sub_idx int;
  v_les_idx int;
  v_blk_idx int;
begin
  select coalesce(max(position), 0) + 1 into v_mod_idx from modules where course_id = p_course_id;
  
  insert into modules (course_id, title, position)
  values (p_course_id, payload->>'title', v_mod_idx)
  returning id into v_module_id;

  v_sub_idx := 1;
  for v_submodule in select * from jsonb_array_elements(payload->'submodules') loop
    insert into submodules (module_id, title, position)
    values (v_module_id, v_submodule->>'title', v_sub_idx)
    returning id into v_submodule_id;

    v_les_idx := 1;
    for v_lesson in select * from jsonb_array_elements(v_submodule->'lessons') loop
      insert into lessons (submodule_id, title, position)
      values (v_submodule_id, v_lesson->>'title', v_les_idx)
      returning id into v_lesson_id;

      if jsonb_typeof(v_lesson->'contentBlocks') = 'array' then
        v_blk_idx := 1;
        insert into content_blocks (lesson_id, type, content, position)
        select 
          v_lesson_id,
          elem->>'type',
          elem->>'content',
          v_blk_idx - 1 + row_number() over ()
        from jsonb_array_elements(v_lesson->'contentBlocks') elem;
      end if;

      v_les_idx := v_les_idx + 1;
    end loop;
    v_sub_idx := v_sub_idx + 1;
  end loop;

  return v_module_id;
end;
$$;


create or replace function import_submodule_tree(
  payload jsonb,
  p_module_id uuid
) returns uuid language plpgsql security definer as $$
declare
  v_submodule_id uuid;
  v_lesson_id uuid;
  v_lesson jsonb;
  v_sub_idx int;
  v_les_idx int;
  v_blk_idx int;
begin
  select coalesce(max(position), 0) + 1 into v_sub_idx from submodules where module_id = p_module_id;
  
  insert into submodules (module_id, title, position)
  values (p_module_id, payload->>'title', v_sub_idx)
  returning id into v_submodule_id;

  v_les_idx := 1;
  for v_lesson in select * from jsonb_array_elements(payload->'lessons') loop
    insert into lessons (submodule_id, title, position)
    values (v_submodule_id, v_lesson->>'title', v_les_idx)
    returning id into v_lesson_id;

    if jsonb_typeof(v_lesson->'contentBlocks') = 'array' then
      v_blk_idx := 1;
      insert into content_blocks (lesson_id, type, content, position)
      select 
        v_lesson_id,
        elem->>'type',
        elem->>'content',
        v_blk_idx - 1 + row_number() over ()
      from jsonb_array_elements(v_lesson->'contentBlocks') elem;
    end if;

    v_les_idx := v_les_idx + 1;
  end loop;

  return v_submodule_id;
end;
$$;
