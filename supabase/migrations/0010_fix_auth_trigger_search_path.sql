-- Fix: Schema-qualify the profiles table insertion and explicitly set search_path.
-- Triggers on auth.users execute in the auth schema context, so they will fail to find "profiles" unless fully qualified.

create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.email, 'New user'));
  return new;
end;
$$;
