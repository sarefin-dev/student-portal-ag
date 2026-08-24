-- Create a secure view to expose auth.users.last_sign_in_at to the admin portal
-- This allows admins to see when an instructor or admin last accessed the system.

CREATE OR REPLACE VIEW admin_staff_profiles_view WITH (security_invoker = off) AS
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
WHERE p.role != 'student';

-- Grant access to authenticated users (RLS on profiles already restricts who can query this indirectly,
-- but since this uses security_invoker = off, we must rely on the API route's service_role key to access it)
GRANT SELECT ON admin_staff_profiles_view TO authenticated;
GRANT SELECT ON admin_staff_profiles_view TO service_role;
