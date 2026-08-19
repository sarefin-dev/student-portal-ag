-- ============================================================================
-- 0008_engagement_notifications.sql
-- Testimonials, in-app notifications, email send log.
-- ============================================================================

create table testimonials (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id),
  course_id uuid references courses(id),
  content text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create trigger trg_testimonials_updated_at before update on testimonials
  for each row execute function set_updated_at();

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id),
  type text not null,
  title text not null,
  body text not null,
  related_entity_type text,
  related_entity_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index idx_notifications_user_unread on notifications(user_id) where read_at is null;

create table email_log (
  id uuid primary key default gen_random_uuid(),
  to_email text not null,
  template text not null,
  related_entity_type text,
  related_entity_id uuid,
  provider_message_id text,
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed')),
  error text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

alter table testimonials enable row level security;
create policy testimonials_select_approved_public on testimonials
  for select using (status = 'approved' and deleted_at is null);
create policy testimonials_select_own_or_admin on testimonials
  for select using (student_id = auth.uid() or is_admin());
create policy testimonials_insert_own on testimonials
  for insert with check (student_id = auth.uid());
create policy testimonials_admin_review on testimonials
  for update using (is_admin()) with check (is_admin());

alter table notifications enable row level security;
create policy notifications_select_own on notifications for select using (user_id = auth.uid());
create policy notifications_update_own on notifications for update
  using (user_id = auth.uid()) with check (user_id = auth.uid()); -- marking as read

alter table email_log enable row level security;
create policy email_log_admin_only on email_log for all using (is_admin()) with check (is_admin());
