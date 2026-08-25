create table if not exists ai_chat_usage (
  student_id uuid references auth.users(id) primary key,
  messages_sent int default 0,
  last_reset_date date default current_date
);

-- RLS
alter table ai_chat_usage enable row level security;
create policy "Users can read own usage" on ai_chat_usage for select using (auth.uid() = student_id);

-- Reset function (called from cron or automatically)
create or replace function increment_ai_usage(p_student_id uuid) returns boolean language plpgsql security definer as $$
declare
  v_usage ai_chat_usage%rowtype;
begin
  -- Get or create record
  select * into v_usage from ai_chat_usage where student_id = p_student_id;
  
  if not found then
    insert into ai_chat_usage (student_id, messages_sent, last_reset_date) 
    values (p_student_id, 1, current_date);
    return true;
  end if;

  -- Reset if it's a new day
  if v_usage.last_reset_date < current_date then
    update ai_chat_usage set messages_sent = 1, last_reset_date = current_date where student_id = p_student_id;
    return true;
  end if;

  -- Enforce limit (e.g., 20 messages per day)
  if v_usage.messages_sent >= 20 then
    return false;
  end if;

  -- Increment
  update ai_chat_usage set messages_sent = messages_sent + 1 where student_id = p_student_id;
  return true;
end;
$$;
