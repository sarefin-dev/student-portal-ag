-- ============================================================================
-- 0030_instructor_credentials.sql
-- Add signature and title to profiles to support multiple instructors.
-- ============================================================================

ALTER TABLE profiles 
  ADD COLUMN instructor_title text,
  ADD COLUMN signature_url text;
