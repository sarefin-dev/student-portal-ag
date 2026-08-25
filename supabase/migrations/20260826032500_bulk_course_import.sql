-- ============================================================================
-- Bulk Course Import RPC
-- Takes a heavily nested JSON payload and builds the entire course tree in
-- a single atomic transaction.
-- ============================================================================

create or replace function import_course_tree(
  payload jsonb,
  instructor_id uuid
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
  insert into courses (title, slug, type, description, status)
  values (
    payload->>'title',
    coalesce(payload->>'slug', regexp_replace(lower(payload->>'title'), '[^a-z0-9]+', '-', 'g') || '-' || substring(md5(random()::text) from 1 for 4)),
    coalesce(payload->>'type', 'recorded'),
    coalesce(payload->>'description', ''),
    'draft'
  )
  returning id into v_course_id;

  -- 3. Assign Instructor
  insert into instructor_assignments (course_id, instructor_id, is_primary)
  values (v_course_id, instructor_id, true);

  -- 4. Insert Routine & Live Sessions (if provided)
  if payload ? 'routine' and jsonb_typeof(payload->'routine') = 'object' then
    insert into routines (course_id, name)
    values (v_course_id, payload->'routine'->>'name')
    returning id into v_routine_id;

    if payload->'routine' ? 'sessions' then
      for v_session in select * from jsonb_array_elements(payload->'routine'->'sessions') loop
        insert into live_sessions (course_id, routine_id, title, scheduled_at, duration_minutes, meeting_url)
        values (
          v_course_id,
          v_routine_id,
          v_session->>'title',
          (v_session->>'scheduled_at')::timestamptz,
          coalesce((v_session->>'duration_minutes')::int, 60),
          coalesce(v_session->>'meeting_url', '')
        );
      end loop;
    end if;
  end if;

  -- 5. Insert Modules -> Submodules -> Lessons -> Content Blocks
  if payload ? 'modules' then
    v_mod_idx := 1;
    for v_module in select * from jsonb_array_elements(payload->'modules') loop
      insert into modules (course_id, title, sort_order)
      values (v_course_id, v_module->>'title', v_mod_idx)
      returning id into v_module_id;
      
      if v_module ? 'submodules' then
        v_sub_idx := 1;
        for v_submodule in select * from jsonb_array_elements(v_module->'submodules') loop
          insert into submodules (module_id, title, sort_order)
          values (v_module_id, v_submodule->>'title', v_sub_idx)
          returning id into v_submodule_id;
          
          if v_submodule ? 'lessons' then
            v_les_idx := 1;
            for v_lesson in select * from jsonb_array_elements(v_submodule->'lessons') loop
              insert into lessons (submodule_id, title, sort_order)
              values (v_submodule_id, v_lesson->>'title', v_les_idx)
              returning id into v_lesson_id;
              
              v_blk_idx := 1;
              -- Optional Video Block
              if v_lesson ? 'video_url' and v_lesson->>'video_url' != '' then
                insert into content_blocks (lesson_id, block_type, sort_order, payload)
                values (v_lesson_id, 'video', v_blk_idx, jsonb_build_object('video_url', v_lesson->>'video_url'));
                v_blk_idx := v_blk_idx + 1;
              end if;

              -- Optional Text Block
              if v_lesson ? 'text_content' and v_lesson->>'text_content' != '' then
                insert into content_blocks (lesson_id, block_type, sort_order, payload)
                values (v_lesson_id, 'text', v_blk_idx, jsonb_build_object('body', v_lesson->>'text_content'));
                v_blk_idx := v_blk_idx + 1;
              end if;
              
              v_les_idx := v_les_idx + 1;
            end loop;
          end if;
          v_sub_idx := v_sub_idx + 1;
        end loop;
      end if;
      v_mod_idx := v_mod_idx + 1;
    end loop;
  end if;

  return v_course_id;
end;
$$;
