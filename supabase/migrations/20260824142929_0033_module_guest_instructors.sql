-- ============================================================================
-- 0033_module_guest_instructors.sql
-- Add guest_instructor_id to modules for visual attribution.
-- ============================================================================

ALTER TABLE modules
  ADD COLUMN guest_instructor_id uuid REFERENCES profiles(id) ON DELETE SET NULL;
