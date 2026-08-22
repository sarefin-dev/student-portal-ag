-- Update trigger to pull full_name and phone from raw_user_meta_data

create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (
    new.id, 
    new.email, 
    coalesce(new.raw_user_meta_data->>'full_name', new.email, 'New user'),
    new.raw_user_meta_data->>'phone'
  );
  return new;
end;
$$;
