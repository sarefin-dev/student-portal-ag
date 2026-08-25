-- Add Know Your Staff (KYS) fields to profiles table
ALTER TABLE profiles 
  ADD COLUMN address text,
  ADD COLUMN nid_number text,
  ADD COLUMN social_fb text,
  ADD COLUMN social_x text,
  ADD COLUMN social_linkedin text,
  ADD COLUMN social_github text,
  ADD COLUMN expertise text,
  ADD COLUMN bio text,
  ADD COLUMN interests text;

-- Recreate admin_staff_profiles_view to include these new fields
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
  p.created_at,
  p.updated_at,
  p.is_superadmin,
  p.instructor_title,
  p.signature_url,
  p.address,
  p.nid_number,
  p.social_fb,
  p.social_x,
  p.social_linkedin,
  p.social_github,
  p.expertise,
  p.bio,
  p.interests,
  u.last_sign_in_at
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE p.role != 'student';

GRANT SELECT ON admin_staff_profiles_view TO authenticated;
GRANT SELECT ON admin_staff_profiles_view TO service_role;

