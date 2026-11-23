alter table roleplay_metrics.interview_sessions add column first_answer boolean;
alter table roleplay_metrics.interview_sessions alter column first_answer set default false;
grant update(first_answer) on roleplay_metrics.interview_sessions to roleplay_metrics_app;
alter table roleplay_metrics.app_usage_daily add column test_visits bigint not null default 0;
create table roleplay_metrics.usage_devices(day date not null, device uuid not null, standalone boolean not null, primary key(day,device,standalone));
alter table roleplay_metrics.usage_devices enable row level security;
grant select,insert on roleplay_metrics.usage_devices to roleplay_metrics_app;
create policy metrics_device_access on roleplay_metrics.usage_devices to roleplay_metrics_app using(true) with check(true);
