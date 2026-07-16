alter table public.devices
  add column if not exists geofence_enabled boolean not null default false,
  add column if not exists geofence_min_latitude double precision,
  add column if not exists geofence_max_latitude double precision,
  add column if not exists geofence_min_longitude double precision,
  add column if not exists geofence_max_longitude double precision,
  add column if not exists geofence_state text not null default 'unknown',
  add column if not exists geofence_last_event text;

alter table public.devices
  drop constraint if exists devices_geofence_state_check;

alter table public.devices
  add constraint devices_geofence_state_check
  check (geofence_state in ('unknown', 'inside', 'outside'));
