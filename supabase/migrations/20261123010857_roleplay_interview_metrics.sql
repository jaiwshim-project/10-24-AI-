create role roleplay_metrics_app nologin nosuperuser nocreatedb nocreaterole noinherit noreplication nobypassrls;
create schema roleplay_metrics;
revoke all on schema roleplay_metrics from public;
grant usage on schema roleplay_metrics to roleplay_metrics_app;

create table roleplay_metrics.interview_sessions (
  id uuid primary key,
  participant uuid not null,
  interview_type text not null check (interview_type in ('job', 'college')),
  topic text not null,
  started_at timestamptz not null,
  baseline_id uuid,
  summary jsonb
);
create index interview_sessions_started_at_idx on roleplay_metrics.interview_sessions (started_at);
alter table roleplay_metrics.interview_sessions enable row level security;
revoke all on roleplay_metrics.interview_sessions from public, anon, authenticated, service_role;
grant select, insert, update (summary) on roleplay_metrics.interview_sessions to roleplay_metrics_app;
create policy interview_metrics_read on roleplay_metrics.interview_sessions
  for select to roleplay_metrics_app using (true);
create policy interview_metrics_start on roleplay_metrics.interview_sessions
  for insert to roleplay_metrics_app with check (summary is null);
create policy interview_metrics_complete on roleplay_metrics.interview_sessions
  for update to roleplay_metrics_app using (summary is null) with check (summary is not null);

create extension if not exists pg_cron;
select cron.schedule(
  'roleplay-interview-metrics-expiry',
  '15 * * * *',
  $job$delete from roleplay_metrics.interview_sessions where started_at < now() - interval '90 days'$job$
);
