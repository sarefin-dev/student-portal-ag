-- Create a secure view to expose auth.users.last_sign_in_at to the admin portal
-- This allows admins to see when a student last accessed the system.

CREATE OR REPLACE VIEW admin_student_profiles_view WITH (security_invoker = off) AS
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
  u.last_sign_in_at
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE p.role = 'student';
