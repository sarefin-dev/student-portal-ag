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
  -- Calculate next module position
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
      insert into lessons (submodule_id, title, position, is_premium)
      values (v_submodule_id, v_lesson->>'title', v_les_idx, coalesce((v_lesson->>'isPremium')::boolean, true))
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
  -- Calculate next submodule position
  select coalesce(max(position), 0) + 1 into v_sub_idx from submodules where module_id = p_module_id;
  
  insert into submodules (module_id, title, position)
  values (p_module_id, payload->>'title', v_sub_idx)
  returning id into v_submodule_id;

  v_les_idx := 1;
  for v_lesson in select * from jsonb_array_elements(payload->'lessons') loop
    insert into lessons (submodule_id, title, position, is_premium)
    values (v_submodule_id, v_lesson->>'title', v_les_idx, coalesce((v_lesson->>'isPremium')::boolean, true))
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
