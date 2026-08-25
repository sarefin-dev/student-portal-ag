create table if not exists system_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

-- RLS
alter table system_settings enable row level security;
create policy "Anyone can read system settings" on system_settings for select using (true);
create policy "Admins can update system settings" on system_settings for all using (is_admin());

insert into system_settings (key, value) values ('ai_gateway', '"https://openrouter.ai/api/v1"') on conflict (key) do nothing;
