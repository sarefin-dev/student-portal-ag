-- Add composite index to dramatically speed up the Students list and pagination
CREATE INDEX IF NOT EXISTS idx_profiles_role_created_at ON public.profiles(role, created_at DESC);
