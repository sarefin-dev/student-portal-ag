-- 0016_private_resources_bucket.sql
-- Creates the private bucket for secure digital resource downloads.

insert into storage.buckets (id, name, public)
values ('private_resources', 'private_resources', false)
on conflict (id) do nothing;

-- 1. Admins can upload to private_resources
create policy "Admins can upload to private_resources"
on storage.objects for insert
with check (
  bucket_id = 'private_resources' 
  and auth.role() = 'authenticated'
  and public.is_admin()
);

-- 2. Admins can update and delete
create policy "Admins can update private_resources"
on storage.objects for update
using (
  bucket_id = 'private_resources' 
  and auth.role() = 'authenticated'
  and public.is_admin()
);

create policy "Admins can delete from private_resources"
on storage.objects for delete
using (
  bucket_id = 'private_resources' 
  and auth.role() = 'authenticated'
  and public.is_admin()
);

-- Note: We intentionally do NOT create a SELECT policy for the public or students.
-- Downloads will be mediated exclusively via a Next.js API route (`/api/resources/[id]/download`)
-- which runs under the service role to read the file, watermark it with pdf-lib, and stream it securely.
