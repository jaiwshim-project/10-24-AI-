create table public.roleplay_member_profiles (
  owner_id uuid primary key references auth.users(id) on delete cascade deferrable initially deferred,
  nickname text not null check (char_length(btrim(nickname)) between 2 and 30),
  phone text not null check (phone ~ '^[+]?[0-9]{8,15}$'),
  user_type text not null check (user_type in ('job-seeker','university','high-school','teacher','coach','nutritionist','other')),
  practice_type text not null check (practice_type in ('job','college','school','career','nutrition'))
);
alter table public.roleplay_member_profiles enable row level security;
revoke all on public.roleplay_member_profiles from public, anon, authenticated;
grant select on public.roleplay_member_profiles to authenticated;
create policy roleplay_profiles_owner_read on public.roleplay_member_profiles
  for select to authenticated using ((select auth.uid()) = owner_id);

create table public.roleplay_member_goals (
  owner_id uuid not null references auth.users(id) on delete cascade,
  practice_type text not null check (practice_type in ('job','college','school','career','nutrition')),
  goal text not null check (char_length(btrim(goal)) between 1 and 200),
  primary key (owner_id, practice_type)
);
alter table public.roleplay_member_goals enable row level security;
revoke all on public.roleplay_member_goals from public, anon, authenticated;
grant select, insert, update, delete on public.roleplay_member_goals to authenticated;
create policy roleplay_goals_owner on public.roleplay_member_goals for all to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);

create function roleplay_metrics.capture_signup_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
declare profile jsonb := new.raw_user_meta_data -> 'roleplay_signup_profile_v1';
begin
  if profile is null then
    return new;
  end if;
  insert into public.roleplay_member_profiles (owner_id, nickname, phone, user_type, practice_type)
  values (new.id, btrim(profile ->> 'nickname'), profile ->> 'phone', profile ->> 'user_type', profile ->> 'practice_type');
  new.raw_user_meta_data := new.raw_user_meta_data - 'roleplay_signup_profile_v1';
  return new;
end;
$$;
revoke all on function roleplay_metrics.capture_signup_profile() from public, anon, authenticated;
create trigger roleplay_capture_signup_profile
  before insert on auth.users for each row execute function roleplay_metrics.capture_signup_profile();
