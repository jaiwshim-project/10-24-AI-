alter table public.roleplay_member_profiles
  add column contact_email text check (char_length(contact_email) between 3 and 254);
create or replace function roleplay_metrics.capture_signup_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
declare profile jsonb := new.raw_user_meta_data -> 'roleplay_signup_profile_v1';
begin
  if profile is null then
    return new;
  end if;
  insert into public.roleplay_member_profiles (owner_id, nickname, phone, user_type, practice_type, contact_email)
  values (new.id, btrim(profile ->> 'nickname'), profile ->> 'phone', profile ->> 'user_type', profile ->> 'practice_type', profile ->> 'contact_email')
  on conflict (owner_id) do nothing;
  new.raw_user_meta_data := new.raw_user_meta_data - 'roleplay_signup_profile_v1';
  return new;
end;
$$;
