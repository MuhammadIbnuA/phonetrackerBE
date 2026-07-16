alter table public.devices
  add column if not exists tracking_interval_seconds integer not null default 60;

alter table public.devices
  drop constraint if exists devices_tracking_interval_seconds_check;

alter table public.devices
  add constraint devices_tracking_interval_seconds_check
  check (tracking_interval_seconds in (60, 300, 900, 1800, 3600));
