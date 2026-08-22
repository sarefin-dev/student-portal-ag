-- Create storage bucket if it doesn't exist (using the built-in storage functions)
insert into storage.buckets (id, name, public)
values ('public_media', 'public_media', true)
on conflict (id) do nothing;

-- Set up RLS for storage.objects
-- Note: the 'storage' schema already has RLS enabled by Supabase by default.

-- 1. Anyone can read from public_media
create policy "Public access to public_media"
on storage.objects for select
using ( bucket_id = 'public_media' );

-- 2. Authenticated users (or just admins) can insert into public_media
-- We will allow any authenticated user with the 'admin' or 'instructor' role to upload.
-- We can use our public.is_admin() function, but since this is the storage schema, we might need a simpler check.
-- Let's just use our `is_admin()` helper. It's in the `public` schema.

create policy "Admins can upload to public_media"
on storage.objects for insert
with check (
  bucket_id = 'public_media' 
  and auth.role() = 'authenticated'
  and public.is_admin()
);

-- 3. Admins can update and delete
create policy "Admins can update public_media"
on storage.objects for update
using (
  bucket_id = 'public_media' 
  and auth.role() = 'authenticated'
  and public.is_admin()
);

create policy "Admins can delete from public_media"
on storage.objects for delete
using (
  bucket_id = 'public_media' 
  and auth.role() = 'authenticated'
  and public.is_admin()
);
