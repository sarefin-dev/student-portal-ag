-- Add is_superadmin flag to profiles
ALTER TABLE profiles ADD COLUMN is_superadmin BOOLEAN NOT NULL DEFAULT false;

-- Create helper function
CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT coalesce((select is_superadmin from profiles where id = auth.uid()), false);
$$;

-- Make the very first admin a superadmin (usually the founder)
DO $$
DECLARE
  first_admin_id uuid;
BEGIN
  SELECT id INTO first_admin_id 
  FROM profiles 
  WHERE role = 'admin' 
  ORDER BY created_at ASC 
  LIMIT 1;

  IF first_admin_id IS NOT NULL THEN
    UPDATE profiles SET is_superadmin = true WHERE id = first_admin_id;
  END IF;
END $$;

