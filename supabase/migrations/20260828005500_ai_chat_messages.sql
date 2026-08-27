-- Create table to persist student AI Tutor conversations
create table if not exists ai_chat_messages (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  lesson_id text,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  model_used text,
  created_at timestamptz not null default now()
);

-- Index for fast user/lesson lookups
create index if not exists idx_ai_chat_messages_student on ai_chat_messages(student_id, created_at asc);

-- RLS
alter table ai_chat_messages enable row level security;

create policy "Users can read own ai chat messages" 
  on ai_chat_messages for select 
  using (auth.uid() = student_id);

create policy "Users can insert own ai chat messages" 
  on ai_chat_messages for insert 
  with check (auth.uid() = student_id);

create policy "Admins can view all ai chat messages"
  on ai_chat_messages for select
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
