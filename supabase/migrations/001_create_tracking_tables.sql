create extension if not exists pgcrypto;

create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  device_name text not null,
  device_identifier text not null unique,
  device_token_hash text not null,
  last_latitude double precision,
  last_longitude double precision,
  accuracy double precision,
  battery_level integer,
  network_type text,
  has_internet boolean,
  tracking_enabled boolean not null default false,
  tracking_interval_seconds integer not null default 60 check (tracking_interval_seconds in (60, 300, 900, 1800, 3600)),
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.device_locations (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.devices(id) on delete cascade,
  latitude double precision not null,
  longitude double precision not null,
  accuracy double precision,
  battery_level integer,
  network_type text,
  recorded_at timestamptz not null,
  received_at timestamptz not null default now()
);

create table if not exists public.device_commands (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.devices(id) on delete cascade,
  command_type text not null check (command_type in ('ring', 'message')),
  title text,
  body text,
  duration_seconds integer,
  payload jsonb,
  status text not null default 'pending' check (status in ('pending', 'sent', 'executed', 'failed')),
  sent_at timestamptz,
  executed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists devices_last_seen_at_idx on public.devices(last_seen_at desc);
create index if not exists device_locations_device_recorded_idx
  on public.device_locations(device_id, recorded_at desc);
create index if not exists device_commands_device_status_created_idx
  on public.device_commands(device_id, status, created_at asc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists devices_set_updated_at on public.devices;
create trigger devices_set_updated_at
before update on public.devices
for each row execute function public.set_updated_at();

drop trigger if exists device_commands_set_updated_at on public.device_commands;
create trigger device_commands_set_updated_at
before update on public.device_commands
for each row execute function public.set_updated_at();
