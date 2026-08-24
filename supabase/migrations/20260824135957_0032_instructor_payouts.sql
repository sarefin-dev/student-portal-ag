-- ============================================================================
-- 0032_instructor_payouts.sql
-- Add payout_percentage to profiles to support instructor revenue share.
-- ============================================================================

ALTER TABLE profiles 
  ADD COLUMN payout_percentage numeric(5,2) DEFAULT 0.00;

-- Update the admin view to include the new column
DROP VIEW IF EXISTS admin_staff_profiles_view;
CREATE VIEW admin_staff_profiles_view WITH (security_invoker = off) AS
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.phone,
  p.avatar_url,
  p.role,
  p.status,
  p.suspended_at,
  p.suspended_by,
  p.suspended_reason,
  p.payout_percentage,
  p.created_at,
  p.updated_at,
  u.last_sign_in_at
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE p.role != 'student';

GRANT SELECT ON admin_staff_profiles_view TO authenticated;
GRANT SELECT ON admin_staff_profiles_view TO service_role;
