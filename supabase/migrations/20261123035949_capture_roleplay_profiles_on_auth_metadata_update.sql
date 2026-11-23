create or replace function roleplay_metrics.capture_signup_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
declare profile jsonb := new.raw_user_meta_data -> 'roleplay_signup_profile_v1';
begin
  if profile is null then
    return new;
  end if;
  insert into public.roleplay_member_profiles (owner_id, nickname, phone, user_type, practice_type)
  values (new.id, btrim(profile ->> 'nickname'), profile ->> 'phone', profile ->> 'user_type', profile ->> 'practice_type')
  on conflict (owner_id) do nothing;
  new.raw_user_meta_data := new.raw_user_meta_data - 'roleplay_signup_profile_v1';
  return new;
end;
$$;
drop trigger roleplay_capture_signup_profile on auth.users;
create trigger roleplay_capture_signup_profile
  before insert or update of raw_user_meta_data on auth.users
  for each row execute function roleplay_metrics.capture_signup_profile();