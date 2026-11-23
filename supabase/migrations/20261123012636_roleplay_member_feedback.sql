create table public.roleplay_member_feedback (
 id uuid primary key,
 owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 completed_at timestamptz not null,
 entry jsonb not null check (jsonb_typeof(entry) = 'object' and octet_length(entry::text) <= 150000)
);
create index roleplay_member_feedback_owner_date_idx on public.roleplay_member_feedback(owner_id, completed_at desc, id desc);
alter table public.roleplay_member_feedback enable row level security;
revoke all on public.roleplay_member_feedback from public, anon, authenticated;
grant select, insert on public.roleplay_member_feedback to authenticated;
create policy roleplay_feedback_owner_select on public.roleplay_member_feedback for select to authenticated using ((select auth.uid()) = owner_id);
create policy roleplay_feedback_owner_insert on public.roleplay_member_feedback for insert to authenticated with check ((select auth.uid()) = owner_id);
create table roleplay_metrics.admin_pin_attempts (
 scope text not null,
 window_start timestamptz not null,
 attempts integer not null,
 primary key (scope,window_start)
);
alter table roleplay_metrics.admin_pin_attempts enable row level security;
create policy roleplay_admin_attempts_server on roleplay_metrics.admin_pin_attempts for all to roleplay_metrics_app using (true) with check (true);
grant select, insert, update on roleplay_metrics.admin_pin_attempts to roleplay_metrics_app;
select cron.schedule('roleplay-admin-pin-attempts-expiry','25 * * * *',
 $job$delete from roleplay_metrics.admin_pin_attempts where window_start < now() - interval '1 day'$job$);
