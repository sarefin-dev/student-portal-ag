-- ============================================================================
-- 0009_audit_triggers_retention.sql
-- Generic audit-logging trigger (applied to sensitive tables), certificate
-- issuance trigger, and the 30-day soft-delete purge function (§A).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Generic audit trigger: automatic, so it cannot be forgotten by an API
-- route author. auth.uid() captures the actor when a user-context request
-- made the change; NULL means a service-role/system action (e.g. the
-- verification-matching function auto-enrolling a student).
-- ---------------------------------------------------------------------------
create or replace function audit_trigger_fn()
returns trigger language plpgsql security definer as $$
begin
  insert into audit_log (actor_id, action, entity_type, entity_id, before, after)
  values (
    auth.uid(),
    lower(tg_table_name) || '.' || lower(tg_op),
    tg_table_name,
    coalesce(new.id, old.id),
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end
  );
  return coalesce(new, old);
end;
$$;

-- Applied to every table where FR-ACC-6 explicitly requires it: user,
-- enrollment, and payment mutations.
create trigger trg_audit_profiles after update on profiles
  for each row execute function audit_trigger_fn();
create trigger trg_audit_enrollments after insert or update on enrollments
  for each row execute function audit_trigger_fn();
create trigger trg_audit_payments after insert on payments
  for each row execute function audit_trigger_fn(); -- payments are insert-only, never updated
create trigger trg_audit_courses after update on courses
  for each row execute function audit_trigger_fn(); -- status lifecycle changes (archive/deactivate)

-- ---------------------------------------------------------------------------
-- Certificate issuance: fires when an enrollment's cached completion
-- percent reaches 100. Relies on block_progress for assessment-type blocks
-- already reflecting the correct pass/required rule (FR-ASM-6) — the
-- application layer is responsible for only marking an assessment content
-- block "completed" once its gating condition (required + passed, or just
-- attempted if not required) is satisfied. This trigger does not
-- re-evaluate assessment logic; it reacts to the aggregate already being
-- correct by the time it changes.
-- ---------------------------------------------------------------------------
create or replace function issue_certificate_on_completion()
returns trigger language plpgsql security definer as $$
declare
  v_code text;
begin
  if new.completion_percent = 100 and old.completion_percent is distinct from 100 then
    v_code := encode(gen_random_bytes(6), 'hex');
    insert into certificates (student_id, course_id, verify_code)
    values (new.student_id, new.course_id, v_code)
    on conflict (student_id, course_id) do nothing;

    insert into jobs (job_type, payload)
    values ('send_email', jsonb_build_object(
      'template', 'certificate_issued', 'student_id', new.student_id, 'course_id', new.course_id
    ));
  end if;
  return new;
end;
$$;

create trigger trg_enrollments_issue_certificate
  after update on enrollments
  for each row execute function issue_certificate_on_completion();

-- ---------------------------------------------------------------------------
-- purge_soft_deleted: the 30-day retention sweep (§A). Scheduled via
-- pg_cron in the real Supabase deployment:
--   select cron.schedule('purge-soft-deleted', '0 3 * * *', 'select purge_soft_deleted();');
-- Only touches the tier explicitly approved for soft-delete + purge (§A2).
-- Payments, orders, installments, refunds, audit_log, and enrollments are
-- never included here — they are excluded by design, not by omission.
-- ---------------------------------------------------------------------------
create or replace function purge_soft_deleted()
returns void language plpgsql security definer as $$
declare
  v_cutoff timestamptz := now() - interval '30 days';
begin
  delete from content_blocks where deleted_at is not null and deleted_at < v_cutoff;
  delete from lessons where deleted_at is not null and deleted_at < v_cutoff;
  delete from submodules where deleted_at is not null and deleted_at < v_cutoff;
  delete from modules where deleted_at is not null and deleted_at < v_cutoff;
  delete from course_attachments where deleted_at is not null and deleted_at < v_cutoff;
  delete from videos where deleted_at is not null and deleted_at < v_cutoff;
  delete from resources where deleted_at is not null and deleted_at < v_cutoff;
  delete from bundles where deleted_at is not null and deleted_at < v_cutoff;
  delete from coupons where deleted_at is not null and deleted_at < v_cutoff;
  delete from testimonials where deleted_at is not null and deleted_at < v_cutoff;
  delete from live_sessions where deleted_at is not null and deleted_at < v_cutoff;

  -- Courses purge last, and only if they were never enrolled in — belt and
  -- suspenders alongside the ON DELETE RESTRICT FK from enrollments.course_id.
  delete from courses c
  where c.deleted_at is not null and c.deleted_at < v_cutoff
    and not exists (select 1 from enrollments e where e.course_id = c.id);
end;
$$;
