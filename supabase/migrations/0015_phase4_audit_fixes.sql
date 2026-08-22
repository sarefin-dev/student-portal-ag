-- ============================================================================
-- 0015_phase4_audit_fixes.sql
-- Fixes critical RLS gaps found during Phase 4 security audit.
-- ============================================================================

-- 1. Fix profiles_update_own to prevent self-unsuspension
drop policy if exists profiles_update_own on profiles;
create policy profiles_update_own on profiles
  for update using (id = auth.uid())
  with check (
    id = auth.uid() 
    and role = (select role from profiles where id = auth.uid())
    and status = (select status from profiles where id = auth.uid())
    and suspended_at is not distinct from (select suspended_at from profiles where id = auth.uid())
    and suspended_by is not distinct from (select suspended_by from profiles where id = auth.uid())
  );

-- 2. Add read access for videos linked via live_sessions.recording_video_id
create policy videos_select_live_session on videos
  for select using (
    exists (
      select 1 from live_sessions ls
      where ls.recording_video_id = videos.id
      and is_enrolled_active(ls.course_id)
    )
  );

-- 3. Fix attendance_write_staff to prevent marked_by spoofing
drop policy if exists attendance_write_staff on attendance;
create policy attendance_write_staff on attendance
  for all using (
    is_admin() or is_instructor_of((select course_id from live_sessions where id = live_session_id))
  )
  with check (
    (is_admin() or is_instructor_of((select course_id from live_sessions where id = live_session_id)))
    and marked_by = auth.uid()
  );
