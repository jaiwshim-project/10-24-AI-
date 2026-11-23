create table roleplay_metrics.app_usage_daily (
  day date primary key,
  visits bigint not null default 0,
  installs bigint not null default 0
);
alter table roleplay_metrics.app_usage_daily enable row level security;
grant select, insert, update on roleplay_metrics.app_usage_daily to roleplay_metrics_app;
create policy metrics_app_usage on roleplay_metrics.app_usage_daily to roleplay_metrics_app using (true) with check (true);
