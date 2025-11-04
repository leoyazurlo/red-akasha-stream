-- Update the handle_new_user function to automatically grant admin role to the first user
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_count integer;
begin
  -- Create profile
  insert into public.profiles (id, username, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  
  -- Check if this is the first user
  select count(*) into user_count from auth.users;
  
  -- Assign admin role to first user, otherwise assign regular user role
  if user_count = 1 then
    insert into public.user_roles (user_id, role)
    values (new.id, 'admin');
  else
    insert into public.user_roles (user_id, role)
    values (new.id, 'user');
  end if;
  
  return new;
end;
$$;