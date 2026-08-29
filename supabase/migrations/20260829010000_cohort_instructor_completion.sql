-- ============================================================
-- Cohort Instructor-Controlled Completion
-- For live_cohort and in_person courses, disable auto-completion
-- via block progress. Admins/instructors mark completion manually.
-- ============================================================

-- 1. Add flag to courses
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS instructor_controlled_completion boolean NOT NULL DEFAULT false;

-- Auto-set to true for all existing live_cohort and in_person courses
UPDATE courses
  SET instructor_controlled_completion = true
  WHERE type IN ('live_cohort', 'in_person');

-- 2. Update recompute_enrollment_progress to respect this flag.
--    If instructor_controlled_completion = true, still update
--    completion_percent (for progress display) but NEVER auto-set
--    completed_at — that remains null until manually set.
CREATE OR REPLACE FUNCTION recompute_enrollment_progress()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_course_id uuid;
  v_total_blocks int;
  v_completed_blocks int;
  v_percent numeric(5,2);
  v_instructor_controlled boolean;
BEGIN
  SELECT m.course_id INTO v_course_id
  FROM content_blocks cb
  JOIN lessons l ON l.id = cb.lesson_id
  JOIN submodules s ON s.id = l.submodule_id
  JOIN modules m ON m.id = s.module_id
  WHERE cb.id = COALESCE(new.content_block_id, old.content_block_id);

  SELECT instructor_controlled_completion INTO v_instructor_controlled
  FROM courses WHERE id = v_course_id;

  SELECT COUNT(*), COUNT(*) FILTER (WHERE bp.status = 'completed')
    INTO v_total_blocks, v_completed_blocks
  FROM content_blocks cb
  JOIN lessons l ON l.id = cb.lesson_id
  JOIN submodules s ON s.id = l.submodule_id
  JOIN modules m ON m.id = s.module_id
  LEFT JOIN block_progress bp
    ON bp.content_block_id = cb.id AND bp.student_id = COALESCE(new.student_id, old.student_id)
  WHERE m.course_id = v_course_id AND cb.deleted_at IS NULL;

  v_percent := CASE WHEN v_total_blocks = 0 THEN 0
    ELSE ROUND(100.0 * v_completed_blocks / v_total_blocks, 2) END;

  IF v_instructor_controlled THEN
    -- Only update progress display; never touch completed_at
    UPDATE enrollments
      SET completion_percent = v_percent
    WHERE course_id = v_course_id
      AND student_id = COALESCE(new.student_id, old.student_id)
      AND completed_at IS NULL; -- don't overwrite if already manually completed
  ELSE
    -- Original self-paced behaviour
    UPDATE enrollments
      SET completion_percent = v_percent,
          completed_at = CASE
            WHEN v_percent = 100 AND completed_at IS NULL THEN now()
            WHEN v_percent < 100 THEN null
            ELSE completed_at
          END
    WHERE course_id = v_course_id
      AND student_id = COALESCE(new.student_id, old.student_id);
  END IF;

  RETURN new;
END;
$$;

-- 3. RPC: Admin/instructor manually marks a cohort enrollment as complete.
--    Sets completion_percent = 100 and completed_at = now().
--    The existing trg_enrollments_issue_certificate trigger fires automatically.
CREATE OR REPLACE FUNCTION force_complete_cohort_enrollment(
  p_enrollment_id uuid,
  p_admin_id uuid
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_course_type text;
BEGIN
  -- Verify caller is admin or instructor
  IF NOT (is_admin() OR is_instructor()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Verify this is a cohort-type course
  SELECT c.type INTO v_course_type
  FROM enrollments e
  JOIN courses c ON c.id = e.course_id
  WHERE e.id = p_enrollment_id;

  IF v_course_type IS NULL THEN
    RAISE EXCEPTION 'Enrollment not found';
  END IF;

  -- Update enrollment to completed
  UPDATE enrollments
    SET completion_percent = 100,
        completed_at = now()
  WHERE id = p_enrollment_id
    AND completed_at IS NULL;

  -- Audit log
  INSERT INTO audit_log (actor_id, action, target_table, target_id, metadata)
  VALUES (
    p_admin_id,
    'cohort_completion_forced',
    'enrollments',
    p_enrollment_id,
    jsonb_build_object('forced_by', p_admin_id, 'at', now())
  );
END;
$$;

COMMENT ON COLUMN courses.instructor_controlled_completion IS
  'When true (default for live_cohort/in_person), students cannot self-complete via block progress. An admin or instructor must call force_complete_cohort_enrollment() to issue the certificate.';
